"""
Live source ↔ evidence verification — Phase 2.7.

Everything in app/services/verification_audit.py operates on data ALREADY
IN THE DATABASE — it can catch internal inconsistencies (evidence that
doesn't match its own claim, scope over-claims, stale cycles) but it
cannot answer the more fundamental question: does the stored evidence_text
actually appear on the real, live source_url? A row could have a perfectly
self-consistent claim/evidence/source_url triple that was simply invented,
or that used to be true and the source has since changed.

This module treats every stored evidence_text as an UNTRUSTED CLAIM about
the real world and independently fetches the source to check it:

    database claim -> fetch source_url -> inspect actual page content
                    -> independently determine support

It NEVER does `database says verified -> treat as source-verified`.

Result vocabulary (reuses verification_audit terminology where the concepts
overlap, per Phase 2.7 instructions):
  SOURCE_VERIFIED    — page reachable, evidence found verbatim (or a very
                        close paraphrase), claim's specific facts confirmed.
  EVIDENCE_FOUND      — page reachable, a passage clearly matching the
                        evidence topic was found, but not a strong enough
                        match to call it a verbatim confirmation.
  EVIDENCE_NOT_FOUND  — page reachable, nothing resembling the stored
                        evidence could be found on it.
  SOURCE_UNAVAILABLE  — page could not be reliably fetched/read at all
                        (network error, non-200, PDF text extraction
                        failed, JS-rendered page with no usable HTML text).
  SOURCE_CHANGED      — page reachable, discusses the same topic, but
                        states a DIFFERENT specific fact than the stored
                        evidence (e.g. a different number/date) — the
                        source appears to have been edited since the
                        evidence was captured.
  SCOPE_MISMATCH      — the live page's own text narrows the claim (degree
                        level / named programme / applicant category) in a
                        way the stored claim doesn't capture — same
                        principle as verification_audit's scope detector,
                        applied to the LIVE text instead of stored evidence.
  CLAIM_NOT_SUPPORTED — page reachable and evidence-ish text found, but a
                        specific figure/date the claim names is absent
                        from or contradicts the live page.
  SOURCE_WRONG_UNIVERSITY — the source_url's domain is identifiable as
                        belonging to a DIFFERENT institution than the one
                        the claim is about (Phase 3 production-readiness
                        audit — see classify_source_ownership below). Never
                        fetched or matched — a wrong-university source can
                        never verify a claim regardless of what evidence_text
                        says, so this is checked and returned before any
                        network call.
"""
import re
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.services.verification_audit import (
    classify_source_tier, _evidence_overlap_ratio, _TIER2_DOMAIN_MARKERS,
    _claim_has_unconfirmed_numbers, _detect_unrepresented_scope, _extract_numbers,
    extract_date_ranges,
)

logger = logging.getLogger("university_finder")

LIVE_RESULTS = (
    "SOURCE_VERIFIED", "EVIDENCE_FOUND", "EVIDENCE_NOT_FOUND", "SOURCE_UNAVAILABLE",
    "SOURCE_CHANGED", "SCOPE_MISMATCH", "CLAIM_NOT_SUPPORTED", "OUTDATED_SOURCE",
    "SOURCE_WRONG_UNIVERSITY",
)

# ── Source ownership (Phase 3 production-readiness audit) ──────────────────
#
# Problem: a claim can be exact-match "verified" by evidence that is real,
# verbatim, on-page text — but fetched from a completely different
# university's own domain (e.g. a Hohenheim claim "verified" by a
# uni-koeln.de page that happens to contain the same words). Reproduced as
# a real false positive; there was previously no check that source_url
# actually belongs to the university the claim is about.
#
# Ownership model — deliberately NOT a simplistic rule (no ".de = valid",
# no "contains 'uni' = valid", no substring-of-university-name matching):
#
#   OWNED         — source_url's registrable domain matches (or is a
#                   subdomain of) the claimed university's OWN `website`
#                   column (already on the University model — no schema
#                   change needed; this is the single source of truth for
#                   "a university's official domain"). Subdomains are
#                   allowed because real university sites route admissions
#                   content through them routinely (e.g.
#                   dein-studium.uni-hohenheim.de for uni-hohenheim.de).
#   SHARED_PORTAL — source_url's domain is one of the small, explicit,
#                   documented list of national/shared application portals
#                   that legitimately handle MANY universities' admissions
#                   processes: uni-assist.de, daad.de, hochschulstart.de,
#                   anabin.kmk.org (reusing verification_audit's existing
#                   _TIER2_DOMAIN_MARKERS — one list, not duplicated).
#                   These are never "wrong university" regardless of which
#                   university the claim is about.
#   WRONG_UNIVERSITY — source_url's domain matches the general shape of an
#                   official-institution domain (the same heuristic
#                   classify_source_tier uses to grant Tier-1 trust to an
#                   UNSPECIFIED domain: starts with "uni-", contains
#                   ".uni-", contains "university", or ends in .edu/.ac.xx)
#                   but is NEITHER the claimed university's own domain NOR
#                   a recognized shared portal. This is the narrow, targeted
#                   signal for "this looks like someone else's official
#                   university page" — not a broad "unfamiliar domain"
#                   rejection.
#   UNKNOWN       — anything else: the claimed university has no `website`
#                   on file, or the source domain doesn't look like an
#                   institutional domain at all (e.g. a news site, a blog).
#                   Ownership is simply undetermined here — per the "do not
#                   assume ownership" requirement, UNKNOWN never blocks
#                   verification by itself (that would reject legitimate
#                   sources we just can't positively attribute), but it
#                   also never confers the confidence OWNED/SHARED_PORTAL
#                   does; unrecognized domains still have to earn trust
#                   through the existing tier/overlap checks downstream.
_OWNERSHIP_LOOKS_LIKE_UNIVERSITY_RE = re.compile(
    r"\.(edu|ac\.[a-z]{2,})$|(^|\.)uni-|\.uni-|university", re.IGNORECASE
)


def _registrable_domain(url: str | None) -> str | None:
    """Best-effort registrable domain (last two dot-separated labels),
    'www.' stripped. Not a full public-suffix-list implementation — this
    codebase's real data is exclusively .de/.com/.org domains, for which
    'last two labels' is correct; a multi-part TLD (co.uk-style) would
    need a real PSL if this dataset ever grows to include one."""
    if not url:
        return None
    netloc = urlparse(url if "://" in url else f"//{url}").netloc.lower()
    netloc = netloc.split(":")[0]  # drop a port if present
    if netloc.startswith("www."):
        netloc = netloc[4:]
    parts = netloc.split(".")
    if len(parts) < 2:
        return netloc or None
    return ".".join(parts[-2:])


def classify_source_ownership(source_url: str | None, university_website: str | None) -> str:
    """Returns 'owned' / 'shared_portal' / 'wrong_university' / 'unknown'.
    See the module-level comment block above for the full model. Pure
    domain-name logic — never fetches anything, so it's checked first and
    cheaply short-circuits a wrong-university source before any network call."""
    source_domain = _registrable_domain(source_url)
    if not source_domain:
        return "unknown"

    source_netloc = urlparse(source_url if "://" in source_url else f"//{source_url}").netloc.lower()
    if source_netloc.startswith("www."):
        source_netloc = source_netloc[4:]

    uni_domain = _registrable_domain(university_website)
    if uni_domain and (source_netloc == uni_domain or source_netloc.endswith("." + uni_domain)):
        return "owned"

    if any(marker in source_netloc for marker in _TIER2_DOMAIN_MARKERS):
        return "shared_portal"

    # Only call something "wrong university" when we actually KNOW the
    # claimed university's own domain and this isn't it — without that,
    # "looks like a university domain" is not evidence of anything (it
    # could easily be the RIGHT domain; we just don't have `website` on
    # file for this university). No known domain to compare against means
    # ownership genuinely cannot be established, which must fall through
    # to 'unknown', not be treated as a positive mismatch.
    if uni_domain and _OWNERSHIP_LOOKS_LIKE_UNIVERSITY_RE.search(source_netloc):
        return "wrong_university"

    return "unknown"

_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; UniPathSourceVerifier/1.0; +https://unipath.example/bot)"}
_TIMEOUT = 15.0
_MIN_PDF_TEXT_CHARS = 200  # below this, treat a PDF as unreadable rather than pretend it was checked

_DOTTED_SHORT_DATE_RE = re.compile(r"^(\d{1,2})\.(\d{1,2})$")


def _dotted_date_days(nums: set[str]) -> set[str]:
    """German short-date notation writes a deadline as 'day.month' with no
    leading zeros and no trailing dot — e.g. '15.7' for 15 July, '15.1' for
    15 January. _extract_numbers (shared with verification_audit.py) has no
    way to tell that apart from a genuine decimal number, so a claim stored
    as the spelled-out date '15 July' (-> number '15') was flagged
    SOURCE_CHANGED against live evidence quoting '15.7' (-> number '15.7'),
    even though both name the exact same day. Found live against real Batch
    4 conflict-resolution data (Wuppertal). Returns just the DAY component
    of any token that parses as a valid day.month pair, so it can be
    compared against a plain day figure from a spelled-out date."""
    days = set()
    for n in nums:
        m = _DOTTED_SHORT_DATE_RE.match(n)
        if m:
            day, month = int(m.group(1)), int(m.group(2))
            if 1 <= day <= 31 and 1 <= month <= 12:
                days.add(str(day))
    return days

# ── Unusable-page detection (Phase 2.8) ─────────────────────────────────────
# A page can return HTTP 200 with plenty of extractable text and STILL not
# be real content — bot-protection challenges, login walls, and cookie
# banners all produce readable HTML that isn't the admissions information
# we're looking for. Found via real-data testing: Humboldt's official
# domain served an Anubis-style bot-protection page that had >50 chars of
# text (so the old length-only check let it through) but was never the
# actual admissions content.
_BOT_PROTECTION_MARKERS = (
    "checking your browser", "enable javascript and cookies", "verify you are a human",
    "ddos protection by", "attention required", "access denied", "anubis",
    "proof-of-work", "please wait while we verify", "are you a robot",
    "makes their resources inaccessible", "checking if the site connection is secure",
    "ray id",
)
_LOGIN_WALL_MARKERS = ("sign in to continue", "log in to continue", "please log in to view", "you must be logged in")
_COOKIE_WALL_MARKERS = ("accept all cookies", "manage your cookie preferences", "we use cookies to")


def classify_page_usability(text: str) -> str | None:
    """
    Returns 'bot_protection' / 'login_wall' / 'cookie_wall' / 'empty', or
    None when the text looks like real page content. A cookie-wall match
    only counts when cookie language dominates a SHORT page (a real
    admissions page mentioning cookies in a footer banner alongside lots of
    other real content is not a cookie wall)."""
    if not text or len(text.strip()) < 50:
        return "empty"
    low = text.lower()
    if any(marker in low for marker in _BOT_PROTECTION_MARKERS):
        return "bot_protection"
    if any(marker in low for marker in _LOGIN_WALL_MARKERS):
        return "login_wall"
    if len(text) < 400 and any(marker in low for marker in _COOKIE_WALL_MARKERS):
        return "cookie_wall"
    return None


_UNUSABLE_PAGE_MESSAGES = {
    "bot_protection": "Page returned a bot-protection/anti-automation challenge page, not real admissions content.",
    "login_wall": "Page requires authentication (login wall) — real content is not visible without logging in.",
    "cookie_wall": "Page is dominated by a cookie-consent banner with little other content.",
    "empty": "Fetched page had almost no extractable text — likely JavaScript-rendered content this verifier cannot execute.",
}


def fetch_source_content(url: str, fetch_fn=None) -> dict:
    """
    Fetches a URL and returns extracted plain text. `fetch_fn` is an
    injectable httpx-like GET function for testing (so tests never hit the
    real network) — defaults to a real httpx.get with redirects followed.

    Returns:
      {reachable, status_code, final_url, is_pdf, text, error}
    text is None when the page/PDF could not be reliably read — callers
    must treat that as SOURCE_UNAVAILABLE, never as "evidence not found"
    (those are different claims: "we checked and it's not there" vs
    "we could not check").
    """
    getter = fetch_fn or (lambda u: httpx.get(u, timeout=_TIMEOUT, follow_redirects=True, headers=_HEADERS))
    try:
        resp = getter(url)
    except Exception as e:
        return {"reachable": False, "status_code": None, "final_url": url, "is_pdf": False, "text": None, "error": f"{type(e).__name__}: {e}"}

    status_code = getattr(resp, "status_code", None)
    final_url = str(getattr(resp, "url", url))
    content_type = (resp.headers.get("content-type", "") if hasattr(resp, "headers") else "") or ""

    if status_code is None or status_code >= 400:
        return {"reachable": False, "status_code": status_code, "final_url": final_url, "is_pdf": False, "text": None,
                "error": f"HTTP {status_code}"}

    is_pdf = "application/pdf" in content_type.lower() or url.lower().endswith(".pdf")

    if is_pdf:
        text = _extract_pdf_text(resp.content)
        if not text or len(text.strip()) < _MIN_PDF_TEXT_CHARS:
            return {"reachable": True, "status_code": status_code, "final_url": final_url, "is_pdf": True, "text": None,
                    "error": "PDF text extraction produced insufficient text — likely scanned/image-only; requires manual verification."}
        return {"reachable": True, "status_code": status_code, "final_url": final_url, "is_pdf": True, "text": text, "error": None}

    html = resp.text if hasattr(resp, "text") else ""
    text = _extract_html_text(html)

    unusable = classify_page_usability(text)
    if unusable:
        return {"reachable": True, "status_code": status_code, "final_url": final_url, "is_pdf": False, "text": None,
                "error": _UNUSABLE_PAGE_MESSAGES[unusable], "unusable_reason": unusable}

    return {"reachable": True, "status_code": status_code, "final_url": final_url, "is_pdf": False, "text": text, "error": None}


def _extract_html_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ")
    return re.sub(r"\s+", " ", text).strip()


def _extract_pdf_text(pdf_bytes: bytes) -> str | None:
    try:
        from pypdf import PdfReader
        import io
        reader = PdfReader(io.BytesIO(pdf_bytes))
        parts = []
        for page in reader.pages:
            try:
                parts.append(page.extract_text() or "")
            except Exception:
                continue
        return re.sub(r"\s+", " ", " ".join(parts)).strip()
    except Exception as e:
        logger.warning("PDF text extraction failed: %s", e)
        return None


# ── Cycle-freshness checking (Phase 2.8) ────────────────────────────────────
# verify_source_evidence() previously accepted a `cycle` parameter but never
# actually used it — found and flagged during Batch 1. Only checked when
# the STORED claim explicitly asserts a cycle (cycle is not None): a claim
# with no stored cycle wasn't asserted to be cycle-specific in the first
# place (e.g. "deadline is always 15 July" is a timeless rule, not tied to
# one admission year), so there's nothing to contradict.
_CYCLE_RE = re.compile(r"\b(20\d{2})\s*/\s*(20\d{2}|\d{2})\b")


def find_cycles_on_page(text: str) -> set[str]:
    """Extracts admission-cycle tokens like '2026/27' or '2025/2026' from
    text, normalized to 'YYYY/YY' form."""
    cycles = set()
    for m in _CYCLE_RE.finditer(text or ""):
        y1, y2 = m.group(1), m.group(2)
        if len(y2) == 4:
            y2 = y2[-2:]
        cycles.add(f"{y1}/{y2}")
    return cycles


def assess_cycle_freshness(found_text: str | None, page_text: str, stored_cycle: str | None) -> tuple[str, set[str]]:
    """
    Returns (status, cycles_found) where status is one of:
      'not_applicable' — no stored_cycle to check against
      'current'        — exactly one cycle found and it matches stored_cycle
      'outdated'       — exactly one cycle found and it does NOT match
      'ambiguous'      — 2+ different cycles found nearby
      'unstated'       — stored_cycle is set but the page states no cycle at all
    Checks the matched passage first (most relevant), falling back to the
    whole page only if the passage itself states nothing.
    """
    if not stored_cycle:
        return "not_applicable", set()

    cycles = find_cycles_on_page(found_text or "")
    if not cycles:
        cycles = find_cycles_on_page(page_text)
    if not cycles:
        return "unstated", set()
    if len(cycles) > 1:
        return "ambiguous", cycles
    only = next(iter(cycles))
    return ("current" if only == stored_cycle else "outdated"), cycles


def _split_sentences(text: str) -> list[str]:
    # Simple sentence/segment splitter — good enough for matching against
    # prose admissions pages; not a linguistic parser.
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [p.strip() for p in parts if len(p.strip()) > 10]


# Known antonym pairs for German-university admission-route terminology —
# a claim naming one side and the matched passage naming the other is a
# strong, narrow signal of a mislabeled/swapped claim, found via the final
# pre-Batch-2 adversarial audit (Phase 2.8.2).
_ADMISSION_CATEGORY_ANTONYMS = [
    ({"restricted", "limited"}, {"unrestricted", "open", "free"}),
    # A claim number can exact-match a completely unrelated fact on the page
    # that happens to use the same figure for a different quantity (e.g. a
    # "€75 fee" claim matching a "75 days processing time" sentence). Found
    # via production-readiness adversarial audit (Phase 3). Only fires when
    # the found passage names ONLY the other unit category and not the
    # claim's own — a passage mentioning both a fee and a duration is left
    # alone, since that's genuinely ambiguous rather than clearly wrong.
    ({"eur", "usd", "gbp", "euro", "euros", "fee", "fees", "tuition", "cost", "costs"},
     {"days", "weeks", "months", "years", "day", "week", "month", "year"}),
]

# EU vs non-EU is a real, common antonym pair in German-university admission
# rules (e.g. "no APS required for EU/EEA citizens" vs "APS required for
# non-EU applicants") but _significant_words filters out words of length <= 2
# — "eu" is 2 characters, so the generic word-set antonym check above can
# never see it. Found via production-readiness adversarial audit (Phase 3):
# EU-only evidence attached to a non-EU claim reached SOURCE_VERIFIED via the
# exact-match short-circuit. Handled with dedicated regexes instead of
# relying on the significant-words filter.
_NON_EU_RE = re.compile(r"\bnon[\s-]?eu\b", re.IGNORECASE)
_EU_CITIZENS_RE = re.compile(r"\beu(?:\s*/\s*eea|\s+and\s+eea)?\s+citizens?\b|\beu/eea\s+citizens?\b", re.IGNORECASE)

# Same problem, different pair: a claim scoped to one intake ("winter
# semester") can share an exact date figure with evidence that actually
# describes a DIFFERENT intake ("summer semester") — e.g. two intakes that
# coincidentally close on the same day of a different month. Found via the
# same adversarial audit. "winter"/"summer" are >2 characters so
# _significant_words does see them, but there was no antonym pair for
# season/intake terms at all.
_WINTER_RE = re.compile(r"\bwinter\b", re.IGNORECASE)
_SUMMER_RE = re.compile(r"\bsummer\b", re.IGNORECASE)


def _find_contradicting_category_term(claim_name: str, found_text: str) -> str | None:
    from app.services.verification_audit import _significant_words
    claim_words, found_words = _significant_words(claim_name), _significant_words(found_text)
    for side_a, side_b in _ADMISSION_CATEGORY_ANTONYMS:
        claim_a, claim_b = bool(claim_words & side_a), bool(claim_words & side_b)
        found_a, found_b = bool(found_words & side_a), bool(found_words & side_b)
        if claim_a and found_b and not found_a:
            return f"claim says '{(claim_words & side_a).pop()}', page says '{(found_words & side_b).pop()}'"
        if claim_b and found_a and not found_b:
            return f"claim says '{(claim_words & side_b).pop()}', page says '{(found_words & side_a).pop()}'"

    claim_non_eu, found_non_eu = bool(_NON_EU_RE.search(claim_name)), bool(_NON_EU_RE.search(found_text))
    claim_eu_only, found_eu_only = (
        bool(_EU_CITIZENS_RE.search(claim_name)) and not claim_non_eu,
        bool(_EU_CITIZENS_RE.search(found_text)) and not found_non_eu,
    )
    if claim_non_eu and found_eu_only:
        return "claim targets non-EU applicants, page states an EU/EEA-citizens-only rule"
    if claim_eu_only and found_non_eu:
        return "claim targets EU/EEA citizens, page states a non-EU-specific rule"

    claim_winter, claim_summer = bool(_WINTER_RE.search(claim_name)), bool(_SUMMER_RE.search(claim_name))
    found_winter, found_summer = bool(_WINTER_RE.search(found_text)), bool(_SUMMER_RE.search(found_text))
    if claim_winter and not claim_summer and found_summer and not found_winter:
        return "claim is scoped to the winter intake, page states a summer-intake rule"
    if claim_summer and not claim_winter and found_winter and not found_summer:
        return "claim is scoped to the summer intake, page states a winter-intake rule"
    return None


def find_evidence_passage(evidence_text: str, page_text: str) -> dict:
    """
    Searches the live page text for the stored evidence — first for an
    exact (whitespace/case-normalized) substring match, then a date-range-
    aware scored search over candidate passages. Never assumes presence;
    always returns what was actually found so a human can compare it
    side-by-side with what was stored.

    Precision fix (Phase 2.8.1): plain word-overlap alone picks the wrong
    passage when a page has multiple structurally similar deadline
    statements (e.g. a lottery-admission sentence vs. a nearby certificate-
    submission sentence — both share "application"/"deadline"/"semester").
    Candidates are now scored on the COMPLETE factual claim: word overlap
    PLUS whether the candidate's own date range(s) match the evidence's —
    a passage stating the exact same range is strongly preferred; a
    passage stating a genuinely different range for the same topic is
    penalized rather than picked as "close enough". Search also considers
    2-sentence windows, since the category-naming sentence ("the lottery
    process...") and the sentence with the actual dates are often adjacent
    but split by the sentence splitter.
    """
    norm_evidence = re.sub(r"\s+", " ", evidence_text.strip().lower())
    norm_page = re.sub(r"\s+", " ", page_text.lower())

    if norm_evidence and norm_evidence in norm_page:
        idx = norm_page.index(norm_evidence)
        return {"found_exact": True, "best_match_text": page_text[max(0, idx - 20):idx + len(norm_evidence) + 20].strip(), "best_match_overlap": 1.0}

    evidence_ranges = extract_date_ranges(evidence_text)
    evidence_nums = _extract_numbers(evidence_text)
    sentences = _split_sentences(page_text)
    candidates = list(sentences) + [f"{sentences[i]} {sentences[i + 1]}" for i in range(len(sentences) - 1)]

    best_candidate, best_word_overlap, best_score = None, 0.0, -1.0
    for candidate in candidates:
        word_overlap = _evidence_overlap_ratio(evidence_text, candidate)
        score = word_overlap
        if evidence_ranges:
            candidate_ranges = extract_date_ranges(candidate)
            if candidate_ranges & evidence_ranges:
                score = max(score, 0.95)  # exact matching date range — strong preference
            elif candidate_ranges:
                score *= 0.3  # candidate states a DIFFERENT specific range — likely the wrong fact
        elif evidence_nums:
            # No date RANGE in the evidence (a single deadline date, e.g.
            # "15 January"), so the range preference above never fires.
            # _significant_words/_evidence_overlap_ratio ignore digits
            # entirely, so a sentence with the exact matching date used to
            # lose to an unrelated passage (an address/contact block) that
            # happened to share a few generic words. Found live against real
            # Batch 4 data (TU Chemnitz PDF: the correct "15th January /
            # 15th July" deadline sentence scored below the university's
            # postal-address paragraph). Boost candidates that contain the
            # same specific number(s) the evidence names.
            candidate_nums = _extract_numbers(candidate)
            num_overlap = len(evidence_nums & candidate_nums) / len(evidence_nums)
            if num_overlap >= 0.5:
                score = max(score, 0.6 + 0.35 * num_overlap)
        if score > best_score:
            best_candidate, best_word_overlap, best_score = candidate, word_overlap, score

    # best_match_overlap stays plain word-overlap (unchanged downstream
    # threshold semantics) — the date-aware score only decides SELECTION.
    reported_overlap = best_word_overlap
    if best_candidate and evidence_ranges and (extract_date_ranges(best_candidate) & evidence_ranges):
        reported_overlap = max(reported_overlap, 0.9)

    return {"found_exact": False, "best_match_text": best_candidate, "best_match_overlap": reported_overlap}


def verify_source_evidence(
    claim_name: str,
    evidence_text: str,
    source_url: str,
    condition: dict | None = None,
    degree_level: str | None = None,
    cycle: str | None = None,
    university_website: str | None = None,
    fetch_fn=None,
) -> dict:
    """
    The independent live check. Treats the stored evidence_text as an
    UNTRUSTED CLAIM about what the source says, and re-derives support from
    the actual fetched content — never from the fact that a source_url is
    merely present or reachable.

    Returns {"result": one of LIVE_RESULTS, "reasons": [...],
             "found_text": str|None, "source_tier": int|None,
             "checked_at": iso datetime, "final_url": str|None}
    """
    checked_at = datetime.now(timezone.utc).isoformat()
    tier = classify_source_tier(source_url, university_website)

    if tier == 5:
        return {"result": "CLAIM_NOT_SUPPORTED", "source_tier": tier, "checked_at": checked_at, "found_text": None, "final_url": source_url,
                "reasons": ["Source domain is a known low-quality/discovery-only source — never sufficient to independently support a claim."]}

    # Source-ownership check (Phase 3 production-readiness audit) — checked
    # before fetching anything. A source that's identifiably another
    # university's own official domain can never verify this claim,
    # regardless of what evidence_text says or how well it matches; no
    # amount of textual overlap makes evidence from the wrong institution
    # correct. UNKNOWN ownership does NOT block here — only a positively
    # identified wrong-university domain does (see classify_source_ownership).
    ownership = classify_source_ownership(source_url, university_website)
    if ownership == "wrong_university":
        return {"result": "SOURCE_WRONG_UNIVERSITY", "source_tier": tier, "checked_at": checked_at, "found_text": None,
                "final_url": source_url, "source_ownership": ownership,
                "reasons": [f"Source domain ({urlparse(source_url).netloc}) is identifiable as belonging to a "
                            f"DIFFERENT institution than the one this claim is about, and is not a recognized "
                            f"shared application portal — evidence_text may be correctly quoted verbatim from that "
                            f"page but cannot verify a claim about a different university."]}

    fetched = fetch_source_content(source_url, fetch_fn=fetch_fn)
    if not fetched["reachable"] or fetched["text"] is None:
        return {"result": "SOURCE_UNAVAILABLE", "source_tier": tier, "checked_at": checked_at, "found_text": None,
                "final_url": fetched.get("final_url"), "reasons": [fetched.get("error") or "Source could not be reliably fetched/read."]}

    match = find_evidence_passage(evidence_text, fetched["text"])
    found_text = match["best_match_text"]

    if not found_text or match["best_match_overlap"] < 0.15:
        return {"result": "EVIDENCE_NOT_FOUND", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                "final_url": fetched["final_url"], "reasons": ["No passage on the live page resembles the stored evidence."]}

    # Critical check found in the final pre-Batch-2 adversarial audit: an
    # EXACT substring match of evidence_text on the page (best_match_overlap
    # hardcoded to 1.0) previously short-circuited straight to SOURCE_VERIFIED
    # without ever checking whether the CLAIM ITSELF is even about the same
    # topic as what was found. If a researcher stores evidence_text that is
    # real, verbatim, on-page text — but for the WRONG claim (e.g. evidence
    # about "Restricted admission" attached to a claim named "Open admission
    # enrolment window") — the exact match alone used to be treated as proof.
    # It is not: the claim's own distinctive vocabulary must also relate to
    # what was actually found, independent of whether evidence_text matches
    # verbatim.
    # A blanket claim-name-vs-found-text overlap threshold was tried first
    # and rejected: legitimate multi-part claims (e.g. a dual-season deadline
    # "1-30 September (winter) / 1-31 March (summer)") can genuinely match a
    # single-season passage on the page with low raw overlap, without being
    # wrong. What IS a reliable, narrow signal is an explicit CONTRADICTING
    # category term — the claim says "open" admission, the found text says
    # "restricted" (an antonym, not just a different topic). Only that
    # specific pattern is flagged, avoiding false rejections of correct
    # partial matches.
    contradiction = _find_contradicting_category_term(claim_name, found_text)
    if contradiction:
        return {"result": "CLAIM_NOT_SUPPORTED", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                "final_url": fetched["final_url"],
                "reasons": [f"The claim and the matched passage name CONTRADICTING admission categories ({contradiction}) — "
                            f"evidence_text may be correctly quoted verbatim but attached to the wrong claim."]}

    # The SELECTED passage may still state a genuinely different date
    # range than the one the stored evidence itself claims — e.g. evidence
    # says '1-30 September', the only/best-scoring candidate on the page
    # says '1-20 September'. Selection scoring already prefers a matching
    # range when one exists, but with only one candidate on the page (or
    # no candidate with a matching range at all) that penalized-but-only
    # candidate can still be picked. This is the final check that a
    # disjoint range never quietly becomes SOURCE_VERIFIED.
    evidence_ranges_claimed = extract_date_ranges(evidence_text)
    found_ranges = extract_date_ranges(found_text)
    if evidence_ranges_claimed and found_ranges and not (evidence_ranges_claimed & found_ranges):
        return {"result": "SOURCE_CHANGED", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                "final_url": fetched["final_url"],
                "reasons": [f"The best-matching live passage states a different date range ({sorted(found_ranges)}) "
                            f"than the stored evidence ({sorted(evidence_ranges_claimed)})."]}

    # A matching topic was found, but does it state the SAME specific
    # figure/date the claim (and stored evidence) name? If the claim has
    # numbers and none of them appear in the matched live passage, this
    # could be an honest EVIDENCE_NOT_FOUND, OR a stronger signal that the
    # source used to say this and now says something else — distinguish by
    # whether the live passage has DIFFERENT numbers of the same kind
    # (dates/figures) than the claim, which points to SOURCE_CHANGED.
    if _claim_has_unconfirmed_numbers(claim_name, found_text):
        live_nums = _extract_numbers(found_text)
        claim_nums = _extract_numbers(claim_name)
        if not (claim_nums & _dotted_date_days(live_nums)):
            # (unless the live page names the same day via German short-date
            # notation, e.g. '15.7' for the claim's spelled-out '15 July' —
            # not a real change, falls through as confirmed instead.)
            if live_nums and claim_nums:
                return {"result": "SOURCE_CHANGED", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                        "final_url": fetched["final_url"],
                        "reasons": [f"The live page discusses the same topic but states different figures ({sorted(live_nums)}) "
                                    f"than the claim ({sorted(claim_nums)}) — source may have changed since this evidence was recorded."]}
            return {"result": "CLAIM_NOT_SUPPORTED", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                    "final_url": fetched["final_url"],
                    "reasons": ["The claim names a specific figure not present in the matching live passage."]}

    scope_findings = _detect_unrepresented_scope(found_text, condition, degree_level)
    if scope_findings:
        return {"result": "SCOPE_MISMATCH", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                "final_url": fetched["final_url"], "reasons": scope_findings}

    cycle_status, cycles_found = assess_cycle_freshness(found_text, fetched["text"], cycle)
    if cycle_status == "outdated":
        return {"result": "OUTDATED_SOURCE", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                "final_url": fetched["final_url"],
                "reasons": [f"This claim is stored for cycle '{cycle}', but the live page states cycle(s) {sorted(cycles_found)} instead — "
                            f"never treat an accessible page as current just because it's still reachable."]}

    strong_match = match["found_exact"] or match["best_match_overlap"] >= 0.6

    if strong_match and cycle_status in ("ambiguous", "unstated"):
        # A strong textual match, but we cannot confirm THIS specific cycle
        # is what the live page currently supports — downgrade rather than
        # silently assume the claim's stored cycle is still valid.
        note = ("the page mentions multiple cycles nearby and it's unclear which applies" if cycle_status == "ambiguous"
                else "the page does not state an admission cycle at all")
        return {"result": "EVIDENCE_FOUND", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                "final_url": fetched["final_url"],
                "reasons": [f"Text match is strong, but cycle '{cycle}' could not be confirmed on the live page — {note}. "
                            f"Not assumed current."]}

    if strong_match:
        return {"result": "SOURCE_VERIFIED", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
                "final_url": fetched["final_url"],
                "reasons": [f"{'Exact' if match['found_exact'] else 'Close paraphrase'} match found on the live source page."]}

    return {"result": "EVIDENCE_FOUND", "source_tier": tier, "checked_at": checked_at, "found_text": found_text,
            "final_url": fetched["final_url"],
            "reasons": [f"A topically related passage was found (overlap ~{match['best_match_overlap']:.0%}), but it's not a strong enough match to call fully verbatim-confirmed."]}

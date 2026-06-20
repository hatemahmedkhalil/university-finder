"""
Recommendation engine — rule-based implementation behind an abstract interface.

To swap in an AI backend (OpenAI, Claude, etc.):
  1. Subclass BaseRecommender and implement `recommend`.
  2. Change get_recommender() to return the new class.
  Nothing else needs to touch the router or schemas.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models.student_profile import EnglishLevel, StudentProfile
from app.models.university import University
from app.schemas.recommendation import ScoreBreakdown, UniversityMatch

# English levels in ascending order — used for range comparisons
_ENGLISH_RANK: dict[str, int] = {
    e.value: i for i, e in enumerate(EnglishLevel)
}

# Maximum tuition-to-budget ratio before a university is hard-excluded
_BUDGET_HARD_CUTOFF = 2.0

# Score weights (must sum to 100)
_W_COUNTRY = 30
_W_BUDGET = 30
_W_ENGLISH = 20
_W_GPA = 20


@dataclass
class StudentCriteria:
    """Normalised input to the recommender — decoupled from the ORM model."""
    gpa: float
    budget_eur: int
    english_level: str
    preferred_countries: list[str]  # lower-cased


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------

class BaseRecommender(ABC):
    @abstractmethod
    def recommend(
        self,
        criteria: StudentCriteria,
        universities: list[University],
    ) -> list[UniversityMatch]:
        """Return matched universities sorted by descending score."""


# ---------------------------------------------------------------------------
# Rule-based implementation
# ---------------------------------------------------------------------------

class RuleBasedRecommender(BaseRecommender):

    def recommend(
        self,
        criteria: StudentCriteria,
        universities: list[University],
    ) -> list[UniversityMatch]:
        results: list[UniversityMatch] = []

        for uni in universities:
            tuition = uni.tuition_fee_eur or 0

            # Hard filter: universities that cost more than 2× the budget are skipped
            if tuition > criteria.budget_eur * _BUDGET_HARD_CUTOFF:
                continue

            breakdown, reasons = self._score(criteria, uni, tuition)
            total = round(
                breakdown.country_match
                + breakdown.budget_fit
                + breakdown.english_fit
                + breakdown.gpa_fit,
                2,
            )

            results.append(
                UniversityMatch(
                    university=uni,
                    score=total,
                    breakdown=breakdown,
                    reasons=reasons,
                )
            )

        results.sort(key=lambda m: m.score, reverse=True)
        return results

    # ------------------------------------------------------------------
    # Scoring helpers
    # ------------------------------------------------------------------

    def _score(
        self,
        c: StudentCriteria,
        uni: University,
        tuition: int,
    ) -> tuple[ScoreBreakdown, list[str]]:
        reasons: list[str] = []

        country_score = self._score_country(c, uni, reasons)
        budget_score = self._score_budget(c, tuition, reasons)
        english_score = self._score_english(c, uni, reasons)
        gpa_score = self._score_gpa(c, uni, reasons)

        return (
            ScoreBreakdown(
                country_match=country_score,
                budget_fit=budget_score,
                english_fit=english_score,
                gpa_fit=gpa_score,
            ),
            reasons,
        )

    def _score_country(self, c: StudentCriteria, uni: University, reasons: list[str]) -> float:
        if not c.preferred_countries:
            # No preference → neutral half-score
            return _W_COUNTRY * 0.5

        if uni.country.lower() in c.preferred_countries:
            reasons.append(f"{uni.country} is in your preferred countries.")
            return float(_W_COUNTRY)

        return 0.0

    def _score_budget(self, c: StudentCriteria, tuition: int, reasons: list[str]) -> float:
        if tuition == 0:
            reasons.append("This university appears to be tuition-free.")
            return float(_W_BUDGET)

        if tuition <= c.budget_eur:
            ratio = 1 - (tuition / c.budget_eur)  # more headroom → slightly higher score
            score = round(_W_BUDGET * (0.7 + 0.3 * ratio), 2)
            reasons.append(f"Tuition (€{tuition:,}) is within your budget (€{c.budget_eur:,}).")
            return score

        # Over budget but under the hard cutoff — partial credit, scaled
        over_ratio = tuition / c.budget_eur  # 1.0 – 2.0
        score = round(_W_BUDGET * max(0, 1 - (over_ratio - 1)), 2)
        reasons.append(f"Tuition (€{tuition:,}) exceeds your budget (€{c.budget_eur:,}) slightly.")
        return score

    def _score_english(self, c: StudentCriteria, uni: University, reasons: list[str]) -> float:
        student_rank = _ENGLISH_RANK.get(c.english_level, 0)
        qualifies_for_english = student_rank >= _ENGLISH_RANK[EnglishLevel.b2.value]

        if uni.english_programs_available and qualifies_for_english:
            reasons.append("English-taught programs available and your level qualifies.")
            return float(_W_ENGLISH)

        if uni.english_programs_available and not qualifies_for_english:
            reasons.append("English programs exist but your English level may not meet entry requirements.")
            return _W_ENGLISH * 0.4

        if not uni.english_programs_available and qualifies_for_english:
            reasons.append("No English-taught programs listed; local language may be required.")
            return _W_ENGLISH * 0.3

        # Neither has English programs nor does the student qualify — neutral
        return _W_ENGLISH * 0.5

    def _score_gpa(self, c: StudentCriteria, uni: University, reasons: list[str]) -> float:
        """
        Estimate selectivity from world ranking.
        Top 100  → needs GPA ≥ 3.7
        Top 500  → needs GPA ≥ 3.2
        Top 1000 → needs GPA ≥ 2.5
        Unranked → neutral
        """
        ranking = uni.ranking

        if ranking is None:
            return _W_GPA * 0.5

        if ranking <= 100:
            required_gpa = 3.7
        elif ranking <= 500:
            required_gpa = 3.2
        else:
            required_gpa = 2.5

        if c.gpa >= required_gpa:
            reasons.append(f"Your GPA ({c.gpa}) meets the estimated requirement for ranked #{ranking}.")
            return float(_W_GPA)

        gap = required_gpa - c.gpa
        score = round(_W_GPA * max(0, 1 - gap / required_gpa), 2)
        reasons.append(
            f"Your GPA ({c.gpa}) is below the estimated threshold ({required_gpa}) for ranked #{ranking}."
        )
        return score


# ---------------------------------------------------------------------------
# Factory — the only place that decides which engine is active
# ---------------------------------------------------------------------------

def get_recommender() -> BaseRecommender:
    return RuleBasedRecommender()


def build_criteria(profile: StudentProfile, overrides: dict) -> StudentCriteria:
    """Merge saved profile with any ad-hoc overrides from the request body."""
    preferred_raw: str = overrides.get("preferred_countries") or profile.preferred_countries or ""
    preferred = [c.strip().lower() for c in preferred_raw.split(",") if c.strip()]

    return StudentCriteria(
        gpa=overrides.get("gpa") if overrides.get("gpa") is not None else profile.gpa,
        budget_eur=overrides.get("budget_eur") if overrides.get("budget_eur") is not None else profile.budget_eur,
        english_level=overrides.get("english_level") or profile.english_level,
        preferred_countries=preferred,
    )

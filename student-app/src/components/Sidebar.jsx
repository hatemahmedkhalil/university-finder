import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { useEffect, useState } from "react";

/* ── SVG Icons ── */
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard:       ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  profile:         ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"],
  recommendations: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  universities:    ["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c3 3 9 3 12 0v-5"],
  scholarships:    ["M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"],
  visaguide:       ["M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"],
  costofLiving:    ["M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z", "M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"],
  community:       ["M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"],
  learning:        ["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z", "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"],
  instructors:     ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M23 21v-2a4 4 0 00-3-3.87", "M9 11a4 4 0 100-8 4 4 0 000 8z", "M16 3.13a4 4 0 010 7.75"],
  applications:    ["M9 11l3 3L22 4", "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"],
  favourites:      ["M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"],
  applyhub:        ["M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"],
  aichat:          ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"],
  pricing:         ["M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", "M12 6v6l4 2"],
  support:         ["M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3", "M12 17h.01"],
  settings:        ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  logout:          ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  chevronLeft:     "M15 18l-6-6 6-6",
  chevronRight:    "M9 18l6-6-6-6",
  menu:            ["M3 12h18", "M3 6h18", "M3 18h18"],
  calendar:        ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"],
  email:           ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"],
  notifications:   ["M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"],
  questions:       ["M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"],
  pipeline:        ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  simulators:      ["M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"],
  /* ── de-AI-ify pass: professional replacements for decorative emoji ── */
  search:        ["M11 19a8 8 0 100-16 8 8 0 000 16z", "M21 21l-4.35-4.35"],
  heart:         ["M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"],
  target:        ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 16a4 4 0 100-8 4 4 0 000 8z", "M12 12a.5.5 0 100-1 .5.5 0 000 1z"],
  award:         ["M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"],
  lock:          ["M5 11h14v10H5z", "M7 11V7a5 5 0 0110 0v4"],
  sparkle:       ["M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"],
  eye:           ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z", "M12 15a3 3 0 100-6 3 3 0 000 6z"],
  scale:         ["M12 3v18M7 7l-4 8a4 4 0 008 0zM21 15a4 4 0 01-8 0l4-8zM3 8h6M15 8h6"],
  x:             ["M18 6L6 18", "M6 6l12 12"],
  check:         ["M20 6L9 17l-5-5"],
  graduationCap: ["M22 10L12 5 2 10l10 5 10-5z", "M6 12v5c3 3 9 3 12 0v-5"],
  globe:         ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M2 12h20", "M12 2a15 15 0 010 20 15 15 0 010-20z"],
  wallet:        ["M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M16 13h.01"],
  clock:         ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 6v6l4 2"],
  compass:       ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M16 8l-2.5 6.5L8 17l2.5-6.5z"],
  headphones:    ["M3 18v-6a9 9 0 0118 0v6", "M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"],
  book:          ["M4 19.5A2.5 2.5 0 016.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"],
  pencil:        ["M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"],
  mic:           ["M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z", "M19 10v2a7 7 0 01-14 0v-2", "M12 19v4", "M8 23h8"],
  mail:          ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"],
  building:      ["M3 21h18", "M5 21V7l8-4v18", "M19 21V11l-6-4", "M9 9h.01M9 12h.01M9 15h.01"],
  film:          ["M2 3h20v18H2z", "M7 3v18M17 3v18M2 8h5M2 16h5M17 8h5M17 16h5"],
  brain:         ["M9.5 2a3.5 3.5 0 00-3.5 3.5v.5a3.5 3.5 0 000 7v3a3.5 3.5 0 007 0V5.5A3.5 3.5 0 009.5 2z", "M14.5 2a3.5 3.5 0 013.5 3.5v.5a3.5 3.5 0 010 7v3a3.5 3.5 0 01-7 0V5.5A3.5 3.5 0 0114.5 2z"],
  trendingUp:    ["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"],
  megaphone:     ["M3 11v3a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z", "M15 8a4 4 0 010 8", "M18 5a8 8 0 010 14"],
  lightbulb:     ["M9 18h6", "M10 22h4", "M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"],
  alertTriangle: ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z", "M12 9v4", "M12 17h.01"],
  refresh:       ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0114.85-3.36L23 10", "M1 14l4.64 4.36A9 9 0 0020.49 15"],
  pin:           ["M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z", "M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"],
  grid:          ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  rocket:        ["M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z", "M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z", "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0", "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"],
  home:          ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  utensils:      ["M3 2v7c0 1.1.9 2 2 2h1a2 2 0 002-2V2", "M6 2v20", "M17 2a5 5 0 00-5 5v6h4v9", "M16 2v7"],
  bus:           ["M4 17h16V6a2 2 0 00-2-2H6a2 2 0 00-2 2v11z", "M4 11h16", "M7.5 17v3M16.5 17v3", "M6 21h.01M18 21h.01"],
  bolt:          ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"],
  film2:         ["M8 21h8", "M12 17v4", "M2 4h20v13H2z"],
  creditCard:    ["M1 4h22v16H1z", "M1 10h22"],
  info:          ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 16v-4", "M12 8h.01"],
  send:          ["M22 2L11 13", "M22 2l-7 20-4-9-9-4z"],
  folderCheck:   ["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z", "M9 13l2 2 4-4"],
  phone:         ["M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"],
  key:           ["M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"],
  folder:        ["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"],
  map:           ["M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z", "M8 2v16", "M16 6v16"],
  trash:         ["M3 6h18", "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"],
  image:         ["M3 3h18v18H3z", "M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M21 15l-5-5L5 21"],
};

/* ── Grouped nav sections — journey-based structure ──
   Each section has `items`: a mix of direct links and nested collapsible
   subgroups ({ type: "subgroup", items: [...] }). */
const STUDENT_NAV_SECTIONS = [
  {
    label: "Discover",
    i18nKey: "nav.sectionDiscover",
    items: [
      { path: "/dashboard", i18nKey: "nav.dashboard", iconKey: "dashboard" },
      {
        type: "subgroup",
        label: "Find Universities",
        i18nKey: "nav.subgroupFindUniversities",
        iconKey: "universities",
        items: [
          { path: "/universities",    i18nKey: "nav.universities",    iconKey: "universities" },
          { path: "/scholarships",    i18nKey: "nav.scholarships",    iconKey: "scholarships" },
          { path: "/recommendations", i18nKey: "nav.recommendations", iconKey: "recommendations", badge: "AI" },
          { path: "/favourites",      i18nKey: "nav.favourites",      iconKey: "favourites" },
        ],
      },
    ],
  },
  {
    label: "Prepare",
    i18nKey: "nav.sectionPrepare",
    items: [
      {
        type: "subgroup",
        label: "Learning",
        i18nKey: "nav.subgroupLearning",
        iconKey: "learning",
        items: [
          { path: "/learning",     i18nKey: "nav.learning",     iconKey: "learning" },
          { path: "/simulators",   i18nKey: "nav.simulators",   iconKey: "simulators" },
          { path: "/instructors",  i18nKey: "nav.instructors",  iconKey: "instructors" },
          { path: "/my-questions", i18nKey: "nav.myQuestions",  iconKey: "questions" },
        ],
      },
      {
        type: "subgroup",
        label: "Guidance",
        i18nKey: "nav.subgroupGuidance",
        iconKey: "visaguide",
        items: [
          { path: "/visa-guide",     i18nKey: "nav.visaGuide",    iconKey: "visaguide" },
          { path: "/cost-of-living", i18nKey: "nav.costOfLiving", iconKey: "costofLiving" },
        ],
      },
    ],
  },
  {
    label: "Apply",
    i18nKey: "nav.sectionApply",
    items: [
      {
        type: "subgroup",
        label: "My Applications",
        i18nKey: "nav.subgroupMyApplications",
        iconKey: "applications",
        items: [
          { path: "/profile",   i18nKey: "nav.myData",   iconKey: "profile" },
          { path: "/apply-hub", i18nKey: "nav.applyHub", iconKey: "applyhub" },
          { path: "/pipeline",  i18nKey: "nav.pipeline", iconKey: "pipeline" },
        ],
      },
    ],
  },
  {
    label: "Community",
    i18nKey: "nav.sectionCommunity",
    items: [
      { path: "/community", i18nKey: "nav.community", iconKey: "community" },
    ],
  },
  {
    label: "Account",
    i18nKey: "nav.sectionAccount",
    items: [
      { path: "/account",  i18nKey: "nav.accountProfile", iconKey: "profile" },
      { path: "/pricing",  i18nKey: "nav.pricing",        iconKey: "pricing" },
      { path: "/support",  i18nKey: "nav.support",        iconKey: "support" },
      { path: "/settings", i18nKey: "nav.settings",       iconKey: "settings" },
    ],
  },
];

/** Recursively expands subgroups into a flat list of direct-link items.
 *  Used for the collapsed (icon-only) desktop sidebar, which has no room
 *  for nested toggles. */
const flattenNavItems = (items) =>
  items.flatMap((it) => (it.type === "subgroup" ? flattenNavItems(it.items) : [it]));

const INSTRUCTOR_NAV_SECTIONS = [
  {
    label: "Main",
    i18nKey: "nav.sectionMain",
    items: [
      { path: "/dashboard",             i18nKey: "nav.dashboard",           iconKey: "dashboard" },
      { path: "/instructor-panel",      i18nKey: "nav.instructorPanel",     iconKey: "instructors" },
      { path: "/my-courses",            i18nKey: "nav.myCourses",           iconKey: "learning" },
      { path: "/my-instructor-profile", i18nKey: "nav.myInstructorProfile", iconKey: "profile" },
    ],
  },
  {
    label: "Account",
    i18nKey: "nav.sectionAccount",
    items: [
      { path: "/support",  i18nKey: "nav.support",  iconKey: "support" },
      { path: "/settings", i18nKey: "nav.settings", iconKey: "settings" },
    ],
  },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [profilePct, setProfilePct] = useState(0);
  const [openSections, setOpenSections] = useState({});
  const toggleSection = (label) => setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  // Subgroup open state keyed by "sectionLabel::subgroupLabel"
  const [openSubgroups, setOpenSubgroups] = useState({});
  const toggleSubgroup = (sectionLabel, subLabel) => {
    const key = `${sectionLabel}::${subLabel}`;
    setOpenSubgroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SECTIONS = user?.role === "instructor" ? INSTRUCTOR_NAV_SECTIONS : STUDENT_NAV_SECTIONS;

  useEffect(() => {
    if (user) {
      api.get("/profiles/me").then(r => {
        const p = r.data;
        const fields = [p?.gpa, p?.budget_eur, p?.field_of_study, p?.preferred_countries?.length, p?.degree_level];
        const filled = fields.filter(Boolean).length;
        setProfilePct(Math.round((filled / fields.length) * 100));
      }).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate("/"); onMobileClose?.(); };

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const tooltipPos = isRTL ? "right-full mr-3" : "left-full ml-3";

  /* ── Nav sections ──
     `isCollapsed` defaults to the shared desktop `collapsed` state, but the
     mobile drawer passes `isCollapsed={false}` explicitly so it never
     inherits the desktop icon-only mode. */
  const NavSections = ({ isCollapsed = collapsed } = {}) => (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
      {SECTIONS.map((section) => {
        const isOpen = openSections[section.label] === true;
        return (
          <div key={section.label} className="mb-1">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-3 pt-4 pb-1.5 cursor-pointer select-none"
              >
                <span className="text-[10.5px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--ink-faint)" }}>
                  {t(section.i18nKey, section.label)}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round"
                     style={{ color: "var(--ink-faint)", transition: "transform 0.2s", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            )}
            {isCollapsed && <div className="my-2 mx-2 h-px" style={{ background: "var(--border)" }} />}
            <div style={{ overflow: "hidden", maxHeight: (!isCollapsed && !isOpen) ? "0px" : "2000px", transition: "max-height 0.25s ease" }}>
              {(isCollapsed ? flattenNavItems(section.items) : section.items).map((entry) => {
                if (entry.type === "subgroup") {
                  const subKey = `${section.label}::${entry.label}`;
                  const subOpen = openSubgroups[subKey] === true;
                  return (
                    <div key={entry.label}>
                      <button
                        onClick={() => toggleSubgroup(section.label, entry.label)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium transition-all duration-150 mb-0.5"
                        style={{ color: "var(--ink-dim)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.color = "var(--ink)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-dim)"; }}
                      >
                        <span className="shrink-0" style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon d={ICONS[entry.iconKey]} size={18} />
                        </span>
                        <span className="whitespace-nowrap overflow-hidden flex-1 text-start">
                          {t(entry.i18nKey, entry.label)}
                        </span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                             strokeLinecap="round" strokeLinejoin="round" className="shrink-0"
                             style={{ transition: "transform 0.2s", transform: subOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <div style={{ overflow: "hidden", maxHeight: subOpen ? "500px" : "0px", transition: "max-height 0.25s ease" }}>
                        {entry.items.map(({ path, i18nKey, iconKey, badge }) => {
                          const active = isActive(path);
                          const label  = t(i18nKey);
                          return (
                            <Link
                              key={path}
                              to={path}
                              onClick={onMobileClose}
                              className="flex items-center gap-3 py-2.5 rounded-[9px] text-sm font-medium transition-all duration-150 relative group mb-0.5"
                              style={{
                                paddingInlineStart: 30,
                                paddingInlineEnd: 12,
                                background: active ? "var(--accent)" : "transparent",
                                color: active ? "var(--on-accent)" : "var(--ink-faint)",
                                fontWeight: active ? 600 : 500,
                              }}
                              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-hover)"; if (!active) e.currentTarget.style.color = "var(--ink)"; }}
                              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; if (!active) e.currentTarget.style.color = "var(--ink-faint)"; }}
                            >
                              <span className="shrink-0" style={{ width: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon d={ICONS[iconKey]} size={15} />
                              </span>
                              <span className="whitespace-nowrap overflow-hidden">{label}</span>
                              {badge && (
                                <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                                      style={{ background: active ? "rgba(255,255,255,.22)" : "var(--surface-2)", color: active ? "var(--on-accent)" : "var(--accent)" }}>
                                  {badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const { path, i18nKey, iconKey, badge } = entry;
                const active = isActive(path);
                const label  = t(i18nKey);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onMobileClose}
                    title={isCollapsed ? label : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium transition-all duration-150 relative group mb-0.5"
                    style={{
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "var(--on-accent)" : "var(--ink-dim)",
                      fontWeight: active ? 600 : 500,
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-hover)"; if (!active) e.currentTarget.style.color = "var(--ink)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; if (!active) e.currentTarget.style.color = "var(--ink-dim)"; }}
                  >
                    <span className="shrink-0" style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon d={ICONS[iconKey]} size={18} />
                    </span>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                      {label}
                    </span>
                    {badge && !isCollapsed && (
                      <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ background: active ? "rgba(255,255,255,.22)" : "var(--surface-2)", color: active ? "var(--on-accent)" : "var(--accent)" }}>
                        {badge}
                      </span>
                    )}
                    {isCollapsed && (
                      <div className={`absolute ${tooltipPos} px-2.5 py-1.5 text-white text-xs rounded-lg
                                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150
                                      whitespace-nowrap z-50 shadow-lg`}
                           style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        {label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  /* ── Logout button ── */
  const LogoutBtn = ({ isCollapsed = collapsed } = {}) => (
    <button
      onClick={handleLogout}
      title={isCollapsed ? t("nav.logout") : undefined}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-[9px] text-sm transition-all duration-150 relative group"
      style={{ color: "var(--ink-dim)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.color = "var(--ink)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-dim)"; }}
    >
      <span className="shrink-0 flex items-center justify-center" style={{ width: 20 }}><Icon d={ICONS.logout} size={16} /></span>
      <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap text-start ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
        {t("nav.logout")}
      </span>
      {isCollapsed && (
        <div className={`absolute ${tooltipPos} px-2.5 py-1.5 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg`}
             style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {t("nav.logout")}
        </div>
      )}
    </button>
  );

  /* ── Bottom pinned card: profile completion + Upgrade to Pro CTA ── */
  const ProfileCard = ({ isCollapsed = collapsed } = {}) => {
    if (isCollapsed) return <LogoutBtn isCollapsed={isCollapsed} />;
    const isPaid = user?.plan === "premium" || user?.plan === "pro";
    return (
      <div className="px-2 pb-3 space-y-2">
        {!isPaid && (
          <Link
            to="/pricing"
            onClick={onMobileClose}
            className="block rounded-2xl p-3.5 text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent-active))" }}
          >
            <p className="text-[13px] font-bold mb-0.5">Upgrade to Pro</p>
            <p className="text-[11.5px] leading-snug opacity-90 mb-2.5">
              Unlock all features and apply to unlimited universities.
            </p>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.18)" }}>
              Upgrade Now →
            </span>
          </Link>
        )}

        <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--ink-dim)" }}>Profile completion</div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${profilePct || 72}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-light))" }} />
          </div>
          <Link to="/profile" onClick={onMobileClose}
                className="text-xs font-semibold transition-colors"
                style={{ color: "var(--accent)" }}>
            Complete profile →
          </Link>
        </div>
        <LogoutBtn />
      </div>
    );
  };

  const collapseIcon = isRTL
    ? (collapsed ? ICONS.chevronLeft  : ICONS.chevronRight)
    : (collapsed ? ICONS.chevronRight : ICONS.chevronLeft);

  const SidebarInner = ({ onClose }) => (
    <>
      {/* Logo header */}
      <div className="flex items-center h-[68px] shrink-0 px-3"
           style={{ borderBottom: "1px solid var(--border)", justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <Link to="/" className={`flex items-center gap-2.5 ${isRTL ? "me-1" : "ms-1"}`} onClick={onClose}>
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white font-bold text-sm shadow-lg"
                 style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent))" }}>U</div>
            <span className="text-white font-bold text-[15px] tracking-tight">UniPath</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" onClick={onClose}
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white font-bold text-sm shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent))" }}>U</Link>
        )}
        {!collapsed && (
          <button onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--ink-faint)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.color = "var(--ink)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-faint)"; }}>
            <Icon d={collapseIcon} size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={onToggle}
                className="mx-auto mt-2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--ink-faint)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.color = "var(--ink)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-faint)"; }}>
          <Icon d={collapseIcon} size={16} />
        </button>
      )}

      <NavSections />
      <ProfileCard />
    </>
  );

  /* Desktop sidebar */
  const desktopSidebar = (
    <aside
      className={`hidden lg:flex flex-col fixed top-0 h-screen z-30 transition-all duration-300 ease-in-out
        ${isRTL ? "right-0 border-l" : "left-0 border-r"}
        ${collapsed ? "w-[68px]" : "w-[240px]"}`}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <SidebarInner onClose={undefined} />
    </aside>
  );

  /* Mobile sidebar */
  const mobileSidebar = (
    <>
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onMobileClose}
      />
      <aside
        className={`lg:hidden fixed top-0 h-screen z-50 w-[240px] flex flex-col transition-transform duration-300 ease-in-out
          ${isRTL
            ? `right-0 border-l ${mobileOpen ? "translate-x-0" : "translate-x-full"}`
            : `left-0 border-r ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
          }`}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between h-[68px] shrink-0 px-4"
             style={{ borderBottom: "1px solid var(--border)" }}>
          <Link to="/" className="flex items-center gap-2.5" onClick={onMobileClose}>
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white font-bold text-sm shadow-lg"
                 style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent))" }}>U</div>
            <span className="text-white font-bold text-[15px] tracking-tight">UniPath</span>
          </Link>
          <button onClick={onMobileClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--ink-faint)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <NavSections isCollapsed={false} />
        <ProfileCard isCollapsed={false} />
      </aside>
    </>
  );

  return <>{desktopSidebar}{mobileSidebar}</>;
};

export default Sidebar;
export { ICONS, Icon };

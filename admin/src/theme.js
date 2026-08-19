/* ══════════════════════════════════════════════════════════════════════════
   UNIPATH ADMIN — DESIGN SYSTEM (MUI theme)
   Same token values as the student app's .app-shell (student-app/src/index.css),
   translated into Material UI's theme so react-admin's built-in Lists, Edits,
   DataGrids, dialogs, and forms pick them up automatically. Denser and more
   "control-room" than the student app (smaller type scale, tighter row
   heights) since this is an internal tool for admins, not a marketing surface.
════════════════════════════════════════════════════════════════════════════ */
import { createTheme } from "@mui/material/styles";

const FONT = '"Manrope", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

const RADIUS = { sm: 8, md: 10, lg: 14, xl: 18 };

const tokensLight = {
  bg: "#f7f9fc",
  bgSubtle: "#f0f4f9",
  surface: "#ffffff",
  surfaceHover: "#f7f9fc",
  surface2: "#f0f4f9",
  border: "#e6ebf2",
  borderStrong: "#d3dbe6",
  ink: "#0b1220",
  inkDim: "#4c5a6e",
  inkFaint: "#8996a8",
  accent: "#0ea5e9",
  accentHover: "#0284c7",
  accentActive: "#0369a1",
  accentLight: "#38bdf8",
  accentSubtle: "#e6f6fe",
  onAccent: "#ffffff",
  good: "#10b981",
  goodSubtle: "#ecfdf5",
  warn: "#f59e0b",
  warnSubtle: "#fffbeb",
  danger: "#ef4444",
  dangerSubtle: "#fef2f2",
};

const tokensDark = {
  bg: "#0a0d12",
  bgSubtle: "#0d1117",
  surface: "#11151c",
  surfaceHover: "#161b24",
  surface2: "#1a212c",
  border: "#1e2531",
  borderStrong: "#2a3342",
  ink: "#eef2f7",
  inkDim: "#a3aebd",
  inkFaint: "#6b7688",
  accent: "#38bdf8",
  accentHover: "#7dd3fc",
  accentActive: "#0ea5e9",
  accentLight: "#7dd3fc",
  accentSubtle: "rgba(56,189,248,0.12)",
  onAccent: "#0a0d12",
  good: "#10b981",
  goodSubtle: "rgba(16,185,129,0.12)",
  warn: "#f59e0b",
  warnSubtle: "rgba(245,158,11,0.12)",
  danger: "#ef4444",
  dangerSubtle: "rgba(239,68,68,0.12)",
};

function buildTheme(mode, t) {
  return createTheme({
    cssVariables: { colorSchemeSelector: "class" },
    palette: {
      mode,
      primary:   { main: t.accent, light: t.accentLight, dark: t.accentActive, contrastText: t.onAccent },
      secondary: { main: t.inkDim },
      success:   { main: t.good, light: t.goodSubtle },
      warning:   { main: t.warn, light: t.warnSubtle },
      error:     { main: t.danger, light: t.dangerSubtle },
      background: { default: t.bg, paper: t.surface },
      text: { primary: t.ink, secondary: t.inkDim, disabled: t.inkFaint },
      divider: t.border,
    },
    shape: { borderRadius: RADIUS.md },
    typography: {
      fontFamily: FONT,
      h1: { fontFamily: FONT, fontWeight: 800 },
      h2: { fontFamily: FONT, fontWeight: 800 },
      h3: { fontFamily: FONT, fontWeight: 700 },
      h4: { fontFamily: FONT, fontWeight: 700 },
      h5: { fontFamily: FONT, fontWeight: 700 },
      h6: { fontFamily: FONT, fontWeight: 700 },
      button: { fontFamily: FONT, fontWeight: 600, textTransform: "none" },
      body1: { fontFamily: FONT },
      body2: { fontFamily: FONT },
    },
    shadows: [
      "none",
      "0 1px 2px rgba(15,23,42,0.04)",
      "0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04)",
      "0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04)",
      "0 6px 16px rgba(15,23,42,0.07), 0 2px 6px rgba(15,23,42,0.04)",
      "0 6px 16px rgba(15,23,42,0.07), 0 2px 6px rgba(15,23,42,0.04)",
      "0 6px 16px rgba(15,23,42,0.07), 0 2px 6px rgba(15,23,42,0.04)",
      "0 6px 16px rgba(15,23,42,0.07), 0 2px 6px rgba(15,23,42,0.04)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
      "0 16px 40px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)",
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: t.bg, fontFamily: FONT },
          "::-webkit-scrollbar": { width: 10, height: 10 },
          "::-webkit-scrollbar-thumb": { backgroundColor: t.borderStrong, borderRadius: 999 },
          "::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${t.border}`,
            backgroundColor: t.surface,
          },
          elevation1: { boxShadow: "0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04)" },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.lg,
            border: `1px solid ${t.border}`,
            boxShadow: "0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04)",
            transition: "box-shadow 150ms ease, border-color 150ms ease",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: t.surface,
            color: t.ink,
            boxShadow: `inset 0 -1px 0 ${t.border}`,
            backgroundImage: "none",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: t.surface,
            borderRight: `1px solid ${t.border}`,
            backgroundImage: "none",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.sm,
            marginLeft: 8,
            marginRight: 8,
            marginTop: 1,
            marginBottom: 1,
            width: "auto",
            "&.RaMenuItemLink-active": {
              backgroundColor: t.accentSubtle,
              color: t.accent,
              "& .MuiListItemIcon-root": { color: t.accent },
            },
            "&:hover": { backgroundColor: t.surfaceHover },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.sm,
            fontWeight: 600,
            boxShadow: "none",
          },
          containedPrimary: {
            boxShadow: "none",
            "&:hover": { boxShadow: "none", backgroundColor: t.accentHover },
          },
          outlined: { borderColor: t.border },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: RADIUS.sm, fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${t.border}` },
          head: {
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            color: t.inkFaint,
            backgroundColor: t.surface2,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": { backgroundColor: t.surfaceHover },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.sm,
            backgroundColor: t.surface,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: t.border },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: t.borderStrong },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: t.accent, borderWidth: 1.5 },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: RADIUS.lg, border: `1px solid ${t.border}` },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: t.ink, color: t.bg, fontSize: 12, borderRadius: RADIUS.sm },
        },
      },
      RaLayout: {
        styleOverrides: {
          root: { backgroundColor: t.bg },
        },
      },
      RaMenuItemLink: {
        styleOverrides: {
          root: { color: t.inkDim },
        },
      },
      RaDatagrid: {
        styleOverrides: {
          root: {
            "& .RaDatagrid-headerCell": { backgroundColor: t.surface2 },
            "& .RaDatagrid-rowCell": { borderColor: t.border },
            "& .RaDatagrid-row:hover": { backgroundColor: t.surfaceHover },
          },
        },
      },
      RaList: {
        styleOverrides: {
          content: { boxShadow: "0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04)" },
        },
      },
    },
  });
}

export const lightTheme = buildTheme("light", tokensLight);
export const darkTheme = buildTheme("dark", tokensDark);
export const tokens = { light: tokensLight, dark: tokensDark };

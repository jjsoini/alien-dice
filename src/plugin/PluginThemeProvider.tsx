import { Theme as MuiTheme, createTheme } from "@mui/material/styles";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import OBR, { Theme } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

import { ACCENT, ACCENT_TEXT } from "../helpers/accent";

/** Alien Dice's own panel colours, in place of OBR's */
const PANEL_DARK = "#161818";
const PANEL_LIGHT = "#F9F7EF";

/**
 * The green accent as the primary colour instead of OBR's purple, so MUI's
 * buttons and controls use it too. The same in both modes.
 */
function getAccentPalette(_mode: "light" | "dark") {
  return { main: ACCENT, contrastText: ACCENT_TEXT };
}

function getPanelBackground(mode: "light" | "dark") {
  const color = mode === "light" ? PANEL_LIGHT : PANEL_DARK;
  return { default: color, paper: color };
}

/**
 * Create a MUI theme based off of the current OBR theme
 * If no theme is provided create the base dark theme
 */
function getTheme(theme?: Theme) {
  return createTheme({
    palette: theme
      ? {
          mode: theme.mode === "LIGHT" ? "light" : "dark",
          text: theme.text,
          primary: getAccentPalette(theme.mode === "LIGHT" ? "light" : "dark"),
          secondary: theme.secondary,
          background: getPanelBackground(theme.mode === "LIGHT" ? "light" : "dark"),
          // Icons in light mode in the dark panel colour instead of MUI's grey
          ...(theme.mode === "LIGHT" ? { action: { active: PANEL_DARK } } : {}),
        }
      : {
          mode: "dark",
          primary: getAccentPalette("dark"),
          secondary: {
            main: ACCENT,
          },
          background: getPanelBackground("dark"),
        },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: OBR.isAvailable ? "transparent" : undefined,
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage:
              theme?.mode === "LIGHT"
                ? "linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05))"
                : "linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.07))",
          },
        },
      },
    },
  });
}

/**
 * Provide a MUI theme with the same palette as the parent OBR window
 */
export function PluginThemeProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [theme, setTheme] = useState<MuiTheme>(() => getTheme());
  const [ready, setReady] = useState(() => OBR.isReady);

  useEffect(() => {
    if (OBR.isAvailable) {
      OBR.onReady(() => setReady(true));
    }
  }, []);

  useEffect(() => {
    if (ready) {
      const updateTheme = (theme: Theme) => {
        setTheme(getTheme(theme));
      };
      OBR.theme.getTheme().then(updateTheme);
      return OBR.theme.onChange(updateTheme);
    }
  }, [ready]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

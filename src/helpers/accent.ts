import { Theme } from "@mui/material/styles";
import { DiceStyle } from "../types/DiceStyle";

/**
 * Alien Dice's accent colour, a deep green at hue 173, as the background of
 * buttons and count badges in both light and dark mode, with white text.
 */
export const ACCENT = "#006257";
export const ACCENT_TEXT = "#FFFFFF";

/**
 * The accent as a text colour (links).
 * The deep green is too dark to read on the dark panel, so dark mode uses a
 * bright green.
 */
const ACCENT_FOREGROUND_DARK = "#2DD2BF";

/** Stress die yellow: the panic result over the tray and stress dice counts */
export const TRAY_PANIC_COLOR = "#FFE500";

/** The accent as a background */
export function getAccentColor(_theme?: Theme) {
  return ACCENT;
}

/** Text on an accent background */
export function getAccentTextColor(_theme?: Theme) {
  return ACCENT_TEXT;
}

/** The accent as a text colour on the panel background */
export function getAccentForegroundColor(theme: Theme) {
  return theme.palette.mode === "light" ? ACCENT : ACCENT_FOREGROUND_DARK;
}

/**
 * Panic result colour: stress die yellow over the tray (always dark) and on
 * dark backgrounds. Yellow doesn't show on light ones, so they use the accent.
 */
export function getPanicColor(theme: Theme, onTray?: boolean) {
  return onTray || theme.palette.mode === "dark" ? TRAY_PANIC_COLOR : ACCENT;
}

/** Count badge colours: stress die yellow for stress dice, the accent otherwise */
export function getBadgeColors(style: DiceStyle) {
  return style === "STRESS"
    ? { bgcolor: TRAY_PANIC_COLOR, color: "#0E1414" }
    : { bgcolor: ACCENT, color: ACCENT_TEXT };
}

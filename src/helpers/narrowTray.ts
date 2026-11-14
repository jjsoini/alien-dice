import { useNarrowLayout } from "./useNarrowLayout";

/**
 * Layout of the phone (narrow) mode: the tray's canvas fills the popover
 * (its camera fits the tray to it, see TrayCamera), with buttons in the
 * corners.
 */

export const NARROW_TRAY_WIDTH = "100vw";
export const NARROW_TRAY_HEIGHT = "100vh";

/** Inset of the tray's corner buttons in the current layout, in pixels */
export function useTrayInset() {
  return useNarrowLayout() ? CORNER_INSET : DESKTOP_INSET;
}

/** Inset of the corner buttons from the popover's edges on phones */
export const CORNER_INSET = 12;
/** The same inset in the desktop layout */
const DESKTOP_INSET = 24;
/** Size of an icon button */
export const CORNER_BUTTON = 40;
/** Space between corner buttons side by side */
export const CORNER_GAP = 8;

/** Popover position of the tray's top edge, plus an offset in pixels */
export function trayTop(offset = CORNER_INSET) {
  return `calc((100vh - ${NARROW_TRAY_HEIGHT}) / 2 + ${offset}px)`;
}

/** Popover position of the tray's left (or right) edge, plus an offset */
export function traySide(offset = CORNER_INSET) {
  return `calc((100vw - ${NARROW_TRAY_WIDTH}) / 2 + ${offset}px)`;
}

/** Left offset of the nth button in the top left row (0 is the corner) */
export function cornerRowOffset(index: number) {
  return CORNER_INSET + index * (CORNER_BUTTON + CORNER_GAP);
}

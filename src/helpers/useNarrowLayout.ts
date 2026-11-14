import { useEffect, useState } from "react";

import { SIDEBAR_WIDTH } from "../plugin/ResizeObserver";

/** Leeway for rounding in the popover width */
const TOLERANCE = 8;
/**
 * Touch screens whose short side is narrower than this get the phone layout:
 * phones and smaller tablets such as the iPad mini (744) and iPad (820).
 * The large iPad Pro (1024) keeps the sidebar.
 */
const TOUCH_MAX_WIDTH = 900;

/**
 * The popover asks Owlbear Rodeo for room for the sidebar plus a 1:2 tray.
 * On a phone it gets less than that, so the tray takes the whole popover
 * with the dice controls in a sheet over it instead.
 *
 * Add `?layout=mobile` (or `?layout=desktop`) to the URL to force a layout.
 */
function isNarrow() {
  const forced = new URLSearchParams(window.location.search).get("layout");
  if (forced === "mobile") {
    return true;
  }
  if (forced === "desktop") {
    return false;
  }
  // Phones and tablets by their screen, as iOS can widen an iframe to fit
  // its content so the popover's own width can't be trusted there
  const isTouchScreen =
    window.matchMedia("(pointer: coarse)").matches &&
    Math.min(window.screen.width, window.screen.height) < TOUCH_MAX_WIDTH;
  return (
    isTouchScreen ||
    window.innerWidth < window.innerHeight / 2 + SIDEBAR_WIDTH - TOLERANCE
  );
}

export function useNarrowLayout() {
  const [narrow, setNarrow] = useState(isNarrow);
  useEffect(() => {
    const handleResize = () => setNarrow(isNarrow());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return narrow;
}

import { useMemo } from "react";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { PushDiceIcon } from "../icons/PushDiceIcon";
import { useDiceRollStore } from "../dice/store";
import { getDiceToPush } from "../helpers/getDiceToPush";
import { isCardRoll } from "../types/Dice";
import { SidebarCollapse } from "./SidebarCollapse";

/**
 * Reroll is hidden: it's rarely needed and easy to mistake for Push. Clear
 * and roll again instead. Set to true to bring the button back.
 */
export const SHOW_REROLL = false;

/**
 * Push the roll in the tray, first among the dice buttons (like Shuffle).
 *
 * Shown once the dice have settled (not for a card draw). A roll can be
 * pushed any number of times (some talents allow more than one push), but
 * not once a stress die shows a facehugger: then the button is dimmed.
 */
export function PushButton({
  variant = "sidebar",
  onPush,
}: {
  /** sidebar: a standard icon button, panel: a big round button the size of
   * the dice buttons */
  variant?: "sidebar" | "panel";
  /** After pushing, e.g. to close the phone panel to watch the dice */
  onPush?: () => void;
}) {
  const roll = useDiceRollStore((state) => state.roll);
  const rollValues = useDiceRollStore((state) => state.rollValues);
  const push = useDiceRollStore((state) => state.push);

  const finishedValues = useMemo(() => {
    const values = Object.values(rollValues);
    if (values.length === 0 || values.some((value) => value === null)) {
      return null;
    }
    return rollValues as Record<string, number>;
  }, [rollValues]);

  const show = Boolean(roll && finishedValues && !isCardRoll(roll));
  const diceToPush = useMemo(
    () => (roll && finishedValues ? getDiceToPush(roll, finishedValues) : null),
    [roll, finishedValues]
  );
  // A facehugger on a stress die: panic, the roll can't be pushed
  const blocked = diceToPush === null;
  const title = blocked
    ? "Panic, can't push"
    : roll?.pushes
    ? "Push again"
    : "Push";

  function handlePush() {
    if (diceToPush) {
      push(diceToPush);
      onPush?.();
    }
  }

  if (variant === "panel") {
    return show ? (
      <Tooltip
        title={title}
        placement="top"
        disableInteractive
      >
        {/* Wrapped so the tooltip works on the disabled button */}
        <Box component="span" display="flex">
          <ButtonBase
            onClick={handlePush}
            disabled={blocked}
            aria-label={title}
            sx={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: "50%",
              opacity: blocked ? 0.4 : 1,
              transition: "opacity 150ms",
            }}
          >
            <PushDiceIcon sx={{ fontSize: 56 }} />
          </ButtonBase>
        </Box>
      </Tooltip>
    ) : null;
  }

  return (
    <SidebarCollapse in={show}>
      <Tooltip
        title={title}
        placement="right"
        disableInteractive
      >
        <Box component="span" display="flex" justifyContent="center">
          <IconButton
            onClick={handlePush}
            disabled={blocked}
            aria-label={title}
            sx={{ opacity: blocked ? 0.4 : 1 }}
          >
            <PushDiceIcon />
          </IconButton>
        </Box>
      </Tooltip>
    </SidebarCollapse>
  );
}

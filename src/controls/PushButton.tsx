import { useMemo } from "react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { PushDiceIcon } from "../icons/PushDiceIcon";
import { useDiceRollStore } from "../dice/store";
import { getDiceToPush } from "../helpers/getDiceToPush";
import { isCardRoll } from "../types/Dice";

/**
 * Reroll is hidden: it's rarely needed and easy to mistake for Push. Clear
 * and roll again instead. Set to true to bring the button back.
 */
export const SHOW_REROLL = false;

/**
 * Push the roll in the tray, in the bottom left corner of the tray and of
 * the phone dice panel.
 *
 * Shown once the dice have settled (not for a card draw). A roll can be
 * pushed any number of times (some talents allow more than one push), but
 * not once a stress die shows a facehugger: then the button is dimmed.
 */
export function PushButton({
  overTray = false,
  onPush,
}: {
  /** Over the (always dark) tray: a white icon */
  overTray?: boolean;
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

  const diceToPush = useMemo(
    () => (roll && finishedValues ? getDiceToPush(roll, finishedValues) : null),
    [roll, finishedValues]
  );

  if (!roll || !finishedValues || isCardRoll(roll)) {
    return null;
  }

  // A facehugger on a stress die: panic, the roll can't be pushed
  const blocked = diceToPush === null;
  const title = blocked
    ? "Panic, can't push"
    : roll.pushes
    ? "Push again"
    : "Push";

  function handlePush() {
    if (diceToPush) {
      push(diceToPush);
      onPush?.();
    }
  }

  return (
    <Tooltip title={title} placement="top" disableInteractive>
      {/* Wrapped so the tooltip works on the disabled button */}
      <span style={{ display: "flex", pointerEvents: "all" }}>
        <IconButton
          onClick={handlePush}
          disabled={blocked}
          aria-label={title}
          sx={{
            opacity: blocked ? 0.4 : 1,
            ...(overTray && { color: "white", "&.Mui-disabled": { color: "white" } }),
          }}
        >
          <PushDiceIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

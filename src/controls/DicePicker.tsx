import { Fragment, useMemo } from "react";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { SidebarCollapse } from "./SidebarCollapse";

import { DicePreview } from "../previews/DicePreview";

import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";
import {
  canAddDie,
  canAddDieToRoll,
} from "../helpers/diceLimits";
import { useDiceHistoryStore } from "./history";
import {
  getCantDrawReason,
  getMaxCards,
  useCardDeckStore,
} from "../cards/cardDeck";
import { isCardRoll } from "../types/Dice";
import { ShuffleButton } from "./DrawnCards";
import { PushButton } from "./PushButton";
import { Die } from "../types/Die";
import { DiceRoll } from "../types/DiceRoll";
import { getDieFromDice } from "../helpers/getDieFromDice";

export function DicePicker({
  variant = "sidebar",
  onAddToRoll,
}: {
  /**
   * - sidebar: a column, buttons that can't be used are hidden
   * - panel: a grid of large labelled buttons (phones), buttons that can't be
   *   used are disabled so the grid doesn't move
   */
  variant?: "sidebar" | "panel";
  /** Called after a die was rolled into the roll in the tray, or a push */
  onAddToRoll?: () => void;
}) {
  const isPanel = variant === "panel";
  const counts = useDiceControlsStore((state) => state.diceCounts);

  const diceById = useDiceControlsStore((state) => state.diceById);
  const handleDiceCountIncrease = useDiceControlsStore(
    (state) => state.incrementDieCount
  );
  const roll = useDiceRollStore((state) => state.roll);
  const addDie = useDiceRollStore((state) => state.addDie);
  const addDieToActiveRoll = useDiceHistoryStore(
    (state) => state.addDieToActiveRoll
  );

  // In the panel the tray's dice are hidden behind it, so with a roll in the
  // tray the buttons count its dice instead of the (empty) pool
  const rollCounts = useMemo(
    () => (isPanel && roll ? getRollCounts(roll, diceById) : null),
    [isPanel, roll, diceById]
  );

  // The card limits come from the deck, so update when it changes
  const cantDrawReason = useCardDeckStore(getCantDrawReason);
  useCardDeckStore(getMaxCards);
  const isGM = useCardDeckStore((state) => state.role === "GM");

  // With dice in the tray a button rolls one more die into it. The pool is
  // only built while the tray is clear.
  function handleClick(id: string) {
    const die = diceById[id];
    if (roll) {
      addDie(die);
      addDieToActiveRoll(die);
      onAddToRoll?.();
    } else {
      handleDiceCountIncrease(id);
    }
  }

  // Buttons that can't be used are hidden, but a button with picked dice
  // stays (dimmed) so its count still shows
  return (
    <Box
      component="div"
      sx={
        isPanel
          ? {
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
            }
          : {
              my: -0.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }
      }
    >
      {/* Push the roll in the tray, before the dice like Shuffle */}
      <PushButton variant={variant} onPush={onAddToRoll} />
      {Object.entries(counts).map(([id, count]) => {
        const die = diceById[id];
        if (!die) {
          return null;
        }
        const isCard = die.type === "CARD";
        // The GM only sees Shuffle once they can't draw,
        // players see the disabled card button
        if (isCard && cantDrawReason && isGM) {
          return <ShuffleButton key={id} variant={variant} />;
        }
        const hidden = isCard
          ? Boolean(cantDrawReason) || Boolean(roll)
          : count === 0 &&
            (roll
              ? !canAddDieToRoll(die, roll)
              : !canAddDie(die, counts, diceById));
        const full = roll
          ? !canAddDieToRoll(die, roll)
          : !canAddDie(die, counts, diceById);
        const reason = isCard
          ? cantDrawReason || (roll ? "Clear the tray first" : null)
          : roll && isCardRoll(roll)
          ? "Clear the tray first"
          : roll?.pushes
          ? "The roll was pushed"
          : null;
        const disabled = full || (isCard && Boolean(cantDrawReason));
        const button = isPanel ? (
          <PanelButton
            key={id}
            die={die}
            count={rollCounts ? rollCounts[id] ?? 0 : count}
            disabled={disabled}
            reason={reason}
            onClick={() => handleClick(id)}
          />
        ) : (
          <SidebarCollapse key={id} in={!hidden}>
            <Tooltip title={reason || ""} placement="right" disableInteractive>
              <span>
                <Badge
                  badgeContent={count}
                  sx={{
                    ".MuiBadge-badge": {
                      bgcolor: BADGE_COLOR,
                      color: BADGE_TEXT_COLOR,
                      pointerEvents: "none",
                    },
                  }}
                  overlap="circular"
                >
                  <IconButton
                    onClick={() => handleClick(id)}
                    sx={{ p: 0, opacity: full ? 0.4 : 1 }}
                    disabled={full}
                  >
                    <DicePreview diceStyle={die.style} diceType={die.type} />
                  </IconButton>
                </Badge>
              </span>
            </Tooltip>
          </SidebarCollapse>
        );
        return isCard ? (
          <Fragment key={id}>
            {button}
            <ShuffleButton variant={variant} />
          </Fragment>
        ) : (
          button
        );
      })}
    </Box>
  );
}

/** Large round die button for the phone dice panel */
function PanelButton({
  die,
  count,
  disabled,
  reason,
  onClick,
}: {
  die: Die;
  count: number;
  disabled: boolean;
  reason: string | null;
  onClick: () => void;
}) {
  // The image fills the whole round button, which the grid sizes
  return (
    <Tooltip title={reason || ""} placement="top" disableInteractive>
      <Badge
        badgeContent={count}
        overlap="circular"
        sx={{
          display: "flex",
          ".MuiBadge-badge": { bgcolor: BADGE_COLOR, color: BADGE_TEXT_COLOR },
        }}
      >
        <ButtonBase
          onClick={onClick}
          disabled={disabled}
          aria-label={`${die.style} ${die.type}`}
          sx={{
            width: "100%",
            aspectRatio: "1",
            p: 0,
            borderRadius: "50%",
            // Only picked dice get a background
            bgcolor: count > 0 ? "rgba(255, 229, 0, 0.18)" : "transparent",
            transition: "background-color 150ms",
            // Picked dice at their limit stay easy to see, as the pool's
            // dice can't be seen behind the panel
            img: {
              opacity: disabled ? (count > 0 ? 0.75 : 0.4) : 1,
              transition: "opacity 150ms",
            },
          }}
        >
          <DicePreview diceStyle={die.style} diceType={die.type} size="fill" />
        </ButtonBase>
      </Badge>
    </Tooltip>
  );
}

/**
 * How many of each button's die are in the roll, by button id. A die counts
 * for the button of the same type and style (a d100's paired d10 has the
 * d100's style, so it doesn't count as a d10).
 */
function getRollCounts(roll: DiceRoll, diceById: Record<string, Die>) {
  const counts: Record<string, number> = {};
  const rolled = getDieFromDice(roll);
  for (const [id, die] of Object.entries(diceById)) {
    counts[id] = rolled.filter(
      (d) => d.type === die.type && d.style === die.style
    ).length;
  }
  return counts;
}

/** Stress die yellow, as on the dice */
const BADGE_COLOR = "#FFE500";
const BADGE_TEXT_COLOR = "#181919";

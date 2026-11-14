import { alpha, Theme } from "@mui/material/styles";
import {
  getAccentForegroundColor,
  getAccentLineColor,
  ACCENT,
  getBadgeColors,
  getPanelIconColor,
  TRAY_PANIC_COLOR,
  LINE_WIDTH,
} from "../helpers/accent";
import { Fragment, useMemo, useRef } from "react";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import { DieButtonImage } from "../icons/DieButtonImage";
import { PANEL_DARK } from "../plugin/PluginThemeProvider";

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
import { Die } from "../types/Die";
import { DiceRoll } from "../types/DiceRoll";
import { getDieFromDice } from "../helpers/getDieFromDice";

export function DicePicker({
  variant = "sidebar",
  onAddToRoll,
}: {
  /**
   * - sidebar: a column of buttons
   * - panel: a 2×2 grid of large buttons (phones)
   *
   * There are only four buttons (base and stress die, card, shuffle), so
   * buttons that can't be used stay in place, disabled.
   */
  variant?: "sidebar" | "panel";
  /** Called after a die was rolled into the roll in the tray */
  onAddToRoll?: () => void;
}) {
  const isPanel = variant === "panel";
  const counts = useDiceControlsStore((state) => state.diceCounts);

  const diceById = useDiceControlsStore((state) => state.diceById);
  const handleDiceCountIncrease = useDiceControlsStore(
    (state) => state.incrementDieCount
  );
  const decrementDieCount = useDiceControlsStore(
    (state) => state.decrementDieCount
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

  return (
    <Box
      component="div"
      sx={
        isPanel
          ? {
              // Four squares with green lines between them. The lines are
              // borders on the squares (not gaps showing a background, which
              // can show an extra sliver), so every line is LINE_WIDTH.
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              // Fills its wrapper in the panel (see DicePanel), which is a
              // square that shrinks when the panel is short
              gridTemplateRows: "repeat(2, 1fr)",
              height: "100%",
              boxSizing: "border-box",
              // A faint green square grid behind the buttons
              backgroundImage: (theme: Theme) => {
                const line = getGridLineColor(theme);
                return `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`;
              },
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              backgroundPosition: "center",
              // The top border is also the line under the panel's button bar
              borderTop: `${LINE_WIDTH}px solid`,
              borderBottom: `${LINE_WIDTH}px solid`,
              borderColor: getAccentLineColor,
              // Squares stay within their column, borders included
              "& > *": {
                borderColor: getAccentLineColor,
                minWidth: 0,
                boxSizing: "border-box",
              },
              // Left column: the line down the middle
              "& > :nth-of-type(odd)": {
                borderRight: `${LINE_WIDTH}px solid`,
                borderRightColor: getAccentLineColor,
              },
              // Top row: the line across the middle
              "& > :nth-of-type(-n + 2)": {
                borderBottom: `${LINE_WIDTH}px solid`,
                borderBottomColor: getAccentLineColor,
              },
            }
          : {
              // The same gap as between the sidebar's other buttons
              gap: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }
      }
    >
      {Object.entries(counts).map(([id, count]) => {
        const die = diceById[id];
        if (!die) {
          return null;
        }
        const isCard = die.type === "CARD";
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
            // The count badge takes a die (or card) back out of the pool,
            // not out of a roll in the tray
            onRemove={
              !roll && count > 0
                ? () => decrementDieCount(id)
                : undefined
            }
          />
        ) : (
          <Box component="div" key={id}>
            <Tooltip title={reason || ""} placement="right" disableInteractive>
              <span>
                <Badge
                  badgeContent={count}
                  sx={{
                    ".MuiBadge-badge": {
                      ...getBadgeColors(die.style),
                      pointerEvents: "none",
                    },
                  }}
                  overlap="circular"
                >
                  <IconButton
                    onClick={() => handleClick(id)}
                    sx={{ p: 0, opacity: disabled ? 0.4 : 1 }}
                    disabled={disabled}
                  >
                    <DieButtonImage die={die} />
                  </IconButton>
                </Badge>
              </span>
            </Tooltip>
          </Box>
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
  onRemove,
}: {
  die: Die;
  count: number;
  disabled: boolean;
  reason: string | null;
  onClick: () => void;
  /** Tapping the count badge removes a die from the pool */
  onRemove?: () => void;
}) {
  // A tap that just removed a die: taps on the square right after it are
  // ignored, so tapping past the last die (when the badge disappears) or
  // slightly off the badge doesn't add one back
  const lastRemove = useRef(0);
  function handleRemove(event: React.MouseEvent) {
    event.stopPropagation();
    if (onRemove) {
      lastRemove.current = performance.now();
      onRemove();
    }
  }
  function handleClick() {
    if (performance.now() - lastRemove.current > REMOVE_GUARD_MS) {
      onClick();
    }
  }

  return (
    <Tooltip title={reason || ""} placement="top" disableInteractive>
      <Badge
        badgeContent={count}
        slotProps={{
          badge: {
            onClick: onRemove ? handleRemove : undefined,
            role: onRemove ? "button" : undefined,
            "aria-label": onRemove
              ? die.type === "CARD"
                ? "Remove a card"
                : die.style === "STRESS"
                ? "Remove a stress die"
                : "Remove a base die"
              : undefined,
          } as React.HTMLAttributes<HTMLSpanElement>,
        }}
        sx={{
          display: "flex",
          // The count inside the square's top right corner
          ".MuiBadge-badge": {
            ...getBadgeColors(die.style),
            top: 10,
            right: 10,
            transform: "none",
            // Bigger than a normal badge, as it's also a remove button
            height: 28,
            minWidth: 28,
            borderRadius: "14px",
            px: 0.75,
            fontSize: "0.875rem",
            cursor: onRemove ? "pointer" : "default",
            // Fast taps count as taps, not a double tap to zoom
            touchAction: "manipulation",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            // A bigger invisible area around the badge to tap
            "&::after": onRemove
              ? { content: '""', position: "absolute", inset: -12 }
              : {},
            // The yellow stress badge on the picked stress die's yellow
            // square (light mode) gets a black outline
            boxShadow: (theme: Theme) =>
              die.style === "STRESS" && theme.palette.mode === "light"
                ? // Inside the badge, so it keeps its size
                  `inset 0 0 0 ${LINE_WIDTH}px ${PANEL_DARK}`
                : "none",
          },
          ".MuiBadge-invisible": { transform: "scale(0)" },
        }}
      >
        <ButtonBase
          onClick={handleClick}
          disabled={disabled}
          aria-label={`${die.style} ${die.type}`}
          sx={{
            touchAction: "manipulation",
            // The whole grid cell: square, or flatter on short screens
            width: "100%",
            height: "100%",
            p: 0,
            borderRadius: 0,
            // Picked dice get a white icon in dark mode (the stress die a
            // yellow one) and a black one in light mode
            color: (theme: Theme) =>
              count === 0
                ? getPanelIconColor(theme)
                : theme.palette.mode === "light"
                ? PANEL_DARK
                : die.style === "STRESS"
                ? TRAY_PANIC_COLOR
                : "#FFFFFF",
            // See-through, so the panel's background shows in the squares
            // Picked dice get a green tint, a picked stress die in light
            // mode a yellow square
            backgroundImage: (theme: Theme) => {
              if (count === 0) {
                return "none";
              }
              const fill =
                die.style === "STRESS" && theme.palette.mode === "light"
                  ? alpha(TRAY_PANIC_COLOR, 1.0)
                  : alpha(getAccentForegroundColor(theme), 0.16);
              return `linear-gradient(${fill}, ${fill})`;
            },
            // Picked dice at their limit stay easy to see, as the pool's
            // dice can't be seen behind the panel
            "img, .die-button-image": {
              opacity: disabled ? (count > 0 ? 0.75 : 0.4) : 1,
              transition: "opacity 150ms",
            },
          }}
        >
          <DieButtonImage die={die} variant="panel" />
        </ButtonBase>
      </Badge>
    </Tooltip>
  );
}

/**
 * How many of each button's die are in the roll, by button id. A die counts
 * for the button of the same type and style.
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

/** Background grid in the phone panel's dice grid */
const GRID_SIZE = 16;

/**
 * The background grid's lines: the accent, faint. Dark mode uses the bright
 * green, as the faint deep green wouldn't show on the near-black panel.
 */
function getGridLineColor(theme: Theme) {
  return theme.palette.mode === "light"
    ? alpha(ACCENT, 0.1)
    : alpha(getAccentForegroundColor(theme), 0.08);
}

/**
 * After removing a die with a count badge, taps on the square are ignored
 * for this long, so a tap past the last die doesn't add one back
 */
const REMOVE_GUARD_MS = 400;

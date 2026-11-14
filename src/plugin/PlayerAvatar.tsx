import { useMemo } from "react";
import { Player } from "@owlbear-rodeo/sdk";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
import { LINE_WIDTH } from "../helpers/accent";
import Tooltip from "@mui/material/Tooltip";

import { usePlayerDice } from "./usePlayerDice";
import { useResultDelay } from "../helpers/useResultDelay";
import { RollSummaryLabel } from "../controls/DiceResults";
import { getPublicHand, useCardDeckStore } from "../cards/cardDeck";
import { formatCards } from "../cards/cards";

/** Sizes of a large avatar at scale 1, in pixels */
const LARGE_AVATAR = 56;
const LARGE_MIN_WIDTH = 72;
/** Extra width of the avatar pill per initiative number after the first */
const LARGE_NUMBER_WIDTH = 22;

/** Width a large avatar takes at a scale, with this many cards drawn */
export function getLargeAvatarWidth(cardCount: number, scale = 1) {
  const px = (value: number) => Math.round(value * scale);
  const content =
    px(LARGE_AVATAR) + Math.max(0, cardCount - 1) * px(LARGE_NUMBER_WIDTH);
  return Math.max(px(LARGE_MIN_WIDTH), content);
}

/**
 * The initiative numbers on a player's avatar, e.g. "7", or "3 7" for the
 * GM's cards. Cards still hidden from others are "?".
 */
function getInitiativeLabel(hand: ReturnType<typeof getPublicHand>) {
  return [formatCards(hand.shown), ...Array(hand.hiddenCount).fill("?")]
    .filter(Boolean)
    .join(" ");
}

export function PlayerAvatar({
  player,
  onSelect,
  size = "small",
  scale = 1,
}: {
  player: Player;
  onSelect: () => void;
  /** small for the sidebar, large for the phone dice panel */
  size?: "small" | "large";
  /** Shrinks a large avatar to fit more players in the panel's strip */
  scale?: number;
}) {
  const large = size === "large";
  const px = (value: number) => Math.round(value * scale);
  const { diceRoll, summary, finishedRolling } = usePlayerDice(player);
  const resultShown = useResultDelay(diceRoll, finishedRolling);
  /** The player's initiative cards, their numbers shown in the avatar */
  const hand = useCardDeckStore((state) => state.hands[player.id]);
  const publicHand = useMemo(() => hand && getPublicHand(hand), [hand]);
  const initiative = publicHand ? getInitiativeLabel(publicHand) : null;
  /** More than one number (the GM's cards) */
  const several = Boolean(initiative && initiative.includes(" "));
  // The cards already show the result of a card draw
  const showBadge =
    resultShown &&
    summary &&
    !(hand && summary.cards) &&
    (summary.cards || summary.value !== null);

  const theme = useTheme();

  return (
    <Stack
      alignItems="center"
      my={0.5}
      // In the panel's strip, keep full size and let the strip scroll
      minWidth={large ? `${px(LARGE_MIN_WIDTH)}px` : undefined}
      flexShrink={large ? 0 : undefined}
    >
      <Badge
        badgeContent={
          showBadge && summary ? (
            <RollSummaryLabel summary={summary} iconSize="1em" stacked />
          ) : null
        }
        showZero
        overlap="circular"
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        sx={{
          ".MuiBadge-badge": {
            bgcolor: "background.paper",
            // Grows to one line per item (successes, panic)
            height: "auto",
            minHeight: "20px",
            py: "2px",
            lineHeight: 1.25,
            borderRadius: "10px",
            // Pin the bottom right corner a little below the avatar, over
            // the start of the name, so extra lines grow upwards
            top: "auto",
            left: "auto",
            bottom: "-8px",
            right: "-6px",
            transform: "scale(1)",
            transformOrigin: "100% 100%",
            zIndex: 2,
            // Keep MUI's hidden state hidden despite the transform above
            "&.MuiBadge-invisible": {
              transform: "scale(0)",
            },
          },
          pointerEvents: "none",
        }}
        max={999}
      >
        <IconButton
          sx={{
            borderRadius: large ? "8px" : "20px",
            p: 0,
            pointerEvents: "all",
          }}
          onClick={() => onSelect()}
        >
          <Tooltip
            title={publicHand ? `Initiative ${publicHand.label}` : ""}
            placement={large ? "top" : "right"}
            disableInteractive
          >
            <Avatar
              sx={{
                // The player's colour for the outline and the letter (or
                // their initiative), no fill or shadow
                bgcolor: "transparent",
                color: player.color,
                fontWeight: 500,
                boxShadow: `inset 0 0 0 ${LINE_WIDTH}px ${player.color}`,
                // A circle, or a pill when it holds several numbers: wider
                // in the phone panel's strip, taller (one number per line)
                // in the narrow sidebar
                ...(large
                  ? {
                      height: px(LARGE_AVATAR),
                      minWidth: px(LARGE_AVATAR),
                      width: "auto",
                      px: several ? 1.5 : 0,
                      whiteSpace: "nowrap",
                      fontSize: `${1.5 * scale}rem`,
                    }
                  : {
                      width: 32,
                      minHeight: 32,
                      height: "auto",
                      py: several ? 0.75 : 0,
                      whiteSpace: "normal",
                      textAlign: "center",
                      lineHeight: several ? 1.2 : undefined,
                      fontSize: several ? "0.8rem" : undefined,
                    }),
                borderRadius: large ? `${px(LARGE_AVATAR) / 2}px` : "16px",
              }}
            >
              {initiative ?? player.name[0]}
            </Avatar>
          </Tooltip>
        </IconButton>
      </Badge>
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        // As wide as the avatar or cards above, without widening them
        width={large ? 0 : "40px"}
        minWidth={large ? "100%" : undefined}
        noWrap
      >
        {player.name}
      </Typography>
    </Stack>
  );
}

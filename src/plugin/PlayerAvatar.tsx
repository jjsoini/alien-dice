import { useMemo } from "react";
import { Player } from "@owlbear-rodeo/sdk";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";

import { usePlayerDice } from "./usePlayerDice";
import { useResultDelay } from "../helpers/useResultDelay";
import { RollSummaryLabel } from "../controls/DiceResults";
import { getPublicHand, useCardDeckStore } from "../cards/cardDeck";
import { CardStack } from "../controls/DrawnCards";

/** Sizes of a large avatar at scale 1, in pixels */
const LARGE_AVATAR = 56;
const LARGE_CARD_WIDTH = 44;
const LARGE_MIN_WIDTH = 72;
/** Space between cards side by side (see CardStack) */
const CARD_GAP = 2;

/** Width a large avatar takes at a scale, with this many cards shown */
export function getLargeAvatarWidth(cardCount: number, scale = 1) {
  const px = (value: number) => Math.round(value * scale);
  const content =
    cardCount > 0
      ? cardCount * px(LARGE_CARD_WIDTH) + (cardCount - 1) * CARD_GAP
      : px(LARGE_AVATAR);
  return Math.max(px(LARGE_MIN_WIDTH), content);
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
  /** The player's initiative cards, shown in place of their avatar */
  const hand = useCardDeckStore((state) => state.hands[player.id]);
  const publicHand = useMemo(() => hand && getPublicHand(hand), [hand]);
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
          {publicHand ? (
            <Tooltip
              title={publicHand.label}
              placement={large ? "top" : "right"}
              disableInteractive
            >
              <Stack alignItems="center">
                <CardStack
                  cards={publicHand.cards}
                  width={large ? px(LARGE_CARD_WIDTH) : 28}
                  isFaceDown={publicHand.isHidden}
                  direction={large ? "row" : "column"}
                />
              </Stack>
            </Tooltip>
          ) : (
            <Avatar
              sx={{
                bgcolor: player.color,
                opacity: "0.5",
                boxShadow: theme.shadows[5],
                width: large ? px(LARGE_AVATAR) : 32,
                height: large ? px(LARGE_AVATAR) : 32,
                fontSize: large ? `${1.5 * scale}rem` : undefined,
              }}
            >
              {player.name[0]}
            </Avatar>
          )}
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

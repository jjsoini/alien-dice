import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";

import HiddenIcon from "@mui/icons-material/VisibilityOffRounded";

import {
  canShuffle,
  getCardsLeft,
  shuffleDeck,
  useCardDeckStore,
} from "../cards/cardDeck";
import { getCardBackImage, getCardImage } from "../cards/cardImages";
import { formatCard } from "../cards/cards";
import { SidebarCollapse } from "./SidebarCollapse";
import shuffleImage from "../previews/card-shuffle.png";

/** Share of a card left showing under the next one */
const INITIATIVE_PEEK = 0.64;
/** Space between cards side by side */
const ROW_GAP = 2;

/** Return all cards to the deck, for the GM once cards have been drawn */
export function ShuffleButton({
  variant = "sidebar",
}: {
  /** In the phone dice panel: as big as the dice buttons in its grid */
  variant?: "sidebar" | "panel";
}) {
  const showShuffle = useCardDeckStore(canShuffle);
  const cardsLeft = useCardDeckStore(getCardsLeft);

  if (variant === "panel") {
    return showShuffle ? (
      <Tooltip
        title={`Shuffle (${cardsLeft} left)`}
        placement="top"
        disableInteractive
      >
        <ButtonBase
          onClick={() => shuffleDeck()}
          aria-label="Shuffle"
          sx={{ width: "100%", aspectRatio: "1", borderRadius: "50%" }}
        >
          <Box
            component="img"
            src={shuffleImage}
            alt="Shuffle"
            sx={{ width: "100%", height: "100%", display: "block" }}
          />
        </ButtonBase>
      </Tooltip>
    ) : null;
  }

  return (
    <SidebarCollapse in={showShuffle}>
      <Tooltip
        title={`Shuffle (${cardsLeft} left)`}
        placement="right"
        disableInteractive
      >
        <IconButton onClick={() => shuffleDeck()} sx={{ p: 0 }}>
          <Box
            component="img"
            src={shuffleImage}
            alt="Shuffle"
            sx={{ width: "38px", height: "38px", display: "block" }}
          />
        </IconButton>
      </Tooltip>
    </SidebarCollapse>
  );
}

/** Cards stacked on top of each other, in initiative order */
export function CardStack({
  cards,
  width,
  isFaceDown,
  isMarkedHidden,
  onCardClick,
  direction = "column",
}: {
  cards: number[];
  /**
   * column: each card lies on the one before, leaving its top showing.
   * row: side by side, lowest first, all numbers fully showing.
   */
  direction?: "column" | "row";
  width: number;
  /** Show the card's back (someone else's hidden card) */
  isFaceDown?: (card: number) => boolean;
  /** Show the card's face with a hidden mark (your own hidden card) */
  isMarkedHidden?: (card: number) => boolean;
  /** Makes the marked cards clickable, e.g. to reveal them */
  onCardClick?: (card: number) => void;
}) {
  const height = (width * 7) / 5;
  // Each card lies on the one before, leaving its top showing. The cards have
  // their number in the middle, so a good part of each shows.
  const row = direction === "row";
  const step = height * INITIATIVE_PEEK;
  // In a column the lowest card goes last to lie on top. In a row it goes
  // first, on the left.
  const ordered = !row ? [...cards].reverse() : cards;
  // Small enough to sit in the plain band above an initiative card's number
  const iconSize = Math.max(8, Math.round(width / 5));
  const stack = (
    <>
      {ordered.map((card, index) => {
        const faceDown = isFaceDown?.(card) ?? false;
        const marked = isMarkedHidden?.(card) ?? false;
        const clickable = marked && Boolean(onCardClick);
        return (
          <Box
            key={card}
            component={clickable ? "button" : "div"}
            onClick={clickable ? () => onCardClick?.(card) : undefined}
            sx={{
              position: "relative",
              display: "block",
              width: `${width}px`,
              height: `${height}px`,
              mt: !row && index > 0 ? `${step - height}px` : 0,
              ml: row && index > 0 ? `${ROW_GAP}px` : 0,
              p: 0,
              border: 0,
              background: "none",
              cursor: clickable ? "pointer" : undefined,
              pointerEvents: clickable ? "auto" : "none",
            }}
          >
            <Box
              component="img"
              src={faceDown ? getCardBackImage(card) : getCardImage(card)}
              alt={faceDown ? "Hidden card" : formatCard(card)}
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: `${Math.max(1, (width * 24) / 500)}px`,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                display: "block",
              }}
            />
            {marked && (
              // In the top corner, which stays visible in the stack
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  display: "flex",
                  p: "1px",
                  borderRadius: "50%",
                  bgcolor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                }}
              >
                <HiddenIcon sx={{ fontSize: iconSize }} />
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );
  return row ? (
    <Box component="div" sx={{ display: "flex" }}>
      {stack}
    </Box>
  ) : (
    stack
  );
}

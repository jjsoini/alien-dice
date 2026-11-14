import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Tooltip from "@mui/material/Tooltip";

import {
  getMyCards,
  getMyHiddenCards,
  revealMyCard,
  useCardDeckStore,
} from "../cards/cardDeck";
import { useDiceRollStore } from "../dice/store";
import { isCardRoll } from "../types/Dice";
import { CardStack } from "./DrawnCards";

/**
 * Your initiative cards in the top left of your tray, like when viewing
 * another player's tray. Shown once the drawn cards are cleared from the tray.
 * Cards drawn hidden are marked, and clicking one reveals just that card.
 */
export function TrayCards({
  top = 16,
  left = 16,
}: {
  top?: number;
  left?: number;
}) {
  const cards = useCardDeckStore(getMyCards);
  const hiddenCards = useCardDeckStore(getMyHiddenCards);
  const roll = useDiceRollStore((state) => state.roll);
  const cardsInTray = roll ? isCardRoll(roll) : false;

  const stack = (
    <Box component="div">
      <CardStack
        cards={cards}
        width={48}
        isMarkedHidden={(card) => hiddenCards.includes(card)}
        onCardClick={(card) => revealMyCard(card)}
      />
    </Box>
  );

  return (
    <Fade in={cards.length > 0 && !cardsInTray} unmountOnExit>
      <Box
        component="div"
        sx={{
          position: "absolute",
          top,
          left,
          // Only the hidden cards take clicks, the rest let dice be dragged
          pointerEvents: "none",
        }}
      >
        {hiddenCards.length > 0 ? (
          <Tooltip
            title="Hidden, click a card to reveal it"
            placement="right"
            disableInteractive
          >
            {stack}
          </Tooltip>
        ) : (
          stack
        )}
      </Box>
    </Fade>
  );
}

import { useDiceRollStore } from "../dice/store";
import { useDiceHistoryStore } from "./history";
import { getDiceToRoll, useDiceControlsStore } from "./store";
import { getCantDrawReason, useCardDeckStore } from "../cards/cardDeck";
import { Die } from "../types/Die";

/** Clear the picked dice pool */
export function resetDicePool() {
  useDiceControlsStore.getState().resetDiceCounts();
}

/**
 * Roll (or draw) the picked dice pool into the tray and add it to the history
 * @param speedMultiplier How hard to throw, from how long the roll was held
 */
export function rollDicePool(speedMultiplier?: number) {
  const {
    diceCounts: counts,
    diceById,
    diceHidden: hidden,
  } = useDiceControlsStore.getState();

  const hasCards = Object.entries(counts).some(
    ([id, count]) => count > 0 && diceById[id]?.type === "CARD"
  );
  // Someone may have emptied the deck (or you drew) since picking the cards
  if (hasCards && getCantDrawReason(useCardDeckStore.getState())) {
    resetDicePool();
    return;
  }

  const dice = getDiceToRoll(counts, diceById);
  useDiceRollStore.getState().startRoll({ dice, hidden }, speedMultiplier);

  const rolledDiceById: Record<string, Die> = {};
  for (const id of Object.keys(counts)) {
    rolledDiceById[id] = diceById[id];
  }
  useDiceHistoryStore
    .getState()
    .pushRecentRoll({ counts, diceById: rolledDiceById });

  resetDicePool();
}

/** Throw speed from how long the roll button was held, like the tray */
export function getThrowSpeed(pressTime: number | null) {
  if (pressTime === null) {
    return 1;
  }
  const seconds = (performance.now() - pressTime) / 1000;
  return Math.max(1, Math.min(10, seconds * 2));
}

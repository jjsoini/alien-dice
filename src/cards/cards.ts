/**
 * The initiative deck: cards 1 to 10, stored as their number.
 * Faces are in `faces-initiative/`, the back is `card-initiative-back.png`.
 */

/** The initiative deck: cards 1 to 10, 1 goes first */
export const INITIATIVE_DECK: number[] = Array.from(
  { length: 10 },
  (_, i) => i + 1
);

/** Initiative of a card: its number */
export function getInitiative(card: number) {
  return card;
}

/** Short label, e.g. "7" */
export function formatCard(card: number) {
  return `${getInitiative(card)}`;
}

/** Labels for several cards in initiative order, e.g. "1 7" */
export function formatCards(cards: number[]) {
  return sortCards(cards).map(formatCard).join(" ");
}

/** Initiative order: lowest first, since initiative 1 goes first */
export function sortCards(cards: number[]) {
  return [...cards].sort((a, b) => getInitiative(a) - getInitiative(b));
}

/** Image file name of a card, e.g. "card-7-initiative" */
export function getCardFileName(card: number) {
  return `card-${getInitiative(card)}-initiative`;
}

/**
 * Draw random cards, no card is drawn twice
 * @param drawn Cards already out of the deck
 */
export function drawCards(count: number, drawn: number[] = []): number[] {
  const left = INITIATIVE_DECK.filter((card) => !drawn.includes(card));
  const cards: number[] = [];
  while (cards.length < count && left.length > 0) {
    const index = Math.floor(Math.random() * left.length);
    cards.push(...left.splice(index, 1));
  }
  return cards;
}

/** Size of a card in the tray (5:7, like a poker card) */
export const CARD_WIDTH = 0.3;
export const CARD_HEIGHT = (CARD_WIDTH * 7) / 5;
/** Visual thickness of the card */
export const CARD_THICKNESS = 0.004;
/** Physics thickness, a bit thicker to keep the card from tunneling */
export const CARD_COLLIDER_THICKNESS = 0.01;
/** Half of the diagonal: how far a card reaches from its centre at any angle */
export const CARD_HALF_DIAGONAL = Math.hypot(CARD_WIDTH, CARD_HEIGHT) / 2;
/** Corner radius, matches the 24px of the 500px wide card templates */
export const CARD_CORNER_RADIUS = (CARD_WIDTH * 24) / 500;

import create from "zustand";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";

import { useDiceRollStore } from "../dice/store";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { generateDiceId } from "../helpers/generateDiceId";
import { getPluginId } from "../plugin/getPluginId";
import { isCardRoll } from "../types/Dice";
import { INITIATIVE_DECK, formatCards, sortCards } from "./cards";

/**
 * The card deck is shared by everyone in the scene and stored in the scene
 * metadata, so the drawn cards are still there when you return to the scene.
 *
 * - `deck`: the current shuffle
 * - `hand/<player id>`: the cards a player drew, each in its own key so that
 *   players drawing at the same time don't overwrite each other
 *
 * The deck is the 10 initiative cards.
 * Everyone draws once per shuffle: players 1 card, the GM up to 5 (for NPCs).
 * Only the GM can shuffle, which returns all cards to the deck.
 * Outside of Owlbear Rodeo the deck is private and has no limits.
 */

/** Max cards the GM can draw, players draw 1 */
export const GM_MAX_CARDS = 5;

const DECK_SIZE = INITIATIVE_DECK.length;

const DECK_KEY = getPluginId("deck");
const HAND_KEY_PREFIX = getPluginId("hand/");

export interface CardHand {
  shuffleId: string;
  /** In initiative order, lowest first */
  cards: number[];
  /** Name at the time of drawing, for players who have left */
  name: string;
  /**
   * Cards still hidden from others (drawn as a hidden roll and not revealed
   * yet). Others only see their backs. The values are still stored, so
   * nobody else can draw the same cards.
   */
  hiddenCards?: number[];
  /** Older draws: the whole hand was hidden */
  hidden?: boolean;
}

/** The cards of a hand that are still hidden from others */
export function getHiddenCards(hand: CardHand): number[] {
  if (hand.hiddenCards) {
    return hand.hiddenCards;
  }
  return hand.hidden ? hand.cards : [];
}

/**
 * A hand as others see it: shown cards in initiative order, then the hidden
 * ones. Hidden cards go last so their place doesn't give their number away.
 */
export function getPublicHand(hand: CardHand) {
  const hidden = getHiddenCards(hand);
  const shown = hand.cards.filter((card) => !hidden.includes(card));
  return {
    shown,
    hiddenCount: hidden.length,
    /** Shown cards first, then the hidden ones */
    cards: [...shown, ...hand.cards.filter((card) => hidden.includes(card))],
    isHidden: (card: number) => hidden.includes(card),
    /** e.g. "3 7 ? ?", or "Hidden" when nothing is shown */
    label:
      shown.length === 0
        ? "Hidden"
        : [formatCards(shown), ...hidden.map(() => "?")].join(" "),
  };
}

/**
 * - `LOCAL`: not in Owlbear Rodeo, a private deck
 * - `SCENE`: the scene's shared deck
 * - `UNAVAILABLE`: in Owlbear Rodeo without an open scene
 */
export type DeckMode = "LOCAL" | "SCENE" | "UNAVAILABLE";

interface CardDeckState {
  mode: DeckMode;
  role: "GM" | "PLAYER";
  playerId: string | null;
  playerName: string;
  shuffleId: string;
  /** Hands of the current shuffle by player id */
  hands: Record<string, CardHand>;
  /** All hand keys in the scene metadata, cleared on shuffle */
  handKeys: string[];
  /** Your cards when the deck is private */
  localCards: number[];
}

export const useCardDeckStore = create<CardDeckState>()(() => ({
  mode: OBR.isAvailable ? "UNAVAILABLE" : "LOCAL",
  role: "PLAYER",
  playerId: null,
  playerName: "",
  shuffleId: "",
  hands: {},
  handKeys: [],
  localCards: [],
}));

/** Your drawn cards, in initiative order */
export function getMyCards(state: CardDeckState): number[] {
  if (state.mode === "LOCAL") {
    return state.localCards;
  }
  return (state.playerId && state.hands[state.playerId]?.cards) || [];
}

/** Cards that are out of the deck */
export function getDrawnCards(state: CardDeckState): number[] {
  if (state.mode === "LOCAL") {
    return [];
  }
  return Object.values(state.hands).flatMap((hand) => hand.cards);
}

export function getCardsLeft(state: CardDeckState) {
  return DECK_SIZE - getDrawnCards(state).length;
}

/** Why you can't draw right now, or null if you can */
export function getCantDrawReason(state: CardDeckState): string | null {
  if (state.mode === "LOCAL") {
    return null;
  }
  if (state.mode === "UNAVAILABLE") {
    return "No scene open";
  }
  if (getMyCards(state).length > 0) {
    return "Already drawn";
  }
  if (getCardsLeft(state) === 0) {
    return "Deck empty";
  }
  return null;
}

/** How many cards you can add to a draw */
export function getMaxCards(state: CardDeckState) {
  if (getCantDrawReason(state)) {
    return 0;
  }
  const max = state.mode === "LOCAL" || state.role === "GM" ? GM_MAX_CARDS : 1;
  return Math.min(
    max,
    state.mode === "LOCAL" ? DECK_SIZE : getCardsLeft(state)
  );
}

/** The GM can shuffle when cards have been drawn */
export function canShuffle(state: CardDeckState) {
  if (state.mode === "LOCAL") {
    return state.localCards.length > 0;
  }
  return (
    state.mode === "SCENE" &&
    state.role === "GM" &&
    Object.keys(state.hands).length > 0
  );
}

/** Return all cards to the deck */
export async function shuffleDeck() {
  const state = useCardDeckStore.getState();
  if (state.mode === "LOCAL") {
    useCardDeckStore.setState({ localCards: [] });
    const { roll, clearRoll } = useDiceRollStore.getState();
    if (roll && isCardRoll(roll)) {
      clearRoll();
    }
    return;
  }
  if (!canShuffle(state)) {
    return;
  }
  const update: Metadata = { [DECK_KEY]: { shuffleId: generateDiceId() } };
  for (const key of state.handKeys) {
    // Setting a key to undefined removes it
    update[key] = undefined;
  }
  await OBR.scene.setMetadata(update);
}

/** Record your drawn cards so nobody else can draw them */
function recordDraw(cards: number[], hidden: boolean) {
  const sorted = sortCards(cards);
  const state = useCardDeckStore.getState();
  if (state.mode === "LOCAL") {
    useCardDeckStore.setState({ localCards: sortCards(cards) });
    return;
  }
  if (state.mode !== "SCENE" || !state.playerId) {
    return;
  }
  const hand: CardHand = {
    shuffleId: state.shuffleId,
    cards: sorted,
    name: state.playerName,
    hiddenCards: hidden ? sorted : [],
  };
  // Update right away so the deck is correct before the scene echoes it back
  useCardDeckStore.setState({
    hands: { ...state.hands, [state.playerId]: hand },
  });
  OBR.scene.setMetadata({ [HAND_KEY_PREFIX + state.playerId]: hand });
}

/** Your cards that are still hidden from others */
export function getMyHiddenCards(state: CardDeckState): number[] {
  if (state.mode !== "SCENE" || !state.playerId) {
    return NO_CARDS;
  }
  const hand = state.hands[state.playerId];
  return hand ? getHiddenCards(hand) : NO_CARDS;
}
const NO_CARDS: number[] = [];

/** Show one of your hidden cards to everyone */
export function revealMyCard(card: number) {
  const state = useCardDeckStore.getState();
  const hand = state.playerId ? state.hands[state.playerId] : undefined;
  if (state.mode !== "SCENE" || !state.playerId || !hand) {
    return;
  }
  const hidden = getHiddenCards(hand);
  if (!hidden.includes(card)) {
    return;
  }
  const revealed: CardHand = {
    ...hand,
    hiddenCards: hidden.filter((other) => other !== card),
    hidden: undefined,
  };
  // Update right away so the card doesn't wait for the scene to echo it back
  useCardDeckStore.setState({
    hands: { ...state.hands, [state.playerId]: revealed },
  });
  OBR.scene.setMetadata({ [HAND_KEY_PREFIX + state.playerId]: revealed });
}

/** Read the deck from the scene metadata */
export function setDeckFromMetadata(metadata: Metadata) {
  const deck = metadata[DECK_KEY] as { shuffleId?: string } | undefined;
  const shuffleId = deck?.shuffleId || "";
  const hands: Record<string, CardHand> = {};
  const handKeys: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (!key.startsWith(HAND_KEY_PREFIX) || !value) {
      continue;
    }
    handKeys.push(key);
    const hand = value as CardHand;
    // Hands from before the last shuffle are back in the deck
    if (hand.shuffleId === shuffleId && Array.isArray(hand.cards)) {
      hands[key.slice(HAND_KEY_PREFIX.length)] = hand;
    }
  }
  useCardDeckStore.setState({ mode: "SCENE", shuffleId, hands, handKeys });
}

export function setDeckUnavailable() {
  useCardDeckStore.setState({
    mode: "UNAVAILABLE",
    shuffleId: "",
    hands: {},
    handKeys: [],
  });
}

/** The card roll last recorded, so each draw is only recorded once */
let recordedRollKey: string | null = null;

// Record the cards as soon as they're drawn, not when they land,
// so nobody else can draw them in the meantime
useDiceRollStore.subscribe((state) => {
  if (!state.roll) {
    return;
  }
  const cardDice = getDieFromDice(state.roll).filter(
    (die) => die.type === "CARD" && die.card !== undefined
  );
  if (cardDice.length === 0) {
    return;
  }
  // Dice ids change on every new draw
  const key = cardDice.map((die) => die.id).join();
  if (key !== recordedRollKey) {
    recordedRollKey = key;
    recordDraw(
      cardDice.map((die) => die.card!),
      Boolean(state.roll.hidden)
    );
  }
});

// A shuffle clears the flipped cards from everyone's tray (each player clears
// their own, which syncs to the others). Loading or changing scenes doesn't count.
useCardDeckStore.subscribe((state, prevState) => {
  if (
    state.shuffleId !== prevState.shuffleId &&
    // Both in the same loaded scene (scene changes go through UNAVAILABLE)
    state.mode === "SCENE" &&
    prevState.mode === "SCENE"
  ) {
    const { roll, clearRoll } = useDiceRollStore.getState();
    if (roll && isCardRoll(roll)) {
      clearRoll();
    }
  }
});

import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { diceSets } from "../sets/diceSets";
import { Dice } from "../types/Dice";
import { DiceSet } from "../types/DiceSet";
import { Die } from "../types/Die";
import { canAddDie } from "../helpers/diceLimits";
import { generateDiceId } from "../helpers/generateDiceId";
import { drawCards } from "../cards/cards";
import { getDrawnCards, useCardDeckStore } from "../cards/cardDeck";

export type DiceCounts = Record<string, number>;

interface DiceControlsState {
  diceSet: DiceSet;
  diceById: Record<string, Die>;
  defaultDiceCounts: DiceCounts;
  diceCounts: DiceCounts;
  diceHidden: boolean;
  diceRollPressTime: number | null;
  changeDiceSet: (diceSet: DiceSet) => void;
  resetDiceCounts: () => void;
  changeDieCount: (id: string, count: number) => void;
  incrementDieCount: (id: string) => void;
  decrementDieCount: (id: string) => void;
  toggleDiceHidden: () => void;
  setDiceRollPressTime: (time: number | null) => void;
}

const initialSet = diceSets[0];
const initialDiceCounts = getDiceCountsFromSet(initialSet);
const initialDiceById = getDiceByIdFromSet(initialSet);

export const useDiceControlsStore = create<DiceControlsState>()(
  immer((set) => ({
    diceSet: initialSet,
    diceById: initialDiceById,
    defaultDiceCounts: initialDiceCounts,
    diceCounts: initialDiceCounts,
    diceHidden: false,
    diceRollPressTime: null,
    changeDiceSet(diceSet) {
      set((state) => {
        const counts: DiceCounts = {};
        const prevCounts = state.diceCounts;
        const prevDice = state.diceSet.dice;
        for (let i = 0; i < diceSet.dice.length; i++) {
          const die = diceSet.dice[i];
          const prevDie = prevDice[i];
          // Carry over count if the index and die type match
          if (prevDie && prevDie.type === die.type) {
            counts[die.id] = prevCounts[prevDie.id] || 0;
          } else {
            counts[die.id] = 0;
          }
        }
        state.diceCounts = counts;
        state.diceSet = diceSet;
        state.defaultDiceCounts = getDiceCountsFromSet(diceSet);
        state.diceById = getDiceByIdFromSet(diceSet);
      });
    },
    resetDiceCounts() {
      set((state) => {
        state.diceCounts = state.defaultDiceCounts;
      });
    },
    changeDieCount(id, count) {
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] = count;
        }
      });
    },
    incrementDieCount(id) {
      set((state) => {
        const die = state.diceById[id];
        if (!(id in state.diceCounts) || !die) {
          return;
        }
        // Dice and cards can't be mixed: picking one clears the other
        const isCard = die.type === "CARD";
        for (const otherId of Object.keys(state.diceCounts)) {
          if ((state.diceById[otherId]?.type === "CARD") !== isCard) {
            state.diceCounts[otherId] = 0;
          }
        }
        if (canAddDie(die, state.diceCounts, state.diceById)) {
          state.diceCounts[id] += 1;
        }
      });
    },
    decrementDieCount(id) {
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] -= 1;
        }
      });
    },
    toggleDiceHidden() {
      set((state) => {
        state.diceHidden = !state.diceHidden;
      });
    },
    setDiceRollPressTime(time) {
      set((state) => {
        state.diceRollPressTime = time;
      });
    },
  }))
);

function getDiceCountsFromSet(diceSet: DiceSet) {
  const counts: Record<string, number> = {};
  for (const die of diceSet.dice) {
    counts[die.id] = 0;
  }
  return counts;
}

function getDiceByIdFromSet(diceSet: DiceSet) {
  const byId: Record<string, Die> = {};
  for (const die of diceSet.dice) {
    byId[die.id] = die;
  }
  return byId;
}

/** Generate new dice from the picked counts */
export function getDiceToRoll(
  counts: DiceCounts,
  diceById: Record<string, Die>
) {
  const dice: (Die | Dice)[] = [];
  for (const [id, count] of Object.entries(counts)) {
    const die = diceById[id];
    if (!die) {
      continue;
    }
    const { style, type } = die;
    if (type === "CARD") {
      // Each card is drawn now from what's left in the deck
      const drawn = getDrawnCards(useCardDeckStore.getState());
      for (const card of drawCards(count, drawn)) {
        dice.push({ id: generateDiceId(), style, type, card });
      }
      continue;
    }
    for (let i = 0; i < count; i++) {
      if (type === "D100") {
        // Push a d100 and d10 when rolling a d100
        dice.push({
          dice: [
            { id: generateDiceId(), style, type: "D100" },
            { id: generateDiceId(), style, type: "D10" },
          ],
        });
      } else {
        dice.push({ id: generateDiceId(), style, type });
      }
    }
  }
  return dice;
}

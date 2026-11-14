import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { WritableDraft } from "immer/dist/types/types-external";

import { DiceRoll } from "../types/DiceRoll";
import { Die, isDie } from "../types/Die";
import { isDice } from "../types/Dice";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { DiceTransform } from "../types/DiceTransform";
import { getRandomDiceThrow } from "../helpers/DiceThrower";
import { generateDiceId } from "../helpers/generateDiceId";
import { DiceThrow } from "../types/DiceThrow";

interface DiceRollState {
  roll: DiceRoll | null;
  /**
   * A mapping from the die ID to its roll result.
   * A value of `null` means the die hasn't finished rolling yet.
   */
  rollValues: Record<string, number | null>;
  /**
   * A mapping from the die ID to its final roll transform.
   * A value of `null` means the die hasn't finished rolling yet.
   */
  rollTransforms: Record<string, DiceTransform | null>;
  /**
   * A mapping from the die ID to its initial roll throw state.
   */
  rollThrows: Record<string, DiceThrow>;
  startRoll: (roll: DiceRoll, speedMultiplier?: number) => void;
  clearRoll: (ids?: string) => void;
  /** Reroll select ids of dice or reroll all dice by passing `undefined` */
  reroll: (ids?: string[], manualThrows?: Record<string, DiceThrow>) => void;
  /** Move a finished die on the tray without changing its result */
  moveDie: (id: string, x: number, z: number) => void;
  /** Roll one more die into the current roll (a d100 adds its d10 too) */
  addDie: (die: Pick<Die, "style" | "type">) => void;
  /**
   * Push the roll: add a stress die and reroll the given dice (the ones that
   * aren't 6s). A roll can be pushed any number of times.
   */
  push: (ids: string[]) => void;
  finishDieRoll: (id: string, number: number, transform: DiceTransform) => void;
}

export const useDiceRollStore = create<DiceRollState>()(
  immer((set) => ({
    roll: null,
    rollValues: {},
    rollTransforms: {},
    rollThrows: {},
    startRoll: (roll, speedMultiplier?: number) =>
      set((state) => {
        state.roll = roll;
        state.rollValues = {};
        state.rollTransforms = {};
        state.rollThrows = {};
        // Set all values to null
        const dice = getDieFromDice(roll);
        for (const die of dice) {
          state.rollValues[die.id] = null;
          state.rollTransforms[die.id] = null;
          state.rollThrows[die.id] = getRandomDiceThrow(speedMultiplier);
        }
      }),
    clearRoll: () =>
      set((state) => {
        state.roll = null;
        state.rollValues = {};
        state.rollTransforms = {};
        state.rollThrows = {};
      }),
    reroll: (ids, manualThrows) => {
      set((state) => {
        if (state.roll) {
          if (!ids) {
            // Rerolling every die is a fresh roll, not a push
            state.roll.pushes = 0;
          }
          rerollDraft(
            state.roll,
            ids,
            manualThrows,
            state.rollValues,
            state.rollTransforms,
            state.rollThrows
          );
        }
      });
    },
    moveDie: (id, x, z) => {
      set((state) => {
        const transform = state.rollTransforms[id];
        if (transform) {
          transform.position.x = x;
          transform.position.z = z;
        }
      });
    },
    addDie: ({ style, type }) => {
      set((state) => {
        if (!state.roll) {
          return;
        }
        const newDice: Die[] =
          type === "D100"
            ? [
                { id: generateDiceId(), style, type: "D100" },
                { id: generateDiceId(), style, type: "D10" },
              ]
            : [{ id: generateDiceId(), style, type }];
        state.roll.dice.push(
          newDice.length === 1 ? newDice[0] : { dice: newDice }
        );
        for (const die of newDice) {
          state.rollValues[die.id] = null;
          state.rollTransforms[die.id] = null;
          state.rollThrows[die.id] = getRandomDiceThrow();
        }
      });
    },
    push: (ids) => {
      set((state) => {
        if (state.roll) {
          state.roll.pushes = (state.roll.pushes ?? 0) + 1;
          const stressDie: Die = {
            id: generateDiceId(),
            style: "STRESS",
            type: "D6",
          };
          state.roll.dice.push(stressDie);
          state.rollValues[stressDie.id] = null;
          state.rollTransforms[stressDie.id] = null;
          state.rollThrows[stressDie.id] = getRandomDiceThrow();
          rerollDraft(
            state.roll,
            ids,
            undefined,
            state.rollValues,
            state.rollTransforms,
            state.rollThrows
          );
        }
      });
    },
    finishDieRoll: (id, number, transform) => {
      set((state) => {
        state.rollValues[id] = number;
        state.rollTransforms[id] = transform;
      });
    },
  }))
);

/** Recursively update the ids of a draft to reroll dice */
function rerollDraft(
  diceRoll: WritableDraft<DiceRoll>,
  ids: string[] | undefined,
  manualThrows: Record<string, DiceThrow> | undefined,
  rollValues: WritableDraft<Record<string, number | null>>,
  rollTransforms: WritableDraft<Record<string, DiceTransform | null>>,
  rollThrows: WritableDraft<Record<string, DiceThrow>>
) {
  for (let dieOrDice of diceRoll.dice) {
    if (isDie(dieOrDice)) {
      if (!ids || ids.includes(dieOrDice.id)) {
        delete rollValues[dieOrDice.id];
        delete rollTransforms[dieOrDice.id];
        delete rollThrows[dieOrDice.id];
        const manualThrow = manualThrows?.[dieOrDice.id];
        const id = generateDiceId();
        dieOrDice.id = id;
        rollValues[id] = null;
        rollTransforms[id] = null;
        if (manualThrow) {
          rollThrows[id] = manualThrow;
        } else {
          rollThrows[id] = getRandomDiceThrow();
        }
      }
    } else if (isDice(dieOrDice)) {
      rerollDraft(
        dieOrDice,
        ids,
        manualThrows,
        rollValues,
        rollTransforms,
        rollThrows
      );
    }
  }
}

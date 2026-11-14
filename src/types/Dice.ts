import { isPlainObject } from "is-plain-object";

import { Die, isDie } from "./Die";

/**
 * The roll of a set of dice, which can nest.
 * @example <caption>2d6</caption>
 * {
 *  dice: [
 *    {id: "123", style: "BASE", type: "D6"},
 *    {id: "234", style: "BASE", type: "D6"},
 *  ],
 * }
 *
 * @example <caption>A D100 rolled with a D10 for the single digit</caption>
 * {
 *  dice: [
 *    {
 *      dice: [
 *        {id: "123", style: "STRESS", type: "D100"},
 *        {id: "234", style: "STRESS", type: "D10"}
 *      ],
 *    },
 *  ],
 * }
 */
export interface Dice {
  dice: (Die | Dice)[];
  /**
   * How to combine the dice for this roll (defaults to `SUM` if undefined)
   */
  combination?: "HIGHEST" | "LOWEST" | "SUM" | "NONE";
}

export function isDice(value: any): value is Dice {
  return isPlainObject(value) && Array.isArray(value.dice);
}

/** Is this a roll of playing cards */
export function isCardRoll(dice: Dice): boolean {
  return dice.dice.some((dieOrDice) =>
    isDie(dieOrDice) ? dieOrDice.type === "CARD" : isCardRoll(dieOrDice)
  );
}

/** The cards of a roll with their drawn values, or null if it has no cards */
export function getRollCards(
  dice: Dice,
  values: Record<string, number | null>
): number[] | null {
  const cards: number[] = [];
  function collect(dice: Dice) {
    for (const dieOrDice of dice.dice) {
      if (isDie(dieOrDice)) {
        const value = values[dieOrDice.id];
        if (dieOrDice.type === "CARD" && typeof value === "number") {
          cards.push(value);
        }
      } else if (isDice(dieOrDice)) {
        collect(dieOrDice);
      }
    }
  }
  collect(dice);
  return cards.length > 0 ? cards : null;
}

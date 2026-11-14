import { Dice, isDice } from "../types/Dice";
import { isDie } from "../types/Die";

/**
 * Recursively get the final result for a roll of dice
 * @param dice
 * @param values A mapping of Die ID to their rolled value
 * @returns
 */
export function getCombinedDiceValue(
  dice: Dice,
  values: Record<string, number>
): number | null {
  let currentValues: number[] = [];
  for (const dieOrDice of dice.dice) {
    if (isDie(dieOrDice)) {
      const value = values[dieOrDice.id];
      if (value !== undefined) {
        if (dieOrDice.type === "D6") {
          // A 6 on a base or stress die is a success
          currentValues.push(value === 6 ? 1 : 0);
        } else {
          currentValues.push(value);
        }
      }
    } else if (isDice(dieOrDice)) {
      const value = getCombinedDiceValue(dieOrDice, values);
      if (value !== null) {
        currentValues.push(value);
      }
    }
  }

  if (currentValues.length === 0 || dice.combination === "NONE") {
    return null;
  } else if (dice.combination === "HIGHEST") {
    return Math.max(...currentValues);
  } else if (dice.combination === "LOWEST") {
    return Math.min(...currentValues);
  } else {
    return currentValues.reduce((a, b) => a + b);
  }
}

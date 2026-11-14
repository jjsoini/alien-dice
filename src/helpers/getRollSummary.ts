import { Dice, getRollCards, isDice } from "../types/Dice";
import { sortCards } from "../cards/cards";
import { Die, isDie } from "../types/Die";
import { getCombinedDiceValue } from "./getCombinedDiceValue";

export interface RollSummary {
  /** Initiative cards drawn, in initiative order, or null for a dice roll */
  cards: number[] | null;
  /** Successes: sixes on base and stress dice */
  value: number | null;
  /** A stress die shows a 1 (a facehugger), so the roll can't be pushed */
  panic: boolean;
}

export function getAllDie(dice: Dice): Die[] {
  const result: Die[] = [];
  for (const d of dice.dice) {
    if (isDie(d)) {
      result.push(d);
    } else if (isDice(d)) {
      result.push(...getAllDie(d));
    }
  }
  return result;
}

/** A 1 on a stress die: a panic roll, and the roll can't be pushed */
export function isFacehugger(die: Die, value: number | null | undefined) {
  return die.style === "STRESS" && die.type === "D6" && value === 1;
}

/** True when any stress die in the roll shows a 1 */
export function hasPanic(
  roll: Dice,
  values: Record<string, number | null | undefined>
) {
  return getAllDie(roll).some((d) => isFacehugger(d, values[d.id]));
}

export function getRollSummary(
  roll: Dice,
  values: Record<string, number>
): RollSummary {
  const cards = getRollCards(roll, values);
  return {
    cards: cards && sortCards(cards),
    value: getCombinedDiceValue(roll, values),
    panic: hasPanic(roll, values),
  };
}

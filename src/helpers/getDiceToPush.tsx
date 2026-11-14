import { Dice } from "../types/Dice";
import { getAllDie, hasPanic } from "./getRollSummary";

/**
 * The dice a push rerolls: every base and stress die that isn't a 6.
 * A roll with a facehugger (a 1 on a stress die) can't be pushed, so this
 * returns null for it.
 * @param values A mapping of Die ID to their rolled value
 */
export function getDiceToPush(
  dice: Dice,
  values: Record<string, number>
): string[] | null {
  if (hasPanic(dice, values)) {
    return null;
  }
  return getAllDie(dice)
    .filter(
      (die) =>
        die.type === "D6" &&
        (die.style === "BASE" || die.style === "STRESS") &&
        values[die.id] !== undefined &&
        values[die.id] < 6
    )
    .map((die) => die.id);
}

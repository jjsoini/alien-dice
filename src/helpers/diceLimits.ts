import { Die, isDie } from "../types/Die";
import { Dice, isCardRoll, isDice } from "../types/Dice";
import type { DiceRoll } from "../types/DiceRoll";
import type { DiceCounts } from "../controls/store";
import { getMaxCards, useCardDeckStore } from "../cards/cardDeck";

export type DieCategory = "BASE" | "STRESS";

/**
 * How many dice of each kind one roll may have. The rules have no limit,
 * this just keeps the tray readable.
 */
export const DICE_LIMITS: Record<DieCategory, number> = {
  BASE: 15,
  STRESS: 10,
};

export function getDieCategory(die: Die): DieCategory {
  return die.style === "STRESS" ? "STRESS" : "BASE";
}

/** True when one more of this die still fits within the roll limits */
export function canAddDie(
  die: Die,
  counts: DiceCounts,
  diceById: Record<string, Die>
) {
  if (die.type === "CARD") {
    // Cards depend on the deck and your role (players 1, the GM up to 5)
    let picked = 0;
    for (const [id, count] of Object.entries(counts)) {
      if (diceById[id]?.type === "CARD") {
        picked += count;
      }
    }
    return picked < getMaxCards(useCardDeckStore.getState());
  }
  const category = getDieCategory(die);
  let used = 0;
  for (const [id, count] of Object.entries(counts)) {
    const other = diceById[id];
    if (other && other.type !== "CARD" && getDieCategory(other) === category) {
      used += count;
    }
  }
  return used < DICE_LIMITS[category];
}

/** Dice used per category by the dice already in a roll */
function getRollUsage(dice: Dice, usage: Record<DieCategory, number>) {
  for (const d of dice.dice) {
    if (isDie(d)) {
      if (d.type !== "CARD") {
        usage[getDieCategory(d)] += 1;
      }
    } else if (isDice(d)) {
      getRollUsage(d, usage);
    }
  }
  return usage;
}

/** True when one more of this die can be rolled into the roll in the tray */
export function canAddDieToRoll(die: Die, roll: DiceRoll) {
  // Cards are only drawn into a clear tray, and dice can't join a card draw
  if (die.type === "CARD" || isCardRoll(roll)) {
    return false;
  }
  // A push rerolls the dice in the tray, nothing is added to it
  if (roll.pushes) {
    return false;
  }
  const category = getDieCategory(die);
  const usage = getRollUsage(roll, { BASE: 0, STRESS: 0 });
  return usage[category] < DICE_LIMITS[category];
}

import { Die } from "../types/Die";

/** Get the density multiplier for a die */
export function getDieDensity(die: Die): number {
  // Cards keep the density they were tuned with in Twilight: 2000 dice
  return die.type === "CARD" ? 1 : 0.75;
}

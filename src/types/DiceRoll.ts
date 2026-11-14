import { Dice } from "./Dice";

/**
 * The roll of a set of dice.
 * See `Dice` type for examples of usage
 */
export interface DiceRoll extends Dice {
  hidden?: boolean;
  /**
   * How many times the roll has been pushed. Each push adds a stress die.
   * Dice can't be rolled into a pushed roll.
   */
  pushes?: number;
}

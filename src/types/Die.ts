import { isPlainObject } from "is-plain-object";

import { DiceStyle } from "./DiceStyle";
import { DiceType } from "./DiceType";

export interface Die {
  id: string;
  style: DiceStyle;
  type: DiceType;
  /** The card drawn, for a `CARD` (1-52, see `cards/cards.ts`) */
  card?: number;
}

export function isDie(value: any): value is Die {
  return isPlainObject(value) && typeof value.id === "string";
}

import { DiceStyle } from "../types/DiceStyle";
import { BaseDieMaterial } from "./basedie/BaseDieMaterial";
import { StressDieMaterial } from "./stressdie/StressDieMaterial";

export function DiceMaterial({ diceStyle }: { diceStyle: DiceStyle }) {
  switch (diceStyle) {
    case "BASE":
      return <BaseDieMaterial />;
    case "STRESS":
      return <StressDieMaterial />;
    default:
      throw Error(`Dice style ${diceStyle} error: not implemented`);
  }
}

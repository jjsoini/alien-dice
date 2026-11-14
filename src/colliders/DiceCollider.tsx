import { DiceType } from "../types/DiceType";
import { D6Collider } from "./D6Collider";
import { CardCollider } from "./CardCollider";

export function DiceCollider({ diceType }: { diceType: DiceType }) {
  switch (diceType) {
    case "D6":
      return <D6Collider />;
    case "CARD":
      return <CardCollider />;
    default:
      throw Error(`Dice type ${diceType} error: not implemented`);
  }
}

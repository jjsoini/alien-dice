import { CuboidCollider } from "@react-three/rapier";
import {
  CARD_COLLIDER_THICKNESS,
  CARD_HEIGHT,
  CARD_WIDTH,
} from "../cards/cardSize";

export function CardCollider() {
  return (
    <CuboidCollider
      args={[CARD_WIDTH / 2, CARD_COLLIDER_THICKNESS / 2, CARD_HEIGHT / 2]}
    />
  );
}

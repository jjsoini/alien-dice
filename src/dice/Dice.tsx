import React from "react";
import { Die } from "../types/Die";

import { DiceMesh } from "../meshes/DiceMesh";
import { DiceMaterial } from "../materials/DiceMaterial";
import { CardMesh } from "../cards/CardMesh";

type DiceProps = JSX.IntrinsicElements["group"] & { die: Die };

export const Dice = React.forwardRef<THREE.Group, DiceProps>(
  ({ die, children, ...props }, ref) => {
    if (die.type === "CARD") {
      return (
        <CardMesh card={die.card} {...props} ref={ref}>
          {children}
        </CardMesh>
      );
    }
    return (
      <DiceMesh diceType={die.type} {...props} ref={ref}>
        <DiceMaterial diceStyle={die.style} />
        {children}
      </DiceMesh>
    );
  }
);

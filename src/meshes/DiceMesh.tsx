import React from "react";
import { DiceType } from "../types/DiceType";
import { RoundedDiceMesh } from "./rounded/RoundedDiceMesh";

type DiceMeshProps = JSX.IntrinsicElements["group"] & {
  diceType: DiceType;
};

export const DiceMesh = React.forwardRef<THREE.Group, DiceMeshProps>(
  (props, ref) => <RoundedDiceMesh ref={ref} {...props} />
);

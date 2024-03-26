import { DiceSet } from "../types/DiceSet";
import { DiceStyle } from "../types/DiceStyle";
import { Die } from "../types/Die";

import * as basePreviews from "../previews/basedie";
import * as stressPreviews from "../previews/stressdie";


const standardPreviews: Record<DiceStyle, string> = {
  BASE: basePreviews.D6,
  STRESS: stressPreviews.D100,
};

function createStandardSet(style: DiceStyle): DiceSet {
  const id = `${style}_STANDARD`;
  return {
    id,
    name: `${style.toLowerCase()} dice`,
    dice: [
      { id: `${id}_D6`, type: "D6", style},
      { id: `${id}_D6ammo`, type: "D6", style: "STRESS" },
    ],
    previewImage: standardPreviews[style],
  };
}

function createSecondarySet(style: DiceStyle): DiceSet {
  const id = `${style}_STANDARD`;
  return {
    id,
    name: `${style.toLowerCase()} dice`,
    dice: [
      { id: `${id}_D4`, type: "D4", style: "BASE" },
      { id: `${id}_D20`, type: "D20", style: "BASE" },
      { id: `${id}_D100`, type: "D100", style },
    ],
    previewImage: standardPreviews[style],
  };
}

const standardSets = [
  createStandardSet("BASE"), createSecondarySet("STRESS"),
];


export const diceSets: DiceSet[] = [...standardSets];

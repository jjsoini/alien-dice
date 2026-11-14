import { DiceSet } from "../types/DiceSet";

import * as basePreviews from "../previews/basedie";

/**
 * The one set in the sidebar: the base and stress dice, then the initiative
 * card (Shuffle follows it). The set switcher (`DiceSetPicker`) is not in
 * the sidebar.
 */
const standardSet: DiceSet = {
  id: "ALIEN_STANDARD",
  name: "alien dice",
  dice: [
    { id: "ALIEN_STANDARD_D6", type: "D6", style: "BASE" },
    { id: "ALIEN_STANDARD_D6stress", type: "D6", style: "STRESS" },
    { id: "ALIEN_STANDARD_CARD", type: "CARD", style: "BASE" },
  ],
  previewImage: basePreviews.D6,
};

export const diceSets: DiceSet[] = [standardSet];

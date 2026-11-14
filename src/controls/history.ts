import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { DiceCounts } from "./store";
import { Die } from "../types/Die";
import { generateDiceId } from "../helpers/generateDiceId";
import { RollSummary } from "../helpers/getRollSummary";

export interface RecentRoll {
  /** Unique id so the result can be attached once the dice settle */
  id: string;
  counts: DiceCounts;
  diceById: Record<string, Die>;
  /** Final result of the roll (updated after pushes), `null` while rolling */
  result: RollSummary | null;
}

interface DiceHistoryState {
  recentRolls: RecentRoll[];
  /** The history entry that the current roll in the tray belongs to */
  activeRollId: string | null;
  pushRecentRoll: (roll: Omit<RecentRoll, "id" | "result">) => void;
  removeRecentRoll: (index: number) => void;
  setActiveRollResult: (result: RollSummary | null) => void;
  /** Count a die rolled into the tray as part of the active roll */
  addDieToActiveRoll: (die: Die) => void;
}

export const useDiceHistoryStore = create<DiceHistoryState>()(
  immer((set) => ({
    recentRolls: [],
    activeRollId: null,
    pushRecentRoll(roll) {
      set((state) => {
        if (state.recentRolls.length > 5) {
          state.recentRolls.splice(0, 1);
        }
        const id = generateDiceId();
        state.recentRolls.push({ ...roll, id, result: null });
        state.activeRollId = id;
      });
    },
    removeRecentRoll(index) {
      set((state) => {
        state.recentRolls.splice(index, 1);
      });
    },
    addDieToActiveRoll(die) {
      set((state) => {
        const roll = state.recentRolls.find((r) => r.id === state.activeRollId);
        if (roll) {
          roll.counts[die.id] = (roll.counts[die.id] || 0) + 1;
          roll.diceById[die.id] = die;
        }
      });
    },
    setActiveRollResult(result) {
      set((state) => {
        const roll = state.recentRolls.find((r) => r.id === state.activeRollId);
        if (roll) {
          roll.result = result;
        }
      });
    },
  }))
);

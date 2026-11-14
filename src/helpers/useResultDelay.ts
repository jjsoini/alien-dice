import { useEffect, useMemo, useState } from "react";

import { Dice } from "../types/Dice";
import { getDieFromDice } from "./getDieFromDice";

/** Milliseconds between the dice settling and the result appearing */
export const RESULT_DELAY = 1000;

/**
 * Hold a roll's result back for a moment after the dice settle, so players
 * read the dice first. Returns true once the result may be shown.
 *
 * Keyed on the dice ids (new on every roll and reroll) because synced rolls
 * from other players arrive as new objects on every OBR update.
 */
export function useResultDelay(
  diceRoll: Dice | null | undefined,
  finishedRolling: boolean
) {
  const rollKey = useMemo(
    () =>
      diceRoll
        ? getDieFromDice(diceRoll)
            .map((die) => die.id)
            .join(",")
        : "",
    [diceRoll]
  );

  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    if (!finishedRolling || !rollKey) {
      return;
    }
    const timeout = setTimeout(() => setShown(true), RESULT_DELAY);
    return () => clearTimeout(timeout);
  }, [rollKey, finishedRolling]);

  return shown;
}

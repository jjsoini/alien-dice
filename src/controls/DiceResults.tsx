import { useMemo } from "react";

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";

import { DiceRoll } from "../types/DiceRoll";
import { getRollSummary, RollSummary } from "../helpers/getRollSummary";
import { useResultDelay } from "../helpers/useResultDelay";
import { FacehuggerIcon, SuccessIcon } from "../icons/ResultIcons";
import { formatCards } from "../cards/cards";

/** Successes, and PANIC when a stress die shows a facehugger */
export function RollSummaryLabel({
  summary,
  iconSize,
  stacked,
}: {
  summary: RollSummary;
  iconSize?: string;
  /**
   * One item per line and the panic as just its icon, for narrow places
   * (avatar badges)
   */
  stacked?: boolean;
}) {
  if (summary.cards) {
    return <>{formatCards(summary.cards)}</>;
  }
  if (summary.value === null) {
    return null;
  }
  return (
    <Stack
      component="span"
      direction={stacked ? "column" : "row"}
      alignItems={stacked ? "flex-end" : "center"}
      columnGap="0.4em"
    >
      <Stack component="span" direction="row" alignItems="center" gap="0.15em">
        {summary.value}
        <SuccessIcon size={iconSize} />
      </Stack>
      {summary.panic && (
        <Stack
          component="span"
          direction="row"
          alignItems="center"
          gap="0.2em"
        >
          <FacehuggerIcon size={iconSize} />
          {!stacked && <span>PANIC</span>}
        </Stack>
      )}
    </Stack>
  );
}

export function DiceResults({
  diceRoll,
  rollValues,
}: {
  diceRoll: DiceRoll;
  rollValues: Record<string, number>;
}) {
  const summary = useMemo(
    () => getRollSummary(diceRoll, rollValues),
    [diceRoll, rollValues]
  );

  // Only rendered once the dice have settled
  const shown = useResultDelay(diceRoll, true);

  // The result sits at the bottom of the tray: the dice themselves are the
  // main read, the result is just there to help
  return (
    <Fade in={shown}>
      <Typography
        variant="h5"
        component="div"
        color={RESULT_COLOR}
        sx={{ px: 1.5, py: 0.5, lineHeight: "32px" }}
      >
        <RollSummaryLabel summary={summary} iconSize="0.9em" />
      </Typography>
    </Fade>
  );
}

/** Stress die yellow */
const RESULT_COLOR = "#FFE500";

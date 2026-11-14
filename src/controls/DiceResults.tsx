import { useMemo } from "react";

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import { useTheme } from "@mui/material/styles";

import { DiceRoll } from "../types/DiceRoll";
import { getRollSummary, RollSummary } from "../helpers/getRollSummary";
import { useResultDelay } from "../helpers/useResultDelay";
import { FacehuggerIcon, SuccessIcon } from "../icons/ResultIcons";
import { formatCards } from "../cards/cards";
import { getPanicColor } from "../helpers/accent";

/**
 * Successes, and PANIC when a stress die shows a facehugger. The successes
 * take the text colour, the panic is stress die yellow (green on light
 * backgrounds, see `getPanicColor`).
 */
export function RollSummaryLabel({
  summary,
  iconSize,
  stacked,
  onTray,
}: {
  summary: RollSummary;
  /** Shown over the (always dark) tray */
  onTray?: boolean;
  iconSize?: string;
  /**
   * One item per line and the panic as just its icon, for narrow places
   * (avatar badges)
   */
  stacked?: boolean;
}) {
  const theme = useTheme();
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
        <SuccessIcon size={iconSize} />
        {summary.value}
      </Stack>
      {summary.panic && (
        <Stack
          component="span"
          direction="row"
          alignItems="center"
          gap="0.2em"
          color={getPanicColor(theme, onTray)}
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
  onTray = true,
}: {
  diceRoll: DiceRoll;
  rollValues: Record<string, number>;
  /**
   * Over the tray (white text), or false in the phone dice panel, which
   * has the theme's background
   */
  onTray?: boolean;
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
        color={onTray ? "white" : "text.primary"}
        sx={{ px: 1.5, py: 0.5, lineHeight: "32px" }}
      >
        <RollSummaryLabel summary={summary} iconSize="0.9em" onTray={onTray} />
      </Typography>
    </Fade>
  );
}


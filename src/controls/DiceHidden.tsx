import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import HiddenOnIcon from "@mui/icons-material/VisibilityOffRounded";
import HiddenOffIcon from "@mui/icons-material/VisibilityRounded";

import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";
import { useTrayInset } from "../helpers/narrowTray";

/**
 * Hidden roll toggle, centred at the top of the tray.
 *
 * - Tray empty or building a dice pool: toggles whether the next roll is hidden.
 * - Dice in the tray: shows whether that roll was hidden (not clickable).
 */
export function DiceHidden({
  indicatorOnly = false,
}: {
  /** Only mark a hidden roll, the toggle is elsewhere (phones) */
  indicatorOnly?: boolean;
}) {
  const hiddenNext = useDiceControlsStore((state) => state.diceHidden);
  const toggleDiceHidden = useDiceControlsStore(
    (state) => state.toggleDiceHidden
  );
  const roll = useDiceRollStore((state) => state.roll);
  const inset = useTrayInset();

  const isIndicator = Boolean(roll);
  const hidden = roll ? Boolean(roll.hidden) : hiddenNext;
  const Icon = hidden ? HiddenOnIcon : HiddenOffIcon;

  if (indicatorOnly && !(roll && hidden)) {
    return null;
  }

  return (
    <Box
      component="div"
      sx={{
        position: "absolute",
        // Lined up with the Clear button in the top right
        top: inset,
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <Tooltip
        title={
          isIndicator
            ? hidden
              ? "Hidden roll"
              : "Visible roll"
            : hidden
            ? "Show roll"
            : "Hide roll"
        }
        disableInteractive
      >
        {isIndicator ? (
          // A plain icon with the same size and padding as the button
          <Box
            component="span"
            sx={{ display: "flex", p: 1, color: "white", opacity: 0.7 }}
          >
            <Icon />
          </Box>
        ) : (
          <IconButton
            onClick={() => toggleDiceHidden()}
            sx={{ color: "white" }}
          >
            <Icon />
          </IconButton>
        )}
      </Tooltip>
    </Box>
  );
}

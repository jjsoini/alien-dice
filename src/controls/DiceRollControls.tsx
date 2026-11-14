import { useEffect, useMemo } from "react";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { useTheme, keyframes } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";

import CloseIcon from "@mui/icons-material/CloseRounded";
import RollIcon from "@mui/icons-material/ArrowForwardRounded";

import { RerollDiceIcon } from "../icons/RerollDiceIcon";
import { SHOW_REROLL } from "./PushButton";

import { GradientOverlay } from "./GradientOverlay";
import { useDiceRollStore } from "../dice/store";
import { DiceResults } from "./DiceResults";
import { useDiceControlsStore } from "./store";
import { DiceType } from "../types/DiceType";
import { isCardRoll } from "../types/Dice";
import { getCantDrawReason, useCardDeckStore } from "../cards/cardDeck";
import { getThrowSpeed, resetDicePool, rollDicePool } from "./rollDicePool";
import { useTrayInset } from "../helpers/narrowTray";

const jiggle = keyframes`
0% { transform: translate(0, 0) rotate(0deg); }
25% { transform: translate(2px, 2px) rotate(2deg); }
50% { transform: translate(0, 0) rotate(0deg); }
75% { transform: translate(-2px, 2px) rotate(-2deg); }
100% { transform: translate(0, 0) rotate(0deg); }
`;

export function DiceRollControls() {
  const defaultDiceCounts = useDiceControlsStore(
    (state) => state.defaultDiceCounts
  );

  const counts = useDiceControlsStore((state) => state.diceCounts);
  // Is currently the default dice state (all counts 0)
  const isDefault = useMemo(
    () =>
      Object.entries(defaultDiceCounts).every(
        ([type, count]) => counts[type as DiceType] === count
      ),
    [counts, defaultDiceCounts]
  );

  const rollValues = useDiceRollStore((state) => state.rollValues);
  const finishedRolling = useMemo(() => {
    const values = Object.values(rollValues);
    if (values.length === 0) {
      return false;
    } else {
      return values.every((value) => value !== null);
    }
  }, [rollValues]);

  if (!isDefault) {
    return (
      <Fade in>
        <span>
          <DicePickedControls />
        </span>
      </Fade>
    );
  } else if (finishedRolling) {
    return (
      <Fade in>
        <span>
          <FinishedRollControls />
        </span>
      </Fade>
    );
  } else {
    return null;
  }
}

function DicePickedControls() {
  const inset = useTrayInset();
  const defaultDiceCounts = useDiceControlsStore(
    (state) => state.defaultDiceCounts
  );
  const diceById = useDiceControlsStore((state) => state.diceById);
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const hidden = useDiceControlsStore((state) => state.diceHidden);

  /** Cards are drawn rather than rolled */
  const hasCards = Object.entries(counts).some(
    ([id, count]) => count > 0 && diceById[id]?.type === "CARD"
  );

  function handleRoll() {
    // Someone may have emptied the deck (or you drew) since picking the cards
    if (hasCards && getCantDrawReason(useCardDeckStore.getState())) {
      handleReset();
    } else if (hasDice && rollPressTime) {
      rollDicePool(getThrowSpeed(rollPressTime));
    }
    setRollPressTime(null);
  }

  function handleReset() {
    resetDicePool();
  }

  const rollPressTime = useDiceControlsStore(
    (state) => state.diceRollPressTime
  );
  const setRollPressTime = useDiceControlsStore(
    (state) => state.setDiceRollPressTime
  );

  function handlePointerDown() {
    setRollPressTime(performance.now());
  }

  useEffect(() => {
    if (rollPressTime) {
      const handlePointerUp = () => {
        setRollPressTime(null);
      };
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [rollPressTime]);

  const hasDice = useMemo(
    () =>
      !Object.entries(defaultDiceCounts).every(
        ([type, count]) => counts[type as DiceType] === count
      ),
    [counts, defaultDiceCounts]
  );

  const theme = useTheme();

  return (
    <>
      <ButtonBase
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          cursor: hasDice ? "pointer" : "",
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          ":focus": {
            outline: 0,
          },
          ":hover #dice-roll-button": hasDice
            ? {
                color: theme.palette.primary.contrastText,
                // Room for the "(hidden)" suffix
                width: hidden ? "160px" : "100px",
                "& span": {
                  transform: "translateX(0)",
                },
                backgroundColor: theme.palette.primary.main,
              }
            : {},
          ":active #dice-roll-button": hasDice
            ? {
                backgroundColor: theme.palette.primary.dark,
              }
            : {},
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handleRoll}
        aria-label="roll"
        disabled={!hasDice}
      >
        <Box
          component="div"
          sx={{
            ":active": {
              animation: `${jiggle} 0.3s infinite`,
            },
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Button
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: hasDice ? "transparent" : "transparent !important",
              "& span": {
                transform: "translate(-23px)",
                color: theme.palette.primary.contrastText,
                transition: theme.transitions.create("transform"),
              },
              transition: theme.transitions.create([
                "width",
                "color",
                "background-color",
              ]),
              minWidth: 0,
              width: "36px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              borderRadius: "20px",
            }}
            endIcon={<RollIcon />}
            variant="contained"
            disabled={!hasDice}
            id="dice-roll-button"
            // @ts-ignore
            component="div"
          >
            {hasCards ? "Draw" : "Roll"}
            {hidden && " (hidden)"}
          </Button>
        </Box>
      </ButtonBase>
      <GradientOverlay top />
      <Stack
        sx={{
          // Top right, where Clear is when there are dice in the tray
          position: "absolute",
          top: inset,
          right: inset,
        }}
      >
        <Tooltip title="Clear" disableInteractive>
          <IconButton
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
}

function FinishedRollControls() {
  const inset = useTrayInset();
  const roll = useDiceRollStore((state) => state.roll);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const reroll = useDiceRollStore((state) => state.reroll);
  const isCards = roll ? isCardRoll(roll) : false;

  const rollValues = useDiceRollStore((state) => state.rollValues);
  const finishedRollValues = useMemo(() => {
    const values: Record<string, number> = {};
    for (const [id, value] of Object.entries(rollValues)) {
      if (value !== null) {
        values[id] = value;
      }
    }
    return values;
  }, [rollValues]);

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          pointerEvents: "none",
          padding: `${inset}px`,
        }}
        component="div"
      >
        <Stack
          direction="row"
          justifyContent="flex-end"
          width="100%"
          alignItems="start"
        >
          <Tooltip title="Clear" sx={{ pointerEvents: "all" }}>
            <IconButton
              onClick={() => clearRoll()}
              sx={{ pointerEvents: "all", color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
      {/* Reroll bottom left when shown. Push is with the dice buttons, and
          cards are drawn once per shuffle: no reroll. */}
      {SHOW_REROLL && !isCards && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="end"
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            pointerEvents: "none",
            padding: `${inset}px`,
          }}
          component="div"
        >
          <Tooltip title="Reroll" sx={{ pointerEvents: "all" }}>
            <IconButton
              onClick={() => reroll()}
              sx={{ pointerEvents: "all", color: "white" }}
            >
              <RerollDiceIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
      <Stack
        sx={{
          position: "absolute",
          bottom: 0,
          // Full width less the buttons in the corners
          // (a centred left: 50% box would wrap the result to half the tray)
          left: 0,
          right: 0,
          pointerEvents: "none",
          padding: `${inset}px`,
          // Clear of the buttons in the corners
          px: `${inset + 48}px`,
          alignItems: "center",
        }}
        component="div"
      >
        {roll && (
          <DiceResults diceRoll={roll} rollValues={finishedRollValues} />
        )}
      </Stack>
    </>
  );
}

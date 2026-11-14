import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Player } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Slide from "@mui/material/Slide";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import ButtonBase from "@mui/material/ButtonBase";

import environment from "../environment.hdr";
import { usePlayerDice } from "./usePlayerDice";
import { PlayerDiceRoll } from "./PlayerDiceRoll";
import { AudioListenerProvider } from "../audio/AudioListenerProvider";
import { Tray } from "../tray/Tray";
import { TraySuspense } from "../tray/TraySuspense";
import { AnimatedPlayerCamera } from "./AnimatedPlayerCamera";
import { useResultDelay } from "../helpers/useResultDelay";
import { RollSummaryLabel } from "../controls/DiceResults";

/** Size of the roll card, in pixels */
export type PopoverTraySize = { width: number; trayHeight: number };

/** The card in the corner of a wider screen */
export const COMPACT_SIZE: PopoverTraySize = { width: 250, trayHeight: 250 };
/** Space around the card */
export const MARGIN = 16;
/** Height of the name and result under the tray */
export const NAME_HEIGHT = 32;
/** Screens narrower than this get the wide card */
const NARROW_VIEWPORT = 600;

/**
 * On a phone the card floats over the map nearly full width, as a 3:4
 * portrait view that suits the tall tray, but never taller than two thirds
 * of the screen so some of the map still shows
 */
export function getPopoverTraySize(
  viewportWidth: number,
  viewportHeight: number
): PopoverTraySize {
  if (viewportWidth >= NARROW_VIEWPORT) {
    return COMPACT_SIZE;
  }
  const width = Math.round(viewportWidth - 2 * MARGIN);
  const maxTrayHeight = (viewportHeight * 2) / 3 - NAME_HEIGHT - MARGIN;
  return {
    width,
    trayHeight: Math.round(Math.min((width * 4) / 3, maxTrayHeight)),
  };
}

export function PopoverTray({
  player,
  onToggle,
  onOpen,
  size,
}: {
  player: Player;
  onToggle: (connectionId: string, show: boolean) => void;
  onOpen: (connectionId: string) => void;
  size: PopoverTraySize;
}) {
  const { diceRoll, summary, finishedRolling, finishedRollTransforms } =
    usePlayerDice(player);

  const theme = useTheme();

  const hidden = !diceRoll || diceRoll.hidden;

  const resultShown = useResultDelay(diceRoll, finishedRolling);

  const [timedOut, setTimedOut] = useState(finishedRolling);

  useEffect(() => {
    if (finishedRolling) {
      const timeout = setTimeout(() => {
        setTimedOut(true);
      }, 5000);
      return () => {
        clearTimeout(timeout);
      };
    } else {
      setTimedOut(false);
    }
  }, [finishedRolling]);

  const shown = !hidden && !timedOut;
  useEffect(() => {
    if (shown) {
      onToggle(player.connectionId, true);
    }
  }, [shown]);

  function handleClick() {
    if (shown) {
      setTimedOut(true);
      onOpen(player.connectionId);
    }
  }

  return (
    <Box component="div" position="absolute" right={MARGIN} bottom={MARGIN}>
      <Slide
        in={shown}
        onExited={() => onToggle(player.connectionId, false)}
        direction="up"
      >
        <ButtonBase onClick={handleClick}>
          <Paper
            elevation={8}
            sx={{
              width: `${size.width}px`,
              height: `${size.trayHeight + NAME_HEIGHT}px`,
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: alpha(
                theme.palette.background.default,
                theme.palette.mode === "dark" ? 0.8 : 0.4
              ),
            }}
          >
            <Box
              component="div"
              height={`${size.trayHeight}px`}
              width={`${size.width}px`}
            >
              <TraySuspense>
                <Canvas frameloop="demand">
                  <AudioListenerProvider volume={0.25}>
                    <Environment files={environment} />
                    <Tray />
                    <PlayerDiceRoll player={player} />
                    <AnimatedPlayerCamera
                      rollTransforms={
                        finishedRolling ? finishedRollTransforms : undefined
                      }
                    />
                  </AudioListenerProvider>
                </Canvas>
              </TraySuspense>
            </Box>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              textAlign="center"
              lineHeight={`${NAME_HEIGHT}px`}
              sx={{
                bgcolor: "background.default",
              }}
              noWrap
            >
              {player?.name}
              {resultShown &&
                summary &&
                (summary.cards || summary.value !== null) && (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      verticalAlign: "middle",
                      ml: 0.5,
                    }}
                  >
                    |&nbsp;
                    <RollSummaryLabel summary={summary} iconSize="1em" />
                  </Box>
                )}
            </Typography>
          </Paper>
        </ButtonBase>
      </Slide>
    </Box>
  );
}

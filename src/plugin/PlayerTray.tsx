import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Player } from "@owlbear-rodeo/sdk";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Fade from "@mui/material/Fade";
import Backdrop from "@mui/material/Backdrop";
import Tooltip from "@mui/material/Tooltip";

import HiddenIcon from "@mui/icons-material/VisibilityOffRounded";

import environment from "../environment.hdr";
import { DiceResults } from "../controls/DiceResults";
import { usePlayerDice } from "./usePlayerDice";
import { PlayerDiceRoll } from "./PlayerDiceRoll";
import { AudioListenerProvider } from "../audio/AudioListenerProvider";
import { Tray } from "../tray/Tray";
import { useDebugStore } from "../debug/store";
import { TraySuspense } from "../tray/TraySuspense";
import { getPublicHand, useCardDeckStore } from "../cards/cardDeck";
import { CardStack } from "../controls/DrawnCards";
import { TrayCoverCamera } from "../tray/TrayCamera";
import {
  CORNER_INSET,
  NARROW_TRAY_HEIGHT,
  NARROW_TRAY_WIDTH,
  cornerRowOffset,
} from "../helpers/narrowTray";

export function PlayerTray({
  player,
  narrow = false,
}: {
  player?: Player; // Make player optional to allow for preloading of the tray
  /** Phone layout: as big as fits, with the back button in its top left */
  narrow?: boolean;
}) {
  const allowOrbit = useDebugStore((state) => state.allowOrbit);
  /** The player's initiative cards from the current shuffle */
  const hand = useCardDeckStore((state) =>
    player ? state.hands[player.id] : undefined
  );

  return (
    <Box component="div" position="relative" display="flex">
      <Box
        component="div"
        borderRadius={0.5}
        height={narrow ? NARROW_TRAY_HEIGHT : "100vh"}
        width={narrow ? NARROW_TRAY_WIDTH : "calc(100vh / 2)"}
        overflow="hidden"
        position="relative"
      >
        <TraySuspense>
          <Canvas frameloop="demand">
            <AudioListenerProvider>
              <Environment files={environment} />
              <ContactShadows
                resolution={256}
                scale={[1, 2]}
                position={[0, 0, 0]}
                blur={0.5}
                opacity={0.5}
                far={1}
                color="#222222"
              />
              <Tray />
              <PlayerDiceRoll player={player} />
              {narrow ? (
                <TrayCoverCamera />
              ) : (
                <PerspectiveCamera
                  makeDefault
                  fov={28}
                  position={[0, 4.3, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                />
              )}
              {allowOrbit && <OrbitControls />}
            </AudioListenerProvider>
          </Canvas>
        </TraySuspense>
      </Box>
      <PlayerTrayResults player={player} narrow={narrow} />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          pointerEvents: "none",
          padding: narrow ? `${CORNER_INSET}px` : 3,
          // Keep clear of the back button and cards on the left (centred,
          // so the same on both sides)
          px: hand && hand.cards.length > 0 ? 15 : 9,
        }}
        component="div"
      >
        <Typography
          variant="h6"
          color="rgba(255, 255, 255, 0.85)"
          textAlign="center"
          noWrap
          sx={{ textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)" }}
        >
          {player?.name}
        </Typography>
      </Box>
      {hand && hand.cards.length > 0 && (
        <Fade in>
          <Box
            component="div"
            // Top left, just right of the back button
            sx={
              narrow
                ? {
                    position: "absolute",
                    top: CORNER_INSET,
                    left: cornerRowOffset(1),
                  }
                : { position: "absolute", top: 16, left: 60 }
            }
          >
            <Tooltip
              title={getPublicHand(hand).label}
              placement="right"
              disableInteractive
            >
              <Box component="div">
                <CardStack
                  cards={getPublicHand(hand).cards}
                  width={48}
                  isFaceDown={getPublicHand(hand).isHidden}
                />
              </Box>
            </Tooltip>
          </Box>
        </Fade>
      )}
    </Box>
  );
}

function PlayerTrayResults({
  player,
  narrow,
}: {
  player?: Player;
  narrow: boolean;
}) {
  const { diceRoll, finalValue, finishedRollValues, finishedRolling } =
    usePlayerDice(player);
  return (
    <>
      {diceRoll?.hidden && (
        <Backdrop open sx={{ position: "absolute" }}>
          <Tooltip title="Hidden Roll">
            <HiddenIcon htmlColor="white" />
          </Tooltip>
        </Backdrop>
      )}
      {finalValue !== null && (
        <>
          <Fade in>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                pointerEvents: "none",
                padding: narrow ? `${CORNER_INSET}px` : 3,
              }}
              component="div"
            >
              <Stack
                direction="row"
                justifyContent="center"
                width="100%"
                alignItems="start"
              >
                {finishedRolling &&
                  diceRoll &&
                  finishedRollValues &&
                  finalValue !== null && (
                    <DiceResults
                      diceRoll={diceRoll}
                      rollValues={finishedRollValues}
                    />
                  )}
              </Stack>
            </Box>
          </Fade>
        </>
      )}
    </>
  );
}

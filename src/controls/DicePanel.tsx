import { useEffect, useMemo, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { alpha, useTheme } from "@mui/material/styles";
import {
  getAccentForegroundColor,
  getAccentLineColor,
  LINE_WIDTH,
} from "../helpers/accent";

import DiceIcon from "@mui/icons-material/CasinoRounded";
import ClearIcon from "@mui/icons-material/CloseRounded";
import RollIcon from "@mui/icons-material/ArrowForwardRounded";
import HiddenOnIcon from "@mui/icons-material/VisibilityOffRounded";
import HiddenOffIcon from "@mui/icons-material/VisibilityRounded";

import { DicePicker } from "./DicePicker";
import { DiceHistory } from "./DiceHistory";
import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";
import { getThrowSpeed, resetDicePool, rollDicePool } from "./rollDicePool";
import { PluginGate } from "../plugin/PluginGate";
import { PartyTrays } from "../plugin/PartyTrays";
import { DiceResults } from "./DiceResults";
import { isCardRoll } from "../types/Dice";
import { RerollDiceIcon } from "../icons/RerollDiceIcon";
import { PushButton, SHOW_REROLL } from "./PushButton";
import {
  CORNER_BUTTON,
  CORNER_INSET,
  trayTop,
  traySide,
  cornerRowOffset,
} from "../helpers/narrowTray";

/** The button bar along the top (toggle, history, Clear) */
const BAR_HEIGHT = CORNER_INSET + CORNER_BUTTON + CORNER_INSET;

/** The dice grid's smallest height: two 72px rows and its lines */
const GRID_MIN_HEIGHT = 2 * 72 + 3 * LINE_WIDTH;

/** Space between the avatars in the players strip, in pixels */
const STRIP_GAP = 8;

/**
 * Dice controls for phones, covering the whole popover.
 *
 * Opened with the toggle in the top left, to pick dice and roll, or to add
 * dice to a roll already in the tray.
 */
export function DicePanel({
  open,
  onClose,
}: {
  open: boolean;
  /** To watch dice roll: after adding a die, a reroll or a push */
  onClose: () => void;
}) {
  const theme = useTheme();
  const hasRoll = useDiceRollStore((state) => Boolean(state.roll));
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const hasPool = Object.values(counts).some((count) => count > 0);

  // Width for the players strip's avatars to fit in
  // (a callback ref, as the strip only mounts once the plugin is ready)
  const [strip, setStrip] = useState<HTMLDivElement | null>(null);
  const [stripWidth, setStripWidth] = useState<number>();
  useEffect(() => {
    if (!strip) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(strip);
      setStripWidth(
        strip.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight)
      );
    });
    observer.observe(strip);
    return () => observer.disconnect();
  }, [strip]);

  return (
    <Fade in={open}>
      <Stack
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          // The panel colour, letting the tray show faintly through
          bgcolor: alpha(theme.palette.background.default, 0.97),
          px: `${CORNER_INSET}px`,
          // Below the buttons along the tray's top edge. The dice grid's top
          // border is the line under them.
          pt: trayTop(BAR_HEIGHT),
          pb: `${CORNER_INSET}px`,
          gap: 1,
          overflowY: "auto",
          // Only scrolls up and down
          overflowX: "hidden",
        }}
      >
        {/* Lined up with the tray's corner buttons: the panel toggle (see
            DicePanelToggle) then history in the top left, Clear top right */}
        <Box
          component="div"
          sx={{
            position: "absolute",
            top: trayTop(),
            left: traySide(cornerRowOffset(1)),
          }}
        >
          <DiceHistory placement="bottom" />
        </Box>
        {/* Clears the tray, like the tray's own Clear, or else the pool */}
        <Fade in={hasRoll || hasPool}>
          <Box
            component="div"
            sx={{ position: "absolute", top: trayTop(), right: traySide() }}
          >
            <Tooltip title="Clear" disableInteractive>
              <IconButton
                onClick={() => (hasRoll ? clearRoll() : resetDicePool())}
                aria-label="Clear"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
        {/* The dice grid runs the full width of the panel. It's a square,
            and the only part of the panel that shrinks: once the space
            above the Roll row is used up it gets flatter, down to 72px
            rows, before the panel scrolls. */}
        <Box
          component="div"
          mx={`-${CORNER_INSET}px`}
          sx={{
            aspectRatio: "1",
            flexShrink: 1,
            minHeight: GRID_MIN_HEIGHT,
          }}
        >
          <DicePicker variant="panel" onAddToRoll={onClose} />
        </Box>
        {/* Other players in a strip right under the dice grid, scrolling
            sideways when they don't fit (centred when they do) */}
        <PluginGate>
          <Stack
            ref={setStrip}
            direction="row"
            alignItems="flex-start"
            gap={`${STRIP_GAP}px`}
            mx={`-${CORNER_INSET}px`}
            px={`${CORNER_INSET}px`}
            pt={0.5}
            pb={0.5}
            sx={{
              // Its full height: as it hides its overflow, the panel's column
              // could otherwise squeeze it and cut off the avatars
              flexShrink: 0,
              overflowX: "auto",
              // Badges reach below the avatars, don't scroll for them
              overflowY: "hidden",
              // Scrolls by swiping, without a scrollbar
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              // Gone when there are no other players
              "&:empty": { display: "none" },
              "& > :first-of-type": { ml: "auto" },
              "& > :last-of-type": { mr: "auto" },
            }}
          >
            <PartyTrays
              divider={false}
              avatarSize="large"
              fitWidth={stripWidth}
              gap={STRIP_GAP}
            />
          </Stack>
        </PluginGate>
        {/* With dice in the tray, picking a die rolls it straight in and the
            tray's roll controls and result are here too. Pushed to the
            bottom by the free space (a margin, so it adds no extra gap). */}
        <Box component="div" mt="auto">
          {hasRoll ? <RollResultRow onRoll={onClose} /> : <RollRow />}
        </Box>
      </Stack>
    </Fade>
  );
}

/** Hidden toggle and the Roll button, held down it throws harder */
function RollRow() {
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const diceById = useDiceControlsStore((state) => state.diceById);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const toggleHidden = useDiceControlsStore((state) => state.toggleDiceHidden);
  const hasDice = useMemo(
    () => Object.values(counts).some((count) => count > 0),
    [counts]
  );
  const hasCards = Object.entries(counts).some(
    ([id, count]) => count > 0 && diceById[id]?.type === "CARD"
  );
  const pressTime = useRef<number | null>(null);
  const theme = useTheme();

  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Tooltip title={hidden ? "Show roll" : "Hide roll"} disableInteractive>
        <IconButton
          onClick={() => toggleHidden()}
          aria-label={hidden ? "Show roll" : "Hide roll"}
          // No background: the icon turns green when the roll is hidden
          sx={{
            width: 40,
            height: 40,
            color: hidden ? getAccentForegroundColor(theme) : undefined,
          }}
        >
          {hidden ? <HiddenOnIcon /> : <HiddenOffIcon />}
        </IconButton>
      </Tooltip>
      <Button
        variant="outlined"
        size="large"
        fullWidth
        disabled={!hasDice}
        endIcon={<RollIcon />}
        onPointerDown={() => {
          pressTime.current = performance.now();
        }}
        onClick={() => {
          rollDicePool(getThrowSpeed(pressTime.current));
          pressTime.current = null;
        }}
        sx={{
          borderRadius: "20px",
          height: 40,
          whiteSpace: "nowrap",
          // Text in the green that reads on the panel, outline in the accent
          color: getAccentForegroundColor(theme),
          borderColor: getAccentLineColor(theme),
          borderWidth: LINE_WIDTH,
          "&:hover": {
            borderColor: getAccentLineColor(theme),
            borderWidth: LINE_WIDTH,
            bgcolor: alpha(getAccentForegroundColor(theme), 0.08),
          },
          "&.Mui-disabled": { borderWidth: LINE_WIDTH },
        }}
      >
        {hasCards ? "Draw" : "Roll"}
        {hidden && " (hidden)"}
      </Button>
    </Stack>
  );
}

/**
 * Opens and closes the dice panel. It stays in the tray's top left corner
 * whether the panel is open or not.
 */
export function DicePanelToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <Tooltip
      title={open ? "Show the tray" : "Dice"}
      placement="right"
      disableInteractive
    >
      <IconButton
        onClick={onToggle}
        aria-label={open ? "Show the tray" : "Dice"}
        aria-pressed={open}
        sx={{
          position: "absolute",
          top: trayTop(),
          left: traySide(),
          zIndex: 3,
          // No background: white over the tray, the icon colour over the
          // open panel
          color: open ? "action.active" : "white",
        }}
      >
        <DiceIcon />
      </IconButton>
    </Tooltip>
  );
}

/**
 * The result, with Push bottom left (and Reroll right if shown), as along the
 * bottom of the tray
 */
function RollResultRow({ onRoll }: { onRoll: () => void }) {
  const roll = useDiceRollStore((state) => state.roll);
  const rollValues = useDiceRollStore((state) => state.rollValues);
  const reroll = useDiceRollStore((state) => state.reroll);

  const finishedValues = useMemo(() => {
    const values = Object.values(rollValues);
    if (values.length === 0 || values.some((value) => value === null)) {
      return null;
    }
    return rollValues as Record<string, number>;
  }, [rollValues]);

  if (!roll) {
    return null;
  }
  // Cards are drawn once per shuffle: no reroll or push
  const isCards = isCardRoll(roll);

  return (
    <Stack
      direction="row"
      alignItems="end"
      justifyContent="space-between"
      gap={1}
      minHeight={CORNER_BUTTON}
    >
      {/* Push bottom left, as on the tray */}
      <Box component="div" width={CORNER_BUTTON} flexShrink={0}>
        {!isCards && <PushButton onPush={onRoll} />}
      </Box>
      <Stack alignItems="center" minWidth={0} flexGrow={1}>
        {finishedValues && (
          <DiceResults
            diceRoll={roll}
            rollValues={finishedValues}
            onTray={false}
          />
        )}
      </Stack>
      <Box
        component="div"
        width={CORNER_BUTTON}
        flexShrink={0}
        display="flex"
        justifyContent="flex-end"
      >
        {SHOW_REROLL && !isCards && finishedValues && (
          <Tooltip title="Reroll" disableInteractive>
            <IconButton
              aria-label="Reroll"
              onClick={() => {
                reroll();
                onRoll();
              }}
            >
              <RerollDiceIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Stack>
  );
}

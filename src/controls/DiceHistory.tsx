import { useEffect, useState } from "react";

import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

import HistoryIcon from "@mui/icons-material/SavedSearchRounded";
import NoHistoryIcon from "@mui/icons-material/ManageSearchRounded";

import { useDiceRollStore } from "../dice/store";
import { RecentRoll, useDiceHistoryStore } from "./history";
import { DicePreview } from "../previews/DicePreview";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { getDiceToRoll, useDiceControlsStore } from "./store";
import { getRollSummary } from "../helpers/getRollSummary";
import { getMaxCards, useCardDeckStore } from "../cards/cardDeck";
import { RollSummaryLabel } from "./DiceResults";

/** Attach the final result to the active history entry once the dice settle */
function useRecordRollResult() {
  const roll = useDiceRollStore((state) => state.roll);
  const rollValues = useDiceRollStore((state) => state.rollValues);
  const setActiveRollResult = useDiceHistoryStore(
    (state) => state.setActiveRollResult
  );

  useEffect(() => {
    const values = Object.values(rollValues);
    if (!roll || values.length === 0) {
      return;
    }
    if (values.every((value) => value !== null)) {
      setActiveRollResult(
        getRollSummary(roll, rollValues as Record<string, number>)
      );
    } else {
      // Dice are rolling again (e.g. a push), clear the old result
      setActiveRollResult(null);
    }
  }, [roll, rollValues, setActiveRollResult]);
}

export function DiceHistory({
  placement = "right",
}: {
  /** Where the history menu opens from the button */
  placement?: "right" | "bottom";
}) {
  useRecordRollResult();

  const startRoll = useDiceRollStore((state) => state.startRoll);
  const pushRecentRoll = useDiceHistoryStore((state) => state.pushRecentRoll);

  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const resetDiceCounts = useDiceControlsStore(
    (state) => state.resetDiceCounts
  );

  function handleRoll(roll: RecentRoll) {
    // Cards can only be drawn once per shuffle
    const counts = { ...roll.counts };
    for (const [id, count] of Object.entries(counts)) {
      if (roll.diceById[id]?.type === "CARD" && count > 0) {
        const max = getMaxCards(useCardDeckStore.getState());
        if (max === 0) {
          return;
        }
        counts[id] = Math.min(count, max);
      }
    }
    const dice = getDiceToRoll(counts, roll.diceById);
    startRoll({ dice, hidden });
    pushRecentRoll({ counts, diceById: roll.diceById });
    resetDiceCounts();
    handleClose();
  }

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }
  function handleClose() {
    setAnchorEl(null);
  }

  const recentRolls = useDiceHistoryStore((state) => state.recentRolls);
  const removeRecentRoll = useDiceHistoryStore(
    (state) => state.removeRecentRoll
  );

  return (
    <>
      <IconButton
        aria-label="more"
        id="more-button"
        aria-controls={open ? "more-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <HistoryIcon />
      </IconButton>
      <Menu
        id="more-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "more-button",
        }}
        anchorOrigin={
          placement === "bottom"
            ? { vertical: "bottom", horizontal: "left" }
            : { vertical: "center", horizontal: "right" }
        }
        transformOrigin={
          placement === "bottom"
            ? { vertical: "top", horizontal: "left" }
            : { vertical: "center", horizontal: "left" }
        }
      >
        <Stack
          // Fits a phone's popover, whose width is about the same
          width={
            placement === "bottom" ? "min(280px, calc(100vw - 40px))" : "280px"
          }
          px={1}
          gap={0.5}
        >
          {/* Stored oldest first, shown newest first */}
          {recentRolls
            .map((recentRoll, index) => (
              <RecentRollChip
                key={recentRoll.id}
                recentRoll={recentRoll}
                onRoll={() => handleRoll(recentRoll)}
                onDelete={() => removeRecentRoll(index)}
              />
            ))
            .reverse()}
          {recentRolls.length === 0 && <EmptyMessage />}
        </Stack>
      </Menu>
    </>
  );
}

function RecentRollChip({
  recentRoll,
  onRoll,
  onDelete,
}: {
  recentRoll: RecentRoll;
  onRoll: () => void;
  onDelete: () => void;
}) {
  // One entry per die rolled, e.g. (d6)(d6)(stress d6)
  const rolledDice: { key: string; die: RecentRoll["diceById"][string] }[] = [];
  for (const [id, count] of Object.entries(recentRoll.counts)) {
    const die = recentRoll.diceById[id];
    if (!die) {
      continue;
    }
    for (let i = 0; i < count; i++) {
      rolledDice.push({ key: `${id}-${i}`, die });
    }
  }

  return (
    <Chip
      sx={{
        flexGrow: 1,
        flexBasis: 0,
        height: "auto",
        minHeight: "32px",
        ".MuiChip-label": {
          whiteSpace: "normal",
          px: 0,
        },
        ".MuiChip-deleteIcon": {
          position: "absolute",
          right: 0,
        },
      }}
      label={
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          pl={1}
          pr={3}
          py={0.25}
        >
          {rolledDice.map(({ key, die }) => (
            <Box key={key} component="span" display="flex" mx="-4px">
              <DicePreview
                diceStyle={die.style}
                diceType={die.type}
                size="small"
              />
            </Box>
          ))}
          {recentRoll.result &&
            (recentRoll.result.cards || recentRoll.result.value !== null) && (
              <Typography
                component="span"
                variant="body2"
                fontWeight="bold"
                ml={0.5}
                whiteSpace="nowrap"
                display="flex"
                alignItems="center"
              >
                =
                <RollSummaryLabel
                  summary={recentRoll.result}
                  iconSize="1.1em"
                />
              </Typography>
            )}
        </Stack>
      }
      variant="filled"
      onClick={() => onRoll()}
      onDelete={() => onDelete()}
    />
  );
}

function EmptyMessage() {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0.5,
        pb: 1,
      }}
    >
      <Box
        component="div"
        sx={{
          fontSize: "2rem",
          color:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.46)"
              : "rgba(0, 0, 0, 0.46)",
          display: "flex",
          p: 1,
        }}
      >
        <NoHistoryIcon />
      </Box>
      <Typography variant="h6">No History</Typography>
      <Typography variant="caption" textAlign="center">
        Roll dice to add to the roll history.
      </Typography>
    </Stack>
  );
}

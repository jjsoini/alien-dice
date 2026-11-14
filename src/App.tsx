import { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import { InteractiveTray } from "./tray/InteractiveTray";
import { Sidebar } from "./controls/Sidebar";
import { DicePanel, DicePanelToggle } from "./controls/DicePanel";
import { useNarrowLayout } from "./helpers/useNarrowLayout";
import { PluginGate } from "./plugin/PluginGate";
import { DiceRollSync } from "./plugin/DiceRollSync";
import { CardDeckSync } from "./plugin/CardDeckSync";
import { ResizeObserver as PluginResizeObserver } from "./plugin/ResizeObserver";
import { useDiceRollStore } from "./dice/store";
import { NARROW_TRAY_HEIGHT, NARROW_TRAY_WIDTH } from "./helpers/narrowTray";

export function App() {
  const narrow = useNarrowLayout();

  if (narrow) {
    return <NarrowLayout />;
  }

  return (
    <Container disableGutters maxWidth="md">
      <Stack direction="row" justifyContent="center">
        <Sidebar />
        <InteractiveTray />
      </Stack>
    </Container>
  );
}

/**
 * Phones: the tray takes the whole popover, and the dice controls a panel
 * over it, opened with the toggle in the top left
 */
function NarrowLayout() {
  // Opened with its toggle, and closed when dice are rolled so you can
  // watch them
  const hasRoll = useDiceRollStore((state) => Boolean(state.roll));
  const [panelOpen, setPanelOpen] = useState(false);
  useEffect(() => {
    if (hasRoll) {
      setPanelOpen(false);
    }
  }, [hasRoll]);

  return (
    <Box
      component="div"
      position="relative"
      width="100vw"
      height="100vh"
      overflow="hidden"
    >
      <Stack alignItems="center" justifyContent="center" height="100vh">
        <InteractiveTray
          width={NARROW_TRAY_WIDTH}
          height={NARROW_TRAY_HEIGHT}
          narrow
        />
      </Stack>
      <PluginGate>
        <DiceRollSync />
        <CardDeckSync />
        <PluginResizeObserver />
      </PluginGate>
      <DicePanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      <DicePanelToggle
        open={panelOpen}
        onToggle={() => setPanelOpen((open) => !open)}
      />
    </Box>
  );
}

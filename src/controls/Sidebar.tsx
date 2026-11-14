import SimpleBar from "simplebar-react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

// import { DiceSetPicker } from "./DiceSetPicker";
import { DicePicker } from "./DicePicker";
import { DiceHistory } from "./DiceHistory";
import { SupportCreator } from "./SupportCreator";

import { PluginGate } from "../plugin/PluginGate";
import { DiceRollSync } from "../plugin/DiceRollSync";
import { CardDeckSync } from "../plugin/CardDeckSync";
import { PartyTrays } from "../plugin/PartyTrays";
import { ResizeObserver as PluginResizeObserver } from "../plugin/ResizeObserver";

export function Sidebar() {
  return (
    <SimpleBar
      style={{
        maxHeight: "100vh",
        width: "60px",
        minWidth: "60px",
        overflowY: "auto",
      }}
    >
      <Stack p={1} gap={1} alignItems="center">
        {/* The set switcher is hidden, there's only one set */}
        {/* <DiceSetPicker /> */}
        <DicePicker />
        <Divider flexItem sx={{ mx: 1 }} />
        {/* Other players, with their own closing divider when there are any
            (your own cards show in the top left of your tray) */}
        <PluginGate>
          <DiceRollSync />
          <CardDeckSync />
          <PartyTrays />
          <PluginResizeObserver />
        </PluginGate>
        <DiceHistory />
        {/* Desktop only: the phone layout has no sidebar */}
        <SupportCreator />
      </Stack>
    </SimpleBar>
  );
}

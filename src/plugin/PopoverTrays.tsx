import OBR, { Player } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";

import {
  COMPACT_SIZE,
  MARGIN,
  NAME_HEIGHT,
  PopoverTray,
  PopoverTraySize,
  getPopoverTraySize,
} from "./PopoverTray";
import { getPluginId } from "./getPluginId";

export function PopoverTrays() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    OBR.party.getPlayers().then(setPlayers);
  }, []);
  useEffect(() => OBR.party.onChange(setPlayers), []);

  const [visibleTrays, setVisibleTrays] = useState<string[]>([]);

  useEffect(() => {
    const playerIds = players.map((p) => p.connectionId);
    setVisibleTrays((visible) =>
      visible.filter((id) => playerIds.includes(id))
    );
  }, [players]);

  function handleTrayToggle(connectionId: string, shown: boolean) {
    if (shown) {
      setVisibleTrays((visible) =>
        visible.includes(connectionId) ? visible : [...visible, connectionId]
      );
    } else {
      setVisibleTrays((visible) => visible.filter((id) => id !== connectionId));
    }
  }

  function handleTrayOpen(connectionId: string) {
    if (window.BroadcastChannel) {
      OBR.action.open();
      const channel = new BroadcastChannel(getPluginId("focused-tray"));
      channel.postMessage(connectionId);
      channel.close();
    }
  }

  // Hide popover when no trays are visible. When shown, size it to the
  // screen: a small card in the corner, or nearly full width on phones.
  const hidden = visibleTrays.length === 0;
  const [size, setSize] = useState<PopoverTraySize>(COMPACT_SIZE);
  useEffect(() => {
    if (hidden) {
      OBR.popover.setHeight(getPluginId("popover"), 0);
      OBR.popover.setWidth(getPluginId("popover"), 0);
    } else {
      // Checked each time, the screen may have been turned
      Promise.all([OBR.viewport.getWidth(), OBR.viewport.getHeight()]).then(
        ([viewportWidth, viewportHeight]) => {
          const size = getPopoverTraySize(viewportWidth, viewportHeight);
          setSize(size);
          // Height = Tray + Name + Bottom
          OBR.popover.setHeight(
            getPluginId("popover"),
            size.trayHeight + NAME_HEIGHT + MARGIN
          );
          // Width = Tray + Right
          OBR.popover.setWidth(getPluginId("popover"), size.width + MARGIN);
        }
      );
    }
  }, [hidden]);

  return (
    <Box
      component="div"
      position="absolute"
      bottom="0"
      left="0"
      right="0"
      top="0"
      overflow="hidden"
    >
      {players.map((player) => (
        <PopoverTray
          key={player.connectionId}
          player={player}
          onToggle={handleTrayToggle}
          onOpen={handleTrayOpen}
          size={size}
        />
      ))}
    </Box>
  );
}

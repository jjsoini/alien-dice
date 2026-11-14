import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";

import {
  setDeckFromMetadata,
  setDeckUnavailable,
  useCardDeckStore,
} from "../cards/cardDeck";

/** Keep the card deck in sync with the scene and your player */
export function CardDeckSync() {
  useEffect(() => {
    useCardDeckStore.setState({ playerId: OBR.player.id });
    Promise.all([OBR.player.getRole(), OBR.player.getName()]).then(
      ([role, playerName]) => useCardDeckStore.setState({ role, playerName })
    );
    return OBR.player.onChange((player) =>
      useCardDeckStore.setState({
        playerId: player.id,
        role: player.role,
        playerName: player.name,
      })
    );
  }, []);

  useEffect(() => {
    let unsubscribeMetadata: (() => void) | undefined;
    function handleReady(ready: boolean) {
      unsubscribeMetadata?.();
      unsubscribeMetadata = undefined;
      if (ready) {
        OBR.scene.getMetadata().then(setDeckFromMetadata);
        unsubscribeMetadata = OBR.scene.onMetadataChange(setDeckFromMetadata);
      } else {
        setDeckUnavailable();
      }
    }
    OBR.scene.isReady().then(handleReady);
    const unsubscribeReady = OBR.scene.onReadyChange(handleReady);
    return () => {
      unsubscribeReady();
      unsubscribeMetadata?.();
    };
  }, []);

  return null;
}

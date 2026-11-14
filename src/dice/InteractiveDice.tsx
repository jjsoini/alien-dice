import { useCallback, useEffect, useRef, useState } from "react";
import { useSpring, animated, config } from "@react-spring/three";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { Die } from "../types/Die";
import { Dice } from "./Dice";
import { useDiceRollStore } from "./store";
import { DiceVector3 } from "../types/DiceVector3";
import { CARD_HALF_DIAGONAL } from "../cards/cardSize";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const DRAG_HEIGHT = 0.5;
/** Dragged dice follow the pointer at this height, whatever the camera zoom */
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_HEIGHT);
/** Long enough for the pick up / drop springs to settle */
const SPRING_RENDER_MS = 1500;

/** Inner bounds of the tray (see TrayColliders) */
const TRAY_HALF_WIDTH = 0.46;
const TRAY_HALF_DEPTH = 0.96;
/** Margin to keep a die inside the tray */
const DIE_MARGIN = 0.06;
/** Cards can be turned, so keep half of their diagonal inside the tray */
const CARD_MARGIN = CARD_HALF_DIAGONAL;

function clamp(value: number, limit: number) {
  return Math.min(Math.max(value, -limit), limit);
}

/**
 * Dice can be dragged to move them around the tray.
 * Moving a die never rerolls it, its result stays the same.
 */
export function InteractiveDice(
  props: JSX.IntrinsicElements["group"] & {
    die: Die;
  }
) {
  const diceRef = useRef<THREE.Group>(null);
  const [dragAnchor, setDragAnchor] = useState<DiceVector3 | null>(null);

  const { invalidate, camera, size } = useThree();

  const pointerDownPositionRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const dice = diceRef.current;
      if (dice) {
        // Find the initial drag position
        const x = Math.min(Math.max(e.offsetX, 0), size.width);
        const y = Math.min(Math.max(e.offsetY, 0), size.height);
        pointer.x = (x / size.width) * 2 - 1;
        pointer.y = -((y / size.height) * 2 - 1);
        raycaster.setFromCamera(pointer, camera);
        const position = raycaster.ray.intersectPlane(
          dragPlane,
          new THREE.Vector3()
        );
        if (!position) {
          return;
        }
        // Offset the drag anchor so that the x and y animate to the
        // pointer position
        setDragAnchor({
          x: position.x - dice.position.x,
          y: DRAG_HEIGHT,
          z: position.z - dice.position.z,
        });

        pointerDownPositionRef.current = { x: e.offsetX, y: e.offsetY };
      }
    },
    [size.width, size.height]
  );

  const moveDie = useDiceRollStore((state) => state.moveDie);

  useEffect(() => {
    if (dragAnchor) {
      const handleUp = (e: PointerEvent) => {
        setDragAnchor(null);
        const dice = diceRef.current;

        if (dice) {
          const deltaX = Math.abs(pointerDownPositionRef.current.x - e.offsetX);
          const deltaY = Math.abs(pointerDownPositionRef.current.y - e.offsetY);
          const minWidth = Math.max(e.width, 5);
          const minHeight = Math.max(e.height, 5);
          if (deltaX > minWidth || deltaY > minHeight) {
            // Drop the die where it was dragged, keeping it inside the tray
            const margin = props.die.type === "CARD" ? CARD_MARGIN : DIE_MARGIN;
            const x = clamp(dice.position.x, TRAY_HALF_WIDTH - margin);
            const z = clamp(dice.position.z, TRAY_HALF_DEPTH - margin);
            dice.position.set(x, dice.position.y, z);
            moveDie(props.die.id, x, z);
          }
        }
      };

      const handleMove = (e: PointerEvent) => {
        const dice = diceRef.current;
        if (dragAnchor && dice && e.target instanceof HTMLCanvasElement) {
          // Find pointer location in world space
          const x = Math.min(Math.max(e.offsetX, 0), size.width);
          const y = Math.min(Math.max(e.offsetY, 0), size.height);
          pointer.x = (x / size.width) * 2 - 1;
          pointer.y = -((y / size.height) * 2 - 1);
          raycaster.setFromCamera(pointer, camera);
          const position = raycaster.ray.intersectPlane(
            dragPlane,
            new THREE.Vector3()
          );
          if (!position) {
            return;
          }

          // Offset initial anchor position
          const newDiceX = position.x - dragAnchor.x;
          const newDiceZ = position.z - dragAnchor.z;

          dice.position.set(newDiceX, dice.position.y, newDiceZ);
          invalidate();
        }
      };
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointermove", handleMove);

      return () => {
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointermove", handleMove);
      };
    }
  }, [
    dragAnchor,
    camera,
    size.width,
    size.height,
    moveDie,
    props.die.id,
    props.die.type,
    invalidate,
  ]);

  // The tray only renders on demand, and react-spring 9.7 only advances its
  // animations when a frame renders. Keep rendering while the pick up / drop
  // animation plays, or the die stays hanging in the air after a drop.
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      invalidate();
      if (performance.now() - start < SPRING_RENDER_MS) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragAnchor, invalidate]);

  const { position } = useSpring({
    position: (dragAnchor
      ? [dragAnchor.x, dragAnchor.y, dragAnchor.z]
      : [0, 0, 0]) as [number, number, number],
    onChange: () => {
      invalidate();
    },
    // Clamp the drop so the spring doesn't overshoot down through the floor
    config: dragAnchor ? config.wobbly : { ...config.stiff, clamp: true },
  });

  return (
    <animated.group position={position}>
      <Dice onPointerDown={handlePointerDown} ref={diceRef} {...props}></Dice>
    </animated.group>
  );
}

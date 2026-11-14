import { useEffect, useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import create from "zustand";

import { useDiceRollStore } from "../dice/store";
import { DiceTransform } from "../types/DiceTransform";

/** Camera height that shows the whole tray in a 1:2 canvas */
const BASE_HEIGHT = 4.25;
const FOV = 27.7;
const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** Half the floor area the view should cover: the tray and its rim */
const TRAY_HALF_Z = BASE_HEIGHT * TAN_HALF_FOV;
const TRAY_HALF_X = TRAY_HALF_Z / 2;
const MAX_ZOOM = 3;
/** How close `autoFrame` moves in on the dice unless you zoomed closer */
const AUTO_FRAME_ZOOM = 2;
/** Room around the dice when framing them */
const FRAME_MARGIN = 0.15;
/** How quickly the camera eases to its target */
const EASE_SPEED = 10;
const DOUBLE_TAP_MS = 300;
/** Pointer movement in pixels that still counts as a tap */
const TAP_SLOP = 10;
const WHEEL_SPEED = 0.0015;

/**
 * Camera centre on the tray floor and zoom. Zoom 1 fills the canvas with the
 * tray (cropping its ends or sides when the canvas isn't 1:2), less than 1
 * zooms out until the whole tray shows.
 */
type View = { x: number; z: number; zoom: number };

const DEFAULT_VIEW: View = { x: 0, z: 0, zoom: 1 };

interface TrayViewState {
  /** Zoomed or panned away from the default view */
  zoomed: boolean;
  resetCount: number;
  /** Ease back to the default view */
  reset: () => void;
  setZoomed: (zoomed: boolean) => void;
}

export const useTrayViewStore = create<TrayViewState>()((set) => ({
  zoomed: false,
  resetCount: 0,
  reset: () => set((state) => ({ resetCount: state.resetCount + 1 })),
  setZoomed: (zoomed) => set({ zoomed }),
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type RollStatus = "empty" | "rolling" | "done";

function getRollStatus(
  transforms: Record<string, DiceTransform | null>
): RollStatus {
  const values = Object.values(transforms);
  if (values.length === 0) {
    return "empty";
  }
  return values.every(Boolean) ? "done" : "rolling";
}

/**
 * Top down camera for the interactive tray that can be zoomed and panned.
 *
 * - Wheel or pinch to zoom, drag the empty tray to pan.
 * - Double tap / click the empty tray (or `useTrayViewStore.reset`) to go
 *   back to the default view, where the tray fills the canvas.
 * - When zoomed in, a roll eases out to the default view to watch the throw,
 *   then frames the dice where they landed, never closer than the zoom
 *   the player picked.
 */
export function TrayCamera({
  autoFrame = false,
}: {
  /**
   * Move in on the dice after every roll, like the roll popover (phones,
   * where the tray is small). Otherwise only when you've zoomed in yourself.
   */
  autoFrame?: boolean;
}) {
  const autoFrameRef = useRef(autoFrame);
  autoFrameRef.current = autoFrame;
  const { size, invalidate, gl } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const planeRef = useRef<THREE.Mesh>(null);

  // Half the floor depth shown at zoom 1, where the tray fills the canvas.
  // Zooming out to `minZoom` shows the whole tray.
  const aspect = size.width / size.height;
  const coverHalfZ = Math.min(TRAY_HALF_Z, TRAY_HALF_X / aspect);
  const containHalfZ = Math.max(TRAY_HALF_Z, TRAY_HALF_X / aspect);
  const minZoom = coverHalfZ / containHalfZ;
  const viewportRef = useRef({ aspect, coverHalfZ, minZoom, ...size });
  viewportRef.current = { aspect, coverHalfZ, minZoom, ...size };

  const current = useRef<View>({ ...DEFAULT_VIEW });
  const target = useRef<View>({ ...DEFAULT_VIEW });
  /** Zoom the player picked, kept when framing a roll */
  const preferredZoom = useRef(1);
  const setZoomed = useTrayViewStore((state) => state.setZoomed);

  /** Half the floor width and depth the view shows at a zoom */
  function visibleHalf(zoom: number) {
    const { aspect, coverHalfZ } = viewportRef.current;
    const z = coverHalfZ / zoom;
    return { x: z * aspect, z };
  }

  /** Keep the view on the tray, centred where it shows all of it */
  function clampView(view: View): View {
    const zoom = clamp(view.zoom, viewportRef.current.minZoom, MAX_ZOOM);
    const half = visibleHalf(zoom);
    const maxX = Math.max(0, TRAY_HALF_X - half.x);
    const maxZ = Math.max(0, TRAY_HALF_Z - half.z);
    return {
      zoom,
      x: clamp(view.x, -maxX, maxX),
      z: clamp(view.z, -maxZ, maxZ),
    };
  }

  function setTarget(view: View, immediate = false) {
    target.current = clampView(view);
    if (immediate) {
      current.current = { ...target.current };
    }
    const { x, z, zoom } = target.current;
    setZoomed(
      Math.abs(zoom - 1) > 0.01 || Math.abs(x) > 0.01 || Math.abs(z) > 0.01
    );
    invalidate();
  }

  /** Tray floor size of one screen pixel */
  function worldPerPixel(zoom: number) {
    return (2 * visibleHalf(zoom).z) / viewportRef.current.height;
  }

  /** Zoom to `zoom`, keeping the floor under screen point (px, py) in place */
  function zoomAt(view: View, zoom: number, px: number, py: number): View {
    const { width, height } = viewportRef.current;
    const dx = px - width / 2;
    const dy = py - height / 2;
    const before = worldPerPixel(view.zoom);
    const newZoom = clamp(zoom, viewportRef.current.minZoom, MAX_ZOOM);
    const after = worldPerPixel(newZoom);
    return {
      zoom: newZoom,
      x: view.x + dx * (before - after),
      z: view.z + dy * (before - after),
    };
  }

  // Keep the view inside the tray when the canvas resizes
  useEffect(() => {
    setTarget(target.current, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  // Ease the camera to its target, rendering only while it moves
  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }
    const c = current.current;
    const t = target.current;
    // The first frame after idling can have a long delta
    const k = 1 - Math.exp(-Math.min(delta, 1 / 30) * EASE_SPEED);
    c.x += (t.x - c.x) * k;
    c.z += (t.z - c.z) * k;
    c.zoom += (t.zoom - c.zoom) * k;
    const settled =
      Math.abs(t.x - c.x) < 0.0005 &&
      Math.abs(t.z - c.z) < 0.0005 &&
      Math.abs(t.zoom - c.zoom) < 0.0005;
    if (settled) {
      current.current = { ...t };
    } else {
      invalidate();
    }
    const { x, z, zoom } = current.current;
    camera.position.set(x, visibleHalf(zoom).z / TAN_HALF_FOV, z);
  });

  // Reset button
  const resetCount = useTrayViewStore((state) => state.resetCount);
  useEffect(() => {
    if (resetCount > 0) {
      preferredZoom.current = 1;
      setTarget(DEFAULT_VIEW);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCount]);

  // Follow the roll when zoomed in
  useEffect(
    () =>
      useDiceRollStore.subscribe((state, prev) => {
        const status = getRollStatus(state.rollTransforms);
        if (status === getRollStatus(prev.rollTransforms)) {
          return;
        }
        if (status === "rolling") {
          if (target.current.zoom > 1) {
            // Watch the throw on the whole tray
            setTarget(DEFAULT_VIEW);
          }
        } else if (
          status === "done" &&
          (autoFrameRef.current || preferredZoom.current > 1)
        ) {
          const positions = Object.values(state.rollTransforms)
            .filter((t): t is DiceTransform => t !== null)
            .map((t) => t.position);
          const minX = Math.min(...positions.map((p) => p.x));
          const maxX = Math.max(...positions.map((p) => p.x));
          const minZ = Math.min(...positions.map((p) => p.z));
          const maxZ = Math.max(...positions.map((p) => p.z));
          const { aspect, coverHalfZ } = viewportRef.current;
          // Close enough to fit every die, but no closer than picked (or than
          // AUTO_FRAME_ZOOM when auto framing)
          const fit =
            coverHalfZ /
            Math.max(
              (maxZ - minZ) / 2 + FRAME_MARGIN,
              ((maxX - minX) / 2 + FRAME_MARGIN) / aspect
            );
          setTarget({
            x: (minX + maxX) / 2,
            z: (minZ + maxZ) / 2,
            // The default view already shows every die, so never zoom out
            zoom: Math.max(
              1,
              Math.min(
                autoFrameRef.current
                  ? Math.max(preferredZoom.current, AUTO_FRAME_ZOOM)
                  : preferredZoom.current,
                fit
              )
            ),
          });
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Pointers on the empty tray, by pointer id, in canvas pixels
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const tap = useRef({ x: 0, y: 0, moved: false });
  const lastTap = useRef({ x: 0, y: 0, time: 0 });

  function toCanvas(e: { clientX: number; clientY: number }) {
    const rect = gl.domElement.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePlanePointerDown(e: ThreeEvent<PointerEvent>) {
    // A die above the floor takes the pointer to be dragged instead
    if (e.intersections[0]?.eventObject !== planeRef.current) {
      return;
    }
    const point = toCanvas(e.nativeEvent);
    pointers.current.set(e.pointerId, point);
    if (pointers.current.size === 1) {
      tap.current = { ...point, moved: false };
    } else {
      tap.current.moved = true;
    }
  }

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const map = pointers.current;
      const previous = map.get(e.pointerId);
      if (!previous) {
        return;
      }
      const point = toCanvas(e);
      if (
        Math.hypot(point.x - tap.current.x, point.y - tap.current.y) > TAP_SLOP
      ) {
        tap.current.moved = true;
      }
      if (map.size === 1) {
        // Pan: the floor follows the pointer
        const scale = worldPerPixel(target.current.zoom);
        setTarget(
          {
            ...target.current,
            x: target.current.x - (point.x - previous.x) * scale,
            z: target.current.z - (point.y - previous.y) * scale,
          },
          true
        );
      } else if (map.size === 2) {
        // Pinch: zoom around the midpoint, which pans with the fingers
        const other = [...map.entries()].find(([id]) => id !== e.pointerId)![1];
        const before = {
          x: (previous.x + other.x) / 2,
          y: (previous.y + other.y) / 2,
          distance: Math.hypot(previous.x - other.x, previous.y - other.y),
        };
        const after = {
          x: (point.x + other.x) / 2,
          y: (point.y + other.y) / 2,
          distance: Math.hypot(point.x - other.x, point.y - other.y),
        };
        if (before.distance > 0) {
          const view = target.current;
          const zoomed = zoomAt(
            view,
            (view.zoom * after.distance) / before.distance,
            before.x,
            before.y
          );
          const scale = worldPerPixel(zoomed.zoom);
          setTarget(
            {
              ...zoomed,
              x: zoomed.x - (after.x - before.x) * scale,
              z: zoomed.z - (after.y - before.y) * scale,
            },
            true
          );
        }
      }
      map.set(e.pointerId, point);
    };

    const handleUp = (e: PointerEvent) => {
      const map = pointers.current;
      if (!map.has(e.pointerId)) {
        return;
      }
      map.delete(e.pointerId);
      if (map.size > 0) {
        return;
      }
      if (tap.current.moved) {
        preferredZoom.current = target.current.zoom;
      } else if (e.type === "pointerup") {
        // Double tap to see the whole tray
        const now = performance.now();
        const near =
          Math.hypot(
            tap.current.x - lastTap.current.x,
            tap.current.y - lastTap.current.y
          ) <
          TAP_SLOP * 3;
        if (near && now - lastTap.current.time < DOUBLE_TAP_MS) {
          lastTap.current.time = 0;
          preferredZoom.current = 1;
          setTarget(DEFAULT_VIEW);
        } else {
          lastTap.current = { x: tap.current.x, y: tap.current.y, time: now };
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const point = toCanvas(e);
      const view = target.current;
      setTarget(
        zoomAt(
          view,
          view.zoom * Math.exp(-e.deltaY * WHEEL_SPEED),
          point.x,
          point.y
        ),
        true
      );
      preferredZoom.current = target.current.zoom;
    };

    const canvas = gl.domElement;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      canvas.removeEventListener("wheel", handleWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={FOV}
        position={[0, BASE_HEIGHT, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* Invisible floor that catches pointers on the empty tray */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        onPointerDown={handlePlanePointerDown}
      >
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

/**
 * Fixed top down camera that fills the canvas with the tray, whatever the
 * canvas shape (for watching another player's tray on a phone)
 */
export function TrayCoverCamera() {
  const { size } = useThree();
  const aspect = size.width / size.height;
  const halfZ = Math.min(TRAY_HALF_Z, TRAY_HALF_X / aspect);
  return (
    <PerspectiveCamera
      makeDefault
      fov={FOV}
      position={[0, halfZ / TAN_HALF_FOV, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

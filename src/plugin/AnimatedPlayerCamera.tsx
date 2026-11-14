import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import { DiceTransform } from "../types/DiceTransform";

export function AnimatedPlayerCamera({
  rollTransforms,
}: {
  rollTransforms: Record<string, DiceTransform> | undefined;
}) {
  const { invalidate } = useThree();

  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (rollTransforms) {
      const transforms = Object.values(rollTransforms);
      if (transforms.length > 0) {
        const bounds = getBoundingBox(transforms);
        const size = Math.max(bounds.width, bounds.height);
        const x = Math.min(0.8, Math.max(-0.8, bounds.center.x));
        const y = lerp(1, 3, Math.max(Math.min(size, 1), 0));
        const z = Math.min(0.8, Math.max(-0.8, bounds.center.y));
        return [x, y, z];
      } else {
        return [0, 3, 0];
      }
    } else {
      return [0, 3, 0];
    }
  }, [rollTransforms]);

  // Eased towards the target each frame. The canvas only draws on demand,
  // so each frame asks for the next one until the camera is there.
  const group = useRef<THREE.Group>(null);
  const target = useMemo(
    () => new THREE.Vector3(...cameraPosition),
    [cameraPosition]
  );
  useEffect(() => {
    invalidate();
  }, [target, invalidate]);
  useFrame((_, delta) => {
    const position = group.current?.position;
    if (!position) {
      return;
    }
    // A long gap since the last drawn frame shouldn't jump the camera
    const step = Math.min(delta, MAX_STEP);
    position.lerp(target, 1 - Math.exp(-EASE_SPEED * step));
    if (position.distanceTo(target) > SETTLED) {
      invalidate();
    } else {
      position.copy(target);
    }
  });

  return (
    <group ref={group} position={[0, 3, 0]}>
      <PerspectiveCamera makeDefault fov={28} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

/** How quickly the camera eases to its target */
const EASE_SPEED = 3;
/** Longest time step of the ease, in seconds */
const MAX_STEP = 1 / 30;
/** Close enough to stop easing */
const SETTLED = 0.0005;

type BoundingBox = {
  min: { x: number; y: number };
  max: { x: number; y: number };
  width: number;
  height: number;
  center: { x: number; y: number };
};

function getBoundingBox(transforms: DiceTransform[]): BoundingBox {
  let minX = Number.MAX_SAFE_INTEGER;
  let maxX = Number.MIN_SAFE_INTEGER;
  let minZ = Number.MAX_SAFE_INTEGER;
  let maxZ = Number.MIN_SAFE_INTEGER;
  for (let t of transforms) {
    minX = t.position.x < minX ? t.position.x : minX;
    maxX = t.position.x > maxX ? t.position.x : maxX;
    minZ = t.position.z < minZ ? t.position.z : minZ;
    maxZ = t.position.z > maxZ ? t.position.z : maxZ;
  }
  let width = maxX - minX;
  let height = maxZ - minZ;
  let center = { x: (minX + maxX) / 2, y: (minZ + maxZ) / 2 };
  return {
    min: { x: minX, y: minZ },
    max: { x: maxX, y: maxZ },
    width,
    height,
    center,
  };
}

function lerp(from: number, to: number, alpha: number): number {
  return from * (1 - alpha) + to * alpha;
}

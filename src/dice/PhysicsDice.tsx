import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CollisionEnterPayload,
  RigidBody,
  RapierRigidBody,
} from "@react-three/rapier";

import { Die } from "../types/Die";
import { getValueFromDiceGroup } from "../helpers/getValueFromDiceGroup";
import { useFrame, useThree } from "@react-three/fiber";
import { useAudioListener } from "../audio/AudioListenerProvider";
import { getNextBuffer } from "../audio/getAudioBuffer";
import { PhysicalMaterial } from "../types/PhysicalMaterial";
import { getDieWeightClass } from "../helpers/getDieWeightClass";
import { getDieDensity } from "../helpers/getDieDensity";
import { DiceThrow } from "../types/DiceThrow";
import { DiceTransform } from "../types/DiceTransform";
import { DiceCollider } from "../colliders/DiceCollider";
import { CARD_HALF_DIAGONAL } from "../cards/cardSize";

/** Inner bounds of the tray (see TrayColliders) */
const TRAY_HALF_WIDTH = 0.46;
const TRAY_HALF_DEPTH = 0.96;

function clamp(value: number, limit: number) {
  return Math.min(Math.max(value, -limit), limit);
}

/** How much of a throw's turn a card keeps, so cards land roughly upright */
const CARD_TILT = 0.1;

/** Minium linear and angular speed before the dice roll is considered finished */
const MIN_ROLL_FINISHED_SPEED = 0.005;
/** Cool down in MS before dice audio can get played again */
const AUDIO_COOLDOWN = 200;
/** Force stop the physics roll after 5 seconds */
const MAX_ROLL_TIME = 5000;

function magnitude({ x, y, z }: { x: number; y: number; z: number }) {
  return Math.sqrt(x * x + y * y + z * z);
}

type Vector3Array = [number, number, number];

export function PhysicsDice({
  die,
  dieThrow,
  onRollFinished,
  children,
  fixedTransform,
  ...props
}: JSX.IntrinsicElements["group"] & {
  die: Die;
  dieThrow: DiceThrow;
  onRollFinished?: (
    id: string,
    number: number,
    transform: DiceTransform
  ) => void;
  fixedTransform?: DiceTransform;
}) {
  const ref = useRef<THREE.Group>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  // Convert dice throw into THREE values
  const [position] = useState<Vector3Array>(() => {
    const p = fixedTransform ? fixedTransform.position : dieThrow.position;
    if (die.type === "CARD" && !fixedTransform) {
      // Start the card fully inside the tray walls, whatever its angle
      const margin = CARD_HALF_DIAGONAL + 0.02;
      return [
        clamp(p.x, TRAY_HALF_WIDTH - margin),
        p.y,
        clamp(p.z, TRAY_HALF_DEPTH - margin),
      ];
    }
    return [p.x, p.y, p.z];
  });

  /** Cards fall flat and face up: they only spin around the vertical axis */
  const isCard = die.type === "CARD";

  const [rotation] = useState<Vector3Array>(() => {
    const r = fixedTransform ? fixedTransform.rotation : dieThrow.rotation;
    const quaternion = new THREE.Quaternion(r.x, r.y, r.z, r.w);
    if (isCard && !fixedTransform) {
      const euler = new THREE.Euler().setFromQuaternion(quaternion, "YXZ");
      // Land roughly upright so the number reads the right way up
      // (euler.y is -π..π, so this is a tilt of up to ±0.3 rad)
      return [0, euler.y * CARD_TILT, 0];
    }
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return [euler.x, euler.y, euler.z];
  });

  const [linearVelocity] = useState<Vector3Array>(() => {
    const v = fixedTransform ? { x: 0, y: 0, z: 0 } : dieThrow.linearVelocity;
    return [v.x, v.y, v.z];
  });

  const [angularVelocity] = useState<Vector3Array>(() => {
    const v = fixedTransform ? { x: 0, y: 0, z: 0 } : dieThrow.angularVelocity;
    return isCard ? [0, v.y * CARD_TILT, 0] : [v.x, v.y, v.z];
  });

  const lockedRef = useRef(false);
  const lockDice = useCallback(() => {
    const rigidBody = rigidBodyRef.current;
    if (rigidBody) {
      // Disable rigid body rotation and translation
      // This stops the dice from getting changed after it has finished rolling
      rigidBody.setEnabledRotations(false, false, false, false);
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, false);
      rigidBody.setEnabledTranslations(false, false, false, false);
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, false);
      lockedRef.current = true;
    }
  }, []);

  const checkRollFinished = useCallback(
    (ignorePhysics?: boolean) => {
      const rigidBody = rigidBodyRef.current;
      const group = ref.current;
      if (rigidBody && !lockedRef.current && group) {
        // Get the total speed for the dice
        const linVel = rigidBody.linvel();
        const angVel = rigidBody.angvel();
        const speed = magnitude(linVel) + magnitude(angVel);
        // Ensure that the dice is in the tray
        const validPosition = rigidBody.translation().y < 1.5;
        if (
          ignorePhysics ||
          (speed < MIN_ROLL_FINISHED_SPEED && validPosition)
        ) {
          // A card's value was drawn when the roll started
          const value =
            die.type === "CARD" ? die.card || 0 : getValueFromDiceGroup(group);
          const position = rigidBody.translation();
          const rotation = rigidBody.rotation();
          const transform = {
            position: { x: position.x, y: position.y, z: position.z },
            rotation: {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
              w: rotation.w,
            },
          };
          onRollFinished?.(die.id, value, transform);
          lockDice();
        }
      }
    },
    [die.id, die.type, die.card, lockDice]
  );

  const handleFrame = useCallback(() => {
    checkRollFinished();
  }, [checkRollFinished]);
  useFrame(handleFrame);

  // Lock the dice when we have a manual transform
  useEffect(() => {
    if (fixedTransform) {
      lockDice();
    }
  }, [fixedTransform]);

  // Stop the roll if over the max roll time
  useEffect(() => {
    let timeout = setTimeout(() => {
      if (!lockedRef.current) {
        console.warn("Roll exceeded max roll time: stopping dice");
        checkRollFinished(true);
      }
    }, MAX_ROLL_TIME);

    return () => {
      clearTimeout(timeout);
    };
  }, [checkRollFinished]);

  const listener = useAudioListener();
  const lastAudioTimeRef = useRef(0);
  const handleCollision = useCallback(
    ({ rigidBodyObject }: CollisionEnterPayload) => {
      // Dice sounds don't fit cards
      if (isCard) {
        return;
      }
      if (performance.now() - lastAudioTimeRef.current < AUDIO_COOLDOWN) {
        return;
      }
      const group = ref.current;
      // TODO: remove conditional when this gets merged https://github.com/pmndrs/react-three-rapier/pull/151/commits
      const physicalMaterial: PhysicalMaterial =
        rigidBodyObject?.userData?.material || "LEATHER";
      const linvel = rigidBodyRef.current?.linvel();
      if (group && physicalMaterial && linvel) {
        const speed = magnitude(linvel);
        const weightClass = getDieWeightClass(die);
        const buffer = getNextBuffer(weightClass, physicalMaterial);
        if (buffer && listener) {
          const sound = new THREE.PositionalAudio(listener);
          sound.setBuffer(buffer);
          sound.setRefDistance(3);
          sound.play();
          // Modulate sound volume based off of the speed of the colliding dice
          sound.setVolume(Math.min(speed / 5, 1));
          sound.onEnded = () => {
            group.remove(sound);
          };
          group.add(sound);
          lastAudioTimeRef.current = performance.now();
        }
      }
    },
    []
  );

  const userData = useMemo(
    () => ({ material: "DICE", dieId: die.id }),
    [die.id]
  );

  return (
    <RigidBody
      // Increase gravity on the dice to offset the non-standard dice size.
      // Dice are around 10x larger then they should be to account for
      // physics errors when shown at proper size. Alien's dice are smaller
      // than the cards and tuned lighter.
      gravityScale={isCard ? 2 : 1.7}
      density={getDieDensity(die)}
      friction={isCard ? 0.6 : 0.075}
      {...(isCard
        ? {
            // No turning at all: cards keep their small starting tilt, so
            // the numbers stay readable when cards bump into each other
            enabledRotations: [false, false, false] as [
              boolean,
              boolean,
              boolean,
            ],
            ccd: true,
          }
        : {})}
      position={position}
      rotation={rotation}
      linearVelocity={linearVelocity}
      angularVelocity={angularVelocity}
      ref={rigidBodyRef}
      onCollisionEnter={handleCollision}
      userData={userData}
    >
      <group ref={ref} {...props}>
        <DiceCollider diceType={die.type} />
        {isCard && !fixedTransform ? <FlipIn>{children}</FlipIn> : children}
      </group>
    </RigidBody>
  );
}

/** How long a thrown card takes to turn face up (seconds) */
const CARD_FLIP_TIME = 0.45;

/** Cards flipped within this time (ms) share one flip sound */
const FLIP_SOUND_COOLDOWN = 300;
let lastFlipSoundTime = -Infinity;

/**
 * Turn a thrown card from face down to face up as it falls.
 * Only visual: the card's physics body always lies face up.
 */
function FlipIn({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const { invalidate } = useThree();

  // One flip sound per draw, however many cards are flipped
  const listener = useAudioListener();
  useEffect(() => {
    const group = ref.current;
    const now = performance.now();
    if (now - lastFlipSoundTime < FLIP_SOUND_COOLDOWN) {
      return;
    }
    const buffer = getNextBuffer("MEDIUM", "CARD");
    if (!group || !buffer || !listener) {
      return;
    }
    lastFlipSoundTime = now;
    const sound = new THREE.PositionalAudio(listener);
    sound.setBuffer(buffer);
    sound.setRefDistance(3);
    sound.setVolume(0.5);
    sound.onEnded = () => {
      group.remove(sound);
    };
    group.add(sound);
    sound.play();
  }, [listener]);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group || timeRef.current >= CARD_FLIP_TIME) {
      return;
    }
    timeRef.current = Math.min(timeRef.current + delta, CARD_FLIP_TIME);
    const t = timeRef.current / CARD_FLIP_TIME;
    // Ease out so the card settles as it turns over
    const eased = 1 - Math.pow(1 - t, 3);
    group.rotation.z = Math.PI * (1 - eased);
    invalidate();
  });
  return (
    <group ref={ref} rotation={[0, 0, Math.PI]}>
      {children}
    </group>
  );
}

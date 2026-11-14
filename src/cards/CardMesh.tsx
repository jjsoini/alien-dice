import React, { Suspense, useLayoutEffect } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

import {
  cardBackImages,
  getCardBackImage,
  getCardImage,
} from "./cardImages";
import {
  CARD_CORNER_RADIUS,
  CARD_HEIGHT,
  CARD_THICKNESS,
  CARD_WIDTH,
} from "./cardSize";

const EDGE_COLOR = "#e9e2d0";
/** Lift the faces off the edge geometry so they don't z-fight with it */
const FACE_OFFSET = CARD_THICKNESS / 2 + 0.0004;

function createCardShape() {
  const w = CARD_WIDTH / 2;
  const h = CARD_HEIGHT / 2;
  const r = CARD_CORNER_RADIUS;
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

const cardShape = createCardShape();

/** A rounded rectangle with UVs covering the whole card image */
const faceGeometry = (() => {
  const geometry = new THREE.ShapeGeometry(cardShape, 6);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    uv.setXY(
      i,
      (position.getX(i) + CARD_WIDTH / 2) / CARD_WIDTH,
      (position.getY(i) + CARD_HEIGHT / 2) / CARD_HEIGHT
    );
  }
  uv.needsUpdate = true;
  return geometry;
})();

/** The paper edge of the card, lying flat */
const edgeGeometry = (() => {
  const geometry = new THREE.ExtrudeGeometry(cardShape, {
    depth: CARD_THICKNESS,
    bevelEnabled: false,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -CARD_THICKNESS / 2);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
})();

function setupTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
}

function CardFace({ image, back }: { image: string; back?: boolean }) {
  const texture = useTexture(image);
  useLayoutEffect(() => {
    setupTexture(texture);
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <mesh
      geometry={faceGeometry}
      // The face looks up, the back looks down. When the card is flipped
      // over (rotated around x) the back image reads upright.
      rotation={[back ? Math.PI / 2 : -Math.PI / 2, 0, 0]}
      position={[0, back ? -FACE_OFFSET : FACE_OFFSET, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial map={texture} roughness={0.6} metalness={0} />
    </mesh>
  );
}

type CardMeshProps = JSX.IntrinsicElements["group"] & {
  /** The card value (1-52), the face is left blank without one */
  card?: number;
};

/** A playing card lying face up, flip it over to show the back */
export const CardMesh = React.forwardRef<THREE.Group, CardMeshProps>(
  ({ card, children, ...props }, ref) => {
    const faceImage = card !== undefined ? getCardImage(card) : undefined;
    return (
      <group ref={ref} {...props}>
        <group name="card">
          <mesh geometry={edgeGeometry} castShadow receiveShadow>
            <meshStandardMaterial color={EDGE_COLOR} roughness={0.8} />
          </mesh>
          {/* Show the plain edge colour until the image has loaded */}
          <Suspense fallback={null}>
            {faceImage && <CardFace image={faceImage} />}
          </Suspense>
          <Suspense fallback={null}>
            <CardFace image={getCardBackImage(card)} back />
          </Suspense>
        </group>
        {children}
      </group>
    );
  }
);

// A back is on every card, so load them up front
for (const image of cardBackImages) {
  useTexture.preload(image);
}

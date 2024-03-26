/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import React from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";

import glb from "./d6.glb";

type GLTFResult = GLTF & {
  nodes: {
    d6: THREE.Mesh;
  };
  materials: {};
};

export const D6 = React.forwardRef<THREE.Group, JSX.IntrinsicElements["group"]>(
  ({ children, ...props }, ref) => {
    const { nodes } = useGLTF(glb) as unknown as GLTFResult;
    return (
      <group ref={ref} {...props} scale={0.08} dispose={null}>
        <group name="dice">
          <mesh name="d6" castShadow receiveShadow geometry={nodes.d6.geometry}>
            {children}
            <group
              name="006_locator_1"
              position={[0, -0.77, 0]}
              rotation={[Math.PI, -1.57, 0]}
            />
            <group
              name="006_locator_2"
              position={[-0.77, 0, 0]}
              rotation={[-Math.PI, 0, Math.PI / 2]}
            />
            <group
              name="006_locator_3"
              position={[0, 0, 0.77]}
              rotation={[Math.PI / 2, -1.57, 0]}
            />
            <group
              name="006_locator_4"
              position={[0, 0, -0.77]}
              rotation={[-Math.PI / 2, Math.PI / 2, 0]}
            />
            <group
              name="006_locator_5"
              position={[0.77, 0, 0]}
              rotation={[0, 0, -Math.PI / 2]}
            />
            <group name="006_locator_6" position={[0, 0.77, 0]} />
          </mesh>
        </group>
      </group>
    );
  }
);

useGLTF.preload(glb);
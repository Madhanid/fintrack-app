"use client";
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

function AnimatedSphere() {
  const sphereRef = useRef<any>();

  useFrame((state) => {
    const { clock } = state;
    if (sphereRef.current) {
      sphereRef.current.rotation.x = clock.getElapsedTime() * 0.2;
      sphereRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={sphereRef} args={[1, 100, 200]} scale={2}>
        <MeshDistortMaterial
          color="#ff007f"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0}
          emissive="#33001a"
        />
      </Sphere>
    </Float>
  );
}

const ThreeBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#050505]">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ff007f" />
        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} color="#ff007f" />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
};

export default ThreeBackground;

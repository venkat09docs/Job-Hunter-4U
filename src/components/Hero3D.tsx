import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import { Suspense } from 'react';

const AnimatedSphere = () => {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1, 100, 200]} scale={1.2}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.4}
        />
      </Sphere>
    </Float>
  );
};

const Hero3D = () => {
  try {
    return (
      <div className="w-32 h-32 md:w-40 md:h-40">
        <Canvas>
          <Suspense fallback={<div className="w-full h-full bg-primary/20 rounded-full animate-pulse" />}>
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 5]} intensity={1} />
            <AnimatedSphere />
          </Suspense>
        </Canvas>
      </div>
    );
  } catch (error) {
    // Fallback to a simple animated div if 3D fails
    return (
      <div className="w-32 h-32 md:w-40 md:h-40">
        <div className="w-full h-full bg-gradient-primary rounded-full animate-pulse" />
      </div>
    );
  }
};

export default Hero3D;
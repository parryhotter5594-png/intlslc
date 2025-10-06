import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Printer, PrintEstimates } from '../types';
import { InfoIcon, LoadingIcon } from './IconComponents';

interface ViewerPanelProps {
  file: File;
  printer: Printer;
  estimates: PrintEstimates;
  aiReasoning: string;
  isEstimating: boolean;
  mesh: THREE.Mesh;
}

const InfoCard: React.FC<{ title: string; value: string; subValue?: string; isLoading?: boolean }> = ({ title, value, subValue, isLoading }) => (
    <div className="bg-dark/50 p-4 rounded-lg text-center relative overflow-hidden">
        <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-xl font-bold text-primary">{value}</p>
            {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
        </div>
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
                <LoadingIcon className="w-6 h-6 text-primary" />
            </div>
        )}
    </div>
);

export const ViewerPanel: React.FC<ViewerPanelProps> = ({ file, printer, estimates, aiReasoning, isEstimating, mesh }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || !mesh) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 150;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-50, 50, -50);
    scene.add(directionalLight2);

    // Add mesh to scene
    scene.add(mesh);
    
    // Fit camera to object
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // zoom out a bit
    camera.position.z = center.z + cameraZ;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
    

    // Handle Resize
    const handleResize = () => {
        if (!currentMount) return;
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(currentMount);


    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    };
  }, [mesh]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow bg-dark/70 rounded-lg flex flex-col p-1 mb-4">
        <div ref={mountRef} className="w-full h-full flex-grow relative rounded-md overflow-hidden">
          {/* 3D Viewer will be mounted here */}
        </div>
        <div className="text-center p-2">
            <p className="font-semibold text-light truncate">{file.name}</p>
            <p className="text-sm text-gray-400">{printer.name}</p>
        </div>
      </div>

      <div className="bg-dark/50 border border-primary/20 p-3 rounded-lg flex items-start mb-4">
        <InfoIcon className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
        <div>
            <p className="font-semibold text-primary">AI Recommendation</p>
            <p className="text-sm text-gray-300">{aiReasoning}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Est. Print Time" value={estimates.printTime} isLoading={isEstimating}/>
        <InfoCard title="Est. Material Usage" value={estimates.materialUsage.split('/')[0].trim()} subValue={estimates.materialUsage.split('/')[1]?.trim()} isLoading={isEstimating} />
      </div>
    </div>
  );
};

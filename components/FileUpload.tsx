import React, { useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import type { MeshStatus } from '../types';
import { UploadIcon, CheckCircleIcon, ExclamationTriangleIcon, LoadingIcon } from './IconComponents';

interface FileUploadProps {
  onFileSelect: (file: File, mesh: THREE.Mesh, status: MeshStatus) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<MeshStatus>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleValidation = (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('Validating');

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const contents = event.target?.result as ArrayBuffer;
            if (!contents) {
              throw new Error("File content is empty.");
            }

            const loader = new STLLoader();
            const geometry = loader.parse(contents);
            geometry.center();

            const material = new THREE.MeshStandardMaterial({
              color: 0x00bcd4,
              metalness: 0.3,
              roughness: 0.6,
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            setStatus('Valid');
            onFileSelect(selectedFile, mesh, 'Valid');

        } catch (error) {
            console.error("Mesh validation/parsing error:", error);
            setStatus('Invalid');
            // We won't call onFileSelect with a mesh if it's invalid
        }
    };
    reader.onerror = () => {
        console.error("Error reading file.");
        setStatus('Invalid');
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleValidation(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidation(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const getStatusContent = () => {
    switch (status) {
      case 'Validating':
        return <div className="flex items-center text-primary"><LoadingIcon className="w-6 h-6 mr-2" /> Parsing & Validating mesh...</div>;
      case 'Valid':
        return <div className="flex items-center text-green-400"><CheckCircleIcon className="w-6 h-6 mr-2" /> Mesh successfully loaded.</div>;
      case 'Invalid':
        return <div className="flex items-center text-red-400"><ExclamationTriangleIcon className="w-6 h-6 mr-2" /> Error: Could not parse the provided 3D model file.</div>;
      default:
        return null;
    }
  };

  return (
    <div className={`p-6 bg-secondary rounded-lg shadow-lg transition-all duration-300 ${disabled ? 'opacity-50' : ''}`}>
      <h2 className="text-xl font-semibold text-light mb-4 flex items-center">
        <span className="bg-primary text-dark rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">1</span>
        Upload 3D Model
      </h2>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors duration-300
          ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary'}
          ${file ? 'border-primary' : ''}
        `}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" className="hidden" accept=".stl" onChange={handleFileChange} disabled={disabled} />
        <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-light">
          {file ? file.name : 'Drag & drop your STL file here'}
        </p>
        <p className="text-sm text-gray-400">
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse'}
        </p>
      </div>
      {status && <div className="mt-4 text-center font-medium">{getStatusContent()}</div>}
    </div>
  );
};
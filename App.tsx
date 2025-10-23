
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { PrinterSelection } from './components/PrinterSelection';
import { AIPrompt } from './components/AIPrompt';
import { SettingsPanel } from './components/SettingsPanel';
import { ViewerPanel } from './components/ViewerPanel';
import type { MeshStatus, Printer, SlicerSettings, PrintEstimates, GeminiResponse } from './types';
import { getSlicerSettingsFromPrompt, getUpdatedEstimates } from './services/geminiService';
import { generate3mfProject } from './services/fileGenerator';
import { PRINTERS } from './constants';
import type { Mesh } from 'three';

// Debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: F extends (...args: infer P) => any ? P : never): Promise<ReturnType<F>> => {
    return new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
};


function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mesh, setMesh] = useState<Mesh | null>(null);
  const [meshStatus, setMeshStatus] = useState<MeshStatus>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);
  
  const [slicerSettings, setSlicerSettings] = useState<SlicerSettings | null>(null);
  const [printEstimates, setPrintEstimates] = useState<PrintEstimates | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>('');

  const handleFileSelect = (file: File, threeMesh: Mesh, status: MeshStatus) => {
    setUploadedFile(file);
    setMesh(threeMesh);
    setMeshStatus(status);
    if (status === 'Valid') {
      setCurrentStep(2);
    }
  };

  const handlePrinterSelect = (printerId: string) => {
    const printer = PRINTERS.find(p => p.id === printerId) || null;
    setSelectedPrinter(printer);
    if (printer) {
      setCurrentStep(3);
    }
  };

  const handlePromptSubmit = async (userPrompt: string) => {
    if (!selectedPrinter) return;
    setIsLoading(true);
    setPrompt(userPrompt);
    try {
      const response: GeminiResponse = await getSlicerSettingsFromPrompt(userPrompt, selectedPrinter.name);
      setSlicerSettings(response.settings);
      setPrintEstimates(response.estimates);
      setAiReasoning(response.reasoning);
      setCurrentStep(4);
    } catch (error) {
      console.error("Failed to get slicer settings", error);
      // Here you could set an error state and display a message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedEstimateUpdate = useCallback(
    debounce(async (settings: SlicerSettings, currentPrompt: string, printer: Printer) => {
      try {
        const newEstimates = await getUpdatedEstimates(settings, currentPrompt, printer.name);
        setPrintEstimates(newEstimates);
      } catch (error) {
        console.error("Failed to update estimates", error);
      } finally {
        setIsEstimating(false);
      }
    }, 1000),
    []
  );

  const handleSettingsChange = (newSettings: SlicerSettings) => {
    setSlicerSettings(newSettings);
    if (prompt && selectedPrinter) {
      setIsEstimating(true);
      debouncedEstimateUpdate(newSettings, prompt, selectedPrinter);
    }
  };

  const handleDownloadProject = async () => {
    if (!slicerSettings || !selectedPrinter || !uploadedFile) {
      alert("Cannot generate project. Missing model, settings, or printer.");
      return;
    }

    setIsGeneratingProject(true);
    try {
      const projectBlob = await generate3mfProject(uploadedFile, slicerSettings);
      
      const link = document.createElement('a');
      const profileName = uploadedFile.name.split('.').slice(0, -1).join('.') || 'project';
      link.href = URL.createObjectURL(projectBlob);
      link.download = `${profileName}_IntelliSlice.3mf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to generate .3mf file", error);
      alert("An error occurred while generating the project file.");
    } finally {
        setIsGeneratingProject(false);
    }
  };
  
  const renderMainContent = () => {
    if (currentStep < 4 || !uploadedFile || !selectedPrinter || !slicerSettings || !printEstimates || !mesh) {
       return (
        <div className="grid grid-cols-1 gap-6">
          <FileUpload onFileSelect={handleFileSelect} disabled={currentStep > 1} />
          <PrinterSelection 
            onPrinterSelect={handlePrinterSelect} 
            selectedPrinter={selectedPrinter}
            disabled={currentStep < 2 || currentStep > 2} 
          />
          <AIPrompt onSubmit={handlePromptSubmit} isLoading={isLoading} disabled={currentStep < 3} />
        </div>
       );
    }
    
    return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-2 h-[60vh] lg:h-auto">
            <SettingsPanel 
              settings={slicerSettings} 
              onSettingsChange={handleSettingsChange}
              onDownloadProject={handleDownloadProject}
              isGenerating={isGeneratingProject}
            />
          </div>
          <div className="h-[70vh] lg:h-auto">
            <ViewerPanel 
              file={uploadedFile} 
              printer={selectedPrinter} 
              estimates={printEstimates}
              aiReasoning={aiReasoning}
              isEstimating={isEstimating}
              mesh={mesh}
            />
          </div>
        </div>
    );
  }

  return (
    <div className="bg-dark min-h-screen font-sans text-light">
      <Header />
      <main className="p-6">
        {renderMainContent()}
      </main>
    </div>
  );
}

export default App;

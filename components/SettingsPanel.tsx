import React, { useState, Fragment } from 'react';
import type { SlicerSettings } from '../types';
import { RefreshIcon, LoadingIcon } from './IconComponents';

type SettingCategory = 'Quality' | 'Walls' | 'Infill' | 'Supports' | 'Speed' | 'Bed Adhesion' | 'Advanced' | 'Filament' | 'Cooling' | 'Printer';

interface SettingInputProps {
  id: keyof SlicerSettings;
  label: string;
  value: any;
  onChange: (id: keyof SlicerSettings, value: any) => void;
  type?: 'number' | 'text' | 'checkbox' | 'select';
  options?: readonly string[];
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
}

const NumberInput: React.FC<SettingInputProps> = ({ id, label, value, onChange, unit, step = 0.01, min = 0 }) => (
    <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-gray-300">{label}</label>
        <div className="flex items-center">
            <input
                type="number"
                id={id}
                name={id}
                value={value}
                onChange={(e) => onChange(id, parseFloat(e.target.value))}
                min={min}
                step={step}
                className="w-24 bg-dark/70 border border-gray-600 rounded-md p-1 text-right text-light focus:ring-primary focus:border-primary"
            />
            {unit && <span className="ml-2 text-sm text-gray-400 w-6 text-left">{unit}</span>}
        </div>
    </div>
);

const CheckboxInput: React.FC<SettingInputProps> = ({ id, label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-gray-300">{label}</label>
        <input
            type="checkbox"
            id={id}
            name={id}
            checked={value}
            onChange={(e) => onChange(id, e.target.checked)}
            className="w-5 h-5 bg-dark/70 border-gray-600 rounded text-primary focus:ring-primary"
        />
    </div>
);

const SelectInput: React.FC<SettingInputProps> = ({ id, label, value, onChange, options = [] }) => (
    <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-gray-300">{label}</label>
        <select
            id={id}
            name={id}
            value={value}
            onChange={(e) => onChange(id, e.target.value)}
            className="w-40 bg-dark/70 border border-gray-600 rounded-md p-1 text-light focus:ring-primary focus:border-primary"
        >
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </div>
);


const CategorySection: React.FC<{ title: SettingCategory, children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(title === 'Quality'); // Default open Quality
    return (
        <div className="border-b border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-3 bg-dark/30 hover:bg-dark/60"
            >
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-primary">{title}</h3>
                    <svg className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            {isOpen && (
                <div className="p-4 space-y-3 bg-secondary/50">
                    {children}
                </div>
            )}
        </div>
    )
}

interface SettingsPanelProps {
  settings: SlicerSettings;
  onSettingsChange: (newSettings: SlicerSettings) => void;
  onDownloadProject: () => void;
  isGenerating: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, onDownloadProject, isGenerating }) => {

  const handleChange = (id: keyof SlicerSettings, value: any) => {
    onSettingsChange({ ...settings, [id]: value });
  };
  
  const settingProps = (id: keyof SlicerSettings, label: string): Omit<SettingInputProps, 'value' | 'onChange' > => ({
    id,
    label,
  });

  return (
    <div className="bg-secondary rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-light">Slicer Settings</h2>
        <button 
          onClick={onDownloadProject}
          disabled={isGenerating}
          className="bg-primary text-dark font-bold py-2 px-4 rounded-lg hover:bg-teal-300 transition-colors flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <LoadingIcon className="w-5 h-5 mr-2" />
              <span>Generating...</span>
            </>
          ) : (
             <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Download Project (.3mf)</span>
             </>
          )}

        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        <CategorySection title="Quality">
            <NumberInput {...settingProps('layerHeight', 'Layer Height')} value={settings.layerHeight} onChange={handleChange} unit="mm" step={0.01} />
            <NumberInput {...settingProps('firstLayerHeight', 'Initial Layer Height')} value={settings.firstLayerHeight} onChange={handleChange} unit="mm" step={0.01} />
            <NumberInput {...settingProps('lineWidth', 'Line Width')} value={settings.lineWidth} onChange={handleChange} unit="mm" step={0.01} />
            <NumberInput {...settingProps('firstLayerLineWidth', 'Initial Layer Line Width')} value={settings.firstLayerLineWidth} onChange={handleChange} unit="mm" step={0.01} />
            <CheckboxInput {...settingProps('variableLayerHeight', 'Use Adaptive Layers')} value={settings.variableLayerHeight} onChange={handleChange} />
        </CategorySection>

         <CategorySection title="Walls">
            <NumberInput type="number" {...settingProps('wallLoops', 'Wall Line Count')} value={settings.wallLoops} onChange={handleChange} unit="" step={1}/>
            <NumberInput type="number" {...settingProps('topShellLayers', 'Top Layers')} value={settings.topShellLayers} onChange={handleChange} unit="" step={1}/>
            <NumberInput type="number" {...settingProps('topShellThickness', 'Top Thickness')} value={settings.topShellThickness} onChange={handleChange} unit="mm" step={0.1}/>
            <NumberInput type="number" {...settingProps('bottomShellLayers', 'Bottom Layers')} value={settings.bottomShellLayers} onChange={handleChange} unit="" step={1}/>
            <NumberInput type="number" {...settingProps('bottomShellThickness', 'Bottom Thickness')} value={settings.bottomShellThickness} onChange={handleChange} unit="mm" step={0.1}/>
            <CheckboxInput {...settingProps('ensureVerticalShellThickness', 'Fill Gaps Between Walls')} value={settings.ensureVerticalShellThickness} onChange={handleChange} />
            <SelectInput {...settingProps('fuzzySkin', 'Fuzzy Skin')} value={settings.fuzzySkin} onChange={handleChange} options={['None', 'Outer', 'All']} />
        </CategorySection>

         <CategorySection title="Infill">
            <NumberInput type="number" {...settingProps('infillDensity', 'Infill Density')} value={settings.infillDensity} onChange={handleChange} unit="%" step={1} min={0} max={100}/>
            <SelectInput {...settingProps('infillPattern', 'Infill Pattern')} value={settings.infillPattern} onChange={handleChange} options={['Grid', 'Gyroid', 'Cubic', 'Lines', 'Triangles', 'Honeycomb', 'CubicSubdivision', 'SupportCubic']} />
            <NumberInput type="number" {...settingProps('infillDirection', 'Infill Line Directions')} value={settings.infillDirection} onChange={handleChange} unit="°" step={1}/>
            <NumberInput type="number" {...settingProps('infillWallOverlap', 'Infill Overlap Percentage')} value={settings.infillWallOverlap} onChange={handleChange} unit="%" step={1}/>
            <NumberInput type="number" {...settingProps('minimumInfillArea', 'Minimum Infill Area')} value={settings.minimumInfillArea} onChange={handleChange} unit="mm²" step={1}/>
        </CategorySection>

        <CategorySection title="Supports">
            <CheckboxInput {...settingProps('enableSupports', 'Generate Support')} value={settings.enableSupports} onChange={handleChange} />
            <SelectInput {...settingProps('supportType', 'Support Structure')} value={settings.supportType} onChange={handleChange} options={['None', 'Normal', 'Tree']} />
            <CheckboxInput {...settingProps('supportOnBuildPlateOnly', 'Supports on Build Plate Only')} value={settings.supportOnBuildPlateOnly} onChange={handleChange} />
            <NumberInput type="number" {...settingProps('supportOverhangAngle', 'Support Overhang Angle')} value={settings.supportOverhangAngle} onChange={handleChange} unit="°" step={1}/>
            <NumberInput type="number" {...settingProps('supportTopZDistance', 'Support Z Distance')} value={settings.supportTopZDistance} onChange={handleChange} unit="mm" step={0.05}/>
            <NumberInput type="number" {...settingProps('supportBottomZDistance', 'Support Bottom Distance')} value={settings.supportBottomZDistance} onChange={handleChange} unit="mm" step={0.05}/>
            <NumberInput type="number" {...settingProps('supportObjectXYDistance', 'Support XY Distance')} value={settings.supportObjectXYDistance} onChange={handleChange} unit="mm" step={0.1}/>
            <NumberInput type="number" {...settingProps('raftLayers', 'Raft Layers')} value={settings.raftLayers} onChange={handleChange} unit="" step={1}/>
        </CategorySection>

        <CategorySection title="Speed">
            <NumberInput type="number" {...settingProps('firstLayerSpeed', 'Initial Layer Speed')} value={settings.firstLayerSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('outerWallSpeed', 'Outer Wall Speed')} value={settings.outerWallSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('innerWallSpeed', 'Inner Wall Speed')} value={settings.innerWallSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('sparseInfillSpeed', 'Infill Speed')} value={settings.sparseInfillSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('solidInfillSpeed', 'Top/Bottom Speed')} value={settings.solidInfillSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('topSurfaceSpeed', 'Top Surface Skin Speed')} value={settings.topSurfaceSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('supportSpeed', 'Support Speed')} value={settings.supportSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('travelSpeed', 'Travel Speed')} value={settings.travelSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('acceleration', 'Print Acceleration')} value={settings.acceleration} onChange={handleChange} unit="mm/s²" step={100}/>
            <NumberInput type="number" {...settingProps('minPrintSpeed', 'Minimum Speed')} value={settings.minPrintSpeed} onChange={handleChange} unit="mm/s" step={1}/>
        </CategorySection>
        
        <CategorySection title="Bed Adhesion">
           <SelectInput {...settingProps('brimType', 'Brim Type')} value={settings.brimType} onChange={handleChange} options={['none', 'outer_brim', 'inner_brim', 'outer_and_inner_brim']} />
           <NumberInput type="number" {...settingProps('elephantFootCompensation', 'Elephant Foot Compensation')} value={settings.elephantFootCompensation} onChange={handleChange} unit="mm" step={0.01}/>
        </CategorySection>
        
        <CategorySection title="Advanced">
            <SelectInput {...settingProps('seamPosition', 'Z Seam Alignment')} value={settings.seamPosition} onChange={handleChange} options={['Nearest', 'Random', 'Back', 'Aligned']} />
            <CheckboxInput {...settingProps('sequentialPrinting', 'Print Sequence')} value={settings.sequentialPrinting} onChange={handleChange} />
            <NumberInput type="number" {...settingProps('retractionLength', 'Retraction Distance')} value={settings.retractionLength} onChange={handleChange} unit="mm" step={0.1}/>
            <NumberInput type="number" {...settingProps('retractionSpeed', 'Retraction Speed')} value={settings.retractionSpeed} onChange={handleChange} unit="mm/s" step={1}/>
            <NumberInput type="number" {...settingProps('zHopWhenRetracted', 'Z Hop Height')} value={settings.zHopWhenRetracted} onChange={handleChange} unit="mm" step={0.1}/>
            <NumberInput type="number" {...settingProps('maxVolumetricSpeed', 'Maximum Volumetric Speed')} value={settings.maxVolumetricSpeed} onChange={handleChange} unit="mm³/s" step={1}/>
        </CategorySection>

        <CategorySection title="Filament">
            <SelectInput {...settingProps('filamentType', 'Material Type')} value={settings.filamentType} onChange={handleChange} options={['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Other']} />
            <NumberInput type="number" {...settingProps('filamentDiameter', 'Diameter')} value={settings.filamentDiameter} onChange={handleChange} unit="mm" step={0.01}/>
            <NumberInput type="number" {...settingProps('flowRatio', 'Flow Ratio')} value={settings.flowRatio} onChange={handleChange} unit="" step={0.01}/>
            <NumberInput type="number" {...settingProps('nozzleTemp', 'Printing Temperature')} value={settings.nozzleTemp} onChange={handleChange} unit="°C" step={1}/>
            <NumberInput type="number" {...settingProps('firstLayerNozzleTemp', 'Initial Printing Temperature')} value={settings.firstLayerNozzleTemp} onChange={handleChange} unit="°C" step={1}/>
            <NumberInput type="number" {...settingProps('bedTemp', 'Build Plate Temperature')} value={settings.bedTemp} onChange={handleChange} unit="°C" step={1}/>
            <NumberInput type="number" {...settingProps('firstLayerBedTemp', 'Initial Build Plate Temperature')} value={settings.firstLayerBedTemp} onChange={handleChange} unit="°C" step={1}/>
        </CategorySection>
        
        <CategorySection title="Cooling">
            <CheckboxInput {...settingProps('enableFan', 'Enable Print Cooling')} value={settings.enableFan} onChange={handleChange} />
            <NumberInput type="number" {...settingProps('fanSpeed', 'Fan Speed')} value={settings.fanSpeed} onChange={handleChange} unit="%" step={1} min={0} max={100}/>
            <CheckboxInput {...settingProps('keepFanAlwaysOn', 'Keep Fan Always On')} value={settings.keepFanAlwaysOn} onChange={handleChange} />
            <CheckboxInput {...settingProps('slowDownForCoolDown', 'Slow Down For Cooling')} value={settings.slowDownForCoolDown} onChange={handleChange} />
        </CategorySection>
        
      </div>
    </div>
  );
};

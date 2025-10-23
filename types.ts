export type MeshStatus = 'Validating' | 'Valid' | 'Invalid' | null;

export interface Printer {
  id: string;
  manufacturer: string;
  name: string;
}

export interface SlicerSettings {
  // Quality
  layerHeight: number; // mm
  firstLayerHeight: number; // mm
  lineWidth: number; // mm
  firstLayerLineWidth: number; // mm
  variableLayerHeight: boolean;
  
  // Walls
  wallLoops: number;
  topShellLayers: number;
  topShellThickness: number; // mm
  bottomShellLayers: number;
  bottomShellThickness: number; // mm
  ensureVerticalShellThickness: boolean;
  fuzzySkin: 'None' | 'Outer' | 'All';

  // Infill
  infillDensity: number; // %
  infillPattern: 'Grid' | 'Gyroid' | 'Cubic' | 'Lines' | 'Triangles' | 'Honeycomb' | 'CubicSubdivision' | 'SupportCubic';
  infillDirection: number; // degrees
  infillWallOverlap: number; // %
  minimumInfillArea: number; // mm^2

  // Supports
  enableSupports: boolean;
  supportType: 'None' | 'Normal' | 'Tree';
  supportOnBuildPlateOnly: boolean;
  supportOverhangAngle: number; // degrees
  supportTopZDistance: number; // mm
  supportBottomZDistance: number; // mm
  supportObjectXYDistance: number; // mm
  raftLayers: number;

  // Speed
  firstLayerSpeed: number; // mm/s
  outerWallSpeed: number; // mm/s
  innerWallSpeed: number; // mm/s
  sparseInfillSpeed: number; // mm/s
  solidInfillSpeed: number; // mm/s
  topSurfaceSpeed: number; // mm/s
  supportSpeed: number; // mm/s
  travelSpeed: number; // mm/s
  acceleration: number; // mm/s^2
  minPrintSpeed: number; // mm/s

  // Bed Adhesion
  brimType: 'none' | 'outer_brim' | 'inner_brim' | 'outer_and_inner_brim';
  elephantFootCompensation: number; // mm
  
  // Advanced
  seamPosition: 'Nearest' | 'Random' | 'Back' | 'Aligned';
  sequentialPrinting: boolean;
  retractionLength: number; // mm
  retractionSpeed: number; // mm/s
  zHopWhenRetracted: number; // mm
  maxVolumetricSpeed: number; // mm^3/s

  // Filament
  filamentType: 'PLA' | 'PETG' | 'ABS' | 'ASA' | 'TPU' | 'Other';
  filamentDiameter: number; // mm
  flowRatio: number; // ratio, e.g., 0.98
  pressureAdvance: number;
  filamentCost: number; // per kg
  filamentDensity: number; // g/cm^3
  nozzleTemp: number; // °C
  firstLayerNozzleTemp: number; // °C
  bedTemp: number; // °C
  firstLayerBedTemp: number; // °C
  
  // Cooling
  enableFan: boolean;
  fanSpeed: number; // %
  keepFanAlwaysOn: boolean;
  slowDownForCoolDown: boolean;
  
  // Printer (Contextual)
  nozzleDiameter: number; // mm
  bedShape: 'Rectangular' | 'Circular';
  printableAreaX: number; // mm
  printableAreaY: number; // mm
  originX: number; // mm
  originY: number; // mm
}


export interface PrintEstimates {
  printTime: string; // e.g., "1h 32m"
  materialUsage: string; // e.g., "52g / 17.3m"
}

export interface GeminiResponse {
  settings: SlicerSettings;
  estimates: PrintEstimates;
  reasoning: string;
}

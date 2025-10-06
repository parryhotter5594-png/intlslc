import { GoogleGenAI, Type } from "@google/genai";
import type { GeminiResponse, SlicerSettings, PrintEstimates } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const settingsSchema = {
    type: Type.OBJECT,
    properties: {
        // Quality
        layerHeight: { type: Type.NUMBER, description: "Layer height in mm." },
        firstLayerHeight: { type: Type.NUMBER, description: "First layer height in mm." },
        lineWidth: { type: Type.NUMBER, description: "General line width in mm." },
        firstLayerLineWidth: { type: Type.NUMBER, description: "First layer line width in mm." },
        variableLayerHeight: { type: Type.BOOLEAN, description: "Enable variable layer height for quality/speed optimization." },
        
        // Walls
        wallLoops: { type: Type.INTEGER, description: "Number of wall loops (perimeters)." },
        topShellLayers: { type: Type.INTEGER, description: "Number of solid top layers." },
        topShellThickness: { type: Type.NUMBER, description: "Thickness of solid top layers in mm." },
        bottomShellLayers: { type: Type.INTEGER, description: "Number of solid bottom layers." },
        bottomShellThickness: { type: Type.NUMBER, description: "Thickness of solid bottom layers in mm." },
        ensureVerticalShellThickness: { type: Type.BOOLEAN, description: "Ensure vertical shell thickness." },
        fuzzySkin: { type: Type.STRING, enum: ['None', 'Outer', 'All'], description: "Apply a fuzzy skin texture to the model." },

        // Infill
        infillDensity: { type: Type.INTEGER, description: "Infill percentage (e.g., 20)." },
        infillPattern: { type: Type.STRING, enum: ['Grid', 'Gyroid', 'Cubic', 'Lines', 'Triangles', 'Honeycomb', 'CubicSubdivision', 'SupportCubic'], description: "The pattern for the infill." },
        infillDirection: { type: Type.INTEGER, description: "The direction of infill lines in degrees." },
        infillWallOverlap: { type: Type.NUMBER, description: "Overlap percentage between infill and walls." },
        minimumInfillArea: { type: Type.NUMBER, description: "Minimum area for an area to get infill in mm^2." },

        // Supports - Note: Cura has fewer options than Orca here
        enableSupports: { type: Type.BOOLEAN, description: "Whether to enable supports." },
        supportType: { type: Type.STRING, enum: ['None', 'Standard', 'Tree'], description: "The type of support material to use ('Standard' for normal, 'Tree' for tree)." },
        supportStyle: { type: Type.STRING, enum: ['Touching Buildplate', 'Everywhere'], description: "Where supports should be placed." },
        supportOverhangAngle: { type: Type.INTEGER, description: "Support overhang angle in degrees." },
        supportTopZDistance: { type: Type.NUMBER, description: "Top Z distance between support and model in mm." },
        supportBottomZDistance: { type: Type.NUMBER, description: "Bottom Z distance between support and model in mm." },
        supportObjectXYDistance: { type: Type.NUMBER, description: "XY distance between support and model in mm." },
        raftLayers: { type: Type.INTEGER, description: "Number of raft layers. For Cura, this is more abstract." },

        // Speed
        firstLayerSpeed: { type: Type.INTEGER, description: "Print speed for the first layer in mm/s." },
        outerWallSpeed: { type: Type.INTEGER, description: "Print speed for outer walls in mm/s." },
        innerWallSpeed: { type: Type.INTEGER, description: "Print speed for inner walls in mm/s." },
        sparseInfillSpeed: { type: Type.INTEGER, description: "Print speed for sparse infill in mm/s." },
        solidInfillSpeed: { type: Type.INTEGER, description: "Print speed for solid infill in mm/s." },
        topSurfaceSpeed: { type: Type.INTEGER, description: "Print speed for top surfaces in mm/s." },
        supportSpeed: { type: Type.INTEGER, description: "Print speed for supports in mm/s." },
        travelSpeed: { type: Type.INTEGER, description: "Travel speed in mm/s." },
        acceleration: { type: Type.INTEGER, description: "Default acceleration in mm/s^2." },
        minPrintSpeed: { type: Type.INTEGER, description: "Minimum print speed in mm/s." },

        // Bed Adhesion
        brimType: { type: Type.STRING, enum: ['none', 'skirt', 'brim', 'raft'], description: "Type of brim to use for bed adhesion." },
        elephantFootCompensation: { type: Type.NUMBER, description: "Compensation for first layer squish in mm." },
        
        // Advanced
        seamPosition: { type: Type.STRING, enum: ['Shortest', 'Random', 'User Specified'], description: "Position of the seam." },
        sequentialPrinting: { type: Type.BOOLEAN, description: "Print objects one at a time." },
        retractionLength: { type: Type.NUMBER, description: "Filament retraction length in mm." },
        retractionSpeed: { type: Type.INTEGER, description: "Filament retraction speed in mm/s." },
        zHopWhenRetracted: { type: Type.NUMBER, description: "Z hop distance when retracted in mm." },
        maxVolumetricSpeed: { type: Type.NUMBER, description: "Maximum volumetric speed of the filament in mm^3/s." },

        // Filament
        filamentType: { type: Type.STRING, enum: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Other'], description: "The optimal filament material." },
        filamentDiameter: { type: Type.NUMBER, description: "Diameter of the filament in mm." },
        flowRatio: { type: Type.NUMBER, description: "Filament flow ratio as a percentage (e.g., 98)." },
        pressureAdvance: { type: Type.NUMBER, description: "Pressure advance value. Not native to Cura, but can be used for Klipper." },
        filamentCost: { type: Type.NUMBER, description: "Cost of the filament per kg." },
        filamentDensity: { type: Type.NUMBER, description: "Density of the filament in g/cm^3." },
        nozzleTemp: { type: Type.INTEGER, description: "Nozzle temperature in Celsius." },
        firstLayerNozzleTemp: { type: Type.INTEGER, description: "First layer nozzle temperature in Celsius." },
        bedTemp: { type: Type.INTEGER, description: "Bed temperature in Celsius." },
        firstLayerBedTemp: { type: Type.INTEGER, description: "First layer bed temperature in Celsius." },
        
        // Cooling
        enableFan: { type: Type.BOOLEAN, description: "Enable the part cooling fan." },
        fanSpeed: { type: Type.INTEGER, description: "Part cooling fan speed percentage." },
        keepFanAlwaysOn: { type: Type.BOOLEAN, description: "Keep the part cooling fan always on." },
        slowDownForCoolDown: { type: Type.BOOLEAN, description: "Slow down the print for better cooling on small layers." },
        
        // Printer - These are less relevant for Cura profiles but good for context
        nozzleDiameter: { type: Type.NUMBER, description: "Diameter of the nozzle in mm." },
        bedShape: { type: Type.STRING, enum: ['Rectangular', 'Circular'], description: "Shape of the printer bed." },
        printableAreaX: { type: Type.NUMBER, description: "Printable area on the X-axis in mm." },
        printableAreaY: { type: Type.NUMBER, description: "Printable area on the Y-axis in mm." },
        originX: { type: Type.NUMBER, description: "X-coordinate of the bed origin in mm." },
        originY: { type: Type.NUMBER, description: "Y-coordinate of the bed origin in mm." },
    },
};

const estimatesSchema = {
    type: Type.OBJECT,
    properties: {
        printTime: { type: Type.STRING, description: "Estimated print time in a human-readable format (e.g., '2h 15m')." },
        materialUsage: { type: Type.STRING, description: "Estimated material usage in grams and meters (e.g., '45g / 15.1m')." },
    },
    required: ["printTime", "materialUsage"],
};


const fullResponseSchema = {
  type: Type.OBJECT,
  properties: {
    settings: settingsSchema,
    estimates: estimatesSchema,
    reasoning: {
      type: Type.STRING,
      description: "A brief, one-sentence explanation for the chosen settings.",
    },
  },
  required: ["settings", "estimates", "reasoning"],
};


export const getSlicerSettingsFromPrompt = async (
  userPrompt: string,
  printerModel: string,
): Promise<GeminiResponse> => {
  const prompt = `
    System Instruction: You are an expert 3D printing engineer. Your task is to generate a complete and optimal set of advanced slicer parameters specifically for the UltiMaker Cura slicer engine.
    The output must be a valid JSON object matching the provided schema, containing values for ALL defined settings. Adapt concepts to Cura's terminology (e.g., 'Support Structure' can be 'normal' or 'tree').

    User's Request: "${userPrompt}"
    Selected Printer: "${printerModel}"
    Selected Slicer: "UltiMaker Cura"

    Analyze the user's request and provide the best, most detailed settings for the selected printer and Cura. Consider material choice, strength requirements, desired finish quality, print speed, and any other implied needs. 
    Also provide a brief, one-sentence explanation for your core choices and initial estimates for print time and material usage.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: fullResponseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText) as GeminiResponse;
    return parsedResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate AI-powered slicer settings.");
  }
};


export const getUpdatedEstimates = async (
  settings: SlicerSettings,
  userPrompt: string,
  printerModel: string,
): Promise<PrintEstimates> => {
  const prompt = `
    System Instruction: You are a 3D printing estimation engine. Given a full Cura slicer profile and the original intent, you will recalculate and return only the new print time and material usage estimates.
    The output must be a valid JSON object matching the provided schema for estimates ONLY. Do not include any other text or explanations.

    Original User's Request: "${userPrompt}"
    Selected Printer: "${printerModel}"
    Selected Slicer: "UltiMaker Cura"
    Updated Slicer Settings:
    ${JSON.stringify(settings, null, 2)}

    Based on the updated settings, provide the new estimates.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: estimatesSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText) as PrintEstimates;
    return parsedResponse;

  } catch (error) {
     console.error("Error calling Gemini API for estimate update:", error);
    throw new Error("Failed to update print estimates.");
  }

}
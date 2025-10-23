import JSZip from 'jszip';
import type { SlicerSettings } from '../types';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import * as THREE from 'three';

/**
 * Converts STL file to 3MF mesh XML format
 * @param stlFile - The STL file to convert
 * @returns Promise with the mesh data (vertices and triangles)
 */
const convertSTLTo3MFMesh = async (stlFile: File): Promise<{vertices: number[], triangles: number[]}> => {
    const arrayBuffer = await stlFile.arrayBuffer();
    const loader = new STLLoader();
    const geometry = loader.parse(arrayBuffer);

    const vertices: number[] = [];
    const triangles: number[] = [];

    // Get position attribute from geometry
    const positionAttribute = geometry.getAttribute('position');

    if (positionAttribute) {
        // Extract vertices
        for (let i = 0; i < positionAttribute.count; i++) {
            vertices.push(
                positionAttribute.getX(i),
                positionAttribute.getY(i),
                positionAttribute.getZ(i)
            );
        }

        // Create triangles (each 3 vertices form a triangle)
        for (let i = 0; i < positionAttribute.count; i += 3) {
            triangles.push(i, i + 1, i + 2);
        }
    }

    return { vertices, triangles };
};

/**
 * Converts the application's camelCase SlicerSettings object into a
 * snake_case INI-formatted string suitable for OrcaSlicer.
 * @param settings - The slicer settings object.
 * @returns An INI-formatted string.
 */
const convertSettingsToIni = (settings: SlicerSettings): string => {
    const settingsMap: { [key in keyof SlicerSettings]?: string } = {
        // Quality
        layerHeight: 'layer_height',
        firstLayerHeight: 'initial_layer_height',
        lineWidth: 'line_width',
        firstLayerLineWidth: 'initial_layer_line_width',
        variableLayerHeight: 'adaptive_layer_height',
        
        // Walls
        wallLoops: 'wall_loops',
        topShellLayers: 'top_shell_layers',
        topShellThickness: 'top_shell_thickness',
        bottomShellLayers: 'bottom_shell_layers',
        bottomShellThickness: 'bottom_shell_thickness',
        ensureVerticalShellThickness: 'ensure_vertical_shell_thickness',
        fuzzySkin: 'fuzzy_skin',

        // Infill
        infillDensity: 'infill_density',
        infillPattern: 'sparse_infill_pattern',
        infillDirection: 'infill_direction',
        infillWallOverlap: 'infill_wall_overlap',
        minimumInfillArea: 'min_infill_area',

        // Supports
        enableSupports: 'support_enable',
        supportType: 'support_type',
        supportOnBuildPlateOnly: 'support_on_build_plate_only',
        supportOverhangAngle: 'support_threshold_angle',
        supportTopZDistance: 'support_top_z_distance',
        supportBottomZDistance: 'support_bottom_z_distance',
        supportObjectXYDistance: 'support_xy_distance',
        raftLayers: 'raft_layers',

        // Speed
        firstLayerSpeed: 'initial_layer_speed',
        outerWallSpeed: 'outer_wall_speed',
        innerWallSpeed: 'inner_wall_speed',
        sparseInfillSpeed: 'sparse_infill_speed',
        solidInfillSpeed: 'solid_infill_speed',
        topSurfaceSpeed: 'top_surface_speed',
        supportSpeed: 'support_speed',
        travelSpeed: 'travel_speed',
        acceleration: 'default_acceleration',
        minPrintSpeed: 'slow_down_min_speed',

        // Bed Adhesion
        brimType: 'brim_type',
        elephantFootCompensation: 'elefant_foot_compensation',
        
        // Advanced
        seamPosition: 'seam_position',
        sequentialPrinting: 'sequential_print',
        retractionLength: 'retraction_length',
        retractionSpeed: 'retraction_speed',
        zHopWhenRetracted: 'z_hop',
        maxVolumetricSpeed: 'max_volumetric_speed',

        // Filament
        filamentType: 'filament_type',
        filamentDiameter: 'filament_diameter',
        flowRatio: 'filament_flow_ratio',
        pressureAdvance: 'pressure_advance',
        filamentCost: 'filament_cost',
        filamentDensity: 'filament_density',
        nozzleTemp: 'nozzle_temperature',
        firstLayerNozzleTemp: 'nozzle_temperature_initial_layer',
        bedTemp: 'bed_temperature',
        firstLayerBedTemp: 'bed_temperature_initial_layer',
        
        // Cooling
        enableFan: 'fan_enable',
        fanSpeed: 'cooling_fan_speed',
        keepFanAlwaysOn: 'fan_always_on',
        slowDownForCoolDown: 'slow_down_for_layer_cooling',
    };

    let iniContent = '[print:IntelliSlice AI Profile]\n';
    iniContent += `inherits = "0.20mm Standard @MyGenericPrinter"\n`;

    for (const [key, value] of Object.entries(settings)) {
        const orcaKey = settingsMap[key as keyof SlicerSettings];
        if (orcaKey && value !== undefined && value !== null) {
            let formattedValue = value;
            if (typeof value === 'boolean') {
                formattedValue = value ? '1' : '0';
            } else if (key === 'infillDensity') {
                 // Orca expects percentages as strings e.g. "15%"
                 formattedValue = `${value}%`;
            } else if (typeof value === 'string' && ['supportType', 'infillPattern', 'fuzzySkin', 'brimType', 'seamPosition'].includes(key)) {
                // Enums are often lowercase
                formattedValue = String(value).toLowerCase();
            }
            
            iniContent += `${orcaKey} = ${formattedValue}\n`;
        }
    }
    return iniContent;
};


/**
 * Creates the 3D model XML file in 3MF format
 * @param vertices - Array of vertex coordinates [x1, y1, z1, x2, y2, z2, ...]
 * @param triangles - Array of triangle vertex indices [v1, v2, v3, v4, v5, v6, ...]
 * @param modelName - Original model file name for metadata
 * @returns XML string for 3dmodel.model file
 */
const create3DModelXML = (vertices: number[], triangles: number[], modelName: string): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${modelName}</metadata>
  <metadata name="Designer">IntelliSlice AI</metadata>
  <metadata name="Application">IntelliSlice</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
`;

    // Add vertices (with proper formatting)
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i].toFixed(6);
        const y = vertices[i + 1].toFixed(6);
        const z = vertices[i + 2].toFixed(6);
        xml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
    }

    xml += `        </vertices>
        <triangles>
`;

    // Add triangles
    for (let i = 0; i < triangles.length; i += 3) {
        xml += `          <triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}" />\n`;
    }

    xml += `        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    return xml;
};

/**
 * Generates the XML content for the [Content_Types].xml file in a 3MF archive.
 * @returns XML string.
 */
const createContentTypesXML = (): string => `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Default Extension="config" ContentType="text/plain"/>
</Types>`;


/**
 * Generates the XML content for the relationships file in a 3MF archive.
 * @returns XML string.
 */
const createRelationshipsXML = (): string => `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;


/**
 * Creates a .3mf project file in-memory using JSZip.
 * @param modelFile - The STL file uploaded by the user.
 * @param settings - The slicer settings generated by the AI.
 * @returns A promise that resolves to a Blob of the generated .3mf file.
 */
export const generate3mfProject = async (modelFile: File, settings: SlicerSettings): Promise<Blob> => {
    const zip = new JSZip();

    // 1. Convert STL to 3MF mesh format
    const { vertices, triangles } = await convertSTLTo3MFMesh(modelFile);

    // 2. Create 3D model XML with metadata
    const modelName = modelFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const modelXML = create3DModelXML(vertices, triangles, modelName);

    // 3. Convert settings to INI format
    const configContent = convertSettingsToIni(settings);

    // 4. Create XML metadata files
    const contentTypesXML = createContentTypesXML();
    const relationshipsXML = createRelationshipsXML();

    // 5. Add all files to the zip archive in proper 3MF structure
    zip.file('[Content_Types].xml', contentTypesXML);
    zip.file('_rels/.rels', relationshipsXML);
    zip.file('3D/3dmodel.model', modelXML);

    // Add config in multiple locations for better compatibility
    zip.file('Metadata/Slic3r_PE.config', configContent);
    zip.file('Metadata/OrcaSlicer.config', configContent);

    // 6. Generate and return the blob with proper compression
    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'
    });
};

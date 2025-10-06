const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// --- Configuration ---
// IMPORTANT: Path to the OrcaSlicer console executable.
// This needs to be configured correctly on the server where this code runs.
// Examples:
// Windows: 'C:/Program Files/OrcaSlicer/orcaslicer_console.exe'
// Linux: '/usr/bin/orcaslicer' or 'orcaslicer' if it's in the PATH
// macOS: '/Applications/OrcaSlicer.app/Contents/MacOS/OrcaSlicer'
const ORCA_SLICER_PATH = 'orcaslicer_console'; // Assumes it's in the system's PATH

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// --- Middleware ---
app.use(cors());
app.use(express.json());
const upload = multer({ dest: UPLOAD_DIR });


// --- Helper Function to convert JSON settings to OrcaSlicer INI format ---
const convertSettingsToIni = (settings) => {
    // This mapping is illustrative. A real implementation would need a more
    // comprehensive map from the app's setting names to OrcaSlicer's internal names.
    const settingsMap = {
        layerHeight: 'layer_height',
        firstLayerHeight: 'initial_layer_height',
        wallLoops: 'wall_loops',
        infillDensity: 'sparse_infill_density',
        infillPattern: 'sparse_infill_pattern',
        nozzleTemp: 'nozzle_temperature',
        firstLayerNozzleTemp: 'nozzle_temperature_initial_layer',
        bedTemp: 'bed_temperature',
        firstLayerBedTemp: 'bed_temperature_initial_layer',
        outerWallSpeed: 'outer_wall_speed',
        innerWallSpeed: 'inner_wall_speed',
        enableSupports: 'support_enable',
        supportType: 'support_type',
        // ... add many more mappings here
    };

    let iniContent = '';
    for (const [key, value] of Object.entries(settings)) {
        const orcaKey = settingsMap[key];
        if (orcaKey) {
            let formattedValue = value;
            if (typeof value === 'boolean') {
                formattedValue = value ? '1' : '0';
            }
             if (typeof value === 'string') {
                // OrcaSlicer patterns are often lowercase (e.g., 'gyroid')
                formattedValue = value.toLowerCase();
            }
            iniContent += `${orcaKey} = ${formattedValue}\n`;
        }
    }
    return iniContent;
};


// --- API Endpoint ---
app.post('/api/generate-project', upload.single('model'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No model file uploaded.');
  }

  const settings = JSON.parse(req.body.settings || '{}');
  
  const tempId = Date.now();
  const modelPath = req.file.path;
  const configPath = path.join(UPLOAD_DIR, `config_${tempId}.ini`);
  const outputPath = path.join(UPLOAD_DIR, `project_${tempId}.3mf`);
  
  try {
    // 1. Convert settings and write to a temp config file
    const iniConfig = convertSettingsToIni(settings);
    fs.writeFileSync(configPath, iniConfig);

    // 2. Build the OrcaSlicer CLI command
    const command = `"${ORCA_SLICER_PATH}" --load "${configPath}" --export-3mf "${outputPath}" "${modelPath}"`;
    
    console.log('Executing command:', command);

    // 3. Execute the command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stderr: ${stderr}`);
        // Clean up and send error response
        fs.unlinkSync(modelPath);
        fs.unlinkSync(configPath);
        return res.status(500).send(`Error running OrcaSlicer: ${stderr}`);
      }

      console.log(`stdout: ${stdout}`);
      
      // 4. Send the generated file back to the client
      res.sendFile(outputPath, (err) => {
        // 5. Clean up all temporary files after sending
        fs.unlinkSync(modelPath);
        fs.unlinkSync(configPath);
        if (fs.existsSync(outputPath)) {
           fs.unlinkSync(outputPath);
        }
        if (err) {
          console.error('Error sending file:', err);
        }
      });
    });

  } catch (err) {
    console.error('Server error:', err);
    // Clean up in case of an error before exec
    fs.unlinkSync(modelPath);
    if(fs.existsSync(configPath)) fs.unlinkSync(configPath);
    res.status(500).send('Failed to process the request.');
  }
});

app.listen(port, () => {
  console.log(`IntelliSlice server listening at http://localhost:${port}`);
});

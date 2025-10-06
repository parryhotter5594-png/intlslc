import type { Printer } from './types';

export const PRINTERS: Printer[] = [
  { id: 'bambu_x1c', manufacturer: 'Bambu Lab', name: 'X1 Carbon' },
  { id: 'bambu_p1s', manufacturer: 'Bambu Lab', name: 'P1S' },
  { id: 'bambu_a1m', manufacturer: 'Bambu Lab', name: 'A1 Mini' },
  { id: 'creality_k1', manufacturer: 'Creality', name: 'K1' },
  { id: 'creality_k1max', manufacturer: 'Creality', name: 'K1 Max' },
  { id: 'creality_ender3v3se', manufacturer: 'Creality', name: 'Ender-3 V3 SE' },
  { id: 'prusa_mk4', manufacturer: 'Prusa', name: 'Original Prusa MK4' },
  { id: 'prusa_mini', manufacturer: 'Prusa', name: 'Original Prusa MINI+' },
  { id: 'voron_24', manufacturer: 'Voron', name: 'Voron 2.4' },
  { id: 'voron_trident', manufacturer: 'Voron', name: 'Voron Trident' },
  { id: 'sovol_sv06', manufacturer: 'Sovol', name: 'SV06' },
];

// This structure is key to making Cura profile import work within a .3mf project.
// It maps our app's printer IDs to the exact 'definition' name used inside Cura.
export const CURA_PRINTER_DEFINITIONS: { [key: string]: string } = {
  'bambu_x1c': 'bambu_lab_x1c',
  'bambu_p1s': 'bambu_lab_p1s',
  'bambu_a1m': 'bambu_lab_a1_mini',
  'creality_k1': 'creality_k1',
  'creality_k1max': 'creality_k1max',
  'creality_ender3v3se': 'creality_ender3v3se',
  'prusa_mk4': 'prusa_i3_mk4',
  'prusa_mini': 'prusa_mini',
  'voron_24': 'voron2_4_350', // These are common community definitions
  'voron_trident': 'voron_trident_300',
  'sovol_sv06': 'sovol_sv06',
  'default': 'ultimaker2_plus' // Fallback definition
};
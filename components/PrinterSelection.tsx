
import React, { useState } from 'react';
import { PRINTERS } from '../constants';
import type { Printer } from '../types';
import { PrinterIcon, CheckCircleIcon } from './IconComponents';

interface PrinterSelectionProps {
  onPrinterSelect: (printerId: string) => void;
  selectedPrinter: Printer | null;
  disabled?: boolean;
}

export const PrinterSelection: React.FC<PrinterSelectionProps> = ({ onPrinterSelect, selectedPrinter, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPrinters = PRINTERS.filter(printer =>
    printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    printer.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-6 bg-secondary rounded-lg shadow-lg transition-all duration-300 ${disabled ? 'opacity-50' : ''}`}>
      <h2 className="text-xl font-semibold text-light mb-4 flex items-center">
        <span className="bg-primary text-dark rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">2</span>
        Select Printer
      </h2>
      {selectedPrinter && disabled ? (
         <div className="bg-dark/50 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
                <PrinterIcon className="w-8 h-8 text-primary mr-4"/>
                <div>
                    <p className="font-bold text-light">{selectedPrinter.name}</p>
                    <p className="text-sm text-gray-400">{selectedPrinter.manufacturer}</p>
                </div>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
         </div>
      ) : (
        <div className="relative">
          <select
            id="printer-select"
            onChange={(e) => onPrinterSelect(e.target.value)}
            disabled={disabled}
            defaultValue=""
            className="w-full bg-dark/50 border border-gray-600 rounded-lg p-3 text-light focus:ring-primary focus:border-primary appearance-none"
          >
            <option value="" disabled>Choose your printer model</option>
            {PRINTERS.map(printer => (
              <option key={printer.id} value={printer.id}>
                {printer.manufacturer} - {printer.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      )}
    </div>
  );
};

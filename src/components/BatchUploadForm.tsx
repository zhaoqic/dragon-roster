'use client';

import { useState } from 'react';
import { Paddler } from '@/types';
import { Upload, Download, AlertTriangle, X } from 'lucide-react';
import { CSVPaddlerManager } from '@/utils/csvUtils';

interface BatchUploadFormProps {
  paddlers: Paddler[];
  onBatchAddPaddlers: (paddlers: Paddler[]) => void;
}

export default function BatchUploadForm({ paddlers, onBatchAddPaddlers }: BatchUploadFormProps) {
  const [csvUpload, setCsvUpload] = useState({
    isUploading: false,
    errors: [] as string[],
    warnings: [] as string[],
    showResults: false
  });

  const handleDownloadTemplate = () => {
    CSVPaddlerManager.downloadTemplate();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setCsvUpload(prev => ({ ...prev, isUploading: true, errors: [], warnings: [], showResults: false }));

    try {
      const text = await file.text();
      const result = CSVPaddlerManager.parseCSV(text);
      
      if (result.errors.length > 0) {
        setCsvUpload(prev => ({ 
          ...prev, 
          isUploading: false, 
          errors: result.errors, 
          showResults: true 
        }));
        return;
      }

      const warnings = CSVPaddlerManager.validatePaddlerData(result.paddlers);
      
      // Check for duplicate names with existing paddlers
      const existingNames = new Set(paddlers.map(p => p.name.toLowerCase()));
      const duplicateWarnings = result.paddlers
        .filter(p => existingNames.has(p.name.toLowerCase()))
        .map(p => `"${p.name}" already exists in current paddler list`);

      const allWarnings = [...warnings, ...duplicateWarnings];

      if (result.paddlers.length > 0) {
        onBatchAddPaddlers(result.paddlers);
        setCsvUpload(prev => ({ 
          ...prev, 
          isUploading: false, 
          warnings: allWarnings, 
          showResults: true 
        }));
      }
    } catch (error) {
      setCsvUpload(prev => ({ 
        ...prev, 
        isUploading: false, 
        errors: ['Failed to read CSV file. Please check the file format.'], 
        showResults: true 
      }));
    }

    // Reset file input
    event.target.value = '';
  };

  const handleCloseResults = () => {
    setCsvUpload(prev => ({ ...prev, showResults: false, errors: [], warnings: [] }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Batch Upload from CSV</h3>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Download size={18} />
          Download Template
        </button>
        
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
          <Upload size={18} />
          {csvUpload.isUploading ? 'Uploading...' : 'Upload CSV'}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={csvUpload.isUploading}
          />
        </label>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        <p>• Download the template to see the required format with examples</p>
        <p>• <strong>Flexible input accepted:</strong></p>
        <p className="ml-4">- Gender: Male/M, Female/F, Other/X (case insensitive)</p>
        <p className="ml-4">- Side: Left/L, Right/R, Ambi/A/Either (case insensitive)</p>
        <p className="ml-4">- Scores: 1-5 (decimals will be rounded)</p>
        <p>• Duplicate names will be flagged but still imported</p>
      </div>

      {/* CSV Upload Results */}
      {csvUpload.showResults && (
        <div className="p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">Import Results</h4>
            <button
              onClick={handleCloseResults}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          {csvUpload.errors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-red-800">
                <AlertTriangle size={16} />
                <span className="font-medium">Errors (Import Failed)</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1 ml-6">
                {csvUpload.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {csvUpload.warnings.length > 0 && csvUpload.errors.length === 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-yellow-800">
                <AlertTriangle size={16} />
                <span className="font-medium">Warnings (Import Successful)</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1 ml-6">
                {csvUpload.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {csvUpload.errors.length === 0 && csvUpload.warnings.length === 0 && (
            <div className="text-green-700">
              ✅ All paddlers imported successfully with no issues!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
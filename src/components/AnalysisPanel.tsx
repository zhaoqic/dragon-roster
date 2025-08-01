'use client';

import { AssignmentMetrics, Seat } from '@/types';

interface AnalysisPanelProps {
  metrics: AssignmentMetrics;
  seats: Seat[];
}

export default function AnalysisPanel({ metrics, seats }: AnalysisPanelProps) {
  const getZoneStrengthAverage = (strengthPerRow: number[], zoneRows: number[]): number => {
    const zoneStrengths = zoneRows.map(row => strengthPerRow[row - 1] || 0);
    const validStrengths = zoneStrengths.filter(s => s > 0);
    return validStrengths.length > 0 ? validStrengths.reduce((sum, s) => sum + s, 0) / validStrengths.length : 0;
  };

  const getSideStrengthAverage = (side: 'Left' | 'Right'): number => {
    const sideSeats = seats.filter(s => s.side === side && s.paddler);
    return sideSeats.length > 0 
      ? sideSeats.reduce((sum, s) => sum + (s.paddler?.strengthScore || 0), 0) / sideSeats.length 
      : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-4">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Analysis & Stats</h3>
      
      {/* Weight Distribution */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-blue-800 mb-3">Weight Distribution</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Left Side:</span>
            <span className="font-medium">{metrics.totalWeightLeft.toFixed(1)}kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Right Side:</span>
            <span className="font-medium">{metrics.totalWeightRight.toFixed(1)}kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Imbalance:</span>
            <span className={`font-medium ${Math.abs(metrics.weightImbalance) > 10 ? 'text-red-600' : 'text-green-600'}`}>
              {Math.abs(metrics.weightImbalance).toFixed(1)}kg
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="font-medium">
              {(metrics.totalWeightLeft + metrics.totalWeightRight).toFixed(1)}kg
            </span>
          </div>
        </div>
      </div>

      {/* Strength Distribution */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-green-800 mb-3">Avg Paddler Strength</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Timing Box:</span>
            <span className="font-medium">{getZoneStrengthAverage(metrics.averageStrengthPerRow, [1, 2, 3]).toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Engine:</span>
            <span className="font-medium">{getZoneStrengthAverage(metrics.averageStrengthPerRow, [4, 5, 6, 7]).toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Rocket:</span>
            <span className="font-medium">{getZoneStrengthAverage(metrics.averageStrengthPerRow, [8, 9, 10]).toFixed(1)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm text-gray-600">Left Side:</span>
            <span className="font-medium">{getSideStrengthAverage('Left').toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Right Side:</span>
            <span className="font-medium">{getSideStrengthAverage('Right').toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Gender Analysis */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-semibold text-purple-800 mb-3">Gender Distribution</h4>
        <div className="space-y-2">
          {(() => {
            const assignedSeats = seats.filter(s => s.paddler);
            const maleSeats = assignedSeats.filter(s => s.paddler?.gender === 'Male');
            const femaleSeats = assignedSeats.filter(s => s.paddler?.gender === 'Female');
            const otherSeats = assignedSeats.filter(s => s.paddler?.gender === 'Other');
            
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Male:</span>
                  <span className="font-medium">{maleSeats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Female:</span>
                  <span className="font-medium">{femaleSeats.length}</span>
                </div>
                {otherSeats.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Other:</span>
                    <span className="font-medium">{otherSeats.length}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-gray-600">Total Assigned:</span>
                  <span className="font-medium">{assignedSeats.length}/20</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Warnings Section */}
      {metrics.warnings.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg mt-6">
          <h4 className="font-semibold text-yellow-800 mb-3">⚠️ Recommendations</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {metrics.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
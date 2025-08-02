'use client';

import { useState, useEffect } from 'react';
import { Paddler, Seat, AssignmentConfig, AssignmentMetrics, BoatLineup } from '@/types';
import { assignSeats, calculateMetrics } from '@/utils/seatAssignment';
import { StorageManager } from '@/utils/storage';
import PaddlersPage from '@/components/PaddlersPage';
import AnalysisPanel from '@/components/AnalysisPanel';
import BoatLayoutWithRoster from '@/components/BoatLayoutWithRoster';
import { Users, Zap } from 'lucide-react';

const defaultConfig: AssignmentConfig = {
  prioritizeExperienceInFront: true,
  prioritizeStrengthInBack: true,
  balanceWeight: true,
  respectSidePreferences: true
};

export default function Home() {
  const [paddlers, setPaddlers] = useState<Paddler[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [metrics, setMetrics] = useState<AssignmentMetrics>({
    totalWeightLeft: 0,
    totalWeightRight: 0,
    weightImbalance: 0,
    averageStrengthPerRow: Array(10).fill(0),
    sidePreferencesSatisfied: 0,
    totalSidePreferences: 0,
    warnings: []
  });
  const [config] = useState<AssignmentConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<'paddlers' | 'layout'>('paddlers');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [newLineupName, setNewLineupName] = useState('');
  const [lineups, setLineups] = useState<BoatLineup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('=== Initializing App ===');
    const devMode = true; // Enable dev mode by default
    console.log('Dev mode:', devMode);
    
    const savedPaddlers = StorageManager.getPaddlers();
    console.log('Loading paddlers:', savedPaddlers.length, savedPaddlers.map(p => p.name));
    
    // Auto-load demo data in dev mode if no paddlers exist
    // Auto-load demo data in dev mode if no paddlers exist
    if (devMode && savedPaddlers.length === 0) {
      console.log('Dev mode enabled: Auto-loading demo data');
      loadDemoDataAsync();
      return;
    }
    
    setPaddlers(savedPaddlers);
    
    // Try to restore current state, otherwise create empty seats
    const savedState = StorageManager.getCurrentState();
    console.log('Loading saved state:', savedState ? `${savedState.filter(s => s.paddler).length} seats assigned` : 'no saved state');
    
    // Debug: Check what's actually in localStorage
    console.log('Raw localStorage data:', {
      paddlers: localStorage.getItem('dragonboat_paddlers'),
      currentState: localStorage.getItem('dragonboat_current_state')
    });
    
    // Show all localStorage keys for debugging
    console.log('All localStorage keys:', Object.keys(localStorage));
    
    const initialSeats = savedState || createEmptySeats();
    setSeats(initialSeats);
    setMetrics(calculateMetrics(initialSeats));
    
    loadLineups();
    
    // Mark as initialized after everything is set
    setIsInitialized(true);
  }, []);

  const loadLineups = () => {
    const savedLineups = StorageManager.getLineups();
    setLineups(savedLineups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
  };

  useEffect(() => {
    // Only save paddlers after initialization to prevent overwriting during restore
    if (isInitialized) {
      console.log('Saving paddlers:', paddlers.length);
      StorageManager.savePaddlers(paddlers);
    }
  }, [paddlers, isInitialized]);

  useEffect(() => {
    setMetrics(calculateMetrics(seats));
    // Auto-save current seat state whenever it changes (but not during initialization)
    if (isInitialized) {
      const assignedSeats = seats.filter(s => s.paddler).length;
      console.log('Saving current state:', assignedSeats, 'seats assigned');
      StorageManager.saveCurrentState(seats);
    } else {
      console.log('Skipping save during initialization, seats:', seats.filter(s => s.paddler).length, 'assigned');
    }
  }, [seats, isInitialized]);

  const createEmptySeats = (): Seat[] => {
    const seats: Seat[] = [];
    for (let row = 1; row <= 10; row++) {
      seats.push({ row, side: 'Left', isLocked: false });
      seats.push({ row, side: 'Right', isLocked: false });
    }
    return seats;
  };

  const handleAddPaddler = (paddler: Paddler) => {
    setPaddlers(prev => [...prev, paddler]);
  };

  const handleRemovePaddler = (paddlerId: string) => {
    setPaddlers(prev => prev.filter(p => p.id !== paddlerId));
    setSeats(prev => prev.map(seat => 
      seat.paddler?.id === paddlerId 
        ? { ...seat, paddler: undefined }
        : seat
    ));
  };

  const handleBatchAddPaddlers = (newPaddlers: Paddler[]) => {
    setPaddlers(prev => [...prev, ...newPaddlers]);
  };

  const handleAutoAssign = () => {
    if (paddlers.length === 0) {
      alert('Please add some paddlers first');
      return;
    }

    const newSeats = assignSeats(paddlers, config, seats);
    setSeats(newSeats);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all seat assignments?')) {
      setSeats(createEmptySeats());
    }
  };

  const handleClearAllExceptLocked = () => {
    if (confirm('Are you sure you want to clear all unlocked seat assignments?')) {
      const newSeats = seats.map(seat => {
        if (seat.isLocked) {
          return seat; // Keep locked seats unchanged
        } else {
          return { ...seat, paddler: undefined }; // Clear unlocked seats
        }
      });
      setSeats(newSeats);
    }
  };

  const handleClearStorage = () => {
    if (confirm('Are you sure you want to clear all stored data? This will remove all paddlers, lineups, and current state.')) {
      StorageManager.clearCurrentState();
      localStorage.removeItem('dragonboat_paddlers');
      localStorage.removeItem('dragonboat_lineups');
      setPaddlers([]);
      setSeats(createEmptySeats());
      setLineups([]);
    }
  };

  const loadDemoDataAsync = async () => {
    try {
      const basePath = process.env.NODE_ENV === 'production' ? '/dragon-roster' : '';
      const response = await fetch(`${basePath}/demo-data.json`);
      const demoData = await response.json();
      
      const demoPaddlers = demoData.dragonboat_paddlers as Paddler[];
      const demoSeats = demoData.dragonboat_current_state.seats as Seat[];
      
      setPaddlers(demoPaddlers);
      setSeats(demoSeats);
      setMetrics(calculateMetrics(demoSeats));
      
      // Save to localStorage
      StorageManager.savePaddlers(demoPaddlers);
      StorageManager.saveCurrentState(demoSeats);
      
      loadLineups();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load demo data:', error);
      // Continue with normal initialization
      const initialSeats = createEmptySeats();
      setSeats(initialSeats);
      setMetrics(calculateMetrics(initialSeats));
      loadLineups();
      setIsInitialized(true);
    }
  };

  const handleLoadDemoData = async () => {
    if (confirm('This will replace all current data with demo data. Continue?')) {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/dragon-roster' : '';
        const response = await fetch(`${basePath}/demo-data.json`);
        const demoData = await response.json();
        
        // Load demo paddlers with proper typing
        const demoPaddlers = demoData.dragonboat_paddlers as Paddler[];
        setPaddlers(demoPaddlers);
        
        // Load demo seats state with proper typing
        const demoSeats = demoData.dragonboat_current_state.seats as Seat[];
        setSeats(demoSeats);
        
        // Save to localStorage
        StorageManager.savePaddlers(demoPaddlers);
        StorageManager.saveCurrentState(demoSeats);
        
        alert('Demo data loaded successfully!');
      } catch (error) {
        alert('Failed to load demo data. Please try again.');
      }
    }
  };


  const handleSeatUpdate = (updatedSeats: Seat[]) => {
    setSeats(updatedSeats);
  };




  const handleSaveLineup = () => {
    if (!newLineupName.trim()) {
      alert('Please enter a lineup name');
      return;
    }

    try {
      const lineup = StorageManager.createLineupFromSeats(newLineupName.trim(), seats);
      StorageManager.saveLineup(lineup);
      setNewLineupName('');
      setShowSaveDialog(false);
      loadLineups();
      alert('Lineup saved successfully!');
    } catch (error) {
      alert('Failed to save lineup');
    }
  };

  const handleSelectLineup = (lineup: BoatLineup) => {
    setSeats(lineup.seats);
    setShowLoadDialog(false);
  };

  const handleExportCSV = () => {
    try {
      const lineup = StorageManager.createLineupFromSeats('Current Lineup', seats);
      const csvContent = StorageManager.exportLineupAsCSV(lineup);
      StorageManager.downloadCSV('current_lineup.csv', csvContent);
    } catch (error) {
      alert('Failed to export current lineup');
    }
  };

  const assignedSeats = seats.filter(seat => seat.paddler).length;


  const tabs = [
    { id: 'paddlers' as const, label: 'Roster', icon: Users, count: paddlers.length },
    { id: 'layout' as const, label: 'Lineup', icon: Zap, count: assignedSeats }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dragon Boat SeatMate</h1>
          <p className="text-gray-600 mt-2">Optimize your dragon boat team's seating arrangement</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="mb-6">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                    ${activeTab === tab.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }
                  `}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  {'count' in tab && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLoadDemoData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                title="Load demo data with sample paddlers and lineup"
              >
                Load Demo Data
              </button>
              <button
                onClick={handleClearStorage}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                title="Clear all stored data (paddlers, lineups, current state)"
              >
                Clear Storage
              </button>
            </div>
          </div>
        </nav>

        <div className="space-y-6">
          {activeTab === 'paddlers' && (
            <PaddlersPage 
              onAddPaddler={handleAddPaddler}
              paddlers={paddlers}
              onRemovePaddler={handleRemovePaddler}
              onBatchAddPaddlers={handleBatchAddPaddlers}
            />
          )}

          {activeTab === 'layout' && (
            <>
              {/* Lineup Management Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Lineup Management</h2>
                
                {/* Save/Load/Export */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={assignedSeats === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Save Lineup
                  </button>
                  <button
                    onClick={() => setShowLoadDialog(true)}
                    disabled={lineups.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Load Lineup
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={assignedSeats === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Three Panel Layout */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Panel: Analysis & Stats */}
                <div className="col-span-3">
                  <AnalysisPanel metrics={metrics} seats={seats} />
                </div>

                {/* Center & Right Panels: Boat Layout with Roster */}
                <div className="col-span-9">
                  <BoatLayoutWithRoster
                    seats={seats}
                    onSeatUpdate={handleSeatUpdate}
                    availablePaddlers={paddlers}
                    onAutoAssign={handleAutoAssign}
                    onClearAll={handleClearAll}
                    onClearAllExceptLocked={handleClearAllExceptLocked}
                  />
                </div>
              </div>

              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-96">
                    <h3 className="text-lg font-semibold mb-4">Save Lineup</h3>
                    <input
                      type="text"
                      value={newLineupName}
                      onChange={(e) => setNewLineupName(e.target.value)}
                      placeholder="Enter lineup name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveLineup()}
                    />
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowSaveDialog(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveLineup}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Load Dialog */}
              {showLoadDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-96 max-h-96 flex flex-col">
                    <h3 className="text-lg font-semibold mb-4">Load Lineup</h3>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {lineups.map((lineup) => (
                        <div
                          key={lineup.id}
                          onClick={() => handleSelectLineup(lineup)}
                          className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="font-medium">{lineup.name}</div>
                          <div className="text-sm text-gray-600">
                            Updated: {new Date(lineup.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => setShowLoadDialog(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
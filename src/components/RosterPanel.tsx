'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core';
import { Seat, Paddler } from '@/types';
import { DraggablePaddler } from './DragonBoatCanvas';

interface RosterPanelProps {
  seats: Seat[];
  availablePaddlers: Paddler[];
  onSeatUpdate: (seats: Seat[]) => void;
  showWeight: boolean;
  setShowWeight: (show: boolean) => void;
  showPerformanceMetrics: boolean;
  setShowPerformanceMetrics: (show: boolean) => void;
  showGender: boolean;
  setShowGender: (show: boolean) => void;
}

function DroppableAvailablePaddlers({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: 'available-paddlers',
  });

  return (
    <div
      ref={setNodeRef}
      className="space-y-2 max-h-96 overflow-y-auto p-2 rounded-lg"
    >
      {children}
    </div>
  );
}

export default function RosterPanel({ 
  seats, 
  availablePaddlers, 
  onSeatUpdate, 
  showWeight, 
  setShowWeight, 
  showPerformanceMetrics, 
  setShowPerformanceMetrics,
  showGender,
  setShowGender
}: RosterPanelProps) {
  const [groupBy, setGroupBy] = useState<'gender' | 'side'>('gender');
  const [orderBy, setOrderBy] = useState<'weight' | 'strength' | 'experience'>('weight');

  const unassignedPaddlers = availablePaddlers.filter(paddler => 
    !seats.some(seat => seat.paddler?.id === paddler.id)
  );

  const sortPaddlers = (paddlers: Paddler[]) => {
    return paddlers.sort((a, b) => {
      switch (orderBy) {
        case 'weight':
          return b.weight - a.weight;
        case 'strength':
          return b.strengthScore - a.strengthScore;
        case 'experience':
          return b.experienceScore - a.experienceScore;
        default:
          return 0;
      }
    });
  };

  const getGroupedPaddlers = () => {
    if (groupBy === 'gender') {
      const malePaddlers = sortPaddlers(unassignedPaddlers.filter(p => p.gender === 'Male'));
      const femalePaddlers = sortPaddlers(unassignedPaddlers.filter(p => p.gender === 'Female'));
      const otherPaddlers = sortPaddlers(unassignedPaddlers.filter(p => p.gender === 'Other'));
      
      return [
        { label: `Male (${malePaddlers.length})`, paddlers: malePaddlers, visible: malePaddlers.length > 0 },
        { label: `Female (${femalePaddlers.length})`, paddlers: femalePaddlers, visible: femalePaddlers.length > 0 },
        { label: `Other (${otherPaddlers.length})`, paddlers: otherPaddlers, visible: otherPaddlers.length > 0 }
      ];
    } else {
      const leftPaddlers = sortPaddlers(unassignedPaddlers.filter(p => p.preferredSide === 'Left'));
      const rightPaddlers = sortPaddlers(unassignedPaddlers.filter(p => p.preferredSide === 'Right'));
      const ambiPaddlers = sortPaddlers(unassignedPaddlers.filter(p => p.preferredSide === 'Ambi'));
      
      return [
        { label: `Left (${leftPaddlers.length})`, paddlers: leftPaddlers, visible: leftPaddlers.length > 0 },
        { label: `Right (${rightPaddlers.length})`, paddlers: rightPaddlers, visible: rightPaddlers.length > 0 },
        { label: `Ambi (${ambiPaddlers.length})`, paddlers: ambiPaddlers, visible: ambiPaddlers.length > 0 }
      ];
    }
  };

  const groupedPaddlers = getGroupedPaddlers();


  const { isOver: isPanelOver, setNodeRef: setPanelRef } = useDroppable({
    id: 'roster-panel',
  });

  return (
    <div 
      ref={setPanelRef}
      className={`relative bg-white rounded-lg shadow-md p-6 h-fit sticky top-4 transition-colors ${
        isPanelOver ? 'bg-green-50 ring-2 ring-green-300 ring-opacity-50' : ''
      }`}
    >
      {isPanelOver && (
        <div className="absolute inset-0 bg-green-100 bg-opacity-30 pointer-events-none flex items-center justify-center rounded-lg z-40">
          <div className="text-green-800 text-lg font-bold animate-bounce drop-shadow-lg bg-white px-4 py-2 rounded-lg shadow-xl">
            🎯 Release to unassign paddler
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Roster ({unassignedPaddlers.length}/{availablePaddlers.length})
        </h3>
      </div>
      
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Group By</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'gender' | 'side')}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="gender">Gender</option>
            <option value="side">Preferred Side</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Order By</label>
          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value as 'weight' | 'strength' | 'experience')}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="weight">Weight</option>
            <option value="strength">Strength</option>
            <option value="experience">Experience</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showGender}
            onChange={(e) => setShowGender(e.target.checked)}
            className="rounded"
          />
          Gender
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showWeight}
            onChange={(e) => setShowWeight(e.target.checked)}
            className="rounded"
          />
          Weight
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showPerformanceMetrics}
            onChange={(e) => setShowPerformanceMetrics(e.target.checked)}
            className="rounded"
          />
          Performance
        </label>
      </div>
      
      {unassignedPaddlers.length === 0 ? (
        <DroppableAvailablePaddlers>
          <div className="text-center text-gray-500 py-8 text-sm">
            All paddlers have been assigned to seats
            <br />
            <span className="text-xs">Drag paddlers here to remove from seats</span>
          </div>
        </DroppableAvailablePaddlers>
      ) : (
        <div className={`grid gap-4 ${groupedPaddlers.filter(g => g.visible).length === 1 ? 'grid-cols-1' : 'grid-cols-1'}`}>
          {groupedPaddlers
            .filter(group => group.visible)
            .map((group, index) => (
              <div key={index}>
                <h4 className="text-sm font-medium text-gray-600 mb-2">
                  {group.label}
                </h4>
                <DroppableAvailablePaddlers>
                  {group.paddlers.map(paddler => (
                    <DraggablePaddler 
                      key={paddler.id} 
                      paddler={paddler} 
                      showWeight={showWeight}
                      showPerformanceMetrics={showPerformanceMetrics}
                      showGender={showGender}
                    />
                  ))}
                  {group.paddlers.length === 0 && (
                    <div className="text-center text-gray-400 py-4 text-xs">
                      No paddlers in this group
                    </div>
                  )}
                </DroppableAvailablePaddlers>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
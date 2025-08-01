'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Seat, Paddler } from '@/types';
import DragonBoatCanvas from './DragonBoatCanvas';
import RosterPanel from './RosterPanel';
import { DraggablePaddler } from './DragonBoatCanvas';

interface BoatLayoutWithRosterProps {
  seats: Seat[];
  onSeatUpdate: (seats: Seat[]) => void;
  availablePaddlers: Paddler[];
  onAutoAssign: () => void;
  onClearAll: () => void;
  onClearAllExceptLocked: () => void;
}

export default function BoatLayoutWithRoster({ 
  seats, 
  onSeatUpdate, 
  availablePaddlers, 
  onAutoAssign, 
  onClearAll, 
  onClearAllExceptLocked 
}: BoatLayoutWithRosterProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedPaddler, setDraggedPaddler] = useState<Paddler | null>(null);
  const [showWeight, setShowWeight] = useState(true);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(true);
  const [showGender, setShowGender] = useState(true);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const paddlerId = active.id as string;
    
    const seatPaddler = seats.find(s => s.paddler?.id === paddlerId)?.paddler;
    const availablePaddler = availablePaddlers.find(p => p.id === paddlerId);
    
    const draggedPaddler = seatPaddler || availablePaddler || null;
    setDraggedPaddler(draggedPaddler);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active) {
      setActiveId(null);
      setDraggedPaddler(null);
      return;
    }

    const sourcePaddlerId = active.id as string;
    const targetId = over.id as string;
    
    if (sourcePaddlerId === targetId) {
      setActiveId(null);
      setDraggedPaddler(null);
      return;
    }

    const newSeats = [...seats];
    
    // Check if dropping on available paddlers area (remove from seat)
    if (targetId === 'available-paddlers' || targetId === 'unassign-zone' || targetId === 'roster-panel') {
      const sourceSeatIndex = newSeats.findIndex(s => s.paddler?.id === sourcePaddlerId);
      
      if (sourceSeatIndex >= 0 && !newSeats[sourceSeatIndex].isLocked) {
        newSeats[sourceSeatIndex].paddler = undefined;
        onSeatUpdate(newSeats);
      }
      
      setActiveId(null);
      setDraggedPaddler(null);
      return;
    }
    
    // Check if dropping on a seat
    const targetMatch = targetId.match(/seat-(\d+)-(Left|Right)/);
    if (targetMatch) {
      const targetRow = parseInt(targetMatch[1]);
      const targetSide = targetMatch[2] as 'Left' | 'Right';
      
      const targetSeatIndex = newSeats.findIndex(s => s.row === targetRow && s.side === targetSide);
      const targetSeat = newSeats[targetSeatIndex];
      
      if (targetSeat.isLocked) {
        setActiveId(null);
        setDraggedPaddler(null);
        return;
      }
      
      const sourceSeatIndex = newSeats.findIndex(s => s.paddler?.id === sourcePaddlerId);
      const sourcePaddler = sourceSeatIndex >= 0 
        ? newSeats[sourceSeatIndex].paddler 
        : availablePaddlers.find(p => p.id === sourcePaddlerId);
      
      if (!sourcePaddler) {
        setActiveId(null);
        setDraggedPaddler(null);
        return;
      }
      
      if (sourceSeatIndex >= 0) {
        const targetPaddler = targetSeat.paddler;
        newSeats[sourceSeatIndex].paddler = targetPaddler;
      }
      
      newSeats[targetSeatIndex].paddler = sourcePaddler;
      onSeatUpdate(newSeats);
    }
    
    setActiveId(null);
    setDraggedPaddler(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-5 gap-6">
        {/* Center Panel: Dragon Boat Canvas */}
        <div className="col-span-3" id="boat-layout">
          <DragonBoatCanvas
            seats={seats}
            onSeatUpdate={onSeatUpdate}
            availablePaddlers={availablePaddlers}
            onAutoAssign={onAutoAssign}
            onClearAll={onClearAll}
            onClearAllExceptLocked={onClearAllExceptLocked}
            showWeight={showWeight}
            setShowWeight={setShowWeight}
            showPerformanceMetrics={showPerformanceMetrics}
            setShowPerformanceMetrics={setShowPerformanceMetrics}
            showGender={showGender}
            setShowGender={setShowGender}
            isDragging={!!activeId}
          />
        </div>

        {/* Right Panel: Roster */}
        <div className="col-span-2">
          <RosterPanel 
            seats={seats}
            availablePaddlers={availablePaddlers}
            onSeatUpdate={onSeatUpdate}
            showWeight={showWeight}
            setShowWeight={setShowWeight}
            showPerformanceMetrics={showPerformanceMetrics}
            setShowPerformanceMetrics={setShowPerformanceMetrics}
            showGender={showGender}
            setShowGender={setShowGender}
          />
        </div>
      </div>

      <DragOverlay 
        dropAnimation={null}
        style={{
          cursor: 'grabbing',
        }}
      >
        {draggedPaddler && (
          <div 
            className="pointer-events-none transform rotate-3 scale-110 shadow-2xl ring-4 ring-blue-400 ring-opacity-75"
            style={{
              transform: 'translate(-50%, -50%) rotate(3deg) scale(1.1)',
            }}
          >
            <DraggablePaddler 
              paddler={draggedPaddler} 
              showWeight={showWeight}
              showPerformanceMetrics={showPerformanceMetrics}
              showGender={showGender}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
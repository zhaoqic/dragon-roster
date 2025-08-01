'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Seat, Paddler } from '@/types';
import { Lock, Unlock } from 'lucide-react';

interface DragonBoatCanvasProps {
  seats: Seat[];
  onSeatUpdate: (seats: Seat[]) => void;
  availablePaddlers: Paddler[];
  onAutoAssign: () => void;
  onClearAll: () => void;
  onClearAllExceptLocked: () => void;
  showWeight: boolean;
  setShowWeight: (show: boolean) => void;
  showPerformanceMetrics: boolean;
  setShowPerformanceMetrics: (show: boolean) => void;
  showGender: boolean;
  setShowGender: (show: boolean) => void;
  isDragging: boolean;
}

interface DraggablePaddlerProps {
  paddler: Paddler;
  isInSeat?: boolean;
  showWeight?: boolean;
  showPerformanceMetrics?: boolean;
  showGender?: boolean;
}

export function DraggablePaddler({ 
  paddler, 
  isInSeat = false, 
  showWeight = true, 
  showPerformanceMetrics = true,
  showGender = true
}: DraggablePaddlerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: paddler.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        rounded-md select-none text-xs transition-all duration-200 ease-in-out relative
        cursor-grab hover:cursor-grabbing
        ${isDragging ? 'opacity-50 scale-105 shadow-lg rotate-2' : 'opacity-100 hover:shadow-md'}
        ${isInSeat 
          ? 'min-h-[48px] w-full bg-blue-100 border border-blue-300 hover:bg-blue-200 p-2' 
          : 'min-h-[56px] w-36 bg-gray-100 border border-gray-300 hover:bg-gray-200 p-2'
        }
      `}
      title={isInSeat ? "Drag to move or unassign" : "Drag to assign to seat"}
    >
      {/* Drag handle indicator */}
      <div
        className="absolute top-1 right-1 w-4 h-4 opacity-60 hover:opacity-100 flex items-center justify-center pointer-events-none"
        title="Drag handle"
      >
        <div className="text-gray-500 text-xs">⠿</div>
      </div>
      
      {/* Card content */}
      <div className={isInSeat ? "pr-4" : "pr-5"}>
        <div className="font-medium truncate">
          {showGender && `(${paddler.gender === 'Male' ? 'M' : paddler.gender === 'Female' ? 'F' : 'X'}) `}{paddler.name}
        </div>
        <div className="text-gray-600 mt-1">
          {paddler.preferredSide === 'Left' ? 'L' : paddler.preferredSide === 'Right' ? 'R' : 'A'}
          {showPerformanceMetrics && ` S${paddler.strengthScore} E${paddler.experienceScore}`}
          {showWeight && ` ${paddler.weight}kg`}
        </div>
      </div>
    </div>
  );
}

interface SeatComponentProps {
  seat: Seat;
  onToggleLock: (row: number, side: 'Left' | 'Right') => void;
  showWeight?: boolean;
  showPerformanceMetrics?: boolean;
  showGender?: boolean;
}

function SeatComponent({ 
  seat, 
  onToggleLock, 
  showWeight = true, 
  showPerformanceMetrics = true,
  showGender = true
}: SeatComponentProps) {
  const isEmpty = !seat.paddler;
  const isLocked = seat.isLocked;
  
  const { isOver, setNodeRef } = useDroppable({
    id: `seat-${seat.row}-${seat.side}`,
  });
  
  const getDropZoneStyles = () => {
    if (isLocked) {
      return isOver 
        ? 'border-red-500 bg-red-100 border-solid shadow-xl transform scale-110 ring-4 ring-red-400 ring-opacity-75 animate-pulse' 
        : 'border-red-300 bg-red-50';
    }
    
    if (isEmpty) {
      return isOver 
        ? 'border-green-500 bg-green-100 border-solid shadow-xl transform scale-110 ring-4 ring-green-400 ring-opacity-75 animate-pulse' 
        : 'border-dashed border-gray-300 bg-gray-50';
    } else {
      return isOver 
        ? 'border-blue-500 bg-blue-200 border-solid shadow-xl transform scale-110 ring-4 ring-blue-400 ring-opacity-75 animate-pulse' 
        : 'border-blue-300 bg-blue-50';
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      className={`
        relative border-2 rounded-md min-h-[64px] w-40 transition-all duration-200 ease-in-out p-2
        ${getDropZoneStyles()}
      `}
    >
      <button
        onClick={() => onToggleLock(seat.row, seat.side)}
        className="absolute -top-1 -right-1 p-1 rounded-full bg-white shadow-sm border hover:bg-gray-50 z-20"
      >
        {isLocked ? <Lock size={12} className="text-red-600" /> : <Unlock size={12} className="text-gray-600" />}
      </button>
      
      {seat.paddler ? (
        <DraggablePaddler 
          paddler={seat.paddler} 
          isInSeat 
          showWeight={showWeight}
          showPerformanceMetrics={showPerformanceMetrics}
          showGender={showGender}
        />
      ) : (
        <div className="text-gray-400 text-xs text-center flex items-center justify-center h-full">
          {seat.side} {seat.row}
        </div>
      )}
    </div>
  );
}

export default function DragonBoatCanvas({ 
  seats, 
  onSeatUpdate, 
  availablePaddlers, 
  onAutoAssign, 
  onClearAll, 
  onClearAllExceptLocked,
  showWeight,
  setShowWeight,
  showPerformanceMetrics,
  setShowPerformanceMetrics,
  showGender,
  setShowGender,
  isDragging
}: DragonBoatCanvasProps) {


  const handleToggleLock = (row: number, side: 'Left' | 'Right') => {
    const newSeats = [...seats];
    const seatIndex = newSeats.findIndex(s => s.row === row && s.side === side);
    if (seatIndex >= 0) {
      newSeats[seatIndex].isLocked = !newSeats[seatIndex].isLocked;
      onSeatUpdate(newSeats);
    }
  };

  const UnassignZone = ({ children }: { children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: 'unassign-zone',
    });

    // Check if we're dragging (general drag state)
    const isDraggingAssignedPaddler = isDragging;

    return (
      <div
        ref={isDraggingAssignedPaddler ? setNodeRef : null}
        className={`
          bg-white rounded-lg shadow-md p-6 transition-all duration-200 ease-in-out relative
          ${isDraggingAssignedPaddler 
            ? `${isOver 
                ? 'bg-orange-50 ring-4 ring-orange-400 ring-opacity-75 shadow-xl border-2 border-orange-300 border-dashed' 
                : 'bg-orange-25 ring-2 ring-orange-200 ring-opacity-50 border border-orange-200'
              }`
            : ''
          }
        `}
      >
        {children}
        {isDraggingAssignedPaddler && isOver && (
          <div className="absolute inset-0 bg-orange-100 bg-opacity-30 pointer-events-none flex items-center justify-center rounded-lg z-40">
            <div className="text-orange-800 text-2xl font-bold animate-bounce drop-shadow-lg bg-white px-6 py-3 rounded-lg shadow-xl">
              🎯 Release to unassign paddler
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <UnassignZone>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Line Up ({seats.filter(s => s.paddler).length}/20)</h3>
          
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={onAutoAssign}
                disabled={availablePaddlers.length === 0}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Auto Assign (Beta)
              </button>
              <button
                onClick={onClearAll}
                className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                Clear All
              </button>
              <button
                onClick={onClearAllExceptLocked}
                className="px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
              >
                Clear Unlocked Seats
              </button>
            </div>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showGender}
                  onChange={(e) => setShowGender(e.target.checked)}
                  className="rounded"
                />
                Show Gender
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showWeight}
                  onChange={(e) => setShowWeight(e.target.checked)}
                  className="rounded"
                />
                Show Weight
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPerformanceMetrics}
                  onChange={(e) => setShowPerformanceMetrics(e.target.checked)}
                  className="rounded"
                />
                Show Performance
              </label>
            </div>
          </div>
        </div>
      
        <div className="bg-white rounded-lg border p-4">
          
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600 mb-4">
              🥁 Front of Boat (Drummer's Position)
            </div>
            
            <div className="space-y-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(row => {
                const leftSeat = seats.find(s => s.row === row && s.side === 'Left');
                const rightSeat = seats.find(s => s.row === row && s.side === 'Right');
                
                let zoneInfo = { name: '', color: '', description: '' };
                if ([1, 2, 3].includes(row)) {
                  zoneInfo = { 
                    name: 'Timing Box', 
                    color: 'bg-blue-50 border-blue-200', 
                    description: 'Row 1-3' 
                  };
                } else if ([4, 5, 6, 7].includes(row)) {
                  zoneInfo = { 
                    name: 'Engine Room', 
                    color: 'bg-red-50 border-red-200', 
                    description: 'Row 4-7' 
                  };
                } else if ([8, 9, 10].includes(row)) {
                  zoneInfo = { 
                    name: 'Rocket', 
                    color: 'bg-yellow-50 border-yellow-200', 
                    description: 'Row 8-10' 
                  };
                }
                
                return (
                  <div key={row}>
                    {([1, 4, 8].includes(row)) && (
                      <div className={`text-center py-1 px-4 mb-1 rounded-md text-xs font-medium ${zoneInfo.color}`}>
                        {zoneInfo.name} - {zoneInfo.description}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <div className="w-6 text-center text-xs font-medium text-gray-600">
                        {row}
                      </div>
                      
                      {leftSeat && (
                        <SeatComponent 
                          seat={leftSeat} 
                          onToggleLock={handleToggleLock}
                          showWeight={showWeight}
                          showPerformanceMetrics={showPerformanceMetrics}
                          showGender={showGender}
                        />
                      )}
                      
                      <div className="w-6 border-t border-gray-300"></div>
                      
                      {rightSeat && (
                        <SeatComponent 
                          seat={rightSeat} 
                          onToggleLock={handleToggleLock}
                          showWeight={showWeight}
                          showPerformanceMetrics={showPerformanceMetrics}
                          showGender={showGender}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center text-sm text-gray-600 mt-4">
              🚣 Back of Boat (Steersperson's Position)
            </div>
          </div>
        </div>
      </UnassignZone>
  );
}
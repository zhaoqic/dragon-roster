'use client';

import { Paddler } from '@/types';
import { X } from 'lucide-react';

interface PaddlerListProps {
  paddlers: Paddler[];
  onRemovePaddler: (id: string) => void;
}

export default function PaddlerList({ paddlers, onRemovePaddler }: PaddlerListProps) {
  if (paddlers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Paddlers (0/20)</h2>
        <div className="text-center text-gray-500 py-8">
          No paddlers added yet. Use the forms on the right to add paddlers.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Paddlers ({paddlers.length}/20)
      </h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {paddlers.map((paddler) => (
          <div
            key={paddler.id}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{paddler.name}</div>
              <div className="text-sm text-gray-600">
                {paddler.weight}kg, {paddler.preferredSide} side
                <span className="ml-2">
                  Str: {paddler.strengthScore}, Exp: {paddler.experienceScore}
                </span>
              </div>
            </div>
            <button
              onClick={() => onRemovePaddler(paddler.id)}
              className="text-red-600 hover:text-red-800 p-1"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
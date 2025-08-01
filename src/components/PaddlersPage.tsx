'use client';

import { Paddler } from '@/types';
import PaddlerList from './PaddlerList';
import IndividualPaddlerForm from './IndividualPaddlerForm';
import BatchUploadForm from './BatchUploadForm';

interface PaddlersPageProps {
  onAddPaddler: (paddler: Paddler) => void;
  paddlers: Paddler[];
  onRemovePaddler: (id: string) => void;
  onBatchAddPaddlers: (paddlers: Paddler[]) => void;
}

export default function PaddlersPage({ 
  onAddPaddler, 
  paddlers, 
  onRemovePaddler, 
  onBatchAddPaddlers 
}: PaddlersPageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* First Column: Paddler List */}
      <div className="lg:col-span-1">
        <PaddlerList 
          paddlers={paddlers} 
          onRemovePaddler={onRemovePaddler} 
        />
      </div>
      
      {/* Second Column: Forms (sticky) */}
      <div className="lg:col-span-1 space-y-6">
        <BatchUploadForm
          paddlers={paddlers}
          onBatchAddPaddlers={onBatchAddPaddlers}
        />
        <IndividualPaddlerForm onAddPaddler={onAddPaddler} />
      </div>
    </div>
  );
}
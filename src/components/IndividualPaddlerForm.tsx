'use client';

import { useState } from 'react';
import { Paddler, PreferredSide } from '@/types';
import { Plus } from 'lucide-react';

interface IndividualPaddlerFormProps {
  onAddPaddler: (paddler: Paddler) => void;
}

export default function IndividualPaddlerForm({ onAddPaddler }: IndividualPaddlerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    weight: '',
    preferredSide: 'Ambi' as PreferredSide,
    strengthScore: '3',
    experienceScore: '3'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.weight) {
      alert('Please fill in all required fields');
      return;
    }

    const paddler: Paddler = {
      id: Date.now().toString(),
      name: formData.name,
      gender: formData.gender,
      weight: parseFloat(formData.weight),
      preferredSide: formData.preferredSide,
      strengthScore: parseInt(formData.strengthScore),
      experienceScore: parseInt(formData.experienceScore)
    };

    onAddPaddler(paddler);
    
    setFormData({
      name: '',
      gender: 'Male',
      weight: '',
      preferredSide: 'Ambi',
      strengthScore: '3',
      experienceScore: '3'
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Add Individual Paddler</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">X</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg) *
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="30"
              max="150"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Side
            </label>
            <select
              value={formData.preferredSide}
              onChange={(e) => handleInputChange('preferredSide', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Ambi">Ambi</option>
              <option value="Left">Left</option>
              <option value="Right">Right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strength Score (1-5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.strengthScore}
              onChange={(e) => handleInputChange('strengthScore', e.target.value)}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">
              {formData.strengthScore === '1' && '1: Light'}
              {formData.strengthScore === '2' && '2: Developing'}
              {formData.strengthScore === '3' && '3: Solid'}
              {formData.strengthScore === '4' && '4: Strong'}
              {formData.strengthScore === '5' && '5: Beast'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience Score (1-5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.experienceScore}
              onChange={(e) => handleInputChange('experienceScore', e.target.value)}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">
              {formData.experienceScore === '1' && '1: Beginner'}
              {formData.experienceScore === '2' && '2: Novice'}
              {formData.experienceScore === '3' && '3: Intermediate'}
              {formData.experienceScore === '4' && '4: Advanced'}
              {formData.experienceScore === '5' && '5: Elite'}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Paddler
        </button>
      </form>
    </div>
  );
}
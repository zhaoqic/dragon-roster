export type PreferredSide = 'Left' | 'Right' | 'Ambi';

export interface Paddler {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  weight: number; // kg
  preferredSide: PreferredSide;
  strengthScore: number; // 1-5
  experienceScore: number; // 1-5
}

export interface Seat {
  row: number; // 1-10
  side: 'Left' | 'Right';
  paddler?: Paddler;
  isLocked?: boolean; // for manual overrides
}

export interface BoatLineup {
  id: string;
  name: string;
  seats: Seat[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentMetrics {
  totalWeightLeft: number;
  totalWeightRight: number;
  weightImbalance: number;
  averageStrengthPerRow: number[];
  sidePreferencesSatisfied: number;
  totalSidePreferences: number;
  warnings: string[];
}

export interface AssignmentConfig {
  prioritizeExperienceInFront: boolean;
  prioritizeStrengthInBack: boolean;
  balanceWeight: boolean;
  respectSidePreferences: boolean;
}
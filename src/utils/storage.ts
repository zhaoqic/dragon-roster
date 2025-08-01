import { BoatLineup, Paddler, Seat } from '@/types';

const STORAGE_KEYS = {
  LINEUPS: 'dragonboat_lineups',
  PADDLERS: 'dragonboat_paddlers',
  CURRENT_STATE: 'dragonboat_current_state'
};

export class StorageManager {
  static saveLineup(lineup: BoatLineup): void {
    try {
      const existingLineups = this.getLineups();
      const updatedLineups = existingLineups.filter(l => l.id !== lineup.id);
      updatedLineups.push({
        ...lineup,
        updatedAt: new Date()
      });
      
      localStorage.setItem(STORAGE_KEYS.LINEUPS, JSON.stringify(updatedLineups));
    } catch (error) {
      console.error('Failed to save lineup:', error);
      throw new Error('Failed to save lineup to local storage');
    }
  }

  static getLineups(): BoatLineup[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LINEUPS);
      if (!stored) return [];
      
      const lineups = JSON.parse(stored);
      return lineups.map((lineup: any) => ({
        ...lineup,
        createdAt: new Date(lineup.createdAt),
        updatedAt: new Date(lineup.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load lineups:', error);
      return [];
    }
  }

  static deleteLineup(lineupId: string): void {
    try {
      const existingLineups = this.getLineups();
      const updatedLineups = existingLineups.filter(l => l.id !== lineupId);
      localStorage.setItem(STORAGE_KEYS.LINEUPS, JSON.stringify(updatedLineups));
    } catch (error) {
      console.error('Failed to delete lineup:', error);
      throw new Error('Failed to delete lineup from local storage');
    }
  }

  static savePaddlers(paddlers: Paddler[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PADDLERS, JSON.stringify(paddlers));
    } catch (error) {
      console.error('Failed to save paddlers:', error);
      throw new Error('Failed to save paddlers to local storage');
    }
  }

  static getPaddlers(): Paddler[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PADDLERS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load paddlers:', error);
      return [];
    }
  }

  static exportLineupAsCSV(lineup: BoatLineup): string {
    const headers = [
      'Row',
      'Side',
      'Name',
      'Gender',
      'Weight (kg)',
      'Preferred Side',
      'Strength Score',
      'Experience Score',
      'Locked'
    ];

    const rows = lineup.seats.map(seat => [
      seat.row.toString(),
      seat.side,
      seat.paddler?.name || '',
      seat.paddler?.gender || '',
      seat.paddler?.weight?.toString() || '',
      seat.paddler?.preferredSide || '',
      seat.paddler?.strengthScore?.toString() || '',
      seat.paddler?.experienceScore?.toString() || '',
      seat.isLocked ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static createLineupFromSeats(name: string, seats: Seat[]): BoatLineup {
    return {
      id: Date.now().toString(),
      name,
      seats: seats.map(seat => ({
        ...seat,
        paddler: seat.paddler ? { ...seat.paddler } : undefined
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Current state management for auto-save/restore
  static saveCurrentState(seats: Seat[]): void {
    try {
      const currentState = {
        seats: seats.map(seat => ({
          ...seat,
          paddler: seat.paddler ? { ...seat.paddler } : undefined
        })),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.CURRENT_STATE, JSON.stringify(currentState));
    } catch (error) {
      console.error('Failed to save current state:', error);
    }
  }

  static getCurrentState(): Seat[] | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_STATE);
      if (!stored) return null;
      
      const currentState = JSON.parse(stored);
      return currentState.seats || null;
    } catch (error) {
      console.error('Failed to load current state:', error);
      return null;
    }
  }

  static clearCurrentState(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STATE);
    } catch (error) {
      console.error('Failed to clear current state:', error);
    }
  }
}
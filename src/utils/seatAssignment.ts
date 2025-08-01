import { Paddler, Seat, AssignmentMetrics, AssignmentConfig } from '@/types';

export class SeatAssignmentAlgorithm {
  private paddlers: Paddler[];
  private config: AssignmentConfig;

  // Dragon boat zones
  private readonly TIMING_BOX = [1, 2, 3];   // Timing Box: rhythm and technique
  private readonly ENGINE_ROOM = [4, 5, 6, 7]; // Engine Room: primary power
  private readonly ROCKET = [8, 9, 10];      // Rocket: acceleration and power

  constructor(paddlers: Paddler[], config: AssignmentConfig) {
    this.paddlers = [...paddlers];
    this.config = config;
  }

  assignSeats(currentSeats?: Seat[]): Seat[] {
    if (this.paddlers.length === 0) {
      return currentSeats || this.createEmptySeats();
    }

    // Use current seats if provided, otherwise create empty ones
    const seats = currentSeats ? [...currentSeats] : this.createEmptySeats();
    
    // Filter out paddlers that are already assigned to locked seats
    const lockedPaddlerIds = new Set(
      seats.filter(s => s.isLocked && s.paddler).map(s => s.paddler!.id)
    );
    
    const availablePaddlers = this.paddlers.filter(p => !lockedPaddlerIds.has(p.id));

    // Professional dragon boat positioning strategy
    this.assignTimingBox(seats, availablePaddlers);
    this.assignEngineRoom(seats, availablePaddlers);
    this.assignRocket(seats, availablePaddlers);
    this.assignRemainingPaddlers(seats, availablePaddlers);

    if (this.config.balanceWeight) {
      this.optimizeWeightBalance(seats);
    }

    return seats;
  }

  private createEmptySeats(): Seat[] {
    const seats: Seat[] = [];
    for (let row = 1; row <= 10; row++) {
      seats.push({ row, side: 'Left' });
      seats.push({ row, side: 'Right' });
    }
    return seats;
  }

  // Timing Box (Rows 1-3): Best timing, technique, prefer lighter paddlers
  private assignTimingBox(seats: Seat[], availablePaddlers: Paddler[]) {
    if (!this.config.prioritizeExperienceInFront) return;

    const timingBoxCandidates = availablePaddlers
      .filter(p => p.experienceScore >= 4) // High experience for rhythm (4-5 on 1-5 scale)
      .sort((a, b) => {
        // Sort by experience first, then prefer lighter paddlers
        const experienceDiff = b.experienceScore - a.experienceScore;
        if (experienceDiff !== 0) return experienceDiff;
        return a.weight - b.weight; // Prefer lighter for timing box
      });

    this.assignToZone(seats, availablePaddlers, this.TIMING_BOX, timingBoxCandidates, 'timing');
  }

  // Engine Room (Rows 4-7): Strongest paddlers, medium to heavier build
  private assignEngineRoom(seats: Seat[], availablePaddlers: Paddler[]) {
    const engineRoomCandidates = availablePaddlers
      .sort((a, b) => {
        // Prioritize strength, then prefer medium to heavier paddlers
        const strengthDiff = b.strengthScore - a.strengthScore;
        if (strengthDiff !== 0) return strengthDiff;
        return b.weight - a.weight; // Prefer heavier for engine room power
      });

    this.assignToZone(seats, availablePaddlers, this.ENGINE_ROOM, engineRoomCandidates, 'power');
  }

  // Rocket (Rows 8-10): Strong, explosive paddlers, slightly heavier for stability
  private assignRocket(seats: Seat[], availablePaddlers: Paddler[]) {
    if (!this.config.prioritizeStrengthInBack) return;

    const rocketCandidates = availablePaddlers
      .filter(p => p.strengthScore >= 4) // Strong paddlers for acceleration (4-5 on 1-5 scale)
      .sort((a, b) => {
        // Sort by strength, then prefer slightly heavier for bow lift
        const strengthDiff = b.strengthScore - a.strengthScore;
        if (strengthDiff !== 0) return strengthDiff;
        return b.weight - a.weight; // Prefer heavier for rocket zone stability
      });

    this.assignToZone(seats, availablePaddlers, this.ROCKET, rocketCandidates, 'rocket');
  }

  private assignToZone(
    seats: Seat[], 
    availablePaddlers: Paddler[], 
    zoneRows: number[], 
    candidates: Paddler[],
    zoneType: 'timing' | 'power' | 'rocket'
  ) {
    for (const row of zoneRows) {
      for (const side of ['Left', 'Right'] as const) {
        if (candidates.length === 0) break;
        
        const seatIndex = seats.findIndex(s => s.row === row && s.side === side);
        const seat = seats[seatIndex];
        
        // Skip if seat is locked or already has a paddler
        if (seat.isLocked || seat.paddler) continue;
        
        const paddler = this.findBestPaddlerForZone(candidates, side, zoneType);
        
        if (paddler) {
          seat.paddler = paddler;
          const paddlerIndex = availablePaddlers.findIndex(p => p.id === paddler.id);
          availablePaddlers.splice(paddlerIndex, 1);
          candidates.splice(candidates.findIndex(p => p.id === paddler.id), 1);
        }
      }
    }
  }

  private assignRemainingPaddlers(seats: Seat[], availablePaddlers: Paddler[]) {
    const emptySeats = seats.filter(s => !s.paddler && !s.isLocked);
    
    for (const seat of emptySeats) {
      if (availablePaddlers.length === 0) break;
      
      const paddler = this.findBestPaddlerForSeat(availablePaddlers, seat.side);
      
      if (paddler) {
        seat.paddler = paddler;
        const paddlerIndex = availablePaddlers.findIndex(p => p.id === paddler.id);
        availablePaddlers.splice(paddlerIndex, 1);
      }
    }
  }

  private findBestPaddlerForZone(
    paddlers: Paddler[], 
    side: 'Left' | 'Right', 
    zoneType: 'timing' | 'power' | 'rocket'
  ): Paddler | null {
    if (paddlers.length === 0) return null;

    // PRIORITY 1: Side preferences are MOST important
    const exactPreferencePaddlers = paddlers.filter(p => p.preferredSide === side);
    const ambiPaddlers = paddlers.filter(p => p.preferredSide === 'Ambi');
    const wrongSidePaddlers = paddlers.filter(p => p.preferredSide !== side && p.preferredSide !== 'Ambi');

    // Try exact preference first, then ambi, then wrong side as last resort
    const priorityGroups = [exactPreferencePaddlers, ambiPaddlers, wrongSidePaddlers];

    for (const group of priorityGroups) {
      if (group.length === 0) continue;

      // Within each preference group, find best by zone score
      const bestInGroup = group.reduce((best, current) => {
        const bestScore = this.calculateZoneScore(best, zoneType);
        const currentScore = this.calculateZoneScore(current, zoneType);
        return currentScore > bestScore ? current : best;
      });

      return bestInGroup;
    }

    return null;
  }

  private findBestPaddlerForSeat(paddlers: Paddler[], side: 'Left' | 'Right'): Paddler | null {
    return this.findBestPaddlerForZone(paddlers, side, 'power');
  }

  private calculateZoneScore(paddler: Paddler, zoneType: 'timing' | 'power' | 'rocket'): number {
    switch (zoneType) {
      case 'timing':
        // Timing Box: Prioritize experience, prefer lighter paddlers
        return paddler.experienceScore * 2 + (5 - Math.min(paddler.weight / 20, 5));
      
      case 'power':
        // Engine Room: Balance strength and experience, prefer heavier paddlers
        return paddler.strengthScore * 1.5 + paddler.experienceScore + (paddler.weight / 20);
      
      case 'rocket':
        // Rocket: Prioritize strength, prefer heavier paddlers for stability
        return paddler.strengthScore * 2 + (paddler.weight / 15);
      
      default:
        return (paddler.strengthScore + paddler.experienceScore) / 2;
    }
  }

  private optimizeWeightBalance(seats: Seat[]) {
    const iterations = 5;
    
    for (let i = 0; i < iterations; i++) {
      const currentMetrics = this.calculateMetrics(seats);
      
      // Check both side-to-side and front-back balance
      const sideImbalance = Math.abs(currentMetrics.weightImbalance);
      const frontBackImbalance = this.calculateFrontBackImbalance(seats);
      
      if (sideImbalance < 5 && frontBackImbalance < 15) break;
      
      // Optimize side-to-side balance
      if (sideImbalance >= 5) {
        this.optimizeSideToSideBalance(seats, currentMetrics);
      }
      
      // Optimize front-back balance (avoid clustering heavy paddlers)
      if (frontBackImbalance >= 15) {
        this.optimizeFrontBackBalance(seats);
      }
    }
  }

  private optimizeSideToSideBalance(seats: Seat[], currentMetrics: AssignmentMetrics) {
    // Only swap paddlers within same side to respect side preferences
    // Try swapping left paddlers with other left paddlers of different weights
    const leftSeats = seats.filter(s => s.side === 'Left' && s.paddler && !s.isLocked);
    const rightSeats = seats.filter(s => s.side === 'Right' && s.paddler && !s.isLocked);
    
    // Try swapping within left side first
    for (let i = 0; i < leftSeats.length; i++) {
      for (let j = i + 1; j < leftSeats.length; j++) {
        const seat1 = leftSeats[i];
        const seat2 = leftSeats[j];
        
        const originalImbalance = Math.abs(currentMetrics.weightImbalance);
        
        const tempPaddler1 = seat1.paddler;
        const tempPaddler2 = seat2.paddler;
        
        seat1.paddler = tempPaddler2;
        seat2.paddler = tempPaddler1;
        
        const newMetrics = this.calculateMetrics(seats);
        const newImbalance = Math.abs(newMetrics.weightImbalance);
        
        if (newImbalance >= originalImbalance) {
          // Revert if no improvement
          seat1.paddler = tempPaddler1;
          seat2.paddler = tempPaddler2;
        } else {
          return; // Found improvement, exit
        }
      }
    }
    
    // Try swapping within right side
    for (let i = 0; i < rightSeats.length; i++) {
      for (let j = i + 1; j < rightSeats.length; j++) {
        const seat1 = rightSeats[i];
        const seat2 = rightSeats[j];
        
        const originalImbalance = Math.abs(currentMetrics.weightImbalance);
        
        const tempPaddler1 = seat1.paddler;
        const tempPaddler2 = seat2.paddler;
        
        seat1.paddler = tempPaddler2;
        seat2.paddler = tempPaddler1;
        
        const newMetrics = this.calculateMetrics(seats);
        const newImbalance = Math.abs(newMetrics.weightImbalance);
        
        if (newImbalance >= originalImbalance) {
          // Revert if no improvement
          seat1.paddler = tempPaddler1;
          seat2.paddler = tempPaddler2;
        } else {
          return; // Found improvement, exit
        }
      }
    }
  }

  private optimizeFrontBackBalance(seats: Seat[]) {
    // Prevent heavy paddlers from clustering in one zone
    const frontZone = seats.filter(s => this.TIMING_BOX.includes(s.row) && s.paddler && !s.isLocked);
    const middleZone = seats.filter(s => this.ENGINE_ROOM.includes(s.row) && s.paddler && !s.isLocked);
    
    // Try swapping heavy paddlers from front to middle/back if needed
    const heavyFrontPaddlers = frontZone.filter(s => s.paddler && s.paddler.weight > 75);
    const lighterMiddlePaddlers = middleZone.filter(s => s.paddler && s.paddler.weight < 70);
    
    for (const heavySeat of heavyFrontPaddlers.slice(0, 2)) {
      for (const lighterSeat of lighterMiddlePaddlers.slice(0, 2)) {
        const temp = heavySeat.paddler;
        heavySeat.paddler = lighterSeat.paddler;
        lighterSeat.paddler = temp;
        break;
      }
    }
  }

  private calculateFrontBackImbalance(seats: Seat[]): number {
    const frontWeight = seats
      .filter(s => this.TIMING_BOX.includes(s.row) && s.paddler)
      .reduce((sum, s) => sum + (s.paddler?.weight || 0), 0);
    
    const backWeight = seats
      .filter(s => this.ROCKET.includes(s.row) && s.paddler)
      .reduce((sum, s) => sum + (s.paddler?.weight || 0), 0);
    
    return Math.abs(frontWeight - backWeight);
  }

  calculateMetrics(seats: Seat[]): AssignmentMetrics {
    const leftSeats = seats.filter(s => s.side === 'Left' && s.paddler);
    const rightSeats = seats.filter(s => s.side === 'Right' && s.paddler);
    
    const totalWeightLeft = leftSeats.reduce((sum, s) => sum + (s.paddler?.weight || 0), 0);
    const totalWeightRight = rightSeats.reduce((sum, s) => sum + (s.paddler?.weight || 0), 0);
    const weightImbalance = totalWeightLeft - totalWeightRight;
    
    const averageStrengthPerRow: number[] = [];
    for (let row = 1; row <= 10; row++) {
      const rowSeats = seats.filter(s => s.row === row && s.paddler);
      const avgStrength = rowSeats.length > 0 
        ? rowSeats.reduce((sum, s) => sum + (s.paddler?.strengthScore || 0), 0) / rowSeats.length
        : 0;
      averageStrengthPerRow.push(avgStrength);
    }
    
    const paddlersWithPreferences = seats
      .filter(s => s.paddler && s.paddler.preferredSide !== 'Ambi')
      .length;
    
    const satisfiedPreferences = seats
      .filter(s => s.paddler && (
        s.paddler.preferredSide === s.side || s.paddler.preferredSide === 'Ambi'
      ))
      .length;
    
    const warnings: string[] = [];
    
    // Side-to-side weight balance check
    if (Math.abs(weightImbalance) > 10) {
      warnings.push(`Side weight imbalance: ${Math.abs(weightImbalance).toFixed(1)}kg`);
    }
    
    // Front-back weight balance check
    const frontBackImbalance = this.calculateFrontBackImbalance(seats);
    if (frontBackImbalance > 20) {
      warnings.push(`Front-back weight imbalance: ${frontBackImbalance.toFixed(1)}kg`);
    }
    
    // Timing Box checks (Rows 1-3)
    const timingBoxSeats = seats.filter(s => this.TIMING_BOX.includes(s.row) && s.paddler);
    const timingBoxExperience = timingBoxSeats.length > 0 
      ? timingBoxSeats.reduce((sum, s) => sum + (s.paddler?.experienceScore || 0), 0) / timingBoxSeats.length
      : 0;
    
    if (timingBoxExperience < 4) {
      warnings.push('Timing Box (rows 1-3) needs more experienced paddlers to lead');
    }
    
    const heavyTimingBoxPaddlers = timingBoxSeats.filter(s => s.paddler && s.paddler.weight > 80);
    if (heavyTimingBoxPaddlers.length > 3) {
      warnings.push('Timing Box has too many heavy paddlers - prefer lighter for bow stability');
    }
    
    // Engine Room checks (Rows 4-7)
    const engineRoomSeats = seats.filter(s => this.ENGINE_ROOM.includes(s.row) && s.paddler);
    const engineRoomStrength = engineRoomSeats.length > 0 
      ? engineRoomSeats.reduce((sum, s) => sum + (s.paddler?.strengthScore || 0), 0) / engineRoomSeats.length
      : 0;
    
    if (engineRoomStrength < 3.5) {
      warnings.push('Engine Room (rows 4-7) needs stronger paddlers for power');
    }
    
    // Rocket checks (Rows 8-10)
    const rocketSeats = seats.filter(s => this.ROCKET.includes(s.row) && s.paddler);
    const rocketStrength = rocketSeats.length > 0 
      ? rocketSeats.reduce((sum, s) => sum + (s.paddler?.strengthScore || 0), 0) / rocketSeats.length
      : 0;
    
    // Weight clustering check
    const weightByZone = {
      timing: timingBoxSeats.reduce((sum, s) => sum + (s.paddler?.weight || 0), 0),
      engine: engineRoomSeats.reduce((sum, s) => sum + (s.paddler?.weight || 0), 0),
      rocket: rocketSeats.reduce((sum, s) => sum + (s.paddler?.weight || 0), 0)
    };
    
    const avgWeightPerPaddler = (weightByZone.timing + weightByZone.engine + weightByZone.rocket) / 
      (timingBoxSeats.length + engineRoomSeats.length + rocketSeats.length || 1);
    
    if (timingBoxSeats.length > 0 && (weightByZone.timing / timingBoxSeats.length) > avgWeightPerPaddler + 10) {
      warnings.push('Heavy paddlers clustered in Timing Box - redistribute for better balance');
    }
    
    return {
      totalWeightLeft,
      totalWeightRight,
      weightImbalance,
      averageStrengthPerRow,
      sidePreferencesSatisfied: satisfiedPreferences,
      totalSidePreferences: paddlersWithPreferences,
      warnings
    };
  }
}

export function assignSeats(paddlers: Paddler[], config: AssignmentConfig, currentSeats?: Seat[]): Seat[] {
  const algorithm = new SeatAssignmentAlgorithm(paddlers, config);
  return algorithm.assignSeats(currentSeats);
}

export function calculateMetrics(seats: Seat[]): AssignmentMetrics {
  const algorithm = new SeatAssignmentAlgorithm([], {
    prioritizeExperienceInFront: true,
    prioritizeStrengthInBack: true,
    balanceWeight: true,
    respectSidePreferences: true
  });
  return algorithm.calculateMetrics(seats);
}
import type { Vector2 } from "../engine/Vector2";
import type { ChainReactionData, ChainReactionResult } from "./MPManager";

export interface ChainReactionTarget {
  id: string;
  position: Vector2;
  crystalType: string;
  isActive: boolean;
  isBreaking: boolean;
}

export interface ChainTimingData {
  startTime: number;
  lastAddTime: number;
  optimalWindow: number; // Time window for perfect timing bonus (seconds)
  maxChainTime: number;  // Maximum time allowed for chain to continue (seconds)
}

/**
 * Tracks crystal chain reactions for MP reward calculation
 * Monitors chain sequences, timing, and bonus conditions
 */
export class ChainReactionTracker {
  private activeChains: Map<string, ChainReactionData> = new Map();
  private chainIdCounter: number = 0;
  private completedChains: ChainReactionResult[] = [];
  
  // Timing configuration
  private readonly OPTIMAL_TIMING_WINDOW = 0.5; // 0.5 seconds for perfect timing
  private readonly MAX_CHAIN_TIME = 3.0; // 3 seconds max for chain to continue
  private readonly CHAIN_DELAY_TOLERANCE = 0.3; // 0.3 seconds between chain reactions

  // Event callbacks
  private onChainStartCallbacks: Array<(chainId: string, crystal: ChainReactionTarget) => void> = [];
  private onChainExtendCallbacks: Array<(chainId: string, crystal: ChainReactionTarget, chainLength: number) => void> = [];
  private onChainCompleteCallbacks: Array<(result: ChainReactionResult) => void> = [];

  /**
   * Start tracking a new chain reaction
   */
  startChainTracking(crystal: ChainReactionTarget): string {
    const chainId = `chain_${this.chainIdCounter++}`;
    const currentTime = Date.now();

    const chainData: ChainReactionData = {
      id: chainId,
      crystals: [crystal.id],
      startTime: currentTime,
      lastAddTime: currentTime,
      isComplete: false,
      crystalTypes: new Set([crystal.crystalType])
    };

    this.activeChains.set(chainId, chainData);

    // Notify listeners
    this.onChainStartCallbacks.forEach(callback => callback(chainId, crystal));

    console.log(`Chain reaction started: ${chainId} with crystal ${crystal.id}`);
    return chainId;
  }

  /**
   * Add a crystal to an existing chain
   */
  addToChain(chainId: string, crystal: ChainReactionTarget): boolean {
    const chain = this.activeChains.get(chainId);
    if (!chain || chain.isComplete) {
      return false;
    }

    const currentTime = Date.now();
    const timeSinceLastAdd = (currentTime - chain.lastAddTime) / 1000;

    // Check if too much time has passed
    if (timeSinceLastAdd > this.CHAIN_DELAY_TOLERANCE) {
      console.log(`Chain ${chainId} timed out (${timeSinceLastAdd.toFixed(2)}s since last crystal)`);
      this.completeChain(chainId);
      return false;
    }

    // Add crystal to chain
    chain.crystals.push(crystal.id);
    chain.lastAddTime = currentTime;
    chain.crystalTypes.add(crystal.crystalType);

    const chainLength = chain.crystals.length;

    // Notify listeners
    this.onChainExtendCallbacks.forEach(callback => callback(chainId, crystal, chainLength));

    console.log(`Chain ${chainId} extended: ${chainLength} crystals`);
    return true;
  }

  /**
   * Complete a chain and calculate rewards
   */
  completeChain(chainId: string): ChainReactionResult | null {
    const chain = this.activeChains.get(chainId);
    if (!chain || chain.isComplete) {
      return null;
    }

    // Mark chain as complete
    chain.isComplete = true;

    const currentTime = Date.now();
    const totalChainTime = (currentTime - chain.startTime) / 1000;
    const chainLength = chain.crystals.length;

    // Calculate bonus multipliers
    const bonusMultipliers: string[] = [];

    // Perfect timing bonus (chain completed quickly)
    if (totalChainTime <= this.OPTIMAL_TIMING_WINDOW * chainLength) {
      bonusMultipliers.push('perfectTiming');
    }

    // All crystal types bonus (chain includes multiple crystal types)
    if (chain.crystalTypes.size > 1) {
      bonusMultipliers.push('allCrystalTypes');
    }

    // Create result
    const result: ChainReactionResult = {
      chainLength,
      mpReward: 0, // Will be calculated by MPManager
      bonusMultiplier: this.calculateBonusMultiplier(bonusMultipliers),
      specialEffects: this.determineSpecialEffects(chainLength, bonusMultipliers)
    };

    // Store completed chain
    this.completedChains.push(result);

    // Clean up
    this.activeChains.delete(chainId);

    // Notify listeners
    this.onChainCompleteCallbacks.forEach(callback => callback(result));

    console.log(`Chain ${chainId} completed: ${chainLength} crystals, ${bonusMultipliers.length} bonuses`);
    return result;
  }

  /**
   * Find or create chain for a crystal breaking
   */
  processChainReaction(crystal: ChainReactionTarget, nearbyChains: string[] = []): string {
    // Try to add to existing nearby chain
    for (const chainId of nearbyChains) {
      if (this.addToChain(chainId, crystal)) {
        return chainId;
      }
    }

    // Start new chain if no existing chain could be extended
    return this.startChainTracking(crystal);
  }

  /**
   * Get all active chains
   */
  getActiveChains(): ChainReactionData[] {
    return Array.from(this.activeChains.values());
  }

  /**
   * Get chain by ID
   */
  getChain(chainId: string): ChainReactionData | null {
    return this.activeChains.get(chainId) || null;
  }

  /**
   * Check if a chain is still active and can accept new crystals
   */
  isChainActive(chainId: string): boolean {
    const chain = this.activeChains.get(chainId);
    if (!chain || chain.isComplete) {
      return false;
    }

    const currentTime = Date.now();
    const timeSinceLastAdd = (currentTime - chain.lastAddTime) / 1000;

    return timeSinceLastAdd <= this.CHAIN_DELAY_TOLERANCE;
  }

  /**
   * Find nearby active chains that could be extended
   */
  findNearbyChains(_position: Vector2, _maxDistance: number = 100): string[] {
    const nearbyChains: string[] = [];

    for (const [chainId, chain] of this.activeChains) {
      if (chain.isComplete) continue;

      // Check if chain is still within timing window
      if (!this.isChainActive(chainId)) {
        this.completeChain(chainId);
        continue;
      }

      // For simplicity, we'll consider all active chains as "nearby"
      // In a more complex implementation, you'd check actual crystal positions
      nearbyChains.push(chainId);
    }

    return nearbyChains;
  }

  /**
   * Calculate total bonus multiplier from individual bonuses
   */
  private calculateBonusMultiplier(bonuses: string[]): number {
    const multipliers = {
      perfectTiming: 1.5,
      allCrystalTypes: 2.0,
      screenClear: 3.0
    };

    return bonuses.reduce((total, bonus) => {
      return total * (multipliers[bonus as keyof typeof multipliers] || 1);
    }, 1.0);
  }

  /**
   * Determine special effects based on chain properties
   */
  private determineSpecialEffects(chainLength: number, bonuses: string[]): string[] {
    const effects: string[] = [];

    if (chainLength >= 5) {
      effects.push('screen_pulse');
    }

    if (chainLength >= 7) {
      effects.push('chain_master');
    }

    if (chainLength >= 10) {
      effects.push('chain_legend');
    }

    if (bonuses.includes('perfectTiming')) {
      effects.push('perfect_timing_flash');
    }

    if (bonuses.includes('allCrystalTypes')) {
      effects.push('rainbow_burst');
    }

    if (bonuses.includes('screenClear')) {
      effects.push('screen_clear_celebration');
    }

    return effects;
  }

  /**
   * Clean up expired chains
   */
  update(_deltaTime: number): void {
    const currentTime = Date.now();
    const expiredChains: string[] = [];

    for (const [chainId, chain] of this.activeChains) {
      if (chain.isComplete) continue;

      const timeSinceLastAdd = (currentTime - chain.lastAddTime) / 1000;
      const totalChainTime = (currentTime - chain.startTime) / 1000;

      // Complete chain if it's been too long since last addition or total time exceeded
      if (timeSinceLastAdd > this.CHAIN_DELAY_TOLERANCE || totalChainTime > this.MAX_CHAIN_TIME) {
        expiredChains.push(chainId);
      }
    }

    // Complete expired chains
    for (const chainId of expiredChains) {
      this.completeChain(chainId);
    }
  }

  /**
   * Get statistics about chain reactions
   */
  getStatistics(): {
    totalChains: number;
    averageChainLength: number;
    longestChain: number;
    totalCrystalsInChains: number;
  } {
    if (this.completedChains.length === 0) {
      return {
        totalChains: 0,
        averageChainLength: 0,
        longestChain: 0,
        totalCrystalsInChains: 0
      };
    }

    const totalCrystals = this.completedChains.reduce((sum, chain) => sum + chain.chainLength, 0);
    const longestChain = Math.max(...this.completedChains.map(chain => chain.chainLength));

    return {
      totalChains: this.completedChains.length,
      averageChainLength: totalCrystals / this.completedChains.length,
      longestChain,
      totalCrystalsInChains: totalCrystals
    };
  }

  /**
   * Event subscription methods
   */
  onChainStart(callback: (chainId: string, crystal: ChainReactionTarget) => void): void {
    this.onChainStartCallbacks.push(callback);
  }

  onChainExtend(callback: (chainId: string, crystal: ChainReactionTarget, chainLength: number) => void): void {
    this.onChainExtendCallbacks.push(callback);
  }

  onChainComplete(callback: (result: ChainReactionResult) => void): void {
    this.onChainCompleteCallbacks.push(callback);
  }

  /**
   * Reset all chain data (for testing or new game)
   */
  reset(): void {
    this.activeChains.clear();
    this.completedChains = [];
    this.chainIdCounter = 0;
    console.log('Chain reaction tracker reset');
  }

  /**
   * Debug method to get current state
   */
  debugGetState(): {
    activeChains: number;
    completedChains: number;
    chainIdCounter: number;
  } {
    return {
      activeChains: this.activeChains.size,
      completedChains: this.completedChains.length,
      chainIdCounter: this.chainIdCounter
    };
  }
}
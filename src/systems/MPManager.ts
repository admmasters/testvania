// Core interfaces for MP (Magic Points) system
export interface MPRewardTable {
  singleCrystal: number;
  chainRewards: Record<number, number>;
  bonusMultipliers: {
    perfectTiming: number;
    allCrystalTypes: number;
    screenClear: number;
  };
}

export interface ChainReactionData {
  id: string;
  crystals: string[];
  startTime: number;
  lastAddTime: number;
  isComplete: boolean;
  crystalTypes: Set<string>;
}

export interface ChainReactionResult {
  chainLength: number;
  mpReward: number;
  bonusMultiplier: number;
  specialEffects: string[];
}

export interface MPGainEvent {
  amount: number;
  source: 'chain' | 'crystal' | 'bonus';
  position: { x: number; y: number };
  chainLength?: number;
  timestamp: number;
}

export interface MPPersistenceData {
  currentMP: number;
  maxMP: number;
  totalMPEarned: number;
  longestChain: number;
  abilitiesUnlocked: string[];
}

/**
 * Central manager for all MP (Magic Points) operations
 * Handles MP earning, spending, persistence, and chain reaction rewards
 */
export class MPManager {
  private currentMP: number = 0;
  private maxMP: number = 100;
  private totalMPEarned: number = 0;
  private longestChain: number = 0;
  private abilitiesUnlocked: Set<string> = new Set();
  
  // Event callbacks
  private onMPGainCallbacks: Array<(event: MPGainEvent) => void> = [];
  private onMPSpendCallbacks: Array<(amount: number, ability: string) => void> = [];
  private onMPCapacityChangeCallbacks: Array<(newMax: number) => void> = [];

  // Reward configuration
  private readonly rewardTable: MPRewardTable = {
    singleCrystal: 1,
    chainRewards: {
      2: 2,    // 2-chain: 2 MP
      3: 4,    // 3-chain: 4 MP  
      4: 8,    // 4-chain: 8 MP
      5: 16,   // 5-chain: 16 MP
      6: 32,   // 6-chain: 32 MP
      7: 50,   // 7+ chain: 50 MP
    },
    bonusMultipliers: {
      perfectTiming: 1.5,    // Chain completed within optimal time window
      allCrystalTypes: 2.0,  // Chain includes multiple crystal types
      screenClear: 3.0,      // Chain clears all crystals on screen
    }
  };

  constructor() {
    this.loadMP();
  }

  /**
   * Get current MP amount
   */
  getCurrentMP(): number {
    return this.currentMP;
  }

  /**
   * Get maximum MP capacity
   */
  getMaxMP(): number {
    return this.maxMP;
  }

  /**
   * Get MP as percentage (0.0 to 1.0)
   */
  getMPPercentage(): number {
    return this.maxMP > 0 ? this.currentMP / this.maxMP : 0;
  }

  /**
   * Award MP from various sources
   */
  awardMP(amount: number, source: 'chain' | 'crystal' | 'bonus', position: { x: number; y: number }, chainLength?: number): void {
    if (amount <= 0) return;

    this.currentMP = Math.min(this.maxMP, this.currentMP + amount);
    this.totalMPEarned += amount;

    // Track longest chain
    if (chainLength && chainLength > this.longestChain) {
      this.longestChain = chainLength;
    }

    // Create MP gain event
    const event: MPGainEvent = {
      amount,
      source,
      position,
      chainLength,
      timestamp: Date.now()
    };

    // Notify listeners
    this.onMPGainCallbacks.forEach(callback => callback(event));

    // Auto-save after MP changes
    this.saveMP();

    console.log(`MP awarded: +${amount} (${source}) | Total: ${this.currentMP}/${this.maxMP}`);
  }

  /**
   * Spend MP on abilities
   */
  spendMP(amount: number, ability: string): boolean {
    if (amount <= 0) return false;
    if (this.currentMP < amount) return false;

    this.currentMP -= amount;

    // Notify listeners
    this.onMPSpendCallbacks.forEach(callback => callback(amount, ability));

    // Auto-save after MP changes
    this.saveMP();

    console.log(`MP spent: -${amount} (${ability}) | Remaining: ${this.currentMP}/${this.maxMP}`);
    return true;
  }

  /**
   * Check if player can afford an ability
   */
  canAffordAbility(cost: number): boolean {
    return this.currentMP >= cost;
  }

  /**
   * Calculate MP reward for chain reactions
   */
  calculateChainReward(chainLength: number, bonusMultipliers: string[] = []): number {
    if (chainLength <= 1) {
      return this.rewardTable.singleCrystal;
    }

    // Get base reward for chain length
    let baseReward = this.rewardTable.chainRewards[chainLength];
    if (!baseReward) {
      // For chains longer than defined, use the highest reward
      const maxChainLength = Math.max(...Object.keys(this.rewardTable.chainRewards).map(Number));
      baseReward = this.rewardTable.chainRewards[maxChainLength];
    }

    // Apply bonus multipliers
    let totalMultiplier = 1.0;
    for (const bonus of bonusMultipliers) {
      if (bonus in this.rewardTable.bonusMultipliers) {
        totalMultiplier *= this.rewardTable.bonusMultipliers[bonus as keyof typeof this.rewardTable.bonusMultipliers];
      }
    }

    return Math.floor(baseReward * totalMultiplier);
  }

  /**
   * Process chain reaction and award MP
   */
  processChainReaction(chainLength: number, position: { x: number; y: number }, bonusMultipliers: string[] = []): ChainReactionResult {
    const mpReward = this.calculateChainReward(chainLength, bonusMultipliers);
    const bonusMultiplier = bonusMultipliers.length > 0 ? 
      bonusMultipliers.reduce((mult, bonus) => mult * (this.rewardTable.bonusMultipliers[bonus as keyof typeof this.rewardTable.bonusMultipliers] || 1), 1) : 1;

    // Award the MP
    this.awardMP(mpReward, 'chain', position, chainLength);

    // Determine special effects based on chain length
    const specialEffects: string[] = [];
    if (chainLength >= 5) {
      specialEffects.push('screen_pulse');
    }
    if (chainLength >= 7) {
      specialEffects.push('chain_master');
    }
    if (bonusMultipliers.includes('screenClear')) {
      specialEffects.push('screen_clear_bonus');
    }

    return {
      chainLength,
      mpReward,
      bonusMultiplier,
      specialEffects
    };
  }

  /**
   * Increase maximum MP capacity
   */
  increaseMaxMP(amount: number): void {
    if (amount <= 0) return;

    this.maxMP += amount;
    this.onMPCapacityChangeCallbacks.forEach(callback => callback(this.maxMP));
    this.saveMP();

    console.log(`MP capacity increased by ${amount} | New max: ${this.maxMP}`);
  }

  /**
   * Restore MP (for level completion, items, etc.)
   */
  restoreMP(amount: number): void {
    if (amount <= 0) return;

    const previousMP = this.currentMP;
    this.currentMP = Math.min(this.maxMP, this.currentMP + amount);
    
    if (this.currentMP > previousMP) {
      this.saveMP();
      console.log(`MP restored: +${this.currentMP - previousMP} | Total: ${this.currentMP}/${this.maxMP}`);
    }
  }

  /**
   * Get statistics for display
   */
  getStatistics(): { totalEarned: number; longestChain: number; abilitiesUnlocked: number } {
    return {
      totalEarned: this.totalMPEarned,
      longestChain: this.longestChain,
      abilitiesUnlocked: this.abilitiesUnlocked.size
    };
  }

  /**
   * Event subscription methods
   */
  onMPGain(callback: (event: MPGainEvent) => void): void {
    this.onMPGainCallbacks.push(callback);
  }

  onMPSpend(callback: (amount: number, ability: string) => void): void {
    this.onMPSpendCallbacks.push(callback);
  }

  onMPCapacityChange(callback: (newMax: number) => void): void {
    this.onMPCapacityChangeCallbacks.push(callback);
  }

  /**
   * Save MP data to localStorage
   */
  saveMP(): void {
    try {
      const data: MPPersistenceData = {
        currentMP: this.currentMP,
        maxMP: this.maxMP,
        totalMPEarned: this.totalMPEarned,
        longestChain: this.longestChain,
        abilitiesUnlocked: Array.from(this.abilitiesUnlocked)
      };
      localStorage.setItem('mp_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save MP data:', error);
    }
  }

  /**
   * Load MP data from localStorage
   */
  loadMP(): void {
    try {
      const saved = localStorage.getItem('mp_data');
      if (saved) {
        const data: MPPersistenceData = JSON.parse(saved);
        this.currentMP = data.currentMP || 0;
        this.maxMP = data.maxMP || 100;
        this.totalMPEarned = data.totalMPEarned || 0;
        this.longestChain = data.longestChain || 0;
        this.abilitiesUnlocked = new Set(data.abilitiesUnlocked || []);
        
        console.log(`MP data loaded: ${this.currentMP}/${this.maxMP} MP`);
      }
    } catch (error) {
      console.warn('Failed to load MP data, using defaults:', error);
      this.currentMP = 0;
      this.maxMP = 100;
      this.totalMPEarned = 0;
      this.longestChain = 0;
      this.abilitiesUnlocked = new Set();
    }
  }

  /**
   * Reset MP data (for testing or new game)
   */
  resetMP(): void {
    this.currentMP = 0;
    this.maxMP = 100;
    this.totalMPEarned = 0;
    this.longestChain = 0;
    this.abilitiesUnlocked.clear();
    this.saveMP();
    
    console.log('MP data reset to defaults');
  }

  /**
   * Debug method to add MP directly
   */
  debugAddMP(amount: number): void {
    this.currentMP = Math.min(this.maxMP, this.currentMP + amount);
    this.saveMP();
    console.log(`Debug: Added ${amount} MP | Total: ${this.currentMP}/${this.maxMP}`);
  }
}
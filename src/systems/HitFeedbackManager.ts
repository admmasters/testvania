// Core interfaces for hit feedback system
export interface HitFeedbackConfig {
  intensity: number;
  duration: number;
  hitType: 'normal' | 'charged' | 'critical' | 'combo';
  targetType: 'enemy' | 'crystal' | 'environment';
  comboMultiplier?: number;
}

export interface FeedbackIntensity {
  visual: number;        // 0.0 - 2.0 multiplier for visual effects
  shake: number;         // 0.0 - 2.0 multiplier for screen shake
  pause: number;         // 0.0 - 2.0 multiplier for hit pause duration
  particles: number;     // 0.0 - 2.0 multiplier for particle count/size
  sound: number;         // 0.0 - 2.0 multiplier for audio feedback
}

export interface HitContext {
  attackType: string;
  attackerLevel: number;
  targetType: string;
  targetHealth: number;
  comboCount: number;
  chargeLevel: number;
}

export interface FeedbackInstance {
  id: string;
  startTime: number;
  duration: number;
  intensity: FeedbackIntensity;
  position: { x: number; y: number };
}

export interface HitFeedbackState {
  activeFeedbacks: Map<string, FeedbackInstance>;
  lastHitTime: number;
  stackingPrevention: boolean;
  performanceMode: 'full' | 'reduced' | 'minimal';
}

/**
 * Calculates hit impact intensity based on various context factors
 */
export class HitImpactCalculator {
  /**
   * Calculate base intensity from hit context
   */
  calculateBaseIntensity(context: HitContext): number {
    let baseIntensity = 1.0;
    
    // Factor in attacker level (higher level = more impact)
    baseIntensity += (context.attackerLevel - 1) * 0.1;
    
    // Factor in charge level for charged attacks
    if (context.chargeLevel > 0) {
      baseIntensity += context.chargeLevel * 0.3;
    }
    
    // Factor in target health (lower health = more dramatic impact)
    if (context.targetHealth <= 1) {
      baseIntensity += 0.4; // Killing blow bonus
    }
    
    // Clamp to reasonable range
    return Math.max(0.5, Math.min(2.0, baseIntensity));
  }

  /**
   * Apply combo multiplier to base intensity
   */
  applyComboMultiplier(baseIntensity: number, comboCount: number): number {
    if (comboCount <= 1) return baseIntensity;
    
    // Progressive combo scaling with diminishing returns
    const comboMultiplier = 1.0 + Math.min(comboCount * 0.15, 1.0);
    return Math.min(2.0, baseIntensity * comboMultiplier);
  }

  /**
   * Adjust intensity based on target type
   */
  adjustForTargetType(intensity: number, targetType: string): number {
    switch (targetType) {
      case 'enemy':
        return intensity; // Base intensity
      case 'crystal':
        return intensity * 1.2; // Crystals feel more satisfying to break
      case 'environment':
        return intensity * 0.8; // Environmental hits are less dramatic
      default:
        return intensity;
    }
  }
}

/**
 * Central manager for all hit feedback effects
 */
export class HitFeedbackManager {
  private impactCalculator: HitImpactCalculator;
  private state: HitFeedbackState;
  private feedbackIdCounter: number = 0;

  constructor() {
    this.impactCalculator = new HitImpactCalculator();
    this.state = {
      activeFeedbacks: new Map(),
      lastHitTime: 0,
      stackingPrevention: true,
      performanceMode: 'full'
    };
  }

  /**
   * Calculate feedback intensity from hit configuration
   */
  calculateFeedbackIntensity(config: HitFeedbackConfig): FeedbackIntensity {
    let baseIntensity = config.intensity;
    
    // Apply combo multiplier if provided
    if (config.comboMultiplier && config.comboMultiplier > 1) {
      baseIntensity = this.impactCalculator.applyComboMultiplier(baseIntensity, config.comboMultiplier);
    }
    
    // Adjust for target type
    baseIntensity = this.impactCalculator.adjustForTargetType(baseIntensity, config.targetType);
    
    // Apply hit type modifiers
    const typeMultipliers = this.getHitTypeMultipliers(config.hitType);
    
    return {
      visual: Math.min(2.0, baseIntensity * typeMultipliers.visual),
      shake: Math.min(2.0, baseIntensity * typeMultipliers.shake),
      pause: Math.min(2.0, baseIntensity * typeMultipliers.pause),
      particles: Math.min(2.0, baseIntensity * typeMultipliers.particles),
      sound: Math.min(2.0, baseIntensity * typeMultipliers.sound)
    };
  }

  /**
   * Get multipliers for different hit types
   */
  private getHitTypeMultipliers(hitType: string): FeedbackIntensity {
    switch (hitType) {
      case 'normal':
        return { visual: 1.0, shake: 1.0, pause: 1.0, particles: 1.0, sound: 1.0 };
      case 'charged':
        return { visual: 1.4, shake: 1.3, pause: 1.2, particles: 1.5, sound: 1.3 };
      case 'critical':
        return { visual: 1.6, shake: 1.4, pause: 1.3, particles: 1.7, sound: 1.5 };
      case 'combo':
        return { visual: 1.2, shake: 1.1, pause: 1.1, particles: 1.3, sound: 1.2 };
      default:
        return { visual: 1.0, shake: 1.0, pause: 1.0, particles: 1.0, sound: 1.0 };
    }
  }

  /**
   * Check if feedback stacking should be prevented
   */
  preventFeedbackStacking(): boolean {
    if (!this.state.stackingPrevention) return false;
    
    const currentTime = Date.now();
    const timeSinceLastHit = currentTime - this.state.lastHitTime;
    
    // Prevent stacking if hits occur within 50ms
    return timeSinceLastHit < 50;
  }

  /**
   * Trigger hit feedback with the given configuration
   */
  triggerHitFeedback(config: HitFeedbackConfig, position: { x: number; y: number }): string {
    // Check for stacking prevention
    if (this.preventFeedbackStacking()) {
      return ''; // Skip this feedback
    }
    
    const intensity = this.calculateFeedbackIntensity(config);
    const feedbackId = `feedback_${this.feedbackIdCounter++}`;
    const currentTime = Date.now();
    
    // Create feedback instance
    const feedback: FeedbackInstance = {
      id: feedbackId,
      startTime: currentTime,
      duration: config.duration,
      intensity,
      position: { x: position.x, y: position.y }
    };
    
    // Store active feedback
    this.state.activeFeedbacks.set(feedbackId, feedback);
    this.state.lastHitTime = currentTime;
    
    return feedbackId;
  }

  /**
   * Update feedback system (call each frame)
   */
  update(_deltaTime: number): void {
    const currentTime = Date.now();
    
    // Clean up expired feedbacks
    for (const [id, feedback] of this.state.activeFeedbacks) {
      if (currentTime - feedback.startTime > feedback.duration * 1000) {
        this.state.activeFeedbacks.delete(id);
      }
    }
  }

  /**
   * Get current active feedbacks
   */
  getActiveFeedbacks(): FeedbackInstance[] {
    return Array.from(this.state.activeFeedbacks.values());
  }

  /**
   * Set performance mode for automatic adjustment
   */
  setPerformanceMode(mode: 'full' | 'reduced' | 'minimal'): void {
    this.state.performanceMode = mode;
  }

  /**
   * Get current performance mode
   */
  getPerformanceMode(): string {
    return this.state.performanceMode;
  }

  /**
   * Enable or disable stacking prevention
   */
  setStackingPrevention(enabled: boolean): void {
    this.state.stackingPrevention = enabled;
  }
}
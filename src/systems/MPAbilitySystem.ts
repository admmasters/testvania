import type { GameState } from "../engine/GameState";
import type { Player } from "../objects/players/player";

export interface MPAbility {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number; // seconds
  unlockLevel: number;
  keybind: string; // e.g., "Z+X"
  
  canActivate(player: Player, gameState: GameState): boolean;
  activate(player: Player, gameState: GameState): void;
  getEffectDuration(): number;
  isUnlocked(playerLevel: number): boolean;
}

export interface AbilityEffect {
  id: string;
  abilityId: string;
  startTime: number;
  duration: number;
  isActive: boolean;
  
  update(deltaTime: number, player: Player, gameState: GameState): void;
  cleanup(player: Player, gameState: GameState): void;
}

export interface AbilityCooldown {
  abilityId: string;
  remainingTime: number;
  totalCooldown: number;
}

/**
 * Base class for MP abilities
 */
export abstract class BaseMPAbility implements MPAbility {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract mpCost: number;
  abstract cooldown: number;
  abstract unlockLevel: number;
  abstract keybind: string;

  /**
   * Check if ability can be activated
   */
  canActivate(player: Player, gameState: GameState): boolean {
    // Check MP cost
    if (!gameState.mpManager.canAffordAbility(this.mpCost)) {
      return false;
    }

    // Check cooldown
    if (gameState.mpAbilitySystem && gameState.mpAbilitySystem.isOnCooldown(this.id)) {
      return false;
    }

    // Check unlock level
    if (!this.isUnlocked(player.level)) {
      return false;
    }

    // Additional ability-specific checks
    return this.canActivateSpecific(player, gameState);
  }

  /**
   * Activate the ability
   */
  activate(player: Player, gameState: GameState): void {
    if (!this.canActivate(player, gameState)) {
      console.warn(`Cannot activate ability ${this.id}`);
      return;
    }

    // Spend MP
    const success = gameState.mpManager.spendMP(this.mpCost, this.id);
    if (!success) {
      console.warn(`Failed to spend MP for ability ${this.id}`);
      return;
    }

    // Start cooldown
    if (gameState.mpAbilitySystem) {
      gameState.mpAbilitySystem.startCooldown(this.id, this.cooldown);
    }

    // Apply ability effect
    this.applyEffect(player, gameState);

    console.log(`Activated ability: ${this.name} (${this.mpCost} MP)`);
  }

  /**
   * Check if ability is unlocked for player level
   */
  isUnlocked(playerLevel: number): boolean {
    return playerLevel >= this.unlockLevel;
  }

  /**
   * Get effect duration in seconds
   */
  abstract getEffectDuration(): number;

  /**
   * Ability-specific activation checks
   */
  protected abstract canActivateSpecific(player: Player, gameState: GameState): boolean;

  /**
   * Apply the ability effect
   */
  protected abstract applyEffect(player: Player, gameState: GameState): void;
}

/**
 * Base class for ability effects
 */
export abstract class BaseAbilityEffect implements AbilityEffect {
  id: string;
  abilityId: string;
  startTime: number;
  duration: number;
  isActive: boolean = true;

  constructor(abilityId: string, duration: number) {
    this.id = `effect_${abilityId}_${Date.now()}`;
    this.abilityId = abilityId;
    this.startTime = Date.now();
    this.duration = duration;
  }

  /**
   * Update effect each frame
   */
  update(deltaTime: number, player: Player, gameState: GameState): void {
    if (!this.isActive) return;

    const currentTime = Date.now();
    const elapsed = (currentTime - this.startTime) / 1000;

    if (elapsed >= this.duration) {
      this.isActive = false;
      this.cleanup(player, gameState);
      return;
    }

    // Update effect-specific logic
    this.updateEffect(deltaTime, player, gameState, elapsed / this.duration);
  }

  /**
   * Clean up effect when it expires
   */
  abstract cleanup(player: Player, gameState: GameState): void;

  /**
   * Update effect-specific logic
   */
  protected abstract updateEffect(deltaTime: number, player: Player, gameState: GameState, progress: number): void;

  /**
   * Get remaining time in seconds
   */
  getRemainingTime(): number {
    const currentTime = Date.now();
    const elapsed = (currentTime - this.startTime) / 1000;
    return Math.max(0, this.duration - elapsed);
  }
}

/**
 * Central system for managing MP abilities
 */
export class MPAbilitySystem {
  private abilities: Map<string, MPAbility> = new Map();
  private activeCooldowns: Map<string, AbilityCooldown> = new Map();
  private activeEffects: Map<string, AbilityEffect> = new Map();

  // Event callbacks
  private onAbilityActivateCallbacks: Array<(ability: MPAbility, player: Player) => void> = [];
  private onAbilityUnlockCallbacks: Array<(ability: MPAbility, player: Player) => void> = [];
  private onCooldownCompleteCallbacks: Array<(abilityId: string) => void> = [];

  /**
   * Register an ability
   */
  registerAbility(ability: MPAbility): void {
    this.abilities.set(ability.id, ability);
    console.log(`Registered MP ability: ${ability.name} (${ability.mpCost} MP)`);
  }

  /**
   * Get ability by ID
   */
  getAbility(id: string): MPAbility | null {
    return this.abilities.get(id) || null;
  }

  /**
   * Get all registered abilities
   */
  getAllAbilities(): MPAbility[] {
    return Array.from(this.abilities.values());
  }

  /**
   * Get abilities available to player (unlocked and affordable)
   */
  getAvailableAbilities(player: Player, gameState: GameState): MPAbility[] {
    return Array.from(this.abilities.values()).filter(ability => 
      ability.isUnlocked(player.level) && ability.canActivate(player, gameState)
    );
  }

  /**
   * Get abilities unlocked for player level
   */
  getUnlockedAbilities(playerLevel: number): MPAbility[] {
    return Array.from(this.abilities.values()).filter(ability => 
      ability.isUnlocked(playerLevel)
    );
  }

  /**
   * Activate ability by ID
   */
  activateAbility(abilityId: string, player: Player, gameState: GameState): boolean {
    const ability = this.abilities.get(abilityId);
    if (!ability) {
      console.warn(`Ability not found: ${abilityId}`);
      return false;
    }

    if (!ability.canActivate(player, gameState)) {
      console.warn(`Cannot activate ability: ${ability.name}`);
      return false;
    }

    ability.activate(player, gameState);

    // Notify listeners
    this.onAbilityActivateCallbacks.forEach(callback => callback(ability, player));

    return true;
  }

  /**
   * Check if ability is on cooldown
   */
  isOnCooldown(abilityId: string): boolean {
    return this.activeCooldowns.has(abilityId);
  }

  /**
   * Get remaining cooldown time
   */
  getCooldownRemaining(abilityId: string): number {
    const cooldown = this.activeCooldowns.get(abilityId);
    return cooldown ? cooldown.remainingTime : 0;
  }

  /**
   * Start cooldown for ability
   */
  startCooldown(abilityId: string, duration: number): void {
    const cooldown: AbilityCooldown = {
      abilityId,
      remainingTime: duration,
      totalCooldown: duration
    };
    this.activeCooldowns.set(abilityId, cooldown);
  }

  /**
   * Add active effect
   */
  addEffect(effect: AbilityEffect): void {
    this.activeEffects.set(effect.id, effect);
  }

  /**
   * Remove active effect
   */
  removeEffect(effectId: string): void {
    this.activeEffects.delete(effectId);
  }

  /**
   * Get active effects for ability
   */
  getActiveEffects(abilityId?: string): AbilityEffect[] {
    const effects = Array.from(this.activeEffects.values());
    return abilityId ? effects.filter(effect => effect.abilityId === abilityId) : effects;
  }

  /**
   * Update system (call each frame)
   */
  update(deltaTime: number, player: Player, gameState: GameState): void {
    // Update cooldowns
    const expiredCooldowns: string[] = [];
    for (const [abilityId, cooldown] of this.activeCooldowns) {
      cooldown.remainingTime -= deltaTime;
      if (cooldown.remainingTime <= 0) {
        expiredCooldowns.push(abilityId);
      }
    }

    // Remove expired cooldowns
    for (const abilityId of expiredCooldowns) {
      this.activeCooldowns.delete(abilityId);
      this.onCooldownCompleteCallbacks.forEach(callback => callback(abilityId));
    }

    // Update active effects
    const expiredEffects: string[] = [];
    for (const [effectId, effect] of this.activeEffects) {
      effect.update(deltaTime, player, gameState);
      if (!effect.isActive) {
        expiredEffects.push(effectId);
      }
    }

    // Remove expired effects
    for (const effectId of expiredEffects) {
      this.activeEffects.delete(effectId);
    }
  }

  /**
   * Check for newly unlocked abilities
   */
  checkUnlocks(player: Player): void {
    for (const ability of this.abilities.values()) {
      if (ability.isUnlocked(player.level)) {
        // Check if this is a new unlock (you might want to track this)
        this.onAbilityUnlockCallbacks.forEach(callback => callback(ability, player));
      }
    }
  }

  /**
   * Event subscription methods
   */
  onAbilityActivate(callback: (ability: MPAbility, player: Player) => void): void {
    this.onAbilityActivateCallbacks.push(callback);
  }

  onAbilityUnlock(callback: (ability: MPAbility, player: Player) => void): void {
    this.onAbilityUnlockCallbacks.push(callback);
  }

  onCooldownComplete(callback: (abilityId: string) => void): void {
    this.onCooldownCompleteCallbacks.push(callback);
  }

  /**
   * Get system statistics
   */
  getStatistics(): {
    totalAbilities: number;
    activeCooldowns: number;
    activeEffects: number;
  } {
    return {
      totalAbilities: this.abilities.size,
      activeCooldowns: this.activeCooldowns.size,
      activeEffects: this.activeEffects.size
    };
  }

  /**
   * Reset system (for testing or new game)
   */
  reset(): void {
    this.activeCooldowns.clear();
    this.activeEffects.clear();
    console.log('MP ability system reset');
  }
}
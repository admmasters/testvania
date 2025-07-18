import type { GameState } from "../../engine/GameState";
import type { Player } from "../../objects/players/player";
import { BaseMPAbility, BaseAbilityEffect } from "../MPAbilitySystem";

/**
 * Power Surge ability effect - enhances player attack power and speed
 */
export class PowerSurgeEffect extends BaseAbilityEffect {
  private originalStrength: number = 0;
  private originalSpeed: number = 0;
  private strengthMultiplier: number = 1.5;
  private speedMultiplier: number = 1.3;

  constructor() {
    super('power_surge', 10); // 10 second duration
  }

  /**
   * Apply the power surge effect to the player
   */
  applyEffect(player: Player): void {
    // Store original values
    this.originalStrength = player.strength;
    this.originalSpeed = player.speed;

    // Apply multipliers
    player.strength = Math.floor(player.strength * this.strengthMultiplier);
    player.speed = Math.floor(player.speed * this.speedMultiplier);

    console.log(`Power Surge activated: Strength ${this.originalStrength} → ${player.strength}, Speed ${this.originalSpeed} → ${player.speed}`);
  }

  /**
   * Update effect each frame - handle visual effects
   */
  protected updateEffect(_deltaTime: number, player: Player, gameState: GameState, _progress: number): void {
    // Create golden aura particles around player
    if (Math.random() < 0.3) { // 30% chance each frame
      this.spawnAuraParticle(player, gameState);
    }

    // Could add screen tint or other visual effects here
    // For now, we'll rely on particle effects
  }

  /**
   * Spawn golden aura particle around player
   */
  private spawnAuraParticle(player: Player, gameState: GameState): void {
    const centerX = player.position.x + player.size.x / 2;
    const centerY = player.position.y + player.size.y / 2;
    
    // Random position around player
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 15;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    // Create a simple visual effect (we'll enhance this later)
    // For now, we can use the existing hit spark system
    gameState.createHitSpark(x, y);
  }

  /**
   * Clean up effect when it expires
   */
  cleanup(player: Player, gameState: GameState): void {
    // Restore original values
    player.strength = this.originalStrength;
    player.speed = this.originalSpeed;

    console.log(`Power Surge ended: Strength restored to ${player.strength}, Speed restored to ${player.speed}`);

    // Create end effect
    const centerX = player.position.x + player.size.x / 2;
    const centerY = player.position.y + player.size.y / 2;
    
    // Burst of particles when effect ends
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 30;
      const y = centerY + Math.sin(angle) * 30;
      gameState.createHitSpark(x, y);
    }
  }
}

/**
 * Power Surge MP Ability - 20 MP cost
 * Increases attack power by 50% and speed by 30% for 10 seconds
 */
export class PowerSurgeAbility extends BaseMPAbility {
  id = 'power_surge';
  name = 'Power Surge';
  description = 'Increases attack power by 50% and speed by 30% for 10 seconds';
  mpCost = 20;
  cooldown = 15; // 15 second cooldown
  unlockLevel = 1; // Available from level 1
  keybind = 'Z+X';

  /**
   * Get effect duration in seconds
   */
  getEffectDuration(): number {
    return 10;
  }

  /**
   * Ability-specific activation checks
   */
  protected canActivateSpecific(_player: Player, gameState: GameState): boolean {
    // Check if Power Surge is already active
    const activeEffects = gameState.mpAbilitySystem.getActiveEffects(this.id);
    if (activeEffects.length > 0) {
      console.log('Power Surge is already active');
      return false;
    }

    return true;
  }

  /**
   * Apply the ability effect
   */
  protected applyEffect(player: Player, gameState: GameState): void {
    // Create and apply the power surge effect
    const effect = new PowerSurgeEffect();
    effect.applyEffect(player);
    
    // Add effect to the ability system for tracking
    gameState.mpAbilitySystem.addEffect(effect);

    // Create activation visual effect
    const centerX = player.position.x + player.size.x / 2;
    const centerY = player.position.y + player.size.y / 2;
    
    // Burst of golden particles when activated
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 25 + Math.random() * 10;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      gameState.createHitSpark(x, y);
    }

    // Screen shake for impact
    gameState.camera.shake(0.3, 4);

    console.log(`Power Surge activated! Duration: ${this.getEffectDuration()}s`);
  }
}
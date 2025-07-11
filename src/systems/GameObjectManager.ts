import type { Enemy } from "@/objects/enemies/enemy";
import type { GameState } from "../engine/GameState";
import type { ICollidable, IRenderable, IUpdateable } from "../interfaces/GameInterfaces";
import type { DiagonalPlatform } from "../objects/diagonalPlatform";
import type { Experience } from "../objects/experience";
import { HitSpark, PoofEffect } from "../objects/hitSpark";
import type { MemoryCrystal } from "../objects/memoryCrystal";
import type { Platform } from "../objects/platform";
import type { SolidBlock } from "../objects/solidBlock";

export class GameObjectManager {
  // Game object collections
  private enemies: Enemy[] = [];
  private platforms: Platform[] = [];
  private solidBlocks: SolidBlock[] = [];
  private diagonalPlatforms: DiagonalPlatform[] = [];
  private hitSparks: HitSpark[] = [];
  private memoryCrystals: MemoryCrystal[] = [];
  private experiences: Experience[] = [];
  private poofEffects: PoofEffect[] = [];

  // Floating indicators
  private floatingExpIndicators: Array<{
    amount: number;
    x: number;
    y: number;
    alpha: number;
    vy: number;
    time: number;
  }> = [];

  /**
   * Initialize the manager with existing game state data
   */
  initialize(gameState: GameState): void {
    // Transfer existing objects from GameState
    this.enemies = gameState.enemies || [];
    this.platforms = gameState.platforms || [];
    this.solidBlocks = gameState.solidBlocks || [];
    this.diagonalPlatforms = gameState.diagonalPlatforms || [];
    this.hitSparks = gameState.hitSparks || [];
    this.memoryCrystals = gameState.memoryCrystals || [];
    this.experiences = gameState.experiences || [];
    this.poofEffects = gameState.poofEffects || [];
    this.floatingExpIndicators = gameState.floatingExpIndicators || [];
  }

  /**
   * Update all game objects
   */
  update(deltaTime: number, gameState: GameState): void {
    // Update memory crystals
    this.updateMemoryCrystals(deltaTime, gameState);
    this.cleanupInactive(this.memoryCrystals);

    // Update experiences
    this.updateObjects(this.experiences, deltaTime, gameState);
    this.cleanupInactive(this.experiences);

    // Update hit sparks
    this.updateObjects(this.hitSparks, deltaTime, gameState);

    // Update poof effects
    this.updateObjects(this.poofEffects, deltaTime, gameState);

    // Update enemies
    this.updateObjects(this.enemies, deltaTime, gameState);

    // Clean up inactive objects
    this.cleanupInactive(this.hitSparks);
    this.cleanupInactive(this.poofEffects);
    this.cleanupInactive(this.enemies);

    // Update floating exp indicators
    this.updateFloatingExpIndicators(deltaTime);
  }

  /**
   * Render all game objects in the correct order
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render static objects first
    this.renderObjects(this.platforms, ctx);
    this.renderObjects(this.solidBlocks, ctx);
    this.renderObjects(this.diagonalPlatforms, ctx);

    // Render interactive objects
    this.renderObjects(this.memoryCrystals, ctx);
    this.renderObjects(this.experiences, ctx);
    this.renderObjects(this.enemies, ctx);

    // Render effects on top
    this.renderObjects(this.hitSparks, ctx);
    this.renderObjects(this.poofEffects, ctx);

    // Render floating exp indicators last
    this.renderFloatingExpIndicators(ctx);
  }

  /**
   * Add objects to collections
   */
  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  addPlatform(platform: Platform): void {
    this.platforms.push(platform);
  }

  addSolidBlock(solidBlock: SolidBlock): void {
    this.solidBlocks.push(solidBlock);
  }

  addDiagonalPlatform(diagonalPlatform: DiagonalPlatform): void {
    this.diagonalPlatforms.push(diagonalPlatform);
  }

  addMemoryCrystal(crystal: MemoryCrystal): void {
    this.memoryCrystals.push(crystal);
  }

  addExperience(experience: Experience): void {
    this.experiences.push(experience);
  }

  addHitSpark(x: number, y: number): void {
    this.hitSparks.push(new HitSpark(x, y));
  }

  addPoofEffect(x: number, y: number): void {
    this.poofEffects.push(new PoofEffect(x, y));
  }

  addFloatingExpIndicator(amount: number, x: number, y: number): void {
    this.floatingExpIndicators.push({
      amount,
      x,
      y,
      alpha: 1,
      vy: 32 + Math.random() * 16,
      time: 0,
    });
  }

  /**
   * Remove objects from collections
   */
  removeEnemy(enemy: Enemy): void {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }

  /**
   * Clear all objects
   */
  clearAll(): void {
    this.enemies.length = 0;
    this.platforms.length = 0;
    this.solidBlocks.length = 0;
    this.diagonalPlatforms.length = 0;
    this.hitSparks.length = 0;
    this.poofEffects.length = 0;
    this.floatingExpIndicators.length = 0;
  }

  /**
   * Clear specific object type
   */
  clearEnemies(): void {
    this.enemies.length = 0;
  }

  clearPlatforms(): void {
    this.platforms.length = 0;
  }

  clearSolidBlocks(): void {
    this.solidBlocks.length = 0;
  }

  clearDiagonalPlatforms(): void {
    this.diagonalPlatforms.length = 0;
  }

  clearMemoryCrystals(): void {
    this.memoryCrystals.length = 0;
  }

  clearExperiences(): void {
    this.experiences.length = 0;
  }

  clearEffects(): void {
    this.hitSparks.length = 0;
    this.poofEffects.length = 0;
    this.floatingExpIndicators.length = 0;
  }

  /**
   * Get object collections (readonly)
   */
  getEnemies(): readonly Enemy[] {
    return this.enemies;
  }

  getPlatforms(): readonly Platform[] {
    return this.platforms;
  }

  getSolidBlocks(): readonly SolidBlock[] {
    return this.solidBlocks;
  }

  getDiagonalPlatforms(): readonly DiagonalPlatform[] {
    return this.diagonalPlatforms;
  }

  getMemoryCrystals(): readonly MemoryCrystal[] {
    return this.memoryCrystals;
  }

  getExperiences(): readonly Experience[] {
    return this.experiences;
  }

  getHitSparks(): readonly HitSpark[] {
    return this.hitSparks;
  }

  getPoofEffects(): readonly PoofEffect[] {
    return this.poofEffects;
  }

  getFloatingExpIndicators(): Array<{
    amount: number;
    x: number;
    y: number;
    alpha: number;
    vy: number;
    time: number;
  }> {
    return this.floatingExpIndicators;
  }

  /**
   * Get all collidable objects
   */
  getCollidableObjects(): ICollidable[] {
    return [
      ...this.platforms,
      ...this.solidBlocks,
      ...this.diagonalPlatforms,
      ...this.enemies,
      ...this.memoryCrystals,
      ...this.experiences,
    ];
  }

  /**
   * Get all updateable objects
   */
  getUpdateableObjects(): IUpdateable[] {
    return [
      ...this.enemies,
      ...this.memoryCrystals,
      ...this.experiences,
      ...this.hitSparks,
      ...this.poofEffects,
    ];
  }

  /**
   * Get all renderable objects
   */
  getRenderableObjects(): IRenderable[] {
    return [
      ...this.platforms,
      ...this.solidBlocks,
      ...this.diagonalPlatforms,
      ...this.enemies,
      ...this.memoryCrystals,
      ...this.experiences,
      ...this.hitSparks,
      ...this.poofEffects,
    ];
  }

  /**
   * Private helper methods
   */
  private updateObjects<T extends IUpdateable>(
    objects: T[],
    deltaTime: number,
    gameState: GameState,
  ): void {
    for (const obj of objects) {
      if (obj.active !== false) {
        obj.update(deltaTime, gameState);
      }
    }
  }

  private renderObjects<T extends IRenderable>(objects: T[], ctx: CanvasRenderingContext2D): void {
    for (const obj of objects) {
      if (obj.isVisible !== false) {
        obj.render(ctx);
      }
    }
  }

  private updateMemoryCrystals(deltaTime: number, gameState: GameState): void {
    for (const crystal of this.memoryCrystals) {
      if (crystal.isActive) {
        crystal.update(deltaTime, gameState);

        // Check for chain reactions
        if (crystal.isBreaking) {
          this.checkChainReactions(crystal);
        }
      }
    }
  }

  private checkChainReactions(triggeringCrystal: MemoryCrystal): void {
    for (const crystal of this.memoryCrystals) {
      if (triggeringCrystal.canTriggerChainReaction(crystal)) {
        crystal.triggerChainReaction(triggeringCrystal.getChainReactionDelay());
      }
    }
  }

  private cleanupInactive<T extends { active: boolean }>(objects: T[]): void {
    for (let i = objects.length - 1; i >= 0; i--) {
      if (!objects[i].active) {
        objects.splice(i, 1);
      }
    }
  }

  private updateFloatingExpIndicators(deltaTime: number): void {
    for (const exp of this.floatingExpIndicators) {
      exp.y -= exp.vy * deltaTime;
      exp.alpha -= deltaTime * 1.2;
      exp.time += deltaTime;
    }

    // Remove expired indicators
    for (let i = this.floatingExpIndicators.length - 1; i >= 0; i--) {
      if (this.floatingExpIndicators[i].alpha <= 0) {
        this.floatingExpIndicators.splice(i, 1);
      }
    }
  }

  private renderFloatingExpIndicators(ctx: CanvasRenderingContext2D): void {
    for (const exp of this.floatingExpIndicators) {
      ctx.save();
      ctx.globalAlpha = exp.alpha;
      ctx.font = "bold 18px 'Orbitron', monospace";
      ctx.fillStyle = "#00FFAA";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 255, 170, 0.8)";
      ctx.shadowBlur = 15;
      ctx.strokeText(`+${exp.amount} EXP`, exp.x, exp.y);
      ctx.fillText(`+${exp.amount} EXP`, exp.x, exp.y);
      ctx.restore();
    }
  }
}

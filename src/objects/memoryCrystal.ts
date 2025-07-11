import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2.js";
import type { ChainReactionTarget } from "./crystal/ChainReactionManager.js";
import { ChainReactionManager } from "./crystal/ChainReactionManager.js";
import type { CrystalPiece } from "./crystal/CrystalRenderer.js";
import { CrystalRenderer } from "./crystal/CrystalRenderer.js";
import type { CrystalType } from "./crystal/CrystalTypeConfig.js";
import { CrystalTypeConfig } from "./crystal/CrystalTypeConfig.js";
import { CrystalVisualEffects } from "./crystal/CrystalVisualEffects.js";
import { ParticleSystem } from "./crystal/ParticleSystem.js";
import { Experience } from "./experience.js";
import type { Player } from "./player";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export class MemoryCrystal implements ChainReactionTarget {
  position: Vector2;
  size: Vector2;
  isActive: boolean;
  active: boolean;
  isBreaking: boolean;
  breakTimer: number;
  pieces: CrystalPiece[];
  crystalType: CrystalType;
  private _gameState: GameState | undefined;

  private particleSystem: ParticleSystem;
  private visualEffects: CrystalVisualEffects;
  private chainReactionManager: ChainReactionManager;
  private renderer: CrystalRenderer;

  constructor(x: number, y: number, type: CrystalType = "azure") {
    this.position = vec2(x, y);
    this.size = vec2(20, 24);
    this.isActive = true;
    this.active = true;
    this.isBreaking = false;
    this.breakTimer = 0;
    this.pieces = [];
    this.crystalType = type;

    this.particleSystem = new ParticleSystem(this.position, this.size);
    this.visualEffects = new CrystalVisualEffects();
    this.chainReactionManager = new ChainReactionManager();
    this.renderer = new CrystalRenderer(this.position, this.size);
  }

  update(deltaTime: number, gameState: GameState): void {
    if (!this.isActive) return;

    this._gameState = gameState;

    const playerPosition = gameState.player?.position;
    this.visualEffects.update(deltaTime, playerPosition, this.position);
    this.particleSystem.update(deltaTime);

    const BREAK_DURATION = 0.8;
    if (this.isBreaking) {
      this.breakTimer += deltaTime;

      this.pieces.forEach((piece) => {
        piece.position.x += piece.velocity.x * deltaTime;
        piece.position.y += piece.velocity.y * deltaTime;
        piece.velocity.y += 300 * deltaTime;
        piece.rotation += piece.rotationSpeed * deltaTime;
        piece.opacity = Math.max(0, 1 - this.breakTimer / BREAK_DURATION);
      });

      if (this.breakTimer < 0.2) {
        this.particleSystem.spawnBreakParticles(3);
      }

      if (this.breakTimer >= BREAK_DURATION) {
        this.isActive = false;
        this.active = false;
      }
    }
  }

  canTriggerChainReaction(otherCrystal: MemoryCrystal): boolean {
    return (
      this.isBreaking &&
      this.chainReactionManager.canTriggerChainReaction(this.position, otherCrystal)
    );
  }

  triggerChainReaction(delay: number = 0): void {
    if (this.isBreaking || !this.isActive) return;

    this.chainReactionManager.setTriggeredByChain(true);

    if (delay > 0) {
      setTimeout(() => {
        if (this.isActive && !this.isBreaking) {
          this.break();
        }
      }, delay * 1000);
    } else {
      this.break();
    }
  }

  break(): { experience: Experience[] } {
    if (this.isBreaking || !this.isActive) return { experience: [] };

    this.isBreaking = true;
    this.breakTimer = 0;

    // Create crystal pieces
    const numPieces = 6;
    for (let i = 0; i < numPieces; i++) {
      const angle = (i / numPieces) * Math.PI * 2;
      const speed = 60 + Math.random() * 40;

      this.pieces.push({
        position: vec2(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2),
        velocity: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 30),
        rotationSpeed: (Math.random() - 0.5) * 8,
        rotation: 0,
        size: 3 + Math.random() * 4,
        opacity: 1,
      });
    }

    // Drop items based on crystal type
    const drops = this.generateDrops();

    return drops;
  }

  private generateDrops(): { experience: Experience[] } {
    const experience: Experience[] = [];

    const gameState = this._gameState;
    if (gameState?.player) {
      const memoryData = {
        id: `memory_${Date.now()}`,
        type: this.crystalType,
        discovered: new Date().toISOString(),
        text: "", // Add text if needed
      };

      // Prefer addMemory if available, fallback to direct push
      const player = gameState.player as Player;
      if (typeof player.addMemory === "function") {
        player.addMemory(memoryData);
      } else if (Array.isArray(player.memories)) {
        player.memories.push(memoryData);
      } else {
        console.log(
          "Player cannot store memories - need to implement memories array or addMemory method",
        );
      }
    }

    // Drop experience based on crystal type
    const expValue = this.getExperienceValue();
    if (expValue > 0) {
      experience.push(
        new Experience(
          this.position.x + this.size.x / 2 - 4,
          this.position.y + this.size.y / 2 - 8,
          expValue,
        ),
      );
    }

    return { experience };
  }

  private getExperienceValue(): number {
    return CrystalTypeConfig.getExperienceValue(this.crystalType);
  }

  getChainReactionDelay(): number {
    return this.chainReactionManager.getDelay();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    const colors = CrystalTypeConfig.getColors(this.crystalType);
    const pulseIntensity = this.visualEffects.getPulseIntensity();
    const resonanceGlow = this.visualEffects.getResonanceLevel() * 0.5;

    this.renderer.render(
      ctx,
      colors,
      pulseIntensity,
      resonanceGlow,
      this.isBreaking,
      this.breakTimer,
      this.particleSystem,
      this.pieces,
    );
  }

  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.position.x,
      right: this.position.x + this.size.x,
      top: this.position.y,
      bottom: this.position.y + this.size.y,
    };
  }
}

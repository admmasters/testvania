import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2.js";
import type { ChainReactionTarget } from "./crystal/ChainReactionManager.js";
import { ChainReactionManager } from "./crystal/ChainReactionManager.js";
import type { CrystalPiece } from "./crystal/CrystalRenderer.js";
import { CrystalRenderer } from "./crystal/CrystalRenderer.js";
import type { CrystalType } from "./crystal/CrystalTypeConfig.js";
import { getCrystalColors, getCrystalExperienceValue, toCrystalType } from "./crystal/CrystalTypeConfig.js";
import { CrystalVisualEffects } from "./crystal/CrystalVisualEffects.js";
import { ParticleSystem } from "./crystal/ParticleSystem.js";
import { Experience } from "./experience.js";
import type { Player } from "./players/player.js";

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
  // Add debug flag for chain reaction area
  static debugChainReaction: boolean = false;

  private particleSystem: ParticleSystem;
  private visualEffects: CrystalVisualEffects;
  private chainReactionManager: ChainReactionManager;
  private renderer: CrystalRenderer;

  // Shake effect properties to emphasize impact when crystal is hit
  private shakeOffset: Vector2 = vec2(0, 0);
  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;
  private shakeType: 'random' | 'horizontal' | 'vertical' = 'horizontal';
  private shakeFrequency: number = 25;

  constructor(x: number, y: number, type: string | CrystalType = "azure") {
    this.position = vec2(x, y);
    this.size = vec2(20, 24);
    this.isActive = true;
    this.active = true;
    this.isBreaking = false;
    this.breakTimer = 0;
    this.pieces = [];
    this.crystalType = toCrystalType(type);

    this.particleSystem = new ParticleSystem(this.position, this.size);
    this.visualEffects = new CrystalVisualEffects();
    this.chainReactionManager = new ChainReactionManager();
    this.renderer = new CrystalRenderer(this.position, this.size);

    // Initialise shake parameters
    this.shakeOffset = vec2(0, 0);
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  update(deltaTime: number, gameState: GameState): void {
    if (!this.isActive) return;

    this._gameState = gameState;

    // Update local shake effect each frame
    this.updateShake(deltaTime);

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
    if (!this.isBreaking || !otherCrystal.isActive) return false;

    // Get center positions of both crystals
    const thisCenterX = this.position.x + this.size.x / 2;
    const thisCenterY = this.position.y + this.size.y / 2;
    const otherCenterX = otherCrystal.position.x + otherCrystal.size.x / 2;
    const otherCenterY = otherCrystal.position.y + otherCrystal.size.y / 2;

    const dx = otherCenterX - thisCenterX;
    const dy = otherCenterY - thisCenterY;

    // Make the trigger area much larger to match the debug cross
    const horizontalRange = this.size.x * 3.5;
    const verticalRange = this.size.y * 3.5;

    // Check if the other crystal is horizontally aligned (with larger y tolerance)
    const withinHorizontal = Math.abs(dx) <= horizontalRange && Math.abs(dy) <= this.size.y * 0.5;

    // Check if the other crystal is directly above or below (with larger x tolerance)
    const directlyAbove =
      Math.abs(dx) <= this.size.x * 0.5 && dy < 0 && Math.abs(dy) <= verticalRange;
    const directlyBelow =
      Math.abs(dx) <= this.size.x * 0.5 && dy > 0 && Math.abs(dy) <= verticalRange;

    // Log for debugging
    if ((withinHorizontal || directlyAbove || directlyBelow) && MemoryCrystal.debugChainReaction) {
      const dir = withinHorizontal ? "Horizontal" : directlyAbove ? "VerticalUp" : "VerticalDown";
      console.log(
        `Chain Reaction: ${dir} from (${this.position.x},${this.position.y}) to (${otherCrystal.position.x},${otherCrystal.position.y})`,
      );
    }

    return withinHorizontal || directlyAbove || directlyBelow;
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

    // Shorter, snappier pause
    if (this._gameState && !this.chainReactionManager.wasTriggeredByChain()) {
      this._gameState.hitPause(0.06);
    }

    // Increment combo meter for satisfying chain reactions
    if (this._gameState?.comboSystem) {
      this._gameState.comboSystem.addHit();
    }

    // Integrate with MP system - award MP for crystal breaking
    if (this._gameState?.mpManager && this._gameState?.chainReactionTracker) {
      const crystalTarget = {
        id: `crystal_${this.position.x}_${this.position.y}`,
        position: this.position,
        crystalType: this.crystalType,
        isActive: this.isActive,
        isBreaking: this.isBreaking
      };

      if (this.chainReactionManager.wasTriggeredByChain()) {
        // This crystal was triggered by a chain reaction
        // Check if we can extend an existing chain or start a new one
        const nearbyChains = this._gameState.chainReactionTracker.findNearbyChains(this.position);
        const chainId = this._gameState.chainReactionTracker.processChainReaction(crystalTarget, nearbyChains);
        console.log(`Chain crystal processed: ${chainId}`);
      } else {
        // Single crystal break - award base MP immediately
        this._gameState.mpManager.awardMP(1, 'crystal', {
          x: this.position.x + this.size.x / 2,
          y: this.position.y + this.size.y / 2
        });
        console.log(`Single crystal break: awarded 1 MP`);
      }
    }

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

    // Trigger chain reactions in nearby crystals
    if (this._gameState) {
      for (const crystal of this._gameState.memoryCrystals) {
        // Skip self and already breaking crystals
        if (crystal === this || crystal.isBreaking || !crystal.isActive) continue;

        // Check if this crystal can trigger a chain reaction in the other crystal
        if (this.canTriggerChainReaction(crystal)) {
          const delay = this.getChainReactionDelay();
          crystal.triggerChainReaction(delay);

          if (MemoryCrystal.debugChainReaction) {
            console.log(
              `Triggering chain reaction to crystal at (${crystal.position.x}, ${crystal.position.y}) with delay ${delay}`,
            );
          }
        }
      }
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
    return getCrystalExperienceValue(this.crystalType);
  }

  getChainReactionDelay(): number {
    return this.chainReactionManager.getDelay();
  }

  /**
   * Toggles the debug visualization for chain reaction areas
   * @returns The current state of the debug flag after toggling
   */
  static toggleDebugChainReaction(): boolean {
    MemoryCrystal.debugChainReaction = !MemoryCrystal.debugChainReaction;
    console.log(
      `Chain reaction debug visualization: ${MemoryCrystal.debugChainReaction ? "ON" : "OFF"}`,
    );
    return MemoryCrystal.debugChainReaction;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Apply shake translation for more impactful visual feedback
    ctx.save();
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

    const colors = getCrystalColors(this.crystalType);
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

    // Draw debug cross overlay for chain reaction area if debug is enabled
    if (MemoryCrystal.debugChainReaction && !this.isBreaking) {
      const centerX = this.position.x + this.size.x / 2;
      const centerY = this.position.y + this.size.y / 2;
      const crossLengthX = this.size.x * 3.5;
      const crossLengthY = this.size.y * 3.5;

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;

      // Horizontal line (left and right, much longer)
      ctx.beginPath();
      ctx.moveTo(centerX - crossLengthX, centerY);
      ctx.lineTo(centerX + crossLengthX, centerY);
      ctx.stroke();

      // Vertical line (above, much longer)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - crossLengthY);
      ctx.stroke();

      // Vertical line (below, much longer)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY + crossLengthY);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.position.x,
      right: this.position.x + this.size.x,
      top: this.position.y,
      bottom: this.position.y + this.size.y,
    };
  }

  /**
   * Begin a shake effect on this crystal.
   */
  startShake(intensity: number, duration: number, shakeType: 'random' | 'horizontal' | 'vertical' = 'horizontal', frequency: number = 25): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
    this.shakeType = shakeType;
    this.shakeFrequency = frequency;
  }

  /**
   * Update the current shake effect, if any.
   */
  private updateShake(deltaTime: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;

      // Calculate shake offset based on shake type
      switch (this.shakeType) {
        case 'horizontal': {
          // Side-to-side motion using sine wave for smooth oscillation
          const time = Date.now() / 1000; // Convert to seconds
          this.shakeOffset.x = Math.sin(time * this.shakeFrequency * Math.PI * 2) * this.shakeIntensity;
          this.shakeOffset.y = 0;
          break;
        }
        
        case 'vertical': {
          // Up-and-down motion
          const timeV = Date.now() / 1000;
          this.shakeOffset.x = 0;
          this.shakeOffset.y = Math.sin(timeV * this.shakeFrequency * Math.PI * 2) * this.shakeIntensity;
          break;
        }
        
        default:
          // Original random shake
          this.shakeOffset.x = (Math.random() - 0.5) * 2 * this.shakeIntensity;
          this.shakeOffset.y = (Math.random() - 0.5) * 2 * this.shakeIntensity;
          break;
      }

      if (this.shakeTimer <= 0) {
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
        this.shakeIntensity = 0;
      }
    }
  }
}

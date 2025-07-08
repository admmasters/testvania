import { Vector2 } from "../engine/Vector2.js";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

import { Experience } from "./experience.js";

export class MemoryCrystal {
  position: Vector2;
  size: Vector2;
  isActive: boolean;
  active: boolean;
  isBreaking: boolean;
  breakTimer: number;
  pieces: Array<{
    position: Vector2;
    velocity: Vector2;
    rotationSpeed: number;
    rotation: number;
    size: number;
    opacity: number;
  }>;

  // Visual effects
  pulseTimer: number;
  pulsePhase: number;
  resonanceLevel: number;
  colorPhase: number;
  particleTimer: number;
  particles: Array<{
    position: Vector2;
    velocity: Vector2;
    life: number;
    maxLife: number;
    size: number;
  }>;

  // Crystal type and effects
  crystalType: "azure" | "amethyst" | "emerald" | "golden";
  memoryEcho: {
    active: boolean;
    timer: number;
    text: string;
    opacity: number;
  };

  // Chain reaction mechanics
  chainReactionRadius: number;
  chainReactionDelay: number;
  triggeredByChain: boolean;

  constructor(x: number, y: number, type: "azure" | "amethyst" | "emerald" | "golden" = "azure") {
    this.position = vec2(x, y);
    this.size = vec2(20, 24);
    this.isActive = true;
    this.active = true;
    this.isBreaking = false;
    this.breakTimer = 0;
    this.pieces = [];

    // Visual effects initialization
    this.pulseTimer = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.resonanceLevel = 0;
    this.colorPhase = 0;
    this.particleTimer = 0;
    this.particles = [];

    // Crystal properties
    this.crystalType = type;
    this.memoryEcho = {
      active: false,
      timer: 0,
      text: "",
      opacity: 0,
    };

    // Chain reaction properties
    this.chainReactionRadius = 60;
    this.chainReactionDelay = 0.2;
    this.triggeredByChain = false;
  }

  update(deltaTime: number, gameState: any): void {
    if (!this.isActive) return;

    // Store reference to gameState for memory addition
    this._gameState = gameState;

    this.pulseTimer += deltaTime;
    this.colorPhase += deltaTime * 0.5;

    // Update resonance based on player proximity
    if (gameState?.player) {
      const distance = Vector2.distance(this.position, gameState.player.position);
      const maxResonanceDistance = 80;
      this.resonanceLevel = Math.max(0, 1 - distance / maxResonanceDistance);
    }

    // Update particle effects
    this.updateParticles(deltaTime);

    // Generate ambient particles
    this.particleTimer += deltaTime;
    if (this.particleTimer > 0.3) {
      this.spawnAmbientParticle();
      this.particleTimer = 0;
    }

    // Update memory echo
    if (this.memoryEcho.active) {
      this.memoryEcho.timer += deltaTime;
      if (this.memoryEcho.timer < 0.5) {
        this.memoryEcho.opacity = this.memoryEcho.timer / 0.5;
      } else if (this.memoryEcho.timer < 2.5) {
        this.memoryEcho.opacity = 1;
      } else if (this.memoryEcho.timer < 3) {
        this.memoryEcho.opacity = 1 - (this.memoryEcho.timer - 2.5) / 0.5;
      } else {
        this.memoryEcho.active = false;
      }
    }

    // Breaking animation
    const BREAK_DURATION = 0.8;
    if (this.isBreaking) {
      this.breakTimer += deltaTime;

      // Update crystal pieces
      this.pieces.forEach((piece) => {
        piece.position.x += piece.velocity.x * deltaTime;
        piece.position.y += piece.velocity.y * deltaTime;
        piece.velocity.y += 300 * deltaTime; // Gravity
        piece.rotation += piece.rotationSpeed * deltaTime;
        piece.opacity = Math.max(0, 1 - this.breakTimer / BREAK_DURATION);
      });

      // Spawn break particles
      if (this.breakTimer < 0.2) {
        for (let i = 0; i < 3; i++) {
          this.spawnBreakParticle();
        }
      }

      if (this.breakTimer >= BREAK_DURATION) {
        this.isActive = false;
        this.active = false;
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.life += deltaTime;

      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnAmbientParticle(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 10;
    const speed = 10 + Math.random() * 20;

    this.particles.push({
      position: vec2(
        this.position.x + this.size.x / 2 + Math.cos(angle) * radius,
        this.position.y + this.size.y / 2 + Math.sin(angle) * radius,
      ),
      velocity: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 30),
      life: 0,
      maxLife: 1.5 + Math.random() * 0.5,
      size: 1 + Math.random() * 2,
    });
  }

  private spawnBreakParticle(): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 40;

    this.particles.push({
      position: vec2(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2),
      velocity: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 50),
      life: 0,
      maxLife: 0.8 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
    });
  }

  canTriggerChainReaction(otherCrystal: MemoryCrystal): boolean {
    if (!this.isBreaking || !otherCrystal.isActive || otherCrystal.isBreaking) {
      return false;
    }

    const distance = Vector2.distance(this.position, otherCrystal.position);
    return distance <= this.chainReactionRadius;
  }

  triggerChainReaction(delay: number = 0): void {
    if (this.isBreaking || !this.isActive) return;

    this.triggeredByChain = true;

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

    // Trigger memory echo
    this.triggerMemoryEcho();

    // Drop items based on crystal type
    const drops = this.generateDrops();

    return drops;
  }

  // Store the gameState reference for memory addition
  private _gameState: any;

  private triggerMemoryEcho(): void {
    const memories = [
      "A distant melody echoes...",
      "Whispers of ancient wisdom...",
      "Fragments of forgotten dreams...",
      "Echoes of a warrior's courage...",
      "Memories of lost love...",
      "The crystal remembers all...",
      "Time flows like water...",
      "Knowledge seeks its keeper...",
    ];

    this.memoryEcho.active = true;
    this.memoryEcho.timer = 0;
    this.memoryEcho.text = memories[Math.floor(Math.random() * memories.length)];
    this.memoryEcho.opacity = 0;
  }

  private generateDrops(): { experience: Experience[] } {
    const experience: Experience[] = [];

    if (this._gameState?.player) {
      // Generate memory data based on crystal type
      const memoryData = {
        id: `memory_${Date.now()}`,
        type: this.crystalType,
        text: this.memoryEcho.text,
        discovered: new Date().toISOString(),
      };

      // Add memory to player
      if (typeof this._gameState.player.addMemory === "function") {
        this._gameState.player.addMemory(memoryData);
      } else if (Array.isArray(this._gameState.player.memories)) {
        this._gameState.player.memories.push(memoryData);
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
    switch (this.crystalType) {
      case "azure":
        return 5;
      case "amethyst":
        return 10;
      case "emerald":
        return 15;
      case "golden":
        return 25;
      default:
        return 5;
    }
  }

  private getCrystalColors(): {
    primary: string;
    secondary: string;
    glow: string;
  } {
    switch (this.crystalType) {
      case "azure":
        return { primary: "#4169E1", secondary: "#87CEEB", glow: "#00BFFF" };
      case "amethyst":
        return { primary: "#9966CC", secondary: "#DA70D6", glow: "#FF00FF" };
      case "emerald":
        return { primary: "#50C878", secondary: "#98FB98", glow: "#00FF7F" };
      case "golden":
        return { primary: "#FFD700", secondary: "#FFF8DC", glow: "#FFFF00" };
      default:
        return { primary: "#4169E1", secondary: "#87CEEB", glow: "#00BFFF" };
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    const colors = this.getCrystalColors();
    const pulseIntensity = 0.3 + Math.sin(this.pulseTimer * 4 + this.pulsePhase) * 0.2;
    const resonanceGlow = this.resonanceLevel * 0.5;

    ctx.save();

    // Render glow effect
    if (pulseIntensity > 0.2 || resonanceGlow > 0.1) {
      ctx.globalAlpha = (pulseIntensity + resonanceGlow) * 0.6;
      ctx.fillStyle = colors.glow;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 15 + resonanceGlow * 10;

      ctx.beginPath();
      ctx.ellipse(
        this.position.x + this.size.x / 2,
        this.position.y + this.size.y / 2,
        this.size.x / 2 + 4,
        this.size.y / 2 + 4,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Render crystal facets
    this.renderCrystalFacets(ctx, colors, pulseIntensity);

    // Render particles
    this.renderParticles(ctx, colors);

    // Render breaking pieces
    if (this.isBreaking) {
      this.renderBreakingPieces(ctx, colors);
    }

    // Render memory echo
    if (this.memoryEcho.active) {
      this.renderMemoryEcho(ctx);
    }

    ctx.restore();
  }

  private renderCrystalFacets(
    ctx: CanvasRenderingContext2D,
    colors: any,
    pulseIntensity: number,
  ): void {
    const centerX = this.position.x + this.size.x / 2;
    const centerY = this.position.y + this.size.y / 2;

    // Main crystal body
    ctx.fillStyle = colors.primary;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    ctx.moveTo(centerX, this.position.y);
    ctx.lineTo(centerX + 8, this.position.y + 8);
    ctx.lineTo(centerX + 6, this.position.y + this.size.y - 4);
    ctx.lineTo(centerX, this.position.y + this.size.y);
    ctx.lineTo(centerX - 6, this.position.y + this.size.y - 4);
    ctx.lineTo(centerX - 8, this.position.y + 8);
    ctx.closePath();
    ctx.fill();

    // Crystal highlights
    ctx.fillStyle = colors.secondary;
    ctx.globalAlpha = 0.6 + pulseIntensity * 0.3;

    ctx.beginPath();
    ctx.moveTo(centerX, this.position.y);
    ctx.lineTo(centerX + 8, this.position.y + 8);
    ctx.lineTo(centerX + 2, this.position.y + 6);
    ctx.lineTo(centerX - 2, this.position.y + 6);
    ctx.lineTo(centerX - 8, this.position.y + 8);
    ctx.closePath();
    ctx.fill();

    // Inner glow
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = pulseIntensity * 0.4;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  private renderParticles(ctx: CanvasRenderingContext2D, colors: any): void {
    ctx.fillStyle = colors.glow;

    this.particles.forEach((particle) => {
      const lifeRatio = particle.life / particle.maxLife;
      const alpha = 1 - lifeRatio;

      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.ellipse(
        particle.position.x,
        particle.position.y,
        particle.size * (1 - lifeRatio * 0.5),
        particle.size * (1 - lifeRatio * 0.5),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  private renderBreakingPieces(ctx: CanvasRenderingContext2D, colors: any): void {
    ctx.fillStyle = colors.primary;

    this.pieces.forEach((piece) => {
      ctx.globalAlpha = piece.opacity;
      ctx.save();
      ctx.translate(piece.position.x, piece.position.y);
      ctx.rotate(piece.rotation);

      ctx.beginPath();
      ctx.moveTo(0, -piece.size);
      ctx.lineTo(piece.size * 0.7, 0);
      ctx.lineTo(0, piece.size);
      ctx.lineTo(-piece.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    ctx.globalAlpha = 1;
  }

  private renderMemoryEcho(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#E6E6FA";
    ctx.globalAlpha = this.memoryEcho.opacity * 0.8;
    ctx.font = "10px serif";
    ctx.textAlign = "center";

    ctx.fillText(this.memoryEcho.text, this.position.x + this.size.x / 2, this.position.y - 20);

    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.x,
      height: this.size.y,
    };
  }
}

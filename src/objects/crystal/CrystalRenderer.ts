import type { Vector2 } from "../../engine/Vector2.js";
import type { CrystalColors } from "./CrystalTypeConfig.js";
import type { ParticleSystem } from "./ParticleSystem.js";

export interface CrystalPiece {
  position: Vector2;
  velocity: Vector2;
  rotationSpeed: number;
  rotation: number;
  size: number;
  opacity: number;
}

export class CrystalRenderer {
  private position: Vector2;
  private size: Vector2;

  constructor(position: Vector2, size: Vector2) {
    this.position = position;
    this.size = size;
  }

  render(
    ctx: CanvasRenderingContext2D,
    colors: CrystalColors,
    pulseIntensity: number,
    resonanceGlow: number,
    isBreaking: boolean,
    breakTimer: number,
    particleSystem: ParticleSystem,
    pieces: CrystalPiece[]
  ): void {
    ctx.save();

    if (!isBreaking || breakTimer < 0.3) {
      this.renderGlow(ctx, colors, pulseIntensity, resonanceGlow);
      this.renderCrystalFacets(ctx, colors, pulseIntensity);
    }

    particleSystem.render(ctx, colors.glow);

    if (isBreaking) {
      this.renderBreakingPieces(ctx, colors, pieces);
    }

    ctx.restore();
  }

  private renderGlow(
    ctx: CanvasRenderingContext2D,
    colors: CrystalColors,
    pulseIntensity: number,
    resonanceGlow: number
  ): void {
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
  }

  private renderCrystalFacets(
    ctx: CanvasRenderingContext2D,
    colors: CrystalColors,
    pulseIntensity: number
  ): void {
    const centerX = this.position.x + this.size.x / 2;
    const centerY = this.position.y + this.size.y / 2;

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

    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = pulseIntensity * 0.4;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  private renderBreakingPieces(
    ctx: CanvasRenderingContext2D,
    colors: CrystalColors,
    pieces: CrystalPiece[]
  ): void {
    ctx.fillStyle = colors.primary;

    pieces.forEach((piece) => {
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

  updatePosition(position: Vector2): void {
    this.position = position;
  }

  updateSize(size: Vector2): void {
    this.size = size;
  }
}
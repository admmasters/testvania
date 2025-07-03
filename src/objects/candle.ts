import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2";
import { Heart } from "./heart";

export class Candle {
  position: Vector2;
  size: Vector2;
  velocity: Vector2;
  active: boolean;
  animationFrame: number;
  animationTimer: number;
  isBreaking: boolean;
  breakTimer: number;

  constructor(x: number, y: number) {
    this.position = new Vector2(x, y);
    this.size = new Vector2(16, 32);
    this.velocity = new Vector2(0, 0);
    this.active = true;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.isBreaking = false;
    this.breakTimer = 0;
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    this.animationTimer += deltaTime;

    if (this.isBreaking) {
      this.breakTimer += deltaTime;
      if (this.breakTimer >= 0.5) {
        // Break animation lasts 0.5 seconds
        this.active = false;
      }
    } else if (this.animationTimer > 0.2) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 2; // Toggle between 0 and 1
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();

    if (this.isBreaking) {
      // Draw broken candle pieces
      ctx.fillStyle = "#FF9933";
      const offset = this.breakTimer * 50; // Pieces spread out over time

      // Draw 4 pieces flying in different directions
      for (let i = 0; i < 4; i++) {
        const x = this.position.x + (i % 2) * 8 + (i < 2 ? -offset : offset);
        const y = this.position.y + (i < 2 ? -offset : offset);
        ctx.fillRect(x, y, 8, 8);
      }
    } else {
      // Draw candle holder/base (bronze/gold color)
      ctx.fillStyle = "#CD7F32";
      ctx.fillRect(this.position.x + 2, this.position.y + this.size.y - 6, this.size.x - 4, 6);

      // Draw candle body (white/cream)
      ctx.fillStyle = "#FFFEF7";
      ctx.fillRect(this.position.x + 4, this.position.y + 4, this.size.x - 8, this.size.y - 10);

      // Draw candle wick (dark)
      ctx.fillStyle = "#333333";
      ctx.fillRect(this.position.x + this.size.x / 2 - 1, this.position.y + 2, 2, 4);

      // Draw animated flame
      const flameX = this.position.x + this.size.x / 2;
      let flameY: number, flameSize: number;

      if (this.animationFrame === 0) {
        flameY = this.position.y - 2;
        flameSize = 3;
      } else {
        flameY = this.position.y - 4;
        flameSize = 2.5;
      }

      // Outer flame (orange)
      ctx.fillStyle = "#FF4500";
      ctx.beginPath();
      ctx.ellipse(flameX, flameY, flameSize, flameSize * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner flame (yellow)
      ctx.fillStyle = "#FFFF00";
      ctx.beginPath();
      ctx.ellipse(flameX, flameY, flameSize * 0.6, flameSize * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core flame (white)
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(flameX, flameY, flameSize * 0.3, flameSize * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  break(gameState?: GameState): void {
    if (this.active && !this.isBreaking) {
      this.isBreaking = true;
      this.breakTimer = 0;

      // Drop a heart when broken
      if (gameState) {
        const heart = new Heart(
          this.position.x + this.size.x / 2 - 6, // Center the heart
          this.position.y + this.size.y / 2,
        );
        gameState.hearts = gameState.hearts || [];
        gameState.hearts.push(heart);
      }
    }
  }

  getBounds() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.x,
      height: this.size.y,
    };
  }
}

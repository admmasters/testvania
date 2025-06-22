import { Vector2 } from "../engine/Vector2";

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
    this.size = new Vector2(16, 24);
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
      // Draw candle base
      ctx.fillStyle = "#DDDDDD";
      ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);

      // Draw candle wax
      ctx.fillStyle = "#FF4444";
      ctx.fillRect(this.position.x + 2, this.position.y + 2, this.size.x - 4, this.size.y - 4);

      // Draw flame
      if (this.animationFrame === 0) {
        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.arc(this.position.x + this.size.x / 2, this.position.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#FF8800";
        ctx.beginPath();
        ctx.arc(this.position.x + this.size.x / 2, this.position.y - 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  break(): void {
    if (this.active && !this.isBreaking) {
      this.isBreaking = true;
      this.breakTimer = 0;
      // Play break sound here if you have audio
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

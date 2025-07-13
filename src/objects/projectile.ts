import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2";

export class EnergyBlast extends GameObject {
  damage: number;
  lifetime: number;
  maxLifetime: number;
  facingRight: boolean;
  trailPositions: Array<{ x: number; y: number; alpha: number }> = [];
  maxTrailLength: number = 8;

  constructor(x: number, y: number, facingRight: boolean, damage: number = 4) {
    super({ x, y, width: 16, height: 8 });
    this.velocity = new Vector2(facingRight ? 400 : -400, 0);
    this.damage = damage;
    this.lifetime = 0;
    this.maxLifetime = 2.0; // 2 seconds
    this.facingRight = facingRight;
  }

  update(deltaTime: number, gameState: GameState): void {
    // Update lifetime
    this.lifetime += deltaTime;
    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // Add current position to trail
    this.trailPositions.unshift({
      x: this.position.x + this.size.x / 2,
      y: this.position.y + this.size.y / 2,
      alpha: 1.0,
    });

    // Limit trail length and fade older positions
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.pop();
    }

    // Fade trail positions
    for (let i = 0; i < this.trailPositions.length; i++) {
      this.trailPositions[i].alpha = 1.0 - i / this.maxTrailLength;
    }

    // Move projectile
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Check collision with solid blocks
    for (const solidBlock of gameState.solidBlocks) {
      if (this.checkCollision(solidBlock)) {
        this.active = false;
        gameState.createHitSpark(this.position.x, this.position.y);
        return;
      }
    }

    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      if (enemy.active && this.checkCollision(enemy)) {
        // Deal damage to enemy
        enemy.takeDamage(this.damage, gameState);
        this.active = false;
        gameState.createHitSpark(this.position.x, this.position.y);
        return;
      }
    }

    // Update shake effect
    this.updateShake(deltaTime, false);
  }

  checkCollision(other: GameObject): boolean {
    const bounds = this.getBounds();
    const otherBounds = other.getBounds();

    return (
      bounds.left < otherBounds.right &&
      bounds.right > otherBounds.left &&
      bounds.top < otherBounds.bottom &&
      bounds.bottom > otherBounds.top
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    const renderPos = this.getRenderPosition();

    ctx.save();

    // Draw trail
    for (let i = this.trailPositions.length - 1; i >= 0; i--) {
      const trail = this.trailPositions[i];
      const size = 4 + trail.alpha * 8;

      ctx.globalAlpha = trail.alpha * 0.6;
      ctx.fillStyle = `hsl(${60 + i * 10}, 100%, ${50 + trail.alpha * 30}%)`;
      ctx.shadowColor = "#FFFF00";
      ctx.shadowBlur = size;

      ctx.fillRect(trail.x - size / 2, trail.y - size / 2, size, size);
    }

    // Draw main projectile
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = "#FFFF00";
    ctx.shadowBlur = 12;

    // Core energy blast
    const gradient = ctx.createRadialGradient(
      renderPos.x + this.size.x / 2,
      renderPos.y + this.size.y / 2,
      0,
      renderPos.x + this.size.x / 2,
      renderPos.y + this.size.y / 2,
      this.size.x / 2,
    );
    gradient.addColorStop(0, "#FFFFFF");
    gradient.addColorStop(0.3, "#FFFF00");
    gradient.addColorStop(0.7, "#FFA500");
    gradient.addColorStop(1, "#FF4500");

    ctx.fillStyle = gradient;
    ctx.fillRect(renderPos.x, renderPos.y, this.size.x, this.size.y);

    // Bright center
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(renderPos.x + 2, renderPos.y + 2, this.size.x - 4, this.size.y - 4);

    // Energy sparks around the blast
    const time = this.lifetime * 10;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time;
      const distance = 8 + Math.sin(time + i) * 4;
      const sparkX = renderPos.x + this.size.x / 2 + Math.cos(angle) * distance;
      const sparkY = renderPos.y + this.size.y / 2 + Math.sin(angle) * distance;

      ctx.fillStyle = "#FFFF00";
      ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
    }

    ctx.restore();
  }
}

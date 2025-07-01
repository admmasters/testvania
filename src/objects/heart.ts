import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2";

export class Heart extends GameObject {
  lifeTime: number;
  maxLifeTime: number;
  floatTimer: number;
  floatAmplitude: number;
  baseY: number;
  collected: boolean;
  healAmount: number;

  constructor(x: number, y: number) {
    super({ x, y, width: 12, height: 12 });
    this.maxLifeTime = 8.0; // Hearts last 8 seconds before disappearing
    this.lifeTime = this.maxLifeTime;
    this.floatTimer = 0;
    this.floatAmplitude = 3;
    this.baseY = y;
    this.collected = false;
    this.healAmount = 2; // Hearts heal 2 health points

    // Give hearts a slight upward velocity when spawned
    this.velocity.y = -80;
  }

  update(deltaTime: number, gameState: GameState): void {
    if (!this.active || this.collected) return;

    // Apply gravity but with reduced effect
    this.velocity.y += 200 * deltaTime;

    // Apply velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Platform collision - hearts can land on platforms
    for (const platform of gameState.platforms) {
      if (
        this.velocity.y > 0 &&
        this.position.y + this.size.y >= platform.position.y &&
        this.position.y + this.size.y <= platform.position.y + 10 &&
        this.position.x + this.size.x > platform.position.x &&
        this.position.x < platform.position.x + platform.size.x
      ) {
        this.position.y = platform.position.y - this.size.y;
        this.velocity.y = 0;
        this.baseY = this.position.y;
        break;
      }
    }

    // Floating animation when resting
    if (this.velocity.y === 0) {
      this.floatTimer += deltaTime * 3;
      this.position.y = this.baseY + Math.sin(this.floatTimer) * this.floatAmplitude;
    }

    // Check collision with player
    if (this.checkCollision(gameState.player)) {
      this.collectHeart(gameState);
    }

    // Reduce lifetime
    this.lifeTime -= deltaTime;
    if (this.lifeTime <= 0) {
      this.active = false;
    }
  }

  collectHeart(gameState: GameState): void {
    if (this.collected) return;

    this.collected = true;
    this.active = false;

    // Heal the player
    gameState.player.health = Math.min(
      gameState.player.maxHealth,
      gameState.player.health + this.healAmount,
    );

    // Create a subtle heart collection effect instead of poof
    this.createHeartCollectionEffect(gameState);
  }

  private createHeartCollectionEffect(gameState: GameState): void {
    // Create gentle sparkles instead of dramatic poof
    for (let i = 0; i < 5; i++) {
      const sparkle = new HeartSparkle(
        this.position.x + this.size.x / 2 + (Math.random() - 0.5) * 8,
        this.position.y + this.size.y / 2 + (Math.random() - 0.5) * 8,
      );
      gameState.heartSparkles.push(sparkle);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();

    // Get render position
    const renderPos = this.getRenderPosition();

    // Flicker when about to disappear
    if (this.lifeTime < 2.0 && Math.floor(Date.now() / 200) % 2) {
      ctx.globalAlpha = 0.5;
    }

    // Draw heart shape
    const centerX = renderPos.x + this.size.x / 2;
    const centerY = renderPos.y + this.size.y / 2;

    ctx.fillStyle = "#FF69B4"; // Hot pink color for heart
    ctx.beginPath();

    // Heart shape using two circles and a triangle
    const heartSize = 5;

    // Left bump of heart
    ctx.arc(centerX - heartSize / 2, centerY - heartSize / 2, heartSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Right bump of heart
    ctx.beginPath();
    ctx.arc(centerX + heartSize / 2, centerY - heartSize / 2, heartSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Bottom point of heart
    ctx.beginPath();
    ctx.moveTo(centerX - heartSize, centerY);
    ctx.lineTo(centerX, centerY + heartSize);
    ctx.lineTo(centerX + heartSize, centerY);
    ctx.closePath();
    ctx.fill();

    // Add a white highlight
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX - heartSize / 3, centerY - heartSize / 3, heartSize / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Subtle sparkle effect for heart collection
export class HeartSparkle extends GameObject {
  lifeTime: number;
  maxLifeTime: number;
  floatVelocity: Vector2;
  color: string;
  alpha: number;

  constructor(x: number, y: number) {
    super({ x, y, width: 2, height: 2 });
    this.maxLifeTime = 1.2;
    this.lifeTime = this.maxLifeTime;
    this.floatVelocity = new Vector2(
      (Math.random() - 0.5) * 30, // Gentle horizontal drift
      -Math.random() * 40 - 10, // Gentle upward float
    );

    // Soft pink/white colors for heart sparkles
    const colors = ["#FFB6C1", "#FFC0CB", "#FFFFFF", "#FF69B4"];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = 1.0;
  }

  update(deltaTime: number, _gameState: GameState): void {
    if (!this.active) return;

    // Update position with gentle floating motion
    this.position.x += this.floatVelocity.x * deltaTime;
    this.position.y += this.floatVelocity.y * deltaTime;

    // Slow down over time
    this.floatVelocity.x *= 0.95;
    this.floatVelocity.y *= 0.98;

    // Fade out over time
    this.lifeTime -= deltaTime;
    this.alpha = Math.max(0, this.lifeTime / this.maxLifeTime);

    if (this.lifeTime <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const renderPos = this.getRenderPosition();

    // Draw a small glowing dot
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(renderPos.x + 1, renderPos.y + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

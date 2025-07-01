import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";

export abstract class Enemy extends GameObject {
  type: string;
  speed: number;
  direction: number;
  hitTimer: number;
  hitDuration: number;
  isHit: boolean;
  expValue: number;
  protected damageIndicators: Array<{
    amount: number;
    x: number;
    y: number;
    alpha: number;
    vy: number;
    time: number;
  }> = [];
  isDying: boolean = false;
  deathTimer: number = 0;
  static DEATH_DURATION = 0.2; // seconds to show damage after death

  constructor(args: {
    x: number;
    y: number;
    type: string;
    width?: number;
    height?: number;
    direction?: number;
  }) {
    const { x, y, type, width = 24, height = 32, direction } = args;
    super({ x, y, width, height });
    this.type = type;
    this.health = 3;
    this.maxHealth = 3;
    this.speed = 50;
    this.direction = direction ?? (Math.random() > 0.5 ? 1 : -1);
    this.hitTimer = 0;
    this.hitDuration = 0.2;
    this.isHit = false;
    this.expValue = 10;
  }

  update(deltaTime: number, gameState: GameState): void {
    if (this.isDying) {
      this.updateTimers(deltaTime);
      this.deathTimer -= deltaTime;
      // Only remove when timer is up and all indicators are gone
      if (this.deathTimer <= 0 && this.damageIndicators.length === 0) {
        this.active = false;
      }
      return;
    }
    this.updateMovement(deltaTime, gameState);
    this.updateTimers(deltaTime);
    this.handlePlayerAttack(gameState);
  }

  abstract updateMovement(deltaTime: number, gameState: GameState): void;

  updateTimers(deltaTime: number): void {
    if (this.isHit) {
      this.hitTimer -= deltaTime;
      if (this.hitTimer <= 0) {
        this.isHit = false;
      }
    }
    // Update damage indicators
    for (const indicator of this.damageIndicators) {
      indicator.y -= indicator.vy * deltaTime;
      indicator.alpha -= deltaTime * 1.2;
      indicator.time += deltaTime;
    }
    // Remove faded indicators
    this.damageIndicators = this.damageIndicators.filter((d) => d.alpha > 0);
  }

  handlePlayerAttack(gameState: GameState): void {
    const player = gameState.player;
    const attackBounds = player.getAttackBounds();

    if (attackBounds && this.checkCollisionWithBounds(attackBounds) && !this.isHit) {
      this.takeDamage(1, gameState);
      this.isHit = true;
      this.hitTimer = this.hitDuration;
      this.showDamage(1);

      // Knockback
      const direction = this.position.x < player.position.x ? -1 : 1;
      this.velocity.x = direction * 200;
      this.velocity.y = -150;

      // Create hit spark at the point of impact
      const sparkX = this.position.x + (direction < 0 ? this.size.x : 0); // Spawn at the side of impact
      const sparkY = this.position.y + this.size.y / 2; // Centered vertically
      gameState.createHitSpark(sparkX, sparkY);

      // Hit pause effect
      gameState.hitPause(0.1);
      gameState.camera.shake(0.2, 3);
    }
  }

  checkCollisionWithBounds(bounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }): boolean {
    const myBounds = this.getBounds();
    return !(
      myBounds.right < bounds.left ||
      myBounds.left > bounds.right ||
      myBounds.bottom < bounds.top ||
      myBounds.top > bounds.bottom
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Get render position with shake offset
    const renderPos = this.getRenderPosition();

    // Fade out if dying
    let alpha = 1.0;
    if (this.isDying) {
      alpha = Math.max(0, this.deathTimer / Enemy.DEATH_DURATION);
    }
    ctx.globalAlpha = alpha;

    // Flash white when hit
    if (this.isHit) {
      ctx.fillStyle = "#FFFFFF";
    } else {
      ctx.fillStyle = this.getColor();
    }

    ctx.fillRect(renderPos.x, renderPos.y, this.size.x, this.size.y);

    if (!this.isHit) {
      this.renderDetails(ctx);
    }

    // Render floating damage indicators
    for (const d of this.damageIndicators) {
      ctx.save();
      ctx.globalAlpha = d.alpha * alpha;
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.strokeText(
        `${d.amount}`,
        d.x - this.position.x + renderPos.x,
        d.y - this.position.y + renderPos.y,
      );
      ctx.fillText(
        `${d.amount}`,
        d.x - this.position.x + renderPos.x,
        d.y - this.position.y + renderPos.y,
      );
      ctx.restore();
    }

    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  protected abstract getColor(): string;
  protected abstract renderDetails(ctx: CanvasRenderingContext2D): void;

  showDamage(amount: number): void {
    this.damageIndicators.push({
      amount,
      x: this.position.x + this.size.x / 2,
      y: this.position.y - 8,
      alpha: 1,
      vy: 32 + Math.random() * 16,
      time: 0,
    });
  }

  takeDamage(amount: number, gameState?: GameState): void {
    this.health -= amount;
    if (this.health <= 0 && !this.isDying) {
      this.isDying = true;
      this.deathTimer = Enemy.DEATH_DURATION;
      // Poof effect at center of enemy
      if (gameState) {
        gameState.createPoofEffect(
          this.position.x + this.size.x / 2,
          this.position.y + this.size.y / 2,
        );
        gameState.awardExp(this.expValue, this.position.x + this.size.x / 2, this.position.y);
      }
      // Optionally: play death animation or sound here
    }
  }
}

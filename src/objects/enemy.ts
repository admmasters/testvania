import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";

export abstract class Enemy extends GameObject {
  type: string;
  speed: number;
  direction: number;
  hitTimer: number;
  hitDuration: number;
  isHit: boolean;

  constructor(x: number, y: number, type: string, width = 24, height = 32) {
    super(x, y, width, height);
    this.type = type;
    this.health = 3;
    this.maxHealth = 3;
    this.speed = 50;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.hitTimer = 0;
    this.hitDuration = 0.2;
    this.isHit = false;
  }

  update(deltaTime: number, gameState: GameState): void {
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
  }

  handlePlayerAttack(gameState: GameState): void {
    const player = gameState.player;
    const attackBounds = player.getAttackBounds();

    if (
      attackBounds &&
      this.checkCollisionWithBounds(attackBounds) &&
      !this.isHit
    ) {
      this.takeDamage(1);
      this.isHit = true;
      this.hitTimer = this.hitDuration;

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

    ctx.restore();
  }

  protected abstract getColor(): string;
  protected abstract renderDetails(ctx: CanvasRenderingContext2D): void;
}

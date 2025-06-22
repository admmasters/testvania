import { GameObject } from "../engine/GameObject";
import { GameState } from "../engine/GameState";

export class Enemy extends GameObject {
  type: string;
  speed: number;
  direction: number;
  hitTimer: number;
  hitDuration: number;
  isHit: boolean;

  constructor(x: number, y: number, type = "skeleton") {
    super(x, y, 24, 32);
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

  updateMovement(deltaTime: number, gameState: GameState): void {
    // Simple AI - move back and forth
    this.velocity.x = this.direction * this.speed;

    // Change direction at screen edges
    if (this.position.x <= 0 || this.position.x >= 776) {
      this.direction *= -1;
    }

    // Gravity
    this.velocity.y += 800 * deltaTime;

    // Calculate next position
    const nextPosition = this.position.add(this.velocity.multiply(deltaTime));

    // Check if about to walk off current platform
    let willFallOff = true;
    let onPlatform = false;

    for (let platform of gameState.platforms) {
      const enemyBottom = this.position.y + this.size.y;
      const nextEnemyBottom = nextPosition.y + this.size.y;

      // Check if currently on this platform
      if (
        Math.abs(enemyBottom - platform.position.y) < 2 &&
        this.position.x + this.size.x > platform.position.x &&
        this.position.x < platform.position.x + platform.size.x
      ) {
        onPlatform = true;

        // Check if next step would be on the platform
        const nextX = this.position.x + this.direction * this.speed * deltaTime;
        const checkX = this.direction > 0 ? nextX + this.size.x : nextX;

        // If still on platform, we're good
        if (checkX >= platform.position.x && checkX <= platform.position.x + platform.size.x) {
          willFallOff = false;
        }
      }

      // Handle landing on platforms when falling
      if (
        this.velocity.y > 0 &&
        enemyBottom <= platform.position.y &&
        nextEnemyBottom >= platform.position.y
      ) {
        // Check horizontal overlap
        if (
          nextPosition.x + this.size.x > platform.position.x &&
          nextPosition.x < platform.position.x + platform.size.x
        ) {
          // Land on platform
          nextPosition.y = platform.position.y - this.size.y;
          this.velocity.y = 0;
          onPlatform = true;
          willFallOff = false;
        }
      }
    }

    // If about to walk off the platform, reverse direction
    if (onPlatform && willFallOff) {
      this.direction *= -1;
      this.velocity.x = this.direction * this.speed;
      // Recalculate horizontal position to prevent falling
      nextPosition.x = this.position.x + this.velocity.x * deltaTime;
    }

    // Apply the calculated position
    this.position = nextPosition;

    // Ground collision
    /*
        if (this.position.y > 416) {
            this.position.y = 416;
            this.velocity.y = 0;
        }*/
  }

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

    if (attackBounds && this.checkCollisionWithBounds(attackBounds) && !this.isHit) {
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

    // Flash white when hit
    if (this.isHit) {
      ctx.fillStyle = "#FFFFFF";
    } else {
      ctx.fillStyle = this.type === "skeleton" ? "#F5F5DC" : "#8B0000";
    }

    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);

    if (!this.isHit) {
      // Simple sprite details
      ctx.fillStyle = "#000";
      // Eyes
      ctx.fillRect(this.position.x + 6, this.position.y + 8, 2, 2);
      ctx.fillRect(this.position.x + 16, this.position.y + 8, 2, 2);
      // Mouth
      ctx.fillRect(this.position.x + 10, this.position.y + 14, 4, 2);
    }

    ctx.restore();
  }
}

import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";

export class Player extends GameObject {
  speed: number;
  jumpPower: number;
  grounded: boolean;
  facingRight: boolean;
  attackTimer: number;
  attacking: boolean;
  attackDuration: number;
  invulnerable: boolean;
  invulnerabilityTimer: number;
  invulnerabilityDuration: number;
  coyoteTime: number;
  coyoteTimer: number;

  constructor(x: number, y: number) {
    super(x, y, 32, 48);
    this.health = 16;
    this.maxHealth = 16;
    this.speed = 220;
    this.jumpPower = 430;
    this.grounded = false;
    this.facingRight = true;
    this.attackTimer = 0;
    this.attacking = false;
    this.attackDuration = 0.3;
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 1.0;
    this.coyoteTime = 0.1;
    this.coyoteTimer = 0;
  }

  update(deltaTime: number, gameState: GameState): void {
    this.handleInput(gameState.input, deltaTime);
    this.updatePhysics(deltaTime, gameState);
    this.updateTimers(deltaTime);
    this.handleCollisions(gameState);
  }

  handleInput(input: any, _deltaTime: number): void {
    // Movement
    if (input.isKeyDown("ArrowLeft")) {
      this.velocity.x = -this.speed;
      this.facingRight = false;
    } else if (input.isKeyDown("ArrowRight")) {
      this.velocity.x = this.speed;
      this.facingRight = true;
    } else {
      this.velocity.x = 0;
    }

    // Jump with improved feel - variable height based on how long the jump button is pressed
    if (
      input.isKeyPressed("Space") &&
      (this.grounded || this.coyoteTimer > 0)
    ) {
      this.velocity.y = -this.jumpPower;
      this.grounded = false;
      this.coyoteTimer = 0; // Used up coyote time

      // Small vertical boost for more responsive jumps
      this.position.y -= 5;
    }
    // Cut jump short if key is released during upward movement (variable jump height)
    else if (!input.isKeyDown("Space") && this.velocity.y < 0) {
      this.velocity.y *= 0.5; // Reduce upward velocity when jump key released
    }

    // Attack
    if (input.isKeyPressed("KeyX") && !this.attacking) {
      this.attack();
    }
  }

  updatePhysics(deltaTime: number, gameState: GameState): void {
    // Gravity
    this.velocity.y += 800 * deltaTime;

    // Update position
    const nextPosition = this.position.add(this.velocity.multiply(deltaTime));

    // Handle platform collisions
    this.grounded = false;
    for (const platform of gameState.platforms) {
      // Check if player would be colliding with a platform after moving
      const playerBottom = this.position.y + this.size.y;
      const nextPlayerBottom = nextPosition.y + this.size.y;

      // Check if player is falling onto platform
      if (
        this.velocity.y > 0 &&
        playerBottom <= platform.position.y &&
        nextPlayerBottom >= platform.position.y
      ) {
        // Check horizontal overlap
        if (
          nextPosition.x + this.size.x > platform.position.x &&
          nextPosition.x < platform.position.x + platform.size.x
        ) {
          // Land on platform
          nextPosition.y = platform.position.y - this.size.y;
          this.velocity.y = 0;
          this.grounded = true;
        }
      }
    }

    // Apply the calculated position
    this.position = nextPosition;

    // Ground collision (simple)
    /*
        if (this.position.y > 400) {
            this.position.y = 400;
            this.velocity.y = 0;
            this.grounded = true;
        }*/

    // Level boundaries
    // Get the level dimensions from the game state
    const levelData = gameState.levelManager.getLevelData(
      gameState.currentLevelId ?? ""
    );
    const levelWidth = levelData?.width || 800; // Fallback to 800 if level data is not available
    const levelHeight = levelData?.height || 600; // Fallback to 600 if level data is not available

    // Apply horizontal boundaries
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.x > levelWidth)
      this.position.x = levelWidth - this.size.x;

    // Apply vertical boundary at the bottom of the level
    if (this.position.y + this.size.y > levelHeight) {
      this.position.y = levelHeight - this.size.y;
      this.velocity.y = 0;
      this.grounded = true;
    }
  }

  updateTimers(deltaTime: number): void {
    if (this.attacking) {
      this.attackTimer -= deltaTime;
      if (this.attackTimer <= 0) {
        this.attacking = false;
      }
    }

    if (this.invulnerable) {
      this.invulnerabilityTimer -= deltaTime;
      if (this.invulnerabilityTimer <= 0) {
        this.invulnerable = false;
      }
    }

    // Handle coyote time (allowing jumps shortly after leaving platform)
    if (!this.grounded) {
      if (this.coyoteTimer > 0) {
        this.coyoteTimer -= deltaTime;
      }
    } else {
      this.coyoteTimer = this.coyoteTime;
    }
  }

  handleCollisions(gameState: GameState): void {
    if (this.invulnerable) return;

    for (const enemy of gameState.enemies) {
      if (enemy.active && this.checkCollision(enemy)) {
        this.takeDamage(1);
        this.invulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;

        // Knockback
        const direction = this.position.x < enemy.position.x ? -1 : 1;
        this.velocity.x = direction * 150;
        this.velocity.y = -200;

        gameState.camera.shake(0.3, 5);
        break;
      }
    }
  }

  attack(): void {
    this.attacking = true;
    this.attackTimer = this.attackDuration;
  }

  getAttackBounds(): {
    left: number;
    right: number;
    top: number;
    bottom: number;
  } | null {
    if (!this.attacking) return null;

    const offset = this.facingRight ? this.size.x : -32;
    return {
      left: this.position.x + offset,
      right: this.position.x + offset + 32,
      top: this.position.y + 8,
      bottom: this.position.y + this.size.y - 8,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Flicker when invulnerable
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = "#8B4513";
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);

    // Face
    ctx.fillStyle = "#FFE4C4";
    ctx.fillRect(this.position.x + 8, this.position.y + 8, 16, 16);

    // Eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(this.position.x + 10, this.position.y + 12, 2, 2);
    ctx.fillRect(this.position.x + 20, this.position.y + 12, 2, 2);

    // Whip/weapon when attacking
    if (this.attacking) {
      ctx.fillStyle = "#8B4513";
      const whipX = this.facingRight
        ? this.position.x + this.size.x
        : this.position.x - 32;
      ctx.fillRect(whipX, this.position.y + 16, 32, 4);
    }

    ctx.restore();
  }
}

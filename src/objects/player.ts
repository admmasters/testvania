import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";
import type { Platform } from "./platform";
import type { SolidBlock } from "./solidBlock";

interface PlayerInput {
  isKeyDown(key: string): boolean;
  isKeyPressed(key: string): boolean;
}

export class Player extends GameObject {
  speed: number;
  jumpPower: number;
  grounded: boolean;
  facingRight: boolean;
  attackTimer: number;
  attacking: boolean;
  attackDuration: number;
  attackCooldown: number;
  attackCooldownTimer: number;
  attackAnimationPhase: number; // 0-1 for smooth animation progression
  invulnerable: boolean;
  invulnerabilityTimer: number;
  invulnerabilityDuration: number;
  coyoteTime: number;
  coyoteTimer: number;
  level: number;
  exp: number;
  expToNext: number;
  strength: number;
  defense: number;
  speedStat: number;

  // Stat growth per level (could be made configurable)
  static BASE_EXP_TO_NEXT = 100;
  static EXP_GROWTH = 1.5;
  static BASE_MAX_HEALTH = 16;
  static BASE_STRENGTH = 2;
  static BASE_DEFENSE = 1;
  static BASE_SPEED = 220;

  constructor(x: number, y: number) {
    super({ x, y, width: 32, height: 48 });
    this.level = 1;
    this.exp = 0;
    this.expToNext = Player.BASE_EXP_TO_NEXT;
    this.strength = Player.BASE_STRENGTH;
    this.defense = Player.BASE_DEFENSE;
    this.maxHealth = Player.BASE_MAX_HEALTH;
    this.health = this.maxHealth;
    this.speedStat = Player.BASE_SPEED;
    this.speed = this.speedStat;
    this.jumpPower = 430;
    this.grounded = false;
    this.facingRight = true;
    this.attackTimer = 0;
    this.attacking = false;
    this.attackDuration = 0.12; // Slower for better visibility and control
    this.attackCooldown = 0.08; // Reasonable cooldown for chaining
    this.attackCooldownTimer = 0;
    this.attackAnimationPhase = 0;
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 1.0;
    this.coyoteTime = 0.1;
    this.coyoteTimer = 0;
  }

  update(deltaTime: number, gameState: GameState): void {
    this.handleInput(gameState.input, deltaTime, gameState);
    this.updatePhysics(deltaTime, gameState);
    this.updateTimers(deltaTime);
    this.handleCollisions(gameState);
  }

  handleInput(input: PlayerInput, _deltaTime: number, gameState?: GameState): void {
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
    if (input.isKeyPressed("Space") && (this.grounded || this.coyoteTimer > 0)) {
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

    // Attack - allow attack if not currently attacking and cooldown is over
    if (input.isKeyPressed("KeyX") && !this.attacking && this.attackCooldownTimer <= 0) {
      this.performAttack(gameState);
    }
  }

  updatePhysics(deltaTime: number, gameState: GameState): void {
    // Gravity
    this.velocity.y += 800 * deltaTime;

    // Handle horizontal movement first
    const nextX = this.position.x + this.velocity.x * deltaTime;
    let canMoveHorizontally = true;

    // Do NOT check horizontal collisions with platforms (allow moving through them)

    // Check horizontal collisions with solid blocks only
    for (const solidBlock of gameState.solidBlocks) {
      if (this.wouldCollideHorizontally(nextX, this.position.y, solidBlock)) {
        canMoveHorizontally = false;
        break;
      }
    }

    // Apply horizontal movement if no collision
    if (canMoveHorizontally) {
      this.position.x = nextX;
    } else {
      this.velocity.x = 0; // Stop horizontal movement on collision
    }

    // Handle vertical movement
    const nextY = this.position.y + this.velocity.y * deltaTime;
    this.grounded = false;

    // Check vertical collisions with platforms and solid blocks
    let highestPlatform: Platform | SolidBlock | null = null;
    let highestPlatformY = Number.MAX_VALUE;
    let hitCeiling = false;

    // Check platforms
    for (const platform of gameState.platforms) {
      // Check if player is falling onto platform (landing on top)
      if (this.velocity.y > 0) {
        const playerBottom = this.position.y + this.size.y;
        const nextPlayerBottom = nextY + this.size.y;

        if (playerBottom <= platform.position.y && nextPlayerBottom >= platform.position.y) {
          // Check horizontal overlap
          if (
            this.position.x + this.size.x > platform.position.x &&
            this.position.x < platform.position.x + platform.size.x
          ) {
            // Check if this is the highest (topmost) platform the player would land on
            if (platform.position.y < highestPlatformY) {
              highestPlatform = platform;
              highestPlatformY = platform.position.y;
            }
          }
        }
      }
      // Do NOT check for hitting ceiling with platforms (allow jumping through)
    }

    // Check solid blocks
    for (const solidBlock of gameState.solidBlocks) {
      // Check if player is falling onto solid block (landing on top)
      if (this.velocity.y > 0) {
        const playerBottom = this.position.y + this.size.y;
        const nextPlayerBottom = nextY + this.size.y;

        if (playerBottom <= solidBlock.position.y && nextPlayerBottom >= solidBlock.position.y) {
          // Check horizontal overlap
          if (
            this.position.x + this.size.x > solidBlock.position.x &&
            this.position.x < solidBlock.position.x + solidBlock.size.x
          ) {
            // Check if this is the highest (topmost) solid block the player would land on
            if (solidBlock.position.y < highestPlatformY) {
              highestPlatform = solidBlock;
              highestPlatformY = solidBlock.position.y;
            }
          }
        }
      }
      // Check if player is moving up into solid block (hitting ceiling)
      else if (this.velocity.y < 0) {
        const playerTop = this.position.y;
        const nextPlayerTop = nextY;
        const solidBlockBottom = solidBlock.position.y + solidBlock.size.y;

        if (playerTop >= solidBlockBottom && nextPlayerTop <= solidBlockBottom) {
          // Check horizontal overlap
          if (
            this.position.x + this.size.x > solidBlock.position.x &&
            this.position.x < solidBlock.position.x + solidBlock.size.x
          ) {
            hitCeiling = true;
            break;
          }
        }
      }
    }

    // Apply vertical movement
    if (highestPlatform) {
      // Land on platform
      this.position.y = highestPlatform.position.y - this.size.y;
      this.velocity.y = 0;
      this.grounded = true;
    } else if (hitCeiling) {
      // Hit ceiling
      this.position.y = this.findCeilingPosition(gameState.platforms, gameState.solidBlocks);
      this.velocity.y = 0;
    } else {
      // No collision, apply normal movement
      this.position.y = nextY;
    }

    // Level boundaries
    const levelData = gameState.levelManager.getLevelData(gameState.currentLevelId ?? "");
    const levelWidth = levelData?.width || 800;
    const levelHeight = levelData?.height || 600;

    // Apply horizontal boundaries
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.size.x > levelWidth) this.position.x = levelWidth - this.size.x;

    // Apply vertical boundary at the bottom of the level
    if (this.position.y + this.size.y > levelHeight) {
      this.position.y = levelHeight - this.size.y;
      this.velocity.y = 0;
      this.grounded = true;
    }
  }

  private wouldCollideHorizontally(
    nextX: number,
    currentY: number,
    obstacle: Platform | SolidBlock,
  ): boolean {
    // Check if the player would overlap with the obstacle horizontally
    const playerLeft = nextX;
    const playerRight = nextX + this.size.x;
    const playerTop = currentY;
    const playerBottom = currentY + this.size.y;

    const obstacleLeft = obstacle.position.x;
    const obstacleRight = obstacle.position.x + obstacle.size.x;
    const obstacleTop = obstacle.position.y;
    const obstacleBottom = obstacle.position.y + obstacle.size.y;

    // Check if there's overlap in both axes
    const horizontalOverlap = playerRight > obstacleLeft && playerLeft < obstacleRight;
    const verticalOverlap = playerBottom > obstacleTop && playerTop < obstacleBottom;

    return horizontalOverlap && verticalOverlap;
  }

  private findCeilingPosition(_platforms: Platform[], solidBlocks: SolidBlock[]): number {
    let lowestCeiling = 0;

    // Do NOT check platforms for ceiling (allow jumping through them)

    // Check solid blocks only
    for (const solidBlock of solidBlocks) {
      const solidBlockBottom = solidBlock.position.y + solidBlock.size.y;

      // Check if player would horizontally overlap with this solid block
      if (
        this.position.x + this.size.x > solidBlock.position.x &&
        this.position.x < solidBlock.position.x + solidBlock.size.x
      ) {
        // Check if this solid block is above the player and lower than current ceiling
        if (solidBlockBottom > lowestCeiling && solidBlockBottom < this.position.y) {
          lowestCeiling = solidBlockBottom;
        }
      }
    }

    return lowestCeiling;
  }

  updateTimers(deltaTime: number): void {
    if (this.attacking) {
      this.attackTimer -= deltaTime;
      // Update animation phase (0 = start, 1 = end)
      this.attackAnimationPhase = 1 - this.attackTimer / this.attackDuration;

      if (this.attackTimer <= 0) {
        this.attacking = false;
        this.attackAnimationPhase = 0;
        this.attackCooldownTimer = this.attackCooldown; // Start cooldown after attack ends
      }
    }

    // Update attack cooldown timer
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= deltaTime;
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
      if (enemy.active && !enemy.isDying && this.checkCollision(enemy)) {
        this.takeDamage(1);
        this.invulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;

        // Knockback
        const direction = this.position.x < enemy.position.x ? -1 : 1;
        this.velocity.x = direction * 150;
        this.velocity.y = -200;

        // No global camera shake; individual objects will shake via GameState.hitPause.
        break;
      }
    }
  }

  attack(): void {
    this.attacking = true;
    this.attackTimer = this.attackDuration;
  }

  // Enhanced attack method that could be called from GameState for screen shake
  performAttack(_gameState?: GameState): void {
    this.attack();
    // No global camera shake; individual objects will shake via GameState.hitPause.
  }

  getAttackBounds(): {
    left: number;
    right: number;
    top: number;
    bottom: number;
  } | null {
    if (!this.attacking) return null;

    // Horizontal slash bounds - much wider reach
    const centerX = this.position.x + this.size.x / 2;
    const centerY = this.position.y + this.size.y / 2;
    const direction = this.facingRight ? 1 : -1;
    const slashLength = 100; // Increased from 60 for longer horizontal reach

    const startX = centerX - direction * slashLength * 0.1; // Less behind character
    const endX = centerX + direction * slashLength * 0.9; // More in front

    return {
      left: Math.min(startX, endX),
      right: Math.max(startX, endX),
      top: centerY - 30, // Increased vertical range from 15 to 30
      bottom: centerY + 30, // Increased vertical range from 15 to 30
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Flicker when invulnerable
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
      ctx.globalAlpha = 0.5;
    }

    // Get render position with shake offset
    const renderPos = this.getRenderPosition();

    ctx.fillStyle = "#8B4513";
    ctx.fillRect(renderPos.x, renderPos.y, this.size.x, this.size.y);

    // Face
    ctx.fillStyle = "#FFE4C4";
    ctx.fillRect(renderPos.x + 8, renderPos.y + 8, 16, 16);

    // Eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(renderPos.x + 10, renderPos.y + 12, 2, 2);
    ctx.fillRect(renderPos.x + 20, renderPos.y + 12, 2, 2);

    // Alucard-style ultra-fast sword swipe
    if (this.attacking) {
      const progress = this.attackAnimationPhase;
      const centerX = renderPos.x + this.size.x / 2;
      const centerY = renderPos.y + this.size.y / 2;
      const direction = this.facingRight ? 1 : -1;

      // Multiple simultaneous slash lines for instant impact
      const slashCount = 3; // Reduced for thinner appearance
      const baseLength = 60; // Slightly shorter visual reach

      // Intense white flash effect at the start - more dramatic with lighting
      if (progress < 0.3) {
        const flashAlpha = 1.0 - progress / 0.5;

        // Outer light bloom - smaller and bright blue
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35);
        gradient.addColorStop(0, `rgba(220, 240, 255, ${flashAlpha * 0.8})`);
        gradient.addColorStop(0.3, `rgba(180, 220, 255, ${flashAlpha * 0.6})`);
        gradient.addColorStop(0.6, `rgba(140, 190, 255, ${flashAlpha * 0.3})`);
        gradient.addColorStop(1, `rgba(100, 150, 255, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 35, centerY - 35, 70, 70);

        // Core bright flash - smaller light blue
        ctx.globalAlpha = flashAlpha * 0.8;
        ctx.fillStyle = "#DDEEff";
        ctx.fillRect(centerX - 20, centerY - 20, 40, 40);
        ctx.globalAlpha = 1.0;
      }

      // Draw multiple horizontal slash lines instantly - razor sharp
      for (let i = 0; i < slashCount; i++) {
        const yOffset = (i - 1) * 2; // Thinner vertical spread for sleeker appearance

        const length = baseLength + i * 8 + progress * 40;
        const startX = centerX - direction * length * 0.1; // Much less behind the character
        const startY = centerY + yOffset;
        const endX = centerX + direction * length * 0.9; // More in front
        const endY = centerY + yOffset;

        // Outer lighting bloom - thinner and more elegant
        ctx.strokeStyle = "#66BBDD";
        ctx.lineWidth = 4; // Reduced from 6
        ctx.globalAlpha = 0.4; // Slightly more transparent
        ctx.lineCap = "round";
        ctx.shadowColor = "#66BBDD";
        ctx.shadowBlur = 6; // Reduced blur
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Mid glow layer - thinner
        ctx.strokeStyle = "#88CCEE";
        ctx.lineWidth = 2; // Reduced from 3
        ctx.globalAlpha = 0.6; // Slightly more transparent
        ctx.shadowBlur = 4; // Reduced blur
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Main slash - thinner bright light blue
        ctx.strokeStyle = "#BBDDFF";
        ctx.lineWidth = 1; // Reduced from 1.5
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = "#BBDDFF";
        ctx.shadowBlur = 2; // Reduced blur
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Ultra-sharp inner core - very thin
        ctx.strokeStyle = "#DDEEFF";
        ctx.lineWidth = 0.3; // Reduced from 0.5
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 1; // Reduced blur
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Reset shadow for other elements
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // Sharp speed lines effect - thinner and more refined
      ctx.globalAlpha = 0.6; // More subtle
      ctx.strokeStyle = "#CCDDFF";
      ctx.lineWidth = 0.5; // Thinner speed lines
      ctx.lineCap = "butt";
      ctx.shadowColor = "#BBDDFF";
      ctx.shadowBlur = 1; // Less blur
      for (let i = 0; i < 4; i++) {
        // Fewer speed lines for cleaner look
        const lineLength = 30 + i * 5; // Slightly shorter
        const yOffset = (i - 1.5) * 3; // Tighter vertical spread

        const lineStartX = centerX - direction * lineLength * 0.2; // Less behind
        const lineStartY = centerY + yOffset;
        const lineEndX = centerX + direction * lineLength * 0.8; // More forward
        const lineEndY = centerY + yOffset;

        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Explosive sparkle burst at sword tip - with dramatic lighting
      if (progress > 0.15) {
        // Start after initial flash for better pacing
        const tipX = centerX + direction * (baseLength + 40) * 0.8; // More forward
        const tipY = centerY;

        // Outer light bloom around tip - smaller blue-white
        const sparkGradient = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 18);
        sparkGradient.addColorStop(0, "rgba(240, 250, 255, 0.8)");
        sparkGradient.addColorStop(0.4, "rgba(200, 230, 255, 0.6)");
        sparkGradient.addColorStop(0.7, "rgba(160, 200, 255, 0.3)");
        sparkGradient.addColorStop(1, "rgba(120, 170, 255, 0)");

        ctx.fillStyle = sparkGradient;
        ctx.fillRect(tipX - 18, tipY - 18, 36, 36);

        // Small spark explosion with blue glow
        ctx.shadowColor = "#AADDFF";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "#CCDDFF";
        for (let i = 0; i < 8; i++) {
          // Fewer sparks
          const sparkAngle = (i / 8) * Math.PI * 2;
          const sparkDist = 4 + Math.random() * 6;
          const sparkX = tipX + Math.cos(sparkAngle) * sparkDist;
          const sparkY = tipY + Math.sin(sparkAngle) * sparkDist;
          ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
        }

        // Small central burst with blue glow
        ctx.shadowColor = "#DDEEFF";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#EEFFFF";
        ctx.fillRect(tipX - 2, tipY - 2, 4, 4);

        // Small bright core
        ctx.shadowBlur = 3;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(tipX - 1, tipY - 1, 2, 2);

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  gainExp(amount: number): void {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.levelUp();
    }
  }

  levelUp(): void {
    this.level++;
    // Stat increases per level (customize as desired)
    this.maxHealth += 4;
    this.strength += 1;
    this.defense += 1;
    this.speedStat += 5;
    this.expToNext = Math.floor(this.expToNext * Player.EXP_GROWTH);
    this.health = this.maxHealth; // Heal on level up
    this.speed = this.speedStat;
    this.displayLevelUp();
    // TODO: Hook for stat allocation UI or animation
  }

  displayLevelUp(): void {
    // Placeholder: Add UI feedback, animation, or sound here
    // Example: console.log(`Level Up! Now level ${this.level}`);
  }
}

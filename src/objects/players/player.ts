import { GameObject } from "../../engine/GameObject";

import type { GameState } from "../../engine/GameState";
import type { DiagonalPlatform } from "../diagonalPlatform";
import * as PlayerAttack from "./PlayerAttack";
import { PlayerMovement } from "./PlayerMovement";
import { PlayerPhysics } from "./PlayerPhysics";
import { PlayerRenderer } from "./PlayerRenderer";
import { PlayerStats } from "./PlayerStats";
import { PlayerTimers } from "./PlayerTimers";
import type { Memory, PlayerInput } from "./PlayerTypes";

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

  // Memories collection for crystal memories
  memories: Memory[] = [];

  // Power bar system for charged attacks
  power: number;
  maxPower: number;
  powerRechargeRate: number;
  isChargingAttack: boolean;
  chargeTime: number;
  maxChargeTime: number;
  chargeLevel: number; // 0 = no charge, 1 = partial, 2 = full charge
  chargingSound: boolean;

  constructor(x: number, y: number) {
    super({ x, y, width: 32, height: 48 });
    this.level = 1;
    this.exp = 0;
    this.expToNext = PlayerStats.BASE_EXP_TO_NEXT;
    this.strength = PlayerStats.BASE_STRENGTH;
    this.defense = PlayerStats.BASE_DEFENSE;
    this.maxHealth = PlayerStats.BASE_MAX_HEALTH;
    this.health = this.maxHealth;
    this.speedStat = PlayerStats.BASE_SPEED;
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
    this.memories = []; // Initialize empty memories array

    // Initialize power bar system
    this.power = 0; // Start at zero
    this.maxPower = 100;
    this.powerRechargeRate = 50; // Power units per second - faster charging
    this.isChargingAttack = false;
    this.chargeTime = 0;
    this.maxChargeTime = 2.0; // 2 seconds for full charge
    this.chargeLevel = 0;
    this.chargingSound = false;
  }

  update(deltaTime: number, gameState: GameState): void {
    this.handleInput(gameState.input, deltaTime, gameState);
    this.updatePhysics(deltaTime, gameState);
    this.updateTimers(deltaTime);
    this.handleCollisions(gameState);
  }

  // Method to add a memory to the player's collection
  addMemory(memoryData: Memory | null): void {
    if (!memoryData) return;

    // Prevent duplicate memories by checking ID
    const exists = this.memories.some((mem) => mem.id === memoryData.id);
    if (!exists) {
      this.memories.push(memoryData);
      console.log("Memory added:", memoryData.text);

      // Could trigger effects or play sound here
      // e.g., temporary buff, visual effect, etc.
    }
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

    // Attack system - X key handling
    if (input.isKeyPressed("KeyX") && !this.attacking && this.attackCooldownTimer <= 0) {
      PlayerAttack.performAttack(this, gameState);
    } else if (input.isKeyDown("KeyX") && !this.attacking && this.attackCooldownTimer <= 0) {
      if (!this.isChargingAttack) {
        this.isChargingAttack = true;
        this.chargeTime = 0;
        this.chargeLevel = 0;
      }
    } else if (this.isChargingAttack && !input.isKeyDown("KeyX")) {
      if (this.power >= this.maxPower && this.chargeLevel >= 2) {
        PlayerAttack.releaseChargedAttack(this, gameState);
      } else {
        this.isChargingAttack = false;
        this.chargeTime = 0;
        this.chargeLevel = 0;
      }
    }
  }

  updatePhysics(deltaTime: number, gameState: GameState): void {
    // Gravity
    this.velocity.y += 800 * deltaTime;

    // Handle horizontal movement first
    const nextX = this.position.x + this.velocity.x * deltaTime;
    let canMoveHorizontally = true;

    // Check horizontal collisions with solid blocks only
    for (const solidBlock of gameState.solidBlocks) {
      if (
        PlayerPhysics.wouldCollideHorizontally(
          nextX,
          this.position.y,
          this.size.x,
          this.size.y,
          solidBlock,
        )
      ) {
        canMoveHorizontally = false;
        break;
      }
    }

    // Additional check: Prevent walking through a platform that sits on top of a solid block
    if (canMoveHorizontally) {
      for (const platform of gameState.platforms) {
        if (
          PlayerPhysics.wouldCollideHorizontally(
            nextX,
            this.position.y,
            this.size.x,
            this.size.y,
            platform,
          )
        ) {
          // Is there a solid block directly below this platform at the same X range?
          const platformBottom = platform.position.y + platform.size.y;
          const platformLeft = platform.position.x;
          const platformRight = platform.position.x + platform.size.x;
          let solidBelow = false;
          for (const solidBlock of gameState.solidBlocks) {
            const solidTop = solidBlock.position.y;
            const solidLeft = solidBlock.position.x;
            const solidRight = solidBlock.position.x + solidBlock.size.x;
            // Solid block must be directly below platform, horizontally overlapping, and touching
            if (
              Math.abs(solidTop - platformBottom) < 0.5 && // Allow for float rounding
              solidLeft < platformRight &&
              solidRight > platformLeft
            ) {
              solidBelow = true;
              break;
            }
          }
          if (solidBelow) {
            canMoveHorizontally = false;
            break;
          }
        }
      }
    }

    // Apply horizontal movement if no collision
    if (canMoveHorizontally) {
      this.position.x = nextX;

      // Check if player is walking on a diagonal platform and adjust Y position
      if (this.grounded) {
        for (const diagonalPlatform of gameState.diagonalPlatforms as DiagonalPlatform[]) {
          const playerLeft = this.position.x;
          const playerRight = this.position.x + this.size.x;
          const playerBottom = this.position.y + this.size.y;

          // Check if player is currently on this diagonal platform
          if (diagonalPlatform.isPlayerOnSurface(playerLeft, playerRight, playerBottom)) {
            // Adjust player Y position to stay on the diagonal surface
            const surfaceY = diagonalPlatform.getPlayerSurfaceY(playerLeft, playerRight);
            if (surfaceY !== null) {
              // Position player exactly on the platform surface
              this.position.y = surfaceY - this.size.y;
              break; // Only adjust for one platform
            }
          }
        }
      }
    } else {
      this.velocity.x = 0; // Stop horizontal movement on collision
    }

    // Handle vertical movement with collision detection
    const nextY = this.position.y + this.velocity.y * deltaTime;

    // Type compatibility fix for gameState
    const gameStateAdapter = {
      platforms: gameState.platforms,
      solidBlocks: gameState.solidBlocks,
      diagonalPlatforms: gameState.diagonalPlatforms,
      levelManager: gameState.levelManager,
      currentLevelId: gameState.currentLevelId || undefined,
    };

    PlayerMovement.handleVerticalMovement(this, nextY, gameStateAdapter);
  }

  updateTimers(deltaTime: number): void {
    PlayerTimers.update(this, deltaTime);
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
    PlayerRenderer.render(this, ctx);
  }

  gainExp(amount: number): void {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.levelUp();
    }
  }

  gainPower(amount: number): void {
    this.power = Math.min(this.maxPower, this.power + amount);
  }

  levelUp(): void {
    PlayerStats.applyLevelUp(this);
    // TODO: Hook for stat allocation UI or animation
  }

  displayLevelUp(): void {
    // Placeholder: Add UI feedback, animation, or sound here
    // Example: console.log(`Level Up! Now level ${this.level}`);
  }
}

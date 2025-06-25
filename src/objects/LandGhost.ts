import { GameState } from "@/engine/GameState";
import { Enemy } from "./enemy";
import { Platform } from "./platform";

export class LandGhost extends Enemy {
  constructor(x: number, y: number) {
    super(x, y, "landghost");
  }

  updateMovement(deltaTime: number, gameState: GameState): void {
    // Get the level dimensions from the game state
    const levelData = gameState.levelManager.getLevelData(
      gameState.currentLevelId ?? ""
    );
    const levelWidth = levelData?.width || 800; // Fallback to 800 if level data is not available
    const levelHeight = levelData?.height || 600; // Fallback to 600 if level data is not available

    // Simple AI - move back and forth
    this.velocity.x = this.direction * this.speed;

    // Change direction at level edges instead of hardcoded screen edges
    if (this.position.x <= 0) {
      this.direction = 1;
      this.position.x = 0;
    } else if (this.position.x + this.size.x >= levelWidth) {
      this.direction = -1;
      this.position.x = levelWidth - this.size.x;
    }

    // Gravity
    this.velocity.y += 800 * deltaTime;

    // Calculate next position
    const nextPosition = this.position.add(this.velocity.multiply(deltaTime));

    // Check platform interactions
    let onPlatform = false;
    let willFallOff = false;
    let landingPlatform: Platform | null = null;
    let landingPlatformY = Number.MAX_VALUE;
    let currentPlatform: Platform | null = null;

    for (const platform of gameState.platforms) {
      const enemyBottom = this.position.y + this.size.y;
      const nextEnemyBottom = nextPosition.y + this.size.y;

      // Check if currently on this platform (with small tolerance for floating point errors)
      if (
        Math.abs(enemyBottom - platform.position.y) < 2 &&
        this.position.x + this.size.x > platform.position.x &&
        this.position.x < platform.position.x + platform.size.x
      ) {
        onPlatform = true;
        currentPlatform = platform;
      }

      // Handle landing on platforms when falling - collect potential platforms
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
          // Check if this is the highest platform to land on
          if (platform.position.y < landingPlatformY) {
            landingPlatform = platform;
            landingPlatformY = platform.position.y;
          }
        }
      }

      // Add additional collision check for falling through a platform at high speed
      else if (
        this.velocity.y > 200 && // High velocity threshold
        this.position.y < platform.position.y &&
        nextPosition.y + this.size.y > platform.position.y + platform.size.y
      ) {
        // Check if enemy is "tunneling" through the platform
        if (
          nextPosition.x + this.size.x > platform.position.x &&
          nextPosition.x < platform.position.x + platform.size.x
        ) {
          // Check if this is the highest platform to land on
          if (platform.position.y < landingPlatformY) {
            landingPlatform = platform;
            landingPlatformY = platform.position.y;
          }
        }
      }
    }

    // Check if about to walk off current platform
    if (onPlatform && currentPlatform) {
      const nextX = this.position.x + this.direction * this.speed * deltaTime;
      
      // Check the edge the ghost is moving towards
      if (this.direction > 0) {
        // Moving right - check if right edge of ghost will go past right edge of platform
        if (nextX + this.size.x >= currentPlatform.position.x + currentPlatform.size.x) {
          willFallOff = true;
        }
      } else {
        // Moving left - check if left edge of ghost will go past left edge of platform
        if (nextX <= currentPlatform.position.x) {
          willFallOff = true;
        }
      }
    }

    // If about to walk off the platform, reverse direction and stay on platform
    if (willFallOff && currentPlatform) {
      this.direction *= -1;
      this.velocity.x = this.direction * this.speed;
      
      // Clamp position to platform bounds to prevent any overshoot
      if (this.direction > 0) {
        // Now moving right, ensure we're not past the left edge
        this.position.x = Math.max(this.position.x, currentPlatform.position.x);
      } else {
        // Now moving left, ensure we're not past the right edge
        this.position.x = Math.min(this.position.x, currentPlatform.position.x + currentPlatform.size.x - this.size.x);
      }
      
      // Recalculate next position with new direction
      nextPosition.x = this.position.x + this.velocity.x * deltaTime;
    }

    // Apply landing on the highest platform found
    if (landingPlatform) {
      nextPosition.y = landingPlatform.position.y - this.size.y;
      this.velocity.y = 0;
      onPlatform = true;
    }

    // Apply the calculated position
    this.position = nextPosition;

    // Ground collision with level bottom
    if (this.position.y + this.size.y > levelHeight) {
      this.position.y = levelHeight - this.size.y;
      this.velocity.y = 0;
      onPlatform = true; // Consider the enemy grounded when on the level floor
    }
  }

  protected getColor(): string {
    return "#F5F5DC"; // Beige color for land ghost
  }

  protected renderDetails(ctx: CanvasRenderingContext2D): void {
    // Simple sprite details
    ctx.fillStyle = "#000";
    // Eyes
    ctx.fillRect(this.position.x + 6, this.position.y + 8, 2, 2);
    ctx.fillRect(this.position.x + 16, this.position.y + 8, 2, 2);
    // Mouth
    ctx.fillRect(this.position.x + 10, this.position.y + 14, 4, 2);
  }
}
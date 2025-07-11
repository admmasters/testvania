import type { GameState } from "@/engine/GameState";
import type { SolidBlock } from "../solidBlock";
import { Enemy } from "./enemy";

export class Ghost extends Enemy {
  floatTimer: number;
  floatAmplitude: number;
  baseY: number;

  constructor(x: number, y: number, direction?: number) {
    super({ x, y, type: "ghost", direction });
    this.speed = 40;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.floatAmplitude = 10;
    this.baseY = y;
    this.hitDuration = 0.3;
    this.health = 2;
    this.maxHealth = 2;
    this.expValue = 10;
  }

  updateMovement(deltaTime: number, gameState: GameState): void {
    // Float up and down
    this.floatTimer += deltaTime * 2;
    this.position.y = this.baseY + Math.sin(this.floatTimer) * this.floatAmplitude;

    // Check for solid block collisions before moving horizontally
    const nextX = this.position.x + this.direction * this.speed * deltaTime;
    let canMoveHorizontally = true;

    // Check horizontal collisions with solid blocks
    for (const solidBlock of gameState.solidBlocks) {
      if (this.wouldCollideHorizontally(nextX, this.position.y, solidBlock)) {
        canMoveHorizontally = false;
        this.direction *= -1; // Reverse direction when hitting a wall
        break;
      }
    }

    // Move left/right only if no collision
    if (canMoveHorizontally) {
      this.position.x = nextX;
    }

    // Reverse direction at level edges
    const levelData = gameState.levelManager.getLevelData(gameState.currentLevelId ?? "");
    const levelWidth = levelData?.width || 800;
    if (this.position.x <= 0) {
      this.direction = 1;
      this.position.x = 0;
    } else if (this.position.x + this.size.x >= levelWidth) {
      this.direction = -1;
      this.position.x = levelWidth - this.size.x;
    }
  }

  handlePlayerAttack(gameState: GameState): void {
    const player = gameState.player;
    const attackBounds = player.getAttackBounds();
    if (attackBounds && this.checkCollisionWithBounds(attackBounds) && !this.isHit) {
      this.takeDamage(1, gameState);
      this.showDamage(1);
      this.isHit = true;
      this.hitTimer = this.hitDuration;
      // Knockback (ghosts float, so just a little push)
      const direction = this.position.x < player.position.x ? -1 : 1;
      this.position.x += direction * 10;
      // Hit spark
      const sparkX = this.position.x + (direction < 0 ? this.size.x : 0);
      const sparkY = this.position.y + this.size.y / 2;
      gameState.createHitSpark(sparkX, sparkY);
      gameState.hitPause(0.1, [this]);
    }
  }

  protected getColor(): string {
    return "#AEE7FF"; // Light blue color for ghost
  }

  protected renderDetails(ctx: CanvasRenderingContext2D): void {
    // Eyes
    const renderPos = this.getRenderPosition();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(renderPos.x + 8, renderPos.y + 16, 2, 0, Math.PI * 2);
    ctx.arc(renderPos.x + 16, renderPos.y + 16, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Get render position with shake offset
    const renderPos = this.getRenderPosition();

    // Fade out if dying (match Enemy)
    let alpha = 1.0;
    if (this.isDying) {
      alpha = Math.max(0, this.deathTimer / (this.constructor as typeof Enemy).DEATH_DURATION);
    }
    ctx.globalAlpha = alpha;

    ctx.globalAlpha *= 0.6;
    ctx.fillStyle = this.isHit ? "#FFFFFF" : this.getColor();
    ctx.beginPath();
    ctx.ellipse(
      renderPos.x + this.size.x / 2,
      renderPos.y + this.size.y / 2,
      this.size.x / 2,
      this.size.y / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (!this.isHit) {
      ctx.globalAlpha = alpha; // restore full alpha for details
      this.renderDetails(ctx);
    }

    // Render floating damage indicators (copied from Enemy)
    for (const d of this.damageIndicators) {
      ctx.save();
      ctx.globalAlpha = d.alpha * alpha * 0.6; // match ghost alpha and fade
      ctx.font = "bold 18px 'Orbitron', monospace";
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
      ctx.shadowBlur = 15;
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

    ctx.restore();
  }

  private wouldCollideHorizontally(nextX: number, currentY: number, obstacle: SolidBlock): boolean {
    // Check if the enemy would overlap with the obstacle horizontally
    const enemyLeft = nextX;
    const enemyRight = nextX + this.size.x;
    const enemyTop = currentY;
    const enemyBottom = currentY + this.size.y;

    const obstacleLeft = obstacle.position.x;
    const obstacleRight = obstacle.position.x + obstacle.size.x;
    const obstacleTop = obstacle.position.y;
    const obstacleBottom = obstacle.position.y + obstacle.size.y;

    // Check if there's overlap in both axes
    const horizontalOverlap = enemyRight > obstacleLeft && enemyLeft < obstacleRight;
    const verticalOverlap = enemyBottom > obstacleTop && enemyTop < obstacleBottom;

    return horizontalOverlap && verticalOverlap;
  }
}

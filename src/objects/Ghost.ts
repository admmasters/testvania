import { Enemy } from "./enemy";
import type { GameState } from "../engine/GameState";

export class Ghost extends Enemy {
  floatTimer: number;
  floatAmplitude: number;
  baseY: number;

  constructor(x: number, y: number) {
    super(x, y, "ghost");
    this.speed = 40;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.floatAmplitude = 10;
    this.baseY = y;
    this.hitDuration = 0.3;
    this.health = 2;
    this.maxHealth = 2;
  }

  updateMovement(deltaTime: number, gameState: GameState): void {
    // Float up and down
    this.floatTimer += deltaTime * 2;
    this.position.y = this.baseY + Math.sin(this.floatTimer) * this.floatAmplitude;

    // Move left/right
    this.position.x += this.direction * this.speed * deltaTime;

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
    if (
      attackBounds &&
      this.checkCollisionWithBounds(attackBounds) &&
      !this.isHit
    ) {
      this.takeDamage(1);
      this.isHit = true;
      this.hitTimer = this.hitDuration;
      // Knockback (ghosts float, so just a little push)
      const direction = this.position.x < player.position.x ? -1 : 1;
      this.position.x += direction * 10;
      // Hit spark
      const sparkX = this.position.x + (direction < 0 ? this.size.x : 0);
      const sparkY = this.position.y + this.size.y / 2;
      gameState.createHitSpark(sparkX, sparkY);
      gameState.hitPause(0.1);
      gameState.camera.shake(0.1, 2);
    }
  }

  protected getColor(): string {
    return "#AEE7FF"; // Light blue color for ghost
  }

  protected renderDetails(ctx: CanvasRenderingContext2D): void {
    // Eyes
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(this.position.x + 8, this.position.y + 16, 2, 0, Math.PI * 2);
    ctx.arc(this.position.x + 16, this.position.y + 16, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = this.isHit ? "#FFFFFF" : this.getColor();
    ctx.beginPath();
    ctx.ellipse(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2,
      this.size.x / 2,
      this.size.y / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    if (!this.isHit) {
      ctx.globalAlpha = 1.0;
      this.renderDetails(ctx);
    }
    
    ctx.restore();
  }
} 
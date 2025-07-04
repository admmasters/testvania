import { LevelManager } from "@/levels/LevelManager";
import type { Candle } from "@/objects/candle";
import type { Enemy } from "@/objects/enemy";
import type { Heart, HeartSparkle } from "@/objects/heart";
import { HitSpark, PoofEffect } from "@/objects/hitSpark";
import type { Platform } from "@/objects/platform";
import { Player } from "@/objects/player";
import type { SolidBlock } from "@/objects/solidBlock";
import { Camera } from "./Camera";
import { Input } from "./Input";
import { ParallaxBackground } from "./ParallaxBackground";

export class GameState {
  levelManager: LevelManager;
  currentLevelId: string | null = null;
  player: Player;
  enemies: Enemy[];
  platforms: Platform[];
  solidBlocks: SolidBlock[];
  hitSparks: HitSpark[];
  candles: Candle[];
  hearts: Heart[];
  heartSparkles: HeartSparkle[];
  input: Input;
  camera: Camera;
  parallaxBackground: ParallaxBackground;
  hitPauseTimer: number;
  hitPauseDuration: number;
  spawnTimer: number;
  spawnInterval: number;
  poofEffects: PoofEffect[] = [];
  floatingExpIndicators: Array<{
    amount: number;
    x: number;
    y: number;
    alpha: number;
    vy: number;
    time: number;
  }> = [];

  constructor(levelId: string = "level1") {
    // Initialize the level manager
    this.levelManager = new LevelManager();

    // Initialize empty arrays
    this.platforms = [];
    this.solidBlocks = [];
    this.enemies = [];
    this.hitSparks = [];
    this.candles = [];
    this.hearts = [];
    this.heartSparkles = [];

    // Initialize common game state properties
    this.input = new Input();
    this.camera = new Camera();
    this.parallaxBackground = new ParallaxBackground();
    this.hitPauseTimer = 0;
    this.hitPauseDuration = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 3;

    // Initialize default player (will be overwritten by level)
    this.player = new Player(100, 330);

    // Load the level
    this.loadLevel(levelId);
  }

  loadLevel(levelId: string): boolean {
    const result = this.levelManager.loadLevel(levelId, this);
    if (result) {
      this.currentLevelId = levelId;
    }
    return result;
  }

  checkCandleCollisions(): void {
    if (this.player.attacking) {
      const attackBounds = this.player.getAttackBounds();

      if (!attackBounds) return;

      for (const candle of this.candles) {
        if (candle.active && !candle.isBreaking) {
          const candleBounds = candle.getBounds();

          const candleLeft = candleBounds.x;
          const candleRight = candleBounds.x + candleBounds.width;
          const candleTop = candleBounds.y;
          const candleBottom = candleBounds.y + candleBounds.height;

          const isColliding =
            attackBounds.left < candleRight &&
            attackBounds.right > candleLeft &&
            attackBounds.top < candleBottom &&
            attackBounds.bottom > candleTop;

          if (isColliding) {
            candle.break(this);
            this.createHitSpark(candle.position.x + candle.size.x / 2, candle.position.y);
          }
        }
      }
    }
  }

  update(deltaTime: number): void {
    // Update candles
    for (const candle of this.candles) {
      if (candle.active) {
        candle.update(deltaTime);
      }
    }

    // Remove inactive candles
    this.candles = this.candles.filter((candle) => candle.active);

    // Check for candle collisions
    this.checkCandleCollisions();

    // Update hearts
    for (const heart of this.hearts) {
      if (heart.active) {
        heart.update(deltaTime, this);
      }
    }

    // Update heart sparkles
    for (const sparkle of this.heartSparkles) {
      if (sparkle.active) {
        sparkle.update(deltaTime, this);
      }
    }

    // Update hit sparks
    for (const spark of this.hitSparks) {
      if (spark.active) {
        spark.update(deltaTime, this);
      }
    }

    // Update poof effects
    for (const poof of this.poofEffects) {
      if (poof.active) {
        poof.update(deltaTime, this);
      }
    }

    // Clean up inactive objects
    this.hitSparks = this.hitSparks.filter((spark) => spark.active);
    this.hearts = this.hearts.filter((heart) => heart.active);
    this.heartSparkles = this.heartSparkles.filter((sparkle) => sparkle.active);
    this.poofEffects = this.poofEffects.filter((poof) => poof.active);

    this.player.update(deltaTime, this);

    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(deltaTime, this);
      }
    }

    // Remove inactive enemies
    this.enemies = this.enemies.filter((enemy) => enemy.active);

    // Automatic enemy spawning is disabled - enemies are placed via the level editor only
    // The timer is kept but not used for spawning
    this.spawnTimer += deltaTime;

    // Camera follows player and clamps to level bounds
    const levelData = this.levelManager.getLevelData(this.currentLevelId ?? "");
    if (levelData) {
      // Use canvas size for viewport
      const viewportWidth = 800; // Default, can be dynamic if needed
      const viewportHeight = 600;
      this.camera.followPlayer(
        this.player.position,
        levelData.width,
        levelData.height,
        viewportWidth,
        viewportHeight,
      );
    }
    this.camera.update(deltaTime);
    this.input.update();

    // Update floating exp indicators
    for (const exp of this.floatingExpIndicators) {
      exp.y -= exp.vy * deltaTime;
      exp.alpha -= deltaTime * 1.2;
      exp.time += deltaTime;
    }
    this.floatingExpIndicators = this.floatingExpIndicators.filter((e) => e.alpha > 0);
  }

  /**
   * Apply shake effects to specific enemies and the player without freezing the game.
   * If no targets are provided, all active enemies will shake (legacy behaviour).
   */
  hitPause(duration: number, targetEnemies?: Enemy[]): void {
    const shakeIntensity = 6; // pixels - increased for more impact
    // Always shake the player so feedback is clear
    this.player.startShake(shakeIntensity, duration);

    // Determine which enemies to shake
    if (targetEnemies && targetEnemies.length > 0) {
      for (const enemy of targetEnemies) {
        if (enemy.active) enemy.startShake(shakeIntensity, duration);
      }
    } else {
      // Legacy: shake everyone
      for (const enemy of this.enemies) {
        if (enemy.active) enemy.startShake(shakeIntensity, duration);
      }
    }
  }

  createHitSpark(x: number, y: number): void {
    this.hitSparks.push(new HitSpark(x, y));
  }

  createPoofEffect(x: number, y: number): void {
    this.poofEffects.push(new PoofEffect(x, y));
  }

  levelEditor: {
    isEditorActive: () => boolean;
    render: (ctx: CanvasRenderingContext2D) => void;
    activate: () => void;
    deactivate: () => void;
  } | null = null; // Will be set by the Game class

  render(ctx: CanvasRenderingContext2D): void {
    // Clear screen
    ctx.fillStyle = "#2C1810";
    ctx.fillRect(0, 0, 800, 600);

    // Draw parallax background (before applying camera)
    this.parallaxBackground.render(ctx, this.camera);

    // Apply camera effects
    this.camera.apply(ctx);

    // Draw platforms
    for (const platform of this.platforms) {
      platform.render(ctx);
    }

    // Draw solid blocks
    for (const solidBlock of this.solidBlocks) {
      solidBlock.render(ctx);
    }

    // Draw game objects
    this.player.render(ctx);

    // Draw candles
    for (const candle of this.candles) {
      if (candle.active) {
        candle.render(ctx);
      }
    }

    // Draw hearts
    for (const heart of this.hearts) {
      if (heart.active) {
        heart.render(ctx);
      }
    }

    // Draw heart sparkles (subtle collection effects)
    for (const sparkle of this.heartSparkles) {
      if (sparkle.active) {
        sparkle.render(ctx);
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.render(ctx);
      }
    }

    // Draw hit sparks (on top of other game objects)
    for (const spark of this.hitSparks) {
      if (spark.active) {
        spark.render(ctx);
      }
    }

    // Draw poof effects (on top of hit sparks)
    for (const poof of this.poofEffects) {
      if (poof.active) {
        poof.render(ctx);
      }
    }

    // Draw floating exp indicators (on top of everything else)
    for (const exp of this.floatingExpIndicators) {
      ctx.save();
      ctx.globalAlpha = exp.alpha;
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "#00FFAA";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.strokeText(`+${exp.amount} EXP`, exp.x, exp.y);
      ctx.fillText(`+${exp.amount} EXP`, exp.x, exp.y);
      ctx.restore();
    }

    // Render level editor UI if active
    if (this.levelEditor?.isEditorActive()) {
      this.levelEditor.render(ctx);
    }

    // Reset camera
    this.camera.reset(ctx);

    // Draw UI
    this.drawUI(ctx);
  }

  drawUI(ctx: CanvasRenderingContext2D): void {
    // Save the current context state
    ctx.save();

    // Expand UI background to accommodate level and exp info
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(16, 16, 220, 128); // Increased height for level info

    // Ensure consistent text alignment for all UI text
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Draw UI text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace";

    // Player level
    ctx.fillText(`Level: ${this.player.level}`, 32, 32);

    // Enemy count (moved down)
    ctx.fillText(`Enemies: ${this.enemies.length}`, 32, 48);

    // Draw player health bar
    const barWidth = 160;
    const barHeight = 8;
    const healthPercentage = this.player.health / this.player.maxHealth;

    // Health bar label
    ctx.fillText("Health:", 32, 64);

    // Draw the empty health bar background
    ctx.fillStyle = "#333333";
    ctx.fillRect(32, 80, barWidth, barHeight);

    // Draw the filled portion of the health bar
    if (healthPercentage > 0.6) {
      ctx.fillStyle = "#00FF00"; // Green for good health
    } else if (healthPercentage > 0.3) {
      ctx.fillStyle = "#FFFF00"; // Yellow for medium health
    } else {
      ctx.fillStyle = "#FF0000"; // Red for low health
    }

    ctx.fillRect(32, 80, barWidth * healthPercentage, barHeight);

    // Draw border around health bar
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 80, barWidth, barHeight);

    // Draw experience bar
    const expPercentage = this.player.exp / this.player.expToNext;

    // Experience bar label and values
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Experience:", 32, 96);
    ctx.font = "12px monospace";
    ctx.fillText(`${this.player.exp}/${this.player.expToNext}`, 32, 112);
    ctx.font = "16px monospace";

    // Draw the empty exp bar background
    ctx.fillStyle = "#333333";
    ctx.fillRect(32, 128, barWidth, barHeight);

    // Draw the filled portion of the exp bar
    ctx.fillStyle = "#00AAFF"; // Blue for experience
    ctx.fillRect(32, 128, barWidth * expPercentage, barHeight);

    // Draw border around exp bar
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 128, barWidth, barHeight);

    // Restore the context state
    ctx.restore();
  }

  awardExp(amount: number, x: number, y: number): void {
    this.player.gainExp(amount);
    this.floatingExpIndicators.push({
      amount,
      x,
      y,
      alpha: 1,
      vy: 32 + Math.random() * 16,
      time: 0,
    });
  }
}

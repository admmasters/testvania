import { HUD } from "@/hud/HUD";
import { LevelManager } from "@/levels/LevelManager";
import type { Candle } from "@/objects/candle";
import type { DiagonalPlatform } from "@/objects/diagonalPlatform";
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
  diagonalPlatforms: DiagonalPlatform[];
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
  hud: HUD;
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
    this.diagonalPlatforms = [];
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

    // Initialize HUD
    this.hud = new HUD();

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

    // Draw diagonal platforms
    for (const diagonalPlatform of this.diagonalPlatforms) {
      diagonalPlatform.render(ctx);
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
      ctx.font = "bold 18px 'Orbitron', monospace";
      ctx.fillStyle = "#00FFAA";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 255, 170, 0.8)";
      ctx.shadowBlur = 15;
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
    this.hud.render(ctx, this.player);
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

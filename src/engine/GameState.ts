import { Player } from "../objects/player";
import { Enemy } from "../objects/enemy";
import { Platform } from "../objects/platform";
import { HitSpark } from "../objects/hitSpark";
import { Candle } from "../objects/candle";
import { Input } from "./Input";
import { Camera } from "./Camera";

export class GameState {
  player: Player;
  enemies: Enemy[];
  platforms: Platform[];
  hitSparks: HitSpark[];
  candles: Candle[];
  input: Input;
  camera: Camera;
  hitPauseTimer: number;
  hitPauseDuration: number;
  spawnTimer: number;
  spawnInterval: number;

  constructor() {
    this.platforms = []; // Initialize platforms first
    this.createPlatforms();

    // Initialize player on a platform
    this.player = new Player(100, 330); // Position player on the left platform

    this.enemies = [];
    this.hitSparks = [];
    this.candles = [];

    // Add some candles to the level
    this.spawnCandles();
    this.input = new Input();
    this.camera = new Camera();
    this.hitPauseTimer = 0;
    this.hitPauseDuration = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 3;
    this.spawnInitialEnemies();
  }

  createPlatforms(): void {
    // Create the ground (acts as a platform too)
    this.platforms.push(new Platform(0, 450, 800, 150, "#654321"));

    // Create floating platforms - create an interesting level layout
    // Left side platforms
    this.platforms.push(new Platform(50, 350, 100, 20, "#654321"));
    this.platforms.push(new Platform(180, 280, 120, 20, "#654321"));
    this.platforms.push(new Platform(80, 200, 90, 20, "#654321"));

    // Middle platforms
    this.platforms.push(new Platform(350, 320, 100, 20, "#654321"));
    this.platforms.push(new Platform(320, 230, 80, 20, "#654321"));
    this.platforms.push(new Platform(300, 140, 70, 20, "#765432"));

    // Right side platforms
    this.platforms.push(new Platform(500, 370, 110, 20, "#654321"));
    this.platforms.push(new Platform(580, 290, 100, 20, "#654321"));
    this.platforms.push(new Platform(650, 200, 90, 20, "#654321"));

    // Special higher platforms
    this.platforms.push(new Platform(450, 100, 60, 15, "#8B4513"));
    this.platforms.push(new Platform(200, 100, 60, 15, "#8B4513"));
  }

  spawnInitialEnemies(): void {
    // Spawn enemies on different platforms
    if (this.platforms.length > 0) {
      // Skip the ground platform (index 0)
      const platformIndices = [2, 5, 8]; // Spawn on different heights

      for (let i = 0; i < platformIndices.length; i++) {
        if (this.platforms[platformIndices[i]]) {
          const platform = this.platforms[platformIndices[i]];
          const x = platform.position.x + platform.size.x / 2 - 12; // Center on platform
          const y = platform.position.y - 32; // On top of platform
          this.enemies.push(new Enemy(x, y));
        }
      }
    } else {
      // Fallback if no platforms defined
      for (let i = 0; i < 3; i++) {
        const x = 200 + i * 200;
        this.enemies.push(new Enemy(x, 300));
      }
    }
  }

  spawnCandles(): void {
    // Add candles to various platforms
    const platformIndices = [1, 3, 5, 7, 9]; // Platforms to place candles on

    for (const index of platformIndices) {
      if (this.platforms[index]) {
        const platform = this.platforms[index];
        // Position candle on top of the platform
        const x = platform.position.x + platform.size.x / 2 - 8; // Center on platform
        const y = platform.position.y - 24; // On top of platform
        const candle = new Candle(x, y);
        this.candles.push(candle);
      }
    }
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
            candle.break();
            this.createHitSpark(
              candle.position.x + candle.size.x / 2,
              candle.position.y
            );
          }
        }
      }
    }
  }

  update(deltaTime: number): void {
    // Handle hit pause
    if (this.hitPauseTimer > 0) {
      this.hitPauseTimer -= deltaTime;
      return; // Skip all updates during hit pause
    }

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

    this.player.update(deltaTime, this);

    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(deltaTime, this);
      }
    }

    // Update hit sparks
    for (const spark of this.hitSparks) {
      if (spark.active) {
        spark.update(deltaTime, this);
      }
    }

    // Remove inactive enemies and hit sparks
    this.enemies = this.enemies.filter((enemy) => enemy.active);
    this.hitSparks = this.hitSparks.filter((spark) => spark.active);

    // Spawn new enemies
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval && this.enemies.length < 5) {
      this.spawnTimer = 0;

      // Pick a random elevated platform (skip ground platform)
      const platformOptions = this.platforms.filter(
        (p) => p.position.y < 400 && p.position.y > 150
      );

      if (platformOptions.length > 0) {
        // Choose random platform
        const platform =
          platformOptions[Math.floor(Math.random() * platformOptions.length)];

        // Position on platform
        const x = platform.position.x + Math.random() * (platform.size.x - 24);
        const y = platform.position.y - 32;

        this.enemies.push(new Enemy(x, y));
      } else {
        // Fallback if no appropriate platforms
        const side = Math.random() > 0.5 ? 0 : 800;
        this.enemies.push(new Enemy(side, 300));
      }
    }

    this.camera.update(deltaTime);
    this.input.update();
  }

  hitPause(duration: number): void {
    this.hitPauseTimer = duration;
    this.hitPauseDuration = duration;
  }

  createHitSpark(x: number, y: number): void {
    this.hitSparks.push(new HitSpark(x, y));
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear screen
    ctx.fillStyle = "#2C1810";
    ctx.fillRect(0, 0, 800, 600);

    // Apply camera effects
    this.camera.apply(ctx);

    // Draw background elements
    this.drawBackground(ctx);

    // Draw platforms
    for (const platform of this.platforms) {
      platform.render(ctx);
    }

    // Draw game objects
    this.player.render(ctx);

    // Draw candles
    for (const candle of this.candles) {
      if (candle.active) {
        candle.render(ctx);
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

    // Reset camera
    this.camera.reset(ctx);

    // Draw UI
    this.drawUI(ctx);
  }

  drawBackground(ctx: CanvasRenderingContext2D): void {
    // Simple castle-like background
    ctx.fillStyle = "#1A0F0A";

    // Castle walls
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(i * 160, 450, 160, 150);
    }

    // Castle towers
    ctx.fillStyle = "#0F0A07";
    ctx.fillRect(0, 400, 40, 48); // Adjusted height to multiple of 8
    ctx.fillRect(760, 400, 40, 48); // Adjusted height to multiple of 8
    ctx.fillRect(384, 352, 40, 96); // Adjusted x,y,height to multiples of 8

    // Moon
    ctx.fillStyle = "#FFFACD";
    ctx.beginPath();
    ctx.arc(704, 80, 32, 0, Math.PI * 2); // Adjusted to multiples of 8
    ctx.fill();
  }

  drawUI(ctx: CanvasRenderingContext2D): void {
    // Save the current context state
    ctx.save();

    // Draw a semi-transparent background for the UI
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(16, 16, 200, 88); // Adjusted to multiples of 8

    // Ensure consistent text alignment for all UI text
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Draw UI text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px monospace"; // Adjusted to multiple of 8
    ctx.fillText(`Enemies: ${this.enemies.length}`, 32, 32); // Adjusted position

    // Draw player health/energy bar
    const healthBarWidth = 160; // Already a multiple of 8
    const healthBarHeight = 8; // Adjusted to multiple of 8
    const healthPercentage = this.player.health / this.player.maxHealth;

    // Draw the empty bar background
    ctx.fillStyle = "#333333";
    ctx.fillRect(32, 56, healthBarWidth, healthBarHeight); // Adjusted to multiples of 8

    // Draw the filled portion of the health bar
    // Color changes based on health: green > yellow > red
    if (healthPercentage > 0.6) {
      ctx.fillStyle = "#00FF00"; // Green for good health
    } else if (healthPercentage > 0.3) {
      ctx.fillStyle = "#FFFF00"; // Yellow for medium health
    } else {
      ctx.fillStyle = "#FF0000"; // Red for low health
    }

    ctx.fillRect(32, 56, healthBarWidth * healthPercentage, healthBarHeight); // Adjusted x to multiple of 8

    // Draw border around health bar
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 56, healthBarWidth, healthBarHeight); // Adjusted to multiples of 8

    // Restore the context state
    ctx.restore();
  }
}

import { HUD } from "@/hud/HUD";
import { LevelManager } from "@/levels/LevelManager";
import type { DiagonalPlatform } from "@/objects/diagonalPlatform";
import type { Enemy } from "@/objects/enemies/enemy";
import type { Experience } from "@/objects/experience";
import { HitSpark, PoofEffect } from "@/objects/hitSpark";
import type { MemoryCrystal } from "@/objects/memoryCrystal";
import type { Platform } from "@/objects/platform";
import { Player } from "@/objects/players/player";
import { EnergyBlast } from "@/objects/projectile";
import type { SolidBlock } from "@/objects/solidBlock";
import { CollisionSystem } from "@/systems/CollisionSystem";
import { ComboSystem } from "@/systems/ComboSystem";
import { GameObjectManager } from "@/systems/GameObjectManager";
import { HitFeedbackManager } from "@/systems/HitFeedbackManager";
import { MPManager } from "@/systems/MPManager";
import { ChainReactionTracker } from "@/systems/ChainReactionTracker";
import { MPAbilitySystem } from "@/systems/MPAbilitySystem";
import { TutorialSystem } from "@/systems/TutorialSystem";
import { PowerSurgeAbility } from "@/systems/abilities/PowerSurgeAbility";
import { LightningSystem } from "../effects/LightningSystem";
import { RainSystem } from "../effects/RainSystem";
import { WeatherSystem } from "../effects/WeatherSystem";
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
  memoryCrystals: MemoryCrystal[];
  experiences: Experience[];
  energyBlasts: EnergyBlast[];
  input: Input;
  camera: Camera;
  parallaxBackground: ParallaxBackground;
  hitPauseTimer: number;
  hitPauseDuration: number;
  spawnTimer: number;
  spawnInterval: number;
  poofEffects: PoofEffect[] = [];
  gameObjectManager: GameObjectManager;
  collisionSystem: CollisionSystem;
  hud: HUD;
  tutorialSystem: TutorialSystem;
  floatingExpIndicators: Array<{
    amount: number;
    x: number;
    y: number;
    alpha: number;
    vy: number;
    time: number;
  }> = [];
  rainSystem: RainSystem;
  lightningSystem: LightningSystem;
  weatherSystem: WeatherSystem;
  comboSystem: ComboSystem;
  hitFeedbackManager: HitFeedbackManager;
  mpManager: MPManager;
  chainReactionTracker: ChainReactionTracker;
  mpAbilitySystem: MPAbilitySystem;
  // Standardised hit pause duration (seconds)
  static readonly STANDARD_HIT_PAUSE = 0.06;

  constructor(levelId: string = "tutorial") {
    console.log("GameState constructor started with levelId:", levelId);
    
    // Initialize the level manager
    console.log("Creating LevelManager...");
    this.levelManager = new LevelManager();
    console.log("LevelManager created");

    // Initialize the game object manager
    console.log("Creating GameObjectManager...");
    this.gameObjectManager = new GameObjectManager();
    console.log("GameObjectManager created");

    // Initialize the collision system
    console.log("Creating CollisionSystem...");
    this.collisionSystem = new CollisionSystem();
    console.log("CollisionSystem created");

    // Initialize the tutorial system
    console.log("Creating TutorialSystem...");
    this.tutorialSystem = new TutorialSystem();
    console.log("TutorialSystem created");

    // Initialize empty arrays
    this.platforms = [];
    this.solidBlocks = [];
    this.diagonalPlatforms = [];
    this.enemies = [];
    this.hitSparks = [];
    this.memoryCrystals = [];
    this.experiences = [];
    this.energyBlasts = [];

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

    // Initialize combo system
    this.comboSystem = new ComboSystem();

    // Initialize hit feedback manager
    this.hitFeedbackManager = new HitFeedbackManager();

    // Initialize MP systems
    this.mpManager = new MPManager();
    this.chainReactionTracker = new ChainReactionTracker();
    this.mpAbilitySystem = new MPAbilitySystem();

    // Register MP abilities
    this.registerMPAbilities();

    // Set up chain reaction completion callback to award MP
    this.chainReactionTracker.onChainComplete((result) => {
      // Calculate MP reward based on chain length and bonuses
      const mpReward = this.mpManager.calculateChainReward(result.chainLength, result.specialEffects);
      
      // Award MP for the completed chain
      this.mpManager.awardMP(mpReward, 'chain', { x: 400, y: 300 }, result.chainLength);
      
      console.log(`Chain completed: ${result.chainLength} crystals, awarded ${mpReward} MP`);
    });

    // Initialize rain system
    this.rainSystem = new RainSystem();

    // Initialize lightning system
    this.lightningSystem = new LightningSystem();

    // Initialize weather system to coordinate rain and lightning
    this.weatherSystem = new WeatherSystem(this.rainSystem, this.lightningSystem);

    // Populate raindrops immediately so rain is visible at game start
    this.rainSystem.seedInitialRain(this);

    // Initialize default player (will be overwritten by level)
    console.log("Creating Player...");
    this.player = new Player(100, 330);
    console.log("Player created");

    // Load the level
    console.log("Loading level:", levelId);
    const levelLoaded = this.loadLevel(levelId);
    console.log("Level loaded:", levelLoaded);

    // Initialize the game object manager with current state
    console.log("Initializing GameObjectManager...");
    this.gameObjectManager.initialize(this);
    console.log("GameState constructor completed successfully");
  }

  loadLevel(levelId: string): boolean {
    const result = this.levelManager.loadLevel(levelId, this);
    if (result) {
      this.currentLevelId = levelId;
    }
    return result;
  }

  update(deltaTime: number): void {
    // Update tutorial system first (only for tutorial level)
    if (this.currentLevelId === "tutorial") {
      this.tutorialSystem.update(deltaTime, this);

      // Pause game updates when tutorial modal is showing
      if (this.tutorialSystem.isGamePaused()) {
        // Continue ambient weather effects while gameplay is paused
        this.rainSystem.update(deltaTime, this);
        this.lightningSystem.update(deltaTime, this);
        this.weatherSystem.update(deltaTime);

        // Clear input at the end when paused so X key can be detected next frame
        this.input.update();
        return; // Don't update game objects when tutorial is paused
      }
    }

    // Global hit-pause: freeze player & UI while active
    if (this.hitPauseTimer > 0) {
      this.hitPauseTimer -= deltaTime;

      // Keep shake animations for enemies only (avoid jiggling the player sprite)
      for (const enemy of this.enemies) {
        if (enemy.active) enemy.updateShake(deltaTime, true);
      }

      this.input.update(); // still accept inputs
      return; // Skip rest of updates to create freeze effect
    }

    // Update memory crystals
    for (const crystal of this.memoryCrystals) {
      if (crystal.active) {
        crystal.update(deltaTime, this);
      }
    }

    // Update experiences
    for (const experience of this.experiences) {
      if (experience.active) {
        experience.update(deltaTime, this);
      }
    }

    // Check collisions
    this.collisionSystem.update(deltaTime, this);

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

    // Update energy blasts
    for (const blast of this.energyBlasts) {
      if (blast.active) {
        blast.update(deltaTime, this);
      }
    }

    // Clean up inactive objects
    this.hitSparks = this.hitSparks.filter((spark) => spark.active);
    this.memoryCrystals = this.memoryCrystals.filter((crystal) => crystal.active);
    this.experiences = this.experiences.filter((experience) => experience.active);
    this.poofEffects = this.poofEffects.filter((poof) => poof.active);
    this.energyBlasts = this.energyBlasts.filter((blast) => blast.active);

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

    // Update rain system
    this.rainSystem.update(deltaTime, this);

    // Update lightning system
    this.lightningSystem.update(deltaTime, this);

    // Update weather system for coordination
    this.weatherSystem.update(deltaTime);

    // Update combo system timers
    this.comboSystem.update(deltaTime);

    // Update hit feedback manager
    this.hitFeedbackManager.update(deltaTime);

    // Update MP systems
    this.chainReactionTracker.update(deltaTime);
    this.mpAbilitySystem.update(deltaTime, this.player, this);

    // Debug controls
    if (this.input.isKeyPressed("F2")) {
      // Dynamic import to avoid circular dependency
      import("../objects/memoryCrystal").then(({ MemoryCrystal }) => {
        MemoryCrystal.toggleDebugChainReaction();
      });
    }
  }

  /**
   * Apply shake effects to specific enemies and the player without freezing the game.
   * If no targets are provided, all active enemies will shake (legacy behaviour).
   */
  hitPause(_duration: number = GameState.STANDARD_HIT_PAUSE, targetEnemies?: Enemy[]): void {
    const duration = GameState.STANDARD_HIT_PAUSE;

    // Only initiate hit-pause if one is not already running to avoid janky stacking
    if (this.hitPauseTimer <= 0) {
      this.hitPauseTimer = duration;
      this.hitPauseDuration = duration;
    }

    const shakeIntensity = 4; // pixels - reduced slightly for smoother side-to-side motion
    const shakeFrequency = 25; // Hz - fast oscillation for emphasis
    
    // Always shake the player so feedback is clear (keep random shake for player)
    this.player.startShake(shakeIntensity, duration, 'random');

    // Determine which enemies to shake with horizontal motion
    if (targetEnemies && targetEnemies.length > 0) {
      for (const enemy of targetEnemies) {
        if (enemy.active) {
          // Use horizontal shake for hit stop effect - enemies shake side to side
          enemy.startShake(shakeIntensity, duration, 'horizontal', shakeFrequency);
        }
      }
    } else {
      // Legacy: shake everyone with horizontal motion
      for (const enemy of this.enemies) {
        if (enemy.active) {
          enemy.startShake(shakeIntensity, duration, 'horizontal', shakeFrequency);
        }
      }
    }
  }

  createHitSpark(x: number, y: number): void {
    this.hitSparks.push(new HitSpark(x, y));
  }

  /**
   * Create enhanced hit feedback using the HitFeedbackManager
   */
  createEnhancedHitFeedback(
    x: number, 
    y: number, 
    hitType: 'normal' | 'charged' | 'critical' | 'combo' = 'normal',
    targetType: 'enemy' | 'crystal' | 'environment' = 'enemy',
    intensity: number = 1.0
  ): void {
    // Get combo count for enhanced feedback
    const comboCount = this.comboSystem.getComboCount();
    
    // Create feedback configuration
    const config = {
      intensity,
      duration: 0.5,
      hitType,
      targetType,
      comboMultiplier: comboCount > 1 ? comboCount : undefined
    };
    
    // Trigger the enhanced feedback
    const feedbackId = this.hitFeedbackManager.triggerHitFeedback(config, { x, y });
    
    if (feedbackId) {
      // Get the calculated intensity for this hit
      const feedbackIntensity = this.hitFeedbackManager.calculateFeedbackIntensity(config);
      
      // Create enhanced hit spark with variable intensity
      this.createEnhancedHitSpark(x, y, feedbackIntensity.particles);
      
      // Apply enhanced screen shake
      this.applyEnhancedScreenShake(feedbackIntensity.shake);
      
      // Apply enhanced hit pause
      this.applyEnhancedHitPause(feedbackIntensity.pause);
    } else {
      // Fallback to basic hit spark if feedback was prevented
      this.createHitSpark(x, y);
    }
  }

  /**
   * Create enhanced hit spark with variable intensity
   */
  private createEnhancedHitSpark(x: number, y: number, _intensity: number): void {
    // For now, create a regular hit spark - we'll enhance this in the next task
    this.hitSparks.push(new HitSpark(x, y));
  }

  /**
   * Apply enhanced screen shake with variable intensity
   */
  private applyEnhancedScreenShake(intensity: number): void {
    // Enhanced shake with variable intensity
    const baseIntensity = 6;
    const shakeDuration = GameState.STANDARD_HIT_PAUSE;
    this.camera.shake(shakeDuration, baseIntensity * intensity);
  }

  /**
   * Apply enhanced hit pause with variable duration
   */
  private applyEnhancedHitPause(intensity: number): void {
    // Enhanced hit pause with variable duration
    const baseDuration = GameState.STANDARD_HIT_PAUSE;
    this.hitPause(baseDuration * intensity);
  }

  createPoofEffect(x: number, y: number): void {
    this.poofEffects.push(new PoofEffect(x, y));
  }

  createEnergyBlast(x: number, y: number, facingRight: boolean, damage: number = 4): void {
    this.energyBlasts.push(new EnergyBlast(x, y, facingRight, damage));
  }

  levelEditor: {
    isEditorActive: () => boolean;
    render: (ctx: CanvasRenderingContext2D) => void;
    activate: () => void;
    deactivate: () => void;
  } | null = null; // Will be set by the Game class

  render(ctx: CanvasRenderingContext2D): void {
    console.log("GameState.render() called");
    // Clear screen
    ctx.fillStyle = "#2C1810";
    ctx.fillRect(0, 0, 800, 600);
    console.log("Screen cleared with background color");

    // Draw parallax background (before applying camera)
    this.parallaxBackground.render(ctx, this.camera);

    // Apply camera effects
    this.camera.apply(ctx);

    // Draw lightning effects (background layer)
    this.lightningSystem.render(ctx);

    // Draw platforms with lightning effects
    for (const platform of this.platforms) {
      platform.render(ctx);
      this.lightningSystem
        .getLightingEffects()
        .renderObjectLighting(ctx, platform.position, platform.size);
    }

    // Draw solid blocks with lightning effects
    for (const solidBlock of this.solidBlocks) {
      solidBlock.render(ctx);
      this.lightningSystem
        .getLightingEffects()
        .renderObjectLighting(ctx, solidBlock.position, solidBlock.size);
    }

    // Draw diagonal platforms with lightning effects
    for (const diagonalPlatform of this.diagonalPlatforms) {
      diagonalPlatform.render(ctx);
      this.lightningSystem
        .getLightingEffects()
        .renderObjectLighting(ctx, diagonalPlatform.position, diagonalPlatform.size);
    }

    // Draw game objects with lightning effects
    this.player.render(ctx);
    this.lightningSystem
      .getLightingEffects()
      .renderObjectLighting(ctx, this.player.position, this.player.size);

    // Draw memory crystals
    for (const crystal of this.memoryCrystals) {
      if (crystal.active) {
        crystal.render(ctx);
      }
    }

    // Draw experiences
    for (const experience of this.experiences) {
      if (experience.active) {
        experience.render(ctx);
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.render(ctx);
      }
    }

    // Draw rain effect (in front of crystals, player, enemies)
    this.rainSystem.render(ctx);

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

    // Draw energy blasts
    for (const blast of this.energyBlasts) {
      if (blast.active) {
        blast.render(ctx);
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

    // Render tutorial messages (only for tutorial level) - after camera reset so it's on top
    if (this.currentLevelId === "tutorial") {
      this.tutorialSystem.render(ctx);
    }
  }

  drawUI(ctx: CanvasRenderingContext2D): void {
    this.hud.render(ctx, this.player, this.mpManager);
    // Render combo meter on top of HUD
    this.comboSystem.render(ctx);
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

  /**
   * Register all MP abilities
   */
  private registerMPAbilities(): void {
    // Register Power Surge ability
    this.mpAbilitySystem.registerAbility(new PowerSurgeAbility());
  }
}

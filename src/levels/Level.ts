import { Ghost } from "@/objects/enemies/Ghost";
import { LandGhost } from "@/objects/enemies/LandGhost";
import type { GameState } from "../engine/GameState";
import { DiagonalPlatform } from "../objects/diagonalPlatform";
import { MemoryCrystal } from "../objects/memoryCrystal";
import { Platform } from "../objects/platform";
import { Player } from "../objects/player";
import { SolidBlock } from "../objects/solidBlock";
import type { LevelData } from "./LevelData";

export class Level {
  private data: LevelData;

  constructor(levelData: LevelData) {
    this.data = levelData;
  }

  // Load this level into the provided GameState
  loadIntoGameState(gameState: GameState): void {
    // Clear existing objects
    gameState.platforms = [];
    gameState.solidBlocks = [];
    gameState.diagonalPlatforms = [];
    gameState.enemies = [];
    gameState.memoryCrystals = [];
    gameState.hitSparks = [];

    // Create platforms
    for (const platformData of this.data.platforms) {
      gameState.platforms.push(
        new Platform({
          x: platformData.position.x,
          y: platformData.position.y,
          width: platformData.size.x,
          height: platformData.size.y,
          color: platformData.color,
        }),
      );
    }

    // Create solid blocks
    for (const solidBlockData of this.data.solidBlocks) {
      gameState.solidBlocks.push(
        new SolidBlock({
          x: solidBlockData.position.x,
          y: solidBlockData.position.y,
          width: solidBlockData.size.x,
          height: solidBlockData.size.y,
          color: solidBlockData.color,
        }),
      );
    }

    // Create diagonal platforms
    for (const diagonalPlatformData of this.data.diagonalPlatforms) {
      gameState.diagonalPlatforms.push(
        new DiagonalPlatform({
          startPoint: diagonalPlatformData.startPoint,
          endPoint: diagonalPlatformData.endPoint,
          thickness: diagonalPlatformData.thickness,
          color: diagonalPlatformData.color,
        }),
      );
    }

    // Create memory crystals
    for (const crystalData of this.data.memoryCrystals) {
      gameState.memoryCrystals.push(
        new MemoryCrystal(
          crystalData.position.x,
          crystalData.position.y,
          crystalData.type || "azure",
        ),
      );
    }

    // Create enemies
    for (const enemyData of this.data.enemies) {
      if (enemyData.type === "ghost") {
        gameState.enemies.push(
          new Ghost(enemyData.position.x, enemyData.position.y, enemyData.direction),
        );
      } else {
        gameState.enemies.push(
          new LandGhost(enemyData.position.x, enemyData.position.y, enemyData.direction),
        );
      }
    }

    // Create player at defined start position
    gameState.player = new Player(this.data.player.position.x, this.data.player.position.y);

    // Reset game state timers
    gameState.hitPauseTimer = 0;
    gameState.hitPauseDuration = 0;
    gameState.spawnTimer = 0;
  }

  public getData(): LevelData {
    return this.data;
  }
}

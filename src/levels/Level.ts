import { LevelData } from "./LevelData";
import { GameState } from "../engine/GameState";
import { Platform } from "../objects/platform";
import { SolidBlock } from "../objects/solidBlock";
import { Candle } from "../objects/candle";
import { Door } from "../objects/door";
import { Player } from "../objects/player";
import { LandGhost } from "@/objects/LandGhost";
import { Ghost } from "../objects/Ghost";

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
    gameState.enemies = [];
    gameState.candles = [];
    gameState.doors = [];
    gameState.hitSparks = [];

    // Create platforms
    for (const platformData of this.data.platforms) {
      gameState.platforms.push(
        new Platform(
          platformData.position.x,
          platformData.position.y,
          platformData.size.x,
          platformData.size.y,
          platformData.color,
        ),
      );
    }

    // Create solid blocks
    for (const solidBlockData of this.data.solidBlocks) {
      gameState.solidBlocks.push(
        new SolidBlock(
          solidBlockData.position.x,
          solidBlockData.position.y,
          solidBlockData.size.x,
          solidBlockData.size.y,
          solidBlockData.color,
        ),
      );
    }

    // Create candles
    for (const candleData of this.data.candles) {
      gameState.candles.push(new Candle(candleData.position.x, candleData.position.y));
    }

    // Create doors
    for (const doorData of this.data.doors) {
      gameState.doors.push(new Door(doorData.position.x, doorData.position.y, doorData.nextLevelId));
    }

    // Create enemies
    for (const enemyData of this.data.enemies) {
      if (enemyData.type === "ghost") {
        gameState.enemies.push(new Ghost(enemyData.position.x, enemyData.position.y));
      } else {
        gameState.enemies.push(new LandGhost(enemyData.position.x, enemyData.position.y));
      }
    }

    // Create player at defined start position
    gameState.player = new Player(this.data.player.position.x, this.data.player.position.y);

    // Reset game state timers
    gameState.hitPauseTimer = 0;
    gameState.hitPauseDuration = 0;
    gameState.spawnTimer = 0;
  }
}

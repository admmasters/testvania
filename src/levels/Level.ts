import { LandGhost } from "@/objects/LandGhost";
import type { GameState } from "../engine/GameState";
import { Candle } from "../objects/candle";
import { Ghost } from "../objects/Ghost";
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
    gameState.enemies = [];
    gameState.candles = [];
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

    // Create candles
    for (const candleData of this.data.candles) {
      gameState.candles.push(new Candle(candleData.position.x, candleData.position.y));
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

  public getData(): LevelData {
    return this.data;
  }
}

import { LevelData } from "./LevelData";
import { GameState } from "../engine/GameState";
import { Platform } from "../objects/platform";
import { Candle } from "../objects/candle";
import { Player } from "../objects/player";
import { LandGhost } from "@/objects/LandGhost";

export class Level {
  private data: LevelData;

  constructor(levelData: LevelData) {
    this.data = levelData;
  }

  // Load this level into the provided GameState
  loadIntoGameState(gameState: GameState): void {
    // Clear existing objects
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.candles = [];
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

    // Create candles
    for (const candleData of this.data.candles) {
      gameState.candles.push(new Candle(candleData.position.x, candleData.position.y));
    }

    // Create enemies
    for (const enemyData of this.data.enemies) {
      gameState.enemies.push(new LandGhost(enemyData.position.x, enemyData.position.y));
    }

    // Create player at defined start position
    gameState.player = new Player(this.data.player.position.x, this.data.player.position.y);

    // Reset game state timers
    gameState.hitPauseTimer = 0;
    gameState.hitPauseDuration = 0;
    gameState.spawnTimer = 0;
  }
}

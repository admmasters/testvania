import { GameState } from "../engine/GameState";
import { LevelData } from "./LevelData";
import { Level } from "./Level";
import { levels } from "./levels";
import { Vector2 } from "../engine/Vector2";

export class LevelManager {
  private levels: Map<string, Level>;
  private currentLevelId: string | null = null;

  constructor() {
    this.levels = new Map();
    this.loadLevels();
  }

  private loadLevels(): void {
    // Load all level data and create Level instances
    for (const levelData of levels) {
      this.levels.set(levelData.id, new Level(levelData));
    }
  }

  getLevelIds(): string[] {
    return Array.from(this.levels.keys());
  }

  loadLevel(levelId: string, gameState: GameState): boolean {
    const level = this.levels.get(levelId);

    if (!level) {
      console.error(`Level with ID ${levelId} not found`);
      return false;
    }

    level.loadIntoGameState(gameState);
    this.currentLevelId = levelId;
    return true;
  }

  getCurrentLevelId(): string | null {
    return this.currentLevelId;
  }

  // Helper method to create a level from current GameState (for level editor)
  static createLevelFromGameState(gameState: GameState, id: string, name: string): LevelData {
    const levelData: LevelData = {
      id,
      name,
      background: {
        color: "#2C1810", // Default background color
      },
      platforms: [],
      candles: [],
      enemies: [],
      player: {
        position: new Vector2(gameState.player.position.x, gameState.player.position.y),
      },
    };

    // Convert platforms
    for (const platform of gameState.platforms) {
      levelData.platforms.push({
        position: new Vector2(platform.position.x, platform.position.y),
        size: new Vector2(platform.size.x, platform.size.y),
        color: platform.color,
      });
    }

    // Convert candles
    for (const candle of gameState.candles) {
      levelData.candles.push({
        position: new Vector2(candle.position.x, candle.position.y),
      });
    }

    // Convert enemies
    for (const enemy of gameState.enemies) {
      levelData.enemies.push({
        position: new Vector2(enemy.position.x, enemy.position.y),
      });
    }

    return levelData;
  }
}

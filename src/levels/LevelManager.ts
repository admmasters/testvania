import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2";
import { Level } from "./Level";
import type { LevelData } from "./LevelData";
import { levels } from "./levels";

export class LevelManager {
  private levels: Map<string, Level>;
  /**
   * Get the LevelData for a given levelId, or undefined if not found.
   */
  public getLevelData(levelId: string): LevelData | undefined {
    const level = this.levels.get(levelId);
    return level ? (level.getData() as LevelData) : undefined;
  }
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
      width: 1600, // Default, should be set appropriately
      height: 608,
      background: {
        color: "#2C1810", // Default background color
      },
      platforms: [],
      solidBlocks: [],
      diagonalPlatforms: [],
      memoryCrystals: [],
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

    // Convert solid blocks
    for (const solidBlock of gameState.solidBlocks) {
      levelData.solidBlocks.push({
        position: new Vector2(solidBlock.position.x, solidBlock.position.y),
        size: new Vector2(solidBlock.size.x, solidBlock.size.y),
        color: solidBlock.color,
      });
    }

    // Convert memory crystals
    for (const crystal of gameState.memoryCrystals) {
      levelData.memoryCrystals.push({
        position: new Vector2(crystal.position.x, crystal.position.y),
        type: crystal.crystalType,
      });
    }

    // Convert enemies
    for (const enemy of gameState.enemies) {
      levelData.enemies.push({
        position: new Vector2(enemy.position.x, enemy.position.y),
        type: enemy.type,
        direction: enemy.direction,
      });
    }

    return levelData;
  }
}

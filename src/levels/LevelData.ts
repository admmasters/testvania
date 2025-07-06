import type { Vector2 } from "../engine/Vector2";

// Define the structure for platform data
export interface PlatformData {
  position: Vector2;
  size: Vector2;
  color: string;
}

// Define the structure for solid block data
export interface SolidBlockData {
  position: Vector2;
  size: Vector2;
  color: string;
}

// Define the structure for diagonal platform data
export interface DiagonalPlatformData {
  startPoint: Vector2;
  endPoint: Vector2;
  thickness?: number;
  color: string;
}

// Define candle positions
export interface CandleData {
  position: Vector2;
}

// Define initial enemy positions
export interface EnemyData {
  position: Vector2;
  type?: string;
  direction?: number; // 1 for right, -1 for left
}

// Define player starting position
export interface PlayerStartData {
  position: Vector2;
}

// Define the entire level data structure
export interface LevelData {
  id: string;
  name: string;
  width: number; // Level width in pixels
  height: number; // Level height in pixels
  background: {
    color: string;
    elements?: {
      type: string;
      position: Vector2;
      size: Vector2;
      color: string;
    }[];
  };
  platforms: PlatformData[];
  solidBlocks: SolidBlockData[];
  diagonalPlatforms: DiagonalPlatformData[];
  candles: CandleData[];
  enemies: EnemyData[];
  player: PlayerStartData;
}

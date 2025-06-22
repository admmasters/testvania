import { Vector2 } from "../engine/Vector2";

// Define the structure for platform data
export interface PlatformData {
  position: Vector2;
  size: Vector2;
  color: string;
}

// Define candle positions
export interface CandleData {
  position: Vector2;
}

// Define initial enemy positions
export interface EnemyData {
  position: Vector2;
}

// Define player starting position
export interface PlayerStartData {
  position: Vector2;
}

// Define the entire level data structure
export interface LevelData {
  id: string;
  name: string;
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
  candles: CandleData[];
  enemies: EnemyData[];
  player: PlayerStartData;
}

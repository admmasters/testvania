import { Vector2 } from "../engine/Vector2";
import type { LevelData } from "./LevelData";

// Helper function to create a Vector2 instance
function vec2(x: number, y: number): Vector2 {
  return new Vector2(x, y);
}

// Export an array of predefined levels
export const levels: LevelData[] = [
  {
    id: "level1",
    name: "Custom Level 1",
    width: 3200,
    height: 600,
    background: {
      color: "#2C1810",
    },
    platforms: [{ position: vec2(0, 544), size: vec2(3200, 64), color: "#654321" }],
    solidBlocks: [],
    candles: [],
    enemies: [],
    player: {
      position: vec2(64, 496),
    },
  },
  {
    id: "level2",
    name: "Castle Entrance",
    width: 2000, // Example: much wider level
    height: 600,
    background: {
      color: "#2C1810",
      elements: [],
    },
    platforms: [],
    solidBlocks: [],
    candles: [],
    enemies: [],
    player: {
      position: vec2(100, 330),
    },
  },
];

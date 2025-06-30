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
    width: 800,
    height: 600,
    background: {
      color: "#2C1810",
    },
    platforms: [
      { position: vec2(0, 544), size: vec2(1600, 64), color: "#654321" },
      { position: vec2(480, 416), size: vec2(288, 32), color: "#654321" },
      { position: vec2(832, 416), size: vec2(256, 32), color: "#654321" },
      { position: vec2(1152, 416), size: vec2(256, 32), color: "#654321" },
      { position: vec2(1440, 480), size: vec2(64, 32), color: "#654321" },
      { position: vec2(368, 320), size: vec2(112, 32), color: "#654321" },
      { position: vec2(480, 176), size: vec2(256, 32), color: "#654321" },
      { position: vec2(832, 176), size: vec2(256, 32), color: "#654321" },
      { position: vec2(1152, 176), size: vec2(384, 32), color: "#654321" },
    ],
    solidBlocks: [{ position: vec2(1504, 176), size: vec2(32, 368), color: "#4A4A4A" }],
    candles: [],
    enemies: [{ position: vec2(592, 512), type: "landghost" }],
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

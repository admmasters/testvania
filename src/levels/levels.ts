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
    width: 1600,
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
    ],
    solidBlocks: [],
    candles: [
      { position: vec2(528, 384) },
      { position: vec2(720, 384) },
      { position: vec2(880, 384) },
      { position: vec2(1040, 384) },
      { position: vec2(1200, 384) },
      { position: vec2(1360, 384) },
      { position: vec2(1472, 448) },
    ],
    enemies: [
      { position: vec2(432, 512), type: "landghost" },
      { position: vec2(784, 512), type: "landghost" },
      { position: vec2(944, 480), type: "ghost" },
      { position: vec2(608, 480), type: "ghost" },
      { position: vec2(912, 512), type: "landghost" },
      { position: vec2(976, 512), type: "landghost" },
      { position: vec2(1152, 512), type: "landghost" },
      { position: vec2(1376, 512), type: "landghost" },
      { position: vec2(1264, 480), type: "ghost" },
    ],
    player: {
      position: vec2(16, 496),
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

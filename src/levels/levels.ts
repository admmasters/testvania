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
      { position: vec2(368, 320), size: vec2(112, 32), color: "#654321" },
      { position: vec2(480, 176), size: vec2(256, 32), color: "#654321" },
      { position: vec2(832, 176), size: vec2(256, 32), color: "#654321" },
      { position: vec2(1152, 176), size: vec2(384, 32), color: "#654321" },
      { position: vec2(368, 224), size: vec2(112, 32), color: "#654321" },
    ],
    solidBlocks: [{ position: vec2(1504, 176), size: vec2(32, 368), color: "#4A4A4A" }],
    candles: [
      { position: vec2(608, 144) },
      { position: vec2(960, 144) },
      { position: vec2(1200, 144) },
      { position: vec2(1488, 144) },
    ],
    enemies: [
      { position: vec2(592, 512), type: "landghost", direction: -1 },
      { position: vec2(368, 464), type: "ghost", direction: -1 },
      { position: vec2(496, 464), type: "ghost", direction: -1 },
      { position: vec2(688, 464), type: "ghost", direction: -1 },
      { position: vec2(784, 512), type: "landghost", direction: -1 },
      { position: vec2(944, 512), type: "landghost", direction: -1 },
      { position: vec2(1072, 512), type: "landghost", direction: -1 },
      { position: vec2(1152, 464), type: "ghost", direction: 1 },
      { position: vec2(1248, 512), type: "landghost", direction: 1 },
      { position: vec2(1360, 512), type: "landghost", direction: 1 },
      { position: vec2(1344, 384), type: "landghost", direction: 1 },
      { position: vec2(1184, 384), type: "landghost", direction: 1 },
      { position: vec2(1024, 384), type: "landghost", direction: 1 },
      { position: vec2(864, 384), type: "landghost", direction: 1 },
      { position: vec2(704, 384), type: "landghost", direction: 1 },
      { position: vec2(512, 384), type: "landghost", direction: 1 },
      { position: vec2(400, 288), type: "landghost", direction: 1 },
      { position: vec2(512, 144), type: "landghost", direction: 1 },
      { position: vec2(672, 144), type: "landghost", direction: 1 },
      { position: vec2(864, 144), type: "landghost", direction: 1 },
      { position: vec2(1024, 144), type: "landghost", direction: 1 },
      { position: vec2(400, 192), type: "landghost", direction: 1 },
      { position: vec2(944, 336), type: "ghost", direction: 1 },
      { position: vec2(1280, 336), type: "ghost", direction: 1 },
      { position: vec2(608, 336), type: "ghost", direction: 1 },
      { position: vec2(1248, 112), type: "ghost", direction: 1 },
      { position: vec2(1408, 112), type: "ghost", direction: 1 },
    ],
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

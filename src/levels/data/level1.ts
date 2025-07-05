import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const level1: LevelData = {
  id: "level1",
  name: "Custom Level1",
  width: 3200,
  height: 600,
  background: {
    color: "#2C1810",
  },
  platforms: [{ position: vec2(0, 544), size: vec2(3200, 64), color: "#654321" }],
  solidBlocks: [{ position: vec2(1536, 256), size: vec2(64, 288), color: "#4A4A4A" }],
  diagonalPlatforms: [],
  candles: [],
  enemies: [],
  player: {
    position: vec2(64, 496),
  },
};

export default level1;

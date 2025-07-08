import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const level2: LevelData = {
  id: "level2",
  name: "Castle Entrance",
  width: 2000,
  height: 600,
  background: {
    color: "#2C1810",
    elements: [],
  },
  platforms: [],
  solidBlocks: [],
  diagonalPlatforms: [],
  memoryCrystals: [],
  enemies: [],
  player: {
    position: vec2(100, 330),
  },
};

export default level2;

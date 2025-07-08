import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const level1: LevelData = {
  id: "level1",
  name: "Custom Level 1",
  width: 1216,
  height: 600,
  background: {
    color: "#2C1810",
  },
  platforms: [{ position: vec2(0, 544), size: vec2(4800, 64), color: "#654321" }],
  solidBlocks: [],
  diagonalPlatforms: [],
  memoryCrystals: [
    { position: vec2(1016, 504), type: "azure" },
    { position: vec2(248, 504), type: "azure" },
    { position: vec2(312, 504), type: "azure" },
    { position: vec2(376, 504), type: "azure" },
  ],
  enemies: [
    { position: vec2(436, 512), type: "landghost", direction: 1 },
    { position: vec2(564, 512), type: "landghost", direction: 1 },
    { position: vec2(692, 512), type: "landghost", direction: 1 },
    { position: vec2(820, 512), type: "landghost", direction: 1 },
  ],
  player: {
    position: vec2(64, 496),
  },
};

export default level1;

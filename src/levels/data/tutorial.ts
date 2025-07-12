import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const tutorial: LevelData = {
  id: "tutorial",
  name: "Tutorial",
  width: 1216,
  height: 600,
  background: {
    color: "#2C1810",
  },
  platforms: [
    { position: vec2(0, 544), size: vec2(1216, 64), color: "#654321" },
    { position: vec2(384, 448), size: vec2(128, 32), color: "#654321" },
    { position: vec2(576, 384), size: vec2(128, 32), color: "#654321" },
  ],
  solidBlocks: [
    { position: vec2(704, 384), size: vec2(64, 160), color: "#4A4A4A" },
    { position: vec2(1152, 192), size: vec2(64, 352), color: "#4A4A4A" },
  ],
  diagonalPlatforms: [],
  memoryCrystals: [
    { position: vec2(440, 408), type: "azure" },
    { position: vec2(632, 344), type: "azure" },
    { position: vec2(824, 504), type: "azure" },
    { position: vec2(952, 504), type: "azure" },
    { position: vec2(1080, 504), type: "azure" },
    { position: vec2(376, 408), type: "azure" },
    { position: vec2(504, 408), type: "azure" },
    { position: vec2(568, 344), type: "azure" },
    { position: vec2(696, 344), type: "azure" },
    { position: vec2(760, 344), type: "azure" },
    { position: vec2(888, 504), type: "azure" },
    { position: vec2(1016, 504), type: "azure" },
  ],
  enemies: [{ position: vec2(1012, 512), type: "landghost", direction: 1 }],
  player: {
    position: vec2(64, 496),
  },
};

export default tutorial;

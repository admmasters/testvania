import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const tutorial: LevelData = {
  id: "tutorial",
  name: "🎓 Quick Training",
  width: 1200,
  height: 600,
  background: {
    color: "#2C1810",
  },
  platforms: [
    { position: vec2(0, 544), size: vec2(1200, 64), color: "#654321" },
    { position: vec2(384, 448), size: vec2(128, 32), color: "#654321" },
    { position: vec2(576, 384), size: vec2(128, 32), color: "#654321" },
    { position: vec2(768, 384), size: vec2(128, 32), color: "#654321" },
  ],
  solidBlocks: [{ position: vec2(704, 384), size: vec2(64, 160), color: "#4A4A4A" }],
  diagonalPlatforms: [],
  memoryCrystals: [
    { position: vec2(440, 408), type: "azure" },
    { position: vec2(632, 344), type: "azure" },
    { position: vec2(824, 344), type: "azure" },
    { position: vec2(824, 504), type: "azure" },
    { position: vec2(952, 504), type: "azure" },
    { position: vec2(1080, 504), type: "azure" },
  ],
  enemies: [{ position: vec2(1012, 512), type: "landghost", direction: 1 }],
  player: {
    position: vec2(64, 496),
  },
};

export default tutorial;

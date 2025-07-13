import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const level1: LevelData = {
  id: "level1",
  name: "Custom Level 1",
  width: 2048,
  height: 600,
  background: {
    color: "#2C1810",
  },
  platforms: [
    { position: vec2(0, 544), size: vec2(4800, 64), color: "#654321" },
    { position: vec2(576, 448), size: vec2(128, 32), color: "#654321" },
    { position: vec2(704, 384), size: vec2(128, 32), color: "#654321" },
    { position: vec2(832, 320), size: vec2(128, 32), color: "#654321" },
    { position: vec2(960, 256), size: vec2(128, 32), color: "#654321" },
    { position: vec2(1344, 256), size: vec2(640, 32), color: "#654321" },
  ],
  solidBlocks: [
    { position: vec2(576, 480), size: vec2(512, 64), color: "#4A4A4A" },
    { position: vec2(704, 416), size: vec2(384, 64), color: "#4A4A4A" },
    { position: vec2(832, 352), size: vec2(256, 64), color: "#4A4A4A" },
    { position: vec2(960, 288), size: vec2(128, 64), color: "#4A4A4A" },
    { position: vec2(1344, 288), size: vec2(640, 160), color: "#4A4A4A" },
    { position: vec2(1984, 0), size: vec2(64, 448), color: "#4A4A4A" },
  ],
  diagonalPlatforms: [],
  memoryCrystals: [
    { position: vec2(568, 408), type: "azure" },
    { position: vec2(632, 408), type: "azure" },
    { position: vec2(888, 280), type: "azure" },
    { position: vec2(1016, 216), type: "azure" },
    { position: vec2(824, 280), type: "azure" },
    { position: vec2(888, 216), type: "azure" },
    { position: vec2(952, 216), type: "azure" },
    { position: vec2(1080, 216), type: "azure" },
    { position: vec2(632, 344), type: "azure" },
    { position: vec2(696, 344), type: "azure" },
    { position: vec2(760, 344), type: "azure" },
    { position: vec2(760, 280), type: "azure" },
    { position: vec2(504, 504), type: "azure" },
    { position: vec2(440, 504), type: "azure" },
    { position: vec2(376, 504), type: "azure" },
    { position: vec2(312, 504), type: "azure" },
    { position: vec2(1144, 504), type: "azure" },
    { position: vec2(1208, 504), type: "azure" },
    { position: vec2(1272, 504), type: "azure" },
    { position: vec2(1336, 504), type: "azure" },
    { position: vec2(1400, 504), type: "azure" },
    { position: vec2(1464, 504), type: "azure" },
    { position: vec2(1528, 504), type: "azure" },
    { position: vec2(1592, 504), type: "azure" },
    { position: vec2(1656, 504), type: "azure" },
    { position: vec2(1720, 504), type: "azure" },
    { position: vec2(1784, 504), type: "azure" },
    { position: vec2(1848, 504), type: "azure" },
  ],
  enemies: [
    { position: vec2(532, 512), type: "landghost", direction: -1 },
    { position: vec2(1012, 224), type: "landghost", direction: 1 },
    { position: vec2(756, 352), type: "landghost", direction: 1 },
    { position: vec2(1748, 496), type: "ghost", direction: 1 },
    { position: vec2(1364, 496), type: "ghost", direction: 1 },
  ],
  player: {
    position: vec2(64, 496),
  },
};

export default level1;

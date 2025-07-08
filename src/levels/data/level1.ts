import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const level1: LevelData = {
  id: "level1",
  name: "Level 1",
  width: 3200,
  height: 600,
  background: {
    color: "#2C1810",
  },
  platforms: [
    { position: vec2(0, 544), size: vec2(3200, 64), color: "#654321" },
    { position: vec2(384, 448), size: vec2(256, 32), color: "#654321" },
    { position: vec2(768, 448), size: vec2(256, 32), color: "#654321" },
    { position: vec2(640, 320), size: vec2(128, 32), color: "#654321" },
  ],
  solidBlocks: [],
  diagonalPlatforms: [],
  memoryCrystals: [
    { position: vec2(376, 512), type: 'azure' },
    { position: vec2(248, 512), type: 'azure' },
    { position: vec2(504, 512), type: 'azure' },
    { position: vec2(632, 512), type: 'azure' },
    { position: vec2(760, 512), type: 'azure' },
    { position: vec2(888, 512), type: 'azure' },
    { position: vec2(1016, 512), type: 'azure' },
    { position: vec2(1144, 512), type: 'azure' },
    { position: vec2(1272, 512), type: 'azure' },
    { position: vec2(1400, 512), type: 'azure' },
    { position: vec2(952, 416), type: 'azure' },
    { position: vec2(824, 416), type: 'azure' },
    { position: vec2(568, 416), type: 'azure' },
    { position: vec2(440, 416), type: 'amethyst' },
    { position: vec2(696, 288), type: 'emerald' },
    { position: vec2(1500, 512), type: 'azure' },
    { position: vec2(1600, 512), type: 'azure' },
    { position: vec2(300, 416), type: 'golden' },
  ],
  enemies: [
    { position: vec2(500, 416), type: "landghost", direction: -1 },
    { position: vec2(884, 416), type: "landghost", direction: 1 },
    { position: vec2(692, 512), type: "landghost", direction: -1 },
  ],
  player: {
    position: vec2(64, 496),
  },
};

export default level1;

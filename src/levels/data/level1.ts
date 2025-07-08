import { Vector2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export const level1: LevelData = {
  id: "level1",
  name: "Training Grounds - Learn the Basics",
  width: 4800,
  height: 600,
  background: {
    color: "#2C1810",
  },
  platforms: [
    // Main ground platform
    { position: vec2(0, 544), size: vec2(4800, 64), color: "#654321" },

    // SECTION 1: Basic Movement Tutorial (0-800px)
    { position: vec2(200, 480), size: vec2(128, 16), color: "#8B4513" },
    { position: vec2(400, 416), size: vec2(128, 16), color: "#8B4513" },
    { position: vec2(600, 352), size: vec2(128, 16), color: "#8B4513" },

    // SECTION 2: Combat Tutorial (800-1600px)
    { position: vec2(1000, 480), size: vec2(96, 16), color: "#654321" },
    { position: vec2(1200, 416), size: vec2(96, 16), color: "#654321" },
    { position: vec2(1400, 480), size: vec2(96, 16), color: "#654321" },

    // SECTION 3: Power System Tutorial (1600-2400px)
    { position: vec2(1800, 480), size: vec2(128, 16), color: "#4A4A4A" },
    { position: vec2(2000, 416), size: vec2(128, 16), color: "#4A4A4A" },
    { position: vec2(2200, 352), size: vec2(128, 16), color: "#4A4A4A" },

    // SECTION 4: Crystal Types Tutorial (2400-3200px)
    { position: vec2(2600, 480), size: vec2(96, 16), color: "#2F4F4F" },
    { position: vec2(2800, 416), size: vec2(96, 16), color: "#2F4F4F" },
    { position: vec2(3000, 352), size: vec2(96, 16), color: "#2F4F4F" },

    // SECTION 5: Advanced Combat (3200-4000px)
    { position: vec2(3400, 480), size: vec2(128, 16), color: "#8B0000" },
    { position: vec2(3600, 416), size: vec2(128, 16), color: "#8B0000" },
    { position: vec2(3800, 352), size: vec2(128, 16), color: "#8B0000" },

    // SECTION 6: Final Challenge (4000-4800px)
    { position: vec2(4200, 480), size: vec2(128, 16), color: "#4B0082" },
    { position: vec2(4400, 416), size: vec2(128, 16), color: "#4B0082" },
    { position: vec2(4600, 352), size: vec2(128, 16), color: "#4B0082" },
  ],
  solidBlocks: [
    // Barriers to separate sections
    { position: vec2(784, 480), size: vec2(16, 64), color: "#4A4A4A" },
    { position: vec2(1584, 480), size: vec2(16, 64), color: "#4A4A4A" },
    { position: vec2(2384, 480), size: vec2(16, 64), color: "#4A4A4A" },
    { position: vec2(3184, 480), size: vec2(16, 64), color: "#4A4A4A" },
    { position: vec2(3984, 480), size: vec2(16, 64), color: "#4A4A4A" },

    // Obstacles in advanced sections
    { position: vec2(3500, 496), size: vec2(32, 48), color: "#696969" },
    { position: vec2(3700, 432), size: vec2(32, 48), color: "#696969" },
    { position: vec2(4300, 496), size: vec2(32, 48), color: "#696969" },
    { position: vec2(4500, 432), size: vec2(32, 48), color: "#696969" },
  ],
  diagonalPlatforms: [
    // Diagonal platforms in advanced sections
    { startPoint: vec2(3300, 544), endPoint: vec2(3380, 496), thickness: 16, color: "#8B4513" },
    { startPoint: vec2(3900, 544), endPoint: vec2(3980, 496), thickness: 16, color: "#8B4513" },
    { startPoint: vec2(4100, 544), endPoint: vec2(4180, 496), thickness: 16, color: "#8B4513" },
  ],
  memoryCrystals: [
    // SECTION 1: Basic Movement - Azure crystals for first experience
    { position: vec2(264, 456), type: "azure" },
    { position: vec2(464, 392), type: "azure" },
    { position: vec2(664, 328), type: "azure" },

    // SECTION 2: Combat Tutorial - More azure crystals
    { position: vec2(1064, 456), type: "azure" },
    { position: vec2(1264, 392), type: "azure" },
    { position: vec2(1464, 456), type: "azure" },

    // SECTION 3: Power System - Amethyst crystals (10 EXP each)
    { position: vec2(1864, 456), type: "amethyst" },
    { position: vec2(2064, 392), type: "amethyst" },
    { position: vec2(2264, 328), type: "amethyst" },

    // SECTION 4: Crystal Types Tutorial - One of each type
    { position: vec2(2664, 456), type: "azure" },
    { position: vec2(2864, 392), type: "amethyst" },
    { position: vec2(3064, 328), type: "emerald" },
    { position: vec2(3164, 504), type: "golden" },

    // SECTION 5: Advanced Combat - Emerald crystals (15 EXP each)
    { position: vec2(3464, 456), type: "emerald" },
    { position: vec2(3664, 392), type: "emerald" },
    { position: vec2(3864, 328), type: "emerald" },

    // SECTION 6: Final Challenge - Golden crystals (25 EXP each)
    { position: vec2(4264, 456), type: "golden" },
    { position: vec2(4464, 392), type: "golden" },
    { position: vec2(4664, 328), type: "golden" },
    { position: vec2(4764, 504), type: "golden" }, // Victory crystal
  ],
  enemies: [
    // SECTION 2: Combat Tutorial - Easy LandGhosts
    { position: vec2(1100, 512), type: "landghost", direction: 1 },
    { position: vec2(1300, 512), type: "landghost", direction: -1 },

    // SECTION 3: Power System - Ghosts to practice charged attacks
    { position: vec2(1900, 400), type: "ghost", direction: 1 },
    { position: vec2(2100, 400), type: "ghost", direction: -1 },

    // SECTION 5: Advanced Combat - Mixed enemies
    { position: vec2(3450, 512), type: "landghost", direction: 1 },
    { position: vec2(3550, 400), type: "ghost", direction: -1 },
    { position: vec2(3750, 512), type: "landghost", direction: -1 },
    { position: vec2(3850, 400), type: "ghost", direction: 1 },

    // SECTION 6: Final Challenge - Tough enemies
    { position: vec2(4250, 512), type: "landghost", direction: 1 },
    { position: vec2(4350, 400), type: "ghost", direction: -1 },
    { position: vec2(4550, 512), type: "landghost", direction: -1 },
    { position: vec2(4650, 400), type: "ghost", direction: 1 },
    { position: vec2(4750, 512), type: "landghost", direction: 1 },
  ],
  player: {
    position: vec2(64, 496),
  },
};

export default level1;

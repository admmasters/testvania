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
    { position: vec2(0, 448), size: vec2(2192, 160), color: "#543121" },
    { position: vec2(336, 368), size: vec2(0, 0), color: "#654321" },
    { position: vec2(400, 256), size: vec2(128, 32), color: "#654321" },
    { position: vec2(592, 256), size: vec2(112, 32), color: "#654321" },
    { position: vec2(752, 256), size: vec2(192, 32), color: "#654321" },
    { position: vec2(624, 352), size: vec2(0, 16), color: "#654321" },
    { position: vec2(592, 352), size: vec2(112, 32), color: "#654321" },
    { position: vec2(400, 352), size: vec2(128, 32), color: "#654321" },
    { position: vec2(224, 304), size: vec2(112, 32), color: "#654321" },
    ],
    solidBlocks: [
    { position: vec2(944, 256), size: vec2(128, 192), color: "#4A4A4A" },
    ],
    candles: [
    { position: vec2(192, 416) },
    { position: vec2(464, 224) },
    { position: vec2(416, 416) },
    { position: vec2(560, 416) },
    { position: vec2(656, 416) },
    { position: vec2(800, 224) },
    { position: vec2(880, 224) },
    { position: vec2(960, 224) },
    { position: vec2(1248, 416) },
    { position: vec2(1312, 416) },
    { position: vec2(1392, 416) },
    { position: vec2(656, 224) },
    { position: vec2(1472, 416) },
    { position: vec2(1536, 416) },
    { position: vec2(1600, 416) },
    ],
    enemies: [
    { position: vec2(864, 416), type: "landghost" },
    { position: vec2(704, 416), type: "landghost" },
    { position: vec2(736, 416), type: "landghost" },
    { position: vec2(496, 224), type: "landghost" },
    { position: vec2(1040, 224), type: "ghost" },
    { position: vec2(672, 224), type: "ghost" },
    { position: vec2(1168, 416), type: "landghost" },
    { position: vec2(1344, 416), type: "landghost" },
    { position: vec2(448, 320), type: "landghost" },
    { position: vec2(640, 320), type: "landghost" },
    { position: vec2(256, 272), type: "landghost" },
    { position: vec2(1552, 416), type: "landghost" },
    { position: vec2(1680, 416), type: "landghost" },
    ],
    player: {
    position: vec2(128, 400)
    },
  },
  {
    id: "level2",
    name: "Castle Entrance",
    width: 2000, // Example: much wider level
    height: 600,
    background: {
      color: "#2C1810",
      elements: [
        {
          type: "rect",
          position: vec2(760, 400),
          size: vec2(40, 48),
          color: "#0F0A07",
        },
        {
          type: "rect",
          position: vec2(384, 352),
          size: vec2(40, 96),
          color: "#0F0A07",
        },
        {
          type: "circle",
          position: vec2(704, 80),
          size: vec2(32, 32),
          color: "#FFFACD",
        },
      ],
    },
    platforms: [
      // Ground
      { position: vec2(0, 450), size: vec2(800, 150), color: "#543121" },
      // Left platforms
      { position: vec2(50, 350), size: vec2(100, 20), color: "#654321" },
      { position: vec2(180, 280), size: vec2(120, 20), color: "#654321" },
      { position: vec2(80, 200), size: vec2(90, 20), color: "#654321" },
      // Middle platforms
      { position: vec2(350, 320), size: vec2(100, 20), color: "#654321" },
      { position: vec2(320, 230), size: vec2(80, 20), color: "#654321" },
      { position: vec2(300, 140), size: vec2(70, 20), color: "#765432" },
      // Right platforms
      { position: vec2(500, 370), size: vec2(110, 20), color: "#654321" },
      { position: vec2(580, 290), size: vec2(100, 20), color: "#654321" },
      { position: vec2(650, 200), size: vec2(90, 20), color: "#654321" },
      // Higher platforms
      { position: vec2(450, 100), size: vec2(60, 15), color: "#8B4513" },
      { position: vec2(200, 100), size: vec2(60, 15), color: "#8B4513" },
    ],
    solidBlocks: [],
    candles: [
      { position: vec2(100, 326) },
      { position: vec2(400, 296) },
      { position: vec2(360, 206) },
      { position: vec2(630, 346) },
      { position: vec2(650, 176) },
    ],
    enemies: [
      { position: vec2(240, 248) },
      { position: vec2(360, 198) },
      { position: vec2(630, 258) },
    ],
    player: {
      position: vec2(100, 330),
    },
  },
  {
    id: "level3",
    name: "Upper Chambers",
    width: 1800,
    height: 700,
    background: {
      color: "#1A1010",
    },
    platforms: [
      // Ground
      { position: vec2(0, 550), size: vec2(800, 150), color: "#543121" },

      // Left side
      { position: vec2(0, 400), size: vec2(120, 20), color: "#543121" },
      { position: vec2(180, 350), size: vec2(100, 20), color: "#543121" },
      { position: vec2(80, 280), size: vec2(80, 20), color: "#543121" },

      // Middle
      { position: vec2(300, 420), size: vec2(200, 30), color: "#543121" },
      { position: vec2(320, 300), size: vec2(60, 20), color: "#543121" },
      { position: vec2(500, 300), size: vec2(60, 20), color: "#543121" },
      { position: vec2(410, 230), size: vec2(60, 20), color: "#543121" },
      { position: vec2(350, 160), size: vec2(100, 20), color: "#614232" },

      // Right side
      { position: vec2(600, 380), size: vec2(80, 20), color: "#543121" },
      { position: vec2(700, 330), size: vec2(100, 20), color: "#543121" },
      { position: vec2(650, 240), size: vec2(70, 20), color: "#543121" },
    ],
    solidBlocks: [],
    candles: [
      { position: vec2(60, 376) },
      { position: vec2(230, 326) },
      { position: vec2(400, 396) },
      { position: vec2(500, 276) },
      { position: vec2(430, 206) },
      { position: vec2(400, 136) },
      { position: vec2(650, 216) },
    ],
    enemies: [
      { position: vec2(100, 250) },
      { position: vec2(350, 270) },
      { position: vec2(450, 390) },
      { position: vec2(710, 300) },
    ],
    player: {
      position: vec2(50, 360),
    },
  },
  {
    id: "level4",
    name: "Custom Level 4",
    width: 1200,
    height: 704,
    background: {
      color: "#2C1810",
    },
    platforms: [
      { position: vec2(0, 552), size: vec2(800, 152), color: "#654321" },
      { position: vec2(208, 480), size: vec2(432, 32), color: "#654321" },
    ],
    solidBlocks: [],
    candles: [{ position: vec2(648, 176) }],
    enemies: [],
    player: {
      position: vec2(104, 504),
    },
  },
];

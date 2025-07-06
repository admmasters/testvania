# Testavania

Testavania is a TypeScript-based 2D game engine inspired by Castlevania, built with Vite. It features a custom engine, a robust event system, and a powerful built-in level editor for creating and managing your own retro platformer levels.

## Features
- 🎮 Custom 2D game engine (TypeScript, Vite)
- 🏰 Built-in modular Level Editor (visual, in-game)
- 🦇 Player, enemies, platforms, candles, and more
- 🌄 Parallax backgrounds
- 🕹️ Keyboard input and camera system
- 🧩 Entity-Component architecture
- 🔄 Undo/redo, area selection, and more in the editor

## How to Use the Level Editor

1. **Run the game** (`npm run dev`)
2. Click the **"Level Editor"** button in the UI to enter editor mode
3. Use the editor tools and modes to create and place objects:
   - **Select**: Click objects to select them
   - **Area Select**: Drag to select multiple objects
   - **Platform**: Draw platforms by clicking and dragging
   - **Solid Block**: Place solid wall blocks
   - **Diagonal Platform**: Draw diagonal platforms
   - **Candle**: Place candles by clicking
   - **Ghost**: Place Ghost enemies
   - **Land Ghost**: Place LandGhost enemies
   - **Player**: Set player starting position
   - **Delete**: Remove objects
4. Use the UI to:
   - Change platform color
   - Set level width and height
   - Undo/redo actions
   - Save/export your level as JSON
   - Scroll/navigate with mouse or keyboard (see UI for instructions)
   - Set enemy direction (when an enemy is selected)
5. Click **"Save Level"** to export your level
6. Copy the generated JSON and add it to a new file in `src/levels/data/` (see below)

## Level Data Structure

Levels are defined as TypeScript objects and loaded from `src/levels/data/`. You can create new levels by exporting a `LevelData` object as default:

```typescript
// src/levels/data/levelX.ts
import { vec2 } from "@/engine/Vector2";
import type { LevelData } from "../LevelData";

const levelX: LevelData = {
  id: "levelX",            // Unique ID for the level
  name: "Castle Entrance", // Display name
  width: 1600,             // Level width
  height: 600,             // Level height
  background: {
    color: "#2C1810",      // Background color
    elements: [ /* ... */ ] // Optional background elements
  },
  platforms: [
    { position: vec2(0, 450), size: vec2(800, 150), color: "#654321" }
  ],
  solidBlocks: [],
  candles: [
    { position: vec2(100, 326) }
  ],
  enemies: [
    { position: vec2(240, 248), type: "Ghost" }
  ],
  player: {
    position: vec2(100, 330)
  }
};

export default levelX;
```

All levels in `src/levels/data/` are automatically loaded by the game. No need to manually import them in `levels.ts`.

## Code Structure

- `src/engine/` – Core engine (game loop, camera, input, etc.)
- `src/objects/` – Game objects (player, enemies, platforms, etc.)
- `src/levels/` – Level system and data
  - `LevelData.ts` – Level data interfaces
  - `Level.ts` – Level loading/management
  - `LevelManager.ts` – Multi-level support
  - `levels.ts` – Loads all levels from `data/`
  - `LevelEditor.ts` – Main Level Editor class
  - `LevelEditor/` – Modular Level Editor components (UI, mouse, rendering, state, etc.)

## Adding New Levels

1. Use the Level Editor to design your level and export the JSON.
2. Create a new file in `src/levels/data/` (e.g., `level3.ts`).
3. Paste the exported JSON as a `LevelData` object and export it as default.
4. The new level will be auto-loaded and available in the game.

## Development
- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run typecheck` – Type checking only
- `npm run format` – Format with Biome
- `npm run lint` – Lint with Biome
- `npm run check` – Format and lint together

---

Testavania is a fangame/engine for learning and fun. Whip some candles, defeat some ghosts, and make your own Castlevania-inspired levels!

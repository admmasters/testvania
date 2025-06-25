# Testavania - Level Editor

This project includes a built-in level editor system that lets you easily create and manage levels.

## How to Use the Level Editor

1. **Run the game**
2. Click the "Level Editor" button in the UI to enter editor mode
3. Use the editor tools to create and place objects:
   - **Select**: Click objects to select them
   - **Platform**: Draw platforms by clicking and dragging
   - **Candle**: Place candles by clicking
   - **Enemy**: Place enemies by clicking
   - **Player**: Set player starting position
   - **Delete**: Remove objects
4. Click "Save Level" to export your level
5. Copy the generated JSON and add it to the `levels.ts` file

## Level Data Structure

Levels are defined in the `src/levels/levels.ts` file. You can create new levels by following the existing format:

```typescript
{
  id: "level1",            // Unique ID for the level
  name: "Castle Entrance", // Display name
  background: {
    color: "#2C1810",      // Background color
    elements: [
      // Optional background elements
    ]
  },
  platforms: [
    // Platform data: position, size, color
    { position: vec2(0, 450), size: vec2(800, 150), color: "#654321" }
  ],
  candles: [
    // Candle positions
    { position: vec2(100, 326) }
  ],
  enemies: [
    // Enemy starting positions
    { position: vec2(240, 248) }
  ],
  player: {
    // Player starting position
    position: vec2(100, 330)
  }
}
```

## Code Structure

The level system is organized as follows:

- `src/levels/LevelData.ts`: Defines the data structure for levels
- `src/levels/Level.ts`: Class that handles loading level data
- `src/levels/LevelManager.ts`: Manages multiple levels and switching between them
- `src/levels/levels.ts`: Contains all defined levels
- `src/levels/LevelEditor.ts`: The visual editor for creating levels

## Adding New Levels Manually

1. Create a new level object in `levels.ts` following the existing format
2. Make sure it has a unique `id`
3. Add platforms, candles, enemies, and player position
4. The new level will automatically appear in the level selection

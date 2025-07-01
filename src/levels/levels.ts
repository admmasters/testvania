import type { LevelData } from "./LevelData";

// Automatically import every level module in ./data
// Vite's `import.meta.glob` eagerly grabs each `.ts` file and bundles it.
// Each level file should export its LevelData as default.
// Use a type assertion to satisfy TS without relying on Vite's generic overloads
const levelModules = import.meta.glob("./data/*.ts", { eager: true }) as Record<
  string,
  { default: LevelData }
>;

export const levels: LevelData[] = Object.values(levelModules).map((m) => m.default);

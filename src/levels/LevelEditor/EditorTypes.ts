import type { Vector2 } from "@/engine/Vector2";
import type { DiagonalPlatform } from "@/objects/diagonalPlatform";
import type { Ghost } from "@/objects/enemies/Ghost";
import type { LandGhost } from "@/objects/enemies/LandGhost";
import type { MemoryCrystal } from "@/objects/memoryCrystal";
import type { Platform } from "@/objects/platform";
import type { SolidBlock } from "@/objects/solidBlock";

export interface EditorPlatform {
  position: Vector2;
  size: Vector2;
  color: string;
}

export interface EditorDiagonalPlatform {
  startPoint: Vector2;
  endPoint: Vector2;
  thickness: number;
  color: string;
}

export interface EditorState {
  platforms: { position: Vector2; size: Vector2; color: string }[];
  solidBlocks: { position: Vector2; size: Vector2; color: string }[];
  diagonalPlatforms: { startPoint: Vector2; endPoint: Vector2; thickness: number; color: string }[];
  memoryCrystals: { position: Vector2; type?: string }[];
  enemies: { position: Vector2; type: string; direction?: number }[];
  player: { position: Vector2 };
  scrollPosition: Vector2;
}

export interface ResizeState {
  handle: string;
  startMouse: Vector2;
  startRect: { x: number; y: number; w: number; h: number };
}

export interface ResizeHandle {
  name: string;
  x: number;
  y: number;
}

// Type for enemies that have direction property
export interface EnemyWithDirection {
  type: string;
  direction: number;
  position: Vector2;
  size: Vector2;
}

// Type for objects that can be positioned and sized in the editor
export interface PositionedObject {
  position: Vector2;
  size: Vector2;
}

export type EditorObject =
  | Platform
  | SolidBlock
  | DiagonalPlatform
  | MemoryCrystal
  | LandGhost
  | Ghost
  | object
  | null;

// Type for selected enemy objects that can have their direction changed
export type SelectableEnemy = (Ghost | LandGhost) & { type: string; direction?: number };

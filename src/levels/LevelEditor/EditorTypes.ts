import type { Vector2 } from "@/engine/Vector2";
import type { Candle } from "@/objects/candle";
import type { Ghost } from "@/objects/Ghost";
import type { LandGhost } from "@/objects/LandGhost";
import type { Platform } from "@/objects/platform";
import type { SolidBlock } from "@/objects/solidBlock";

export interface EditorPlatform {
  position: Vector2;
  size: Vector2;
  color: string;
}

export interface EditorState {
  platforms: { position: Vector2; size: Vector2; color: string }[];
  solidBlocks: { position: Vector2; size: Vector2; color: string }[];
  candles: { position: Vector2 }[];
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

export type EditorObject = Platform | SolidBlock | Candle | LandGhost | Ghost | object | null;

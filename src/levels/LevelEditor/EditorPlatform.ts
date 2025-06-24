import { Vector2 } from "../../engine/Vector2";

export interface EditorPlatform {
  position: Vector2;
  size: Vector2;
  color: string;
}

export function startPlatformMode(pos: Vector2, color: string) {
  return {
    position: pos,
    size: new Vector2(0, 0),
    color,
  };
}

export function updatePlatformSize(
  platform: EditorPlatform,
  startPosition: Vector2,
  pos: Vector2,
  snapVec2: (v: Vector2) => Vector2
) {
  if (!platform || !startPosition) return;
  const snapped = snapVec2(pos);
  platform.size.x = snapped.x - platform.position.x;
  platform.size.y = snapped.y - platform.position.y;
  if (platform.size.x < 0) {
    platform.position.x = snapped.x;
    platform.size.x = Math.abs(platform.size.x);
  }
  if (platform.size.y < 0) {
    platform.position.y = snapped.y;
    platform.size.y = Math.abs(platform.size.y);
  }
}

export function finishPlatform(
  platform: EditorPlatform,
  startPosition: Vector2,
  pos: Vector2,
  snapVec2: (v: Vector2) => Vector2,
  addPlatform: (p: EditorPlatform) => void
) {
  if (!platform || !startPosition) return;
  updatePlatformSize(platform, startPosition, pos, snapVec2);
  addPlatform(platform);
}

import type { Vector2 } from "../../engine/Vector2";
import type { Candle } from "../../objects/candle";
import type { Enemy } from "../../objects/enemy";
import type { Platform } from "../../objects/platform";

export function selectObject(
  pos: Vector2,
  platforms: Platform[],
  candles: Candle[],
  enemies: Enemy[],
  player: { position: Vector2; size: Vector2 }
): Platform | Candle | Enemy | object | null {
  // Prioritize: enemy > candle > platform > player
  for (const enemy of enemies) {
    if (
      pos.x >= enemy.position.x &&
      pos.x <= enemy.position.x + enemy.size.x &&
      pos.y >= enemy.position.y &&
      pos.y <= enemy.position.y + enemy.size.y
    ) {
      return enemy;
    }
  }
  for (const candle of candles) {
    if (
      pos.x >= candle.position.x &&
      pos.x <= candle.position.x + candle.size.x &&
      pos.y >= candle.position.y &&
      pos.y <= candle.position.y + candle.size.y
    ) {
      return candle;
    }
  }
  for (const platform of platforms) {
    if (
      pos.x >= platform.position.x &&
      pos.x <= platform.position.x + platform.size.x &&
      pos.y >= platform.position.y &&
      pos.y <= platform.position.y + platform.size.y
    ) {
      return platform;
    }
  }
  if (
    pos.x >= player.position.x &&
    pos.x <= player.position.x + player.size.x &&
    pos.y >= player.position.y &&
    pos.y <= player.position.y + player.size.y
  ) {
    return player;
  }
  return null;
}

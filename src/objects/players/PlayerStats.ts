// Handles player stat growth, leveling, and experience logic

import type { Player } from "./player";

export const PlayerStats = {
  BASE_EXP_TO_NEXT: 100,
  EXP_GROWTH: 1.5,
  BASE_MAX_HEALTH: 16,
  BASE_STRENGTH: 2,
  BASE_DEFENSE: 1,
  BASE_SPEED: 220,

  applyLevelUp(player: Player) {
    player.level++;
    player.maxHealth += 4;
    player.strength += 1;
    player.defense += 1;
    player.speedStat += 5;
    player.expToNext = Math.floor(player.expToNext * PlayerStats.EXP_GROWTH);
    player.health = player.maxHealth;
    player.speed = player.speedStat;
    player.displayLevelUp();
  },
};

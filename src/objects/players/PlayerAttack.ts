// Handles player attack, charging, and power bar logic
import type { GameState } from "../../engine/GameState";
import type { Player } from "./player";

export function performAttack(player: Player, _gameState?: GameState) {
  player.attacking = true;
  player.attackTimer = player.attackDuration;
  // No global camera shake; individual objects will shake via GameState.hitPause.
}

export function releaseChargedAttack(player: Player, gameState?: GameState) {
  if (!player.isChargingAttack || !gameState) return;
  if (player.power >= player.maxPower && player.chargeLevel >= 2) {
    player.power = 0;
    const centerX = player.position.x + player.size.x / 2;
    const centerY = player.position.y + player.size.y / 2;
    const blastDamage = 8;
    gameState.createEnergyBlast(centerX, centerY, player.facingRight, blastDamage);
    player.attackCooldownTimer = player.attackCooldown;
  }
  player.isChargingAttack = false;
  player.chargeTime = 0;
  player.chargeLevel = 0;
}

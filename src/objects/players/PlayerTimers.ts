// Handles player timer updates
import type { Player } from "./player";

export const PlayerTimers = {
  update(player: Player, deltaTime: number): void {
    this.updateAttackTimers(player, deltaTime);
    this.updateChargeAndPower(player, deltaTime);
    this.updateInvulnerability(player, deltaTime);
    this.updateCoyoteTime(player, deltaTime);
  },

  updateAttackTimers(player: Player, deltaTime: number): void {
    if (player.attacking) {
      player.attackTimer -= deltaTime;
      // Update animation phase (0 = start, 1 = end)
      player.attackAnimationPhase = 1 - player.attackTimer / player.attackDuration;

      if (player.attackTimer <= 0) {
        player.attacking = false;
        player.attackAnimationPhase = 0;
        player.attackCooldownTimer = player.attackCooldown; // Start cooldown after attack ends
      }
    }

    // Update attack cooldown timer
    if (player.attackCooldownTimer > 0) {
      player.attackCooldownTimer -= deltaTime;
    }
  },

  updateChargeAndPower(player: Player, deltaTime: number): void {
    // Update charging attack
    if (player.isChargingAttack) {
      player.chargeTime += deltaTime;

      // Fill power bar while charging
      if (player.power < player.maxPower) {
        player.power = Math.min(
          player.maxPower,
          player.power + player.powerRechargeRate * deltaTime,
        );
      }

      // Update charge level based on time (only matters when power is full)
      if (player.power >= player.maxPower) {
        if (player.chargeTime >= player.maxChargeTime) {
          player.chargeLevel = 2; // Full charge
        } else if (player.chargeTime >= player.maxChargeTime * 0.5) {
          player.chargeLevel = 1; // Partial charge
        } else {
          player.chargeLevel = 0; // No charge
        }
      } else {
        player.chargeLevel = 0; // No charge until power is full
      }
    }

    // Power drains when not charging
    if (!player.isChargingAttack && player.power > 0) {
      player.power = Math.max(0, player.power - player.powerRechargeRate * 2 * deltaTime); // Drain faster than it fills
    }
  },

  updateInvulnerability(player: Player, deltaTime: number): void {
    if (player.invulnerable) {
      player.invulnerabilityTimer -= deltaTime;
      if (player.invulnerabilityTimer <= 0) {
        player.invulnerable = false;
      }
    }
  },

  updateCoyoteTime(player: Player, deltaTime: number): void {
    // Handle coyote time (allowing jumps shortly after leaving platform)
    if (!player.grounded) {
      if (player.coyoteTimer > 0) {
        player.coyoteTimer -= deltaTime;
      }
    } else {
      player.coyoteTimer = player.coyoteTime;
    }
  },
};

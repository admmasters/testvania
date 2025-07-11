// Handles player rendering logic
import type { Player } from "./player";

export const PlayerRenderer = {
  render(player: Player, ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Flicker when invulnerable
    if (player.invulnerable && Math.floor(Date.now() / 100) % 2) {
      ctx.globalAlpha = 0.5;
    }

    // Get render position with shake offset
    const renderPos = player.getRenderPosition();

    // Flash white when fully charged
    if (player.power >= player.maxPower && player.isChargingAttack) {
      const flashIntensity = 0.3 + 0.4 * Math.sin(Date.now() * 0.08); // 4x faster flashing
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
      ctx.fillRect(renderPos.x - 2, renderPos.y - 2, player.size.x + 4, player.size.y + 4);
    }

    ctx.fillStyle = "#8B4513";
    ctx.fillRect(renderPos.x, renderPos.y, player.size.x, player.size.y);

    // Face
    ctx.fillStyle = "#FFE4C4";
    ctx.fillRect(renderPos.x + 8, renderPos.y + 8, 16, 16);

    // Eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(renderPos.x + 10, renderPos.y + 12, 2, 2);
    ctx.fillRect(renderPos.x + 20, renderPos.y + 12, 2, 2);

    // Charging effects - show when charging (power building up)
    this.renderChargingEffects(player, ctx, renderPos);

    // Render attack animation if attacking
    if (player.attacking) {
      this.renderAttackAnimation(player, ctx, renderPos);
    }

    ctx.restore();
  },

  renderChargingEffects(
    player: Player,
    ctx: CanvasRenderingContext2D,
    renderPos: { x: number; y: number },
  ): void {
    if (!player.isChargingAttack) return;

    const centerX = renderPos.x + player.size.x / 2;
    const centerY = renderPos.y + player.size.y / 2;
    const time = Date.now() * 0.03; // 3x faster animation

    // Energy aura based on power level and charge level
    const powerPercent = player.power / player.maxPower;
    const auraIntensity = powerPercent * (player.chargeLevel === 2 ? 1.0 : 0.6);
    const auraColor =
      player.chargeLevel === 2 ? "#FF4500" : powerPercent >= 1.0 ? "#FFFF00" : "#88FF88";

    ctx.save();
    ctx.globalAlpha = auraIntensity * (0.5 + 0.4 * Math.sin(time * 2)); // Faster pulsing
    ctx.shadowColor = auraColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = 2;

    // Draw energy rings
    for (let i = 0; i < 3; i++) {
      const radius = 20 + i * 8 + Math.sin(time * 1.5 + i) * 6; // Faster and more pronounced movement
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Energy particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time * 2; // Faster rotation
      const distance = 25 + Math.sin(time * 3 + i) * 10; // Faster and more movement
      const sparkX = centerX + Math.cos(angle) * distance;
      const sparkY = centerY + Math.sin(angle) * distance;

      ctx.fillStyle = auraColor;
      ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
    }

    ctx.restore();
  },

  renderAttackAnimation(
    player: Player,
    ctx: CanvasRenderingContext2D,
    renderPos: { x: number; y: number },
  ): void {
    const progress = player.attackAnimationPhase;
    const centerX = renderPos.x + player.size.x / 2;
    const centerY = renderPos.y + player.size.y / 2;
    const direction = player.facingRight ? 1 : -1;

    // Sword blade properties
    const bladeLength = 80; // Long, elegant blade
    const bladeWidth = 8; // Thin blade width
    const hiltLength = 12; // Sword hilt

    // Calculate sword position based on attack progress
    const swordAngle = direction * (progress * 0.5 - 0.25) * Math.PI; // Smooth arc motion
    const swordStartX = centerX + direction * 8; // Start near player
    const swordStartY = centerY;
    const swordEndX = swordStartX + Math.cos(swordAngle) * bladeLength * direction;
    const swordEndY = swordStartY + Math.sin(swordAngle) * bladeLength * 0.3; // Slight vertical arc

    ctx.save();

    // Draw sword hilt (dark brown/black)
    ctx.strokeStyle = "#2C1810";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(swordStartX, swordStartY);
    ctx.lineTo(
      swordStartX + Math.cos(swordAngle) * hiltLength * direction,
      swordStartY + Math.sin(swordAngle) * hiltLength * 0.3,
    );
    ctx.stroke();

    // Draw sword guard (metallic gold)
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    const guardX = swordStartX + Math.cos(swordAngle) * hiltLength * direction;
    const guardY = swordStartY + Math.sin(swordAngle) * hiltLength * 0.3;
    ctx.beginPath();
    ctx.moveTo(guardX - 8, guardY - 4);
    ctx.lineTo(guardX + 8, guardY + 4);
    ctx.stroke();

    // Draw main blade (bright silver/white with subtle glow)
    ctx.strokeStyle = "#F0F0F0";
    ctx.lineWidth = bladeWidth;
    ctx.lineCap = "round";
    ctx.shadowColor = "#FFFFFF";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(guardX, guardY);
    ctx.lineTo(swordEndX, swordEndY);
    ctx.stroke();

    // Draw blade highlight (bright white center line)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.moveTo(guardX, guardY);
    ctx.lineTo(swordEndX, swordEndY);
    ctx.stroke();

    // Draw blade edge (ultra-thin bright line)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 0.5;
    ctx.shadowBlur = 1;
    ctx.beginPath();
    ctx.moveTo(guardX, guardY);
    ctx.lineTo(swordEndX, swordEndY);
    ctx.stroke();

    // Motion blur effect - draw several blade positions for speed
    if (progress > 0.2) {
      ctx.globalAlpha = 0.3;
      for (let i = 1; i <= 3; i++) {
        const blurProgress = Math.max(0, progress - i * 0.05);
        const blurAngle = direction * (blurProgress * 0.5 - 0.25) * Math.PI;
        const blurEndX = swordStartX + Math.cos(blurAngle) * bladeLength * direction;
        const blurEndY = swordStartY + Math.sin(blurAngle) * bladeLength * 0.3;

        ctx.strokeStyle = "#E0E0E0";
        ctx.lineWidth = bladeWidth * 0.8;
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.moveTo(guardX, guardY);
        ctx.lineTo(blurEndX, blurEndY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    // Subtle sparkle at blade tip during peak of swing
    if (progress > 0.4 && progress < 0.8) {
      const sparkIntensity = 1.0 - Math.abs(progress - 0.6) * 5; // Peak at 0.6
      ctx.globalAlpha = sparkIntensity * 0.8;

      // Small bright flash at tip
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#FFFFFF";
      ctx.shadowBlur = 8;
      ctx.fillRect(swordEndX - 2, swordEndY - 2, 4, 4);

      // Tiny sparkles around tip
      ctx.fillStyle = "#F0F0F0";
      ctx.shadowBlur = 4;
      for (let i = 0; i < 4; i++) {
        const sparkAngle = (i / 4) * Math.PI * 2;
        const sparkDist = 6 + Math.random() * 4;
        const sparkX = swordEndX + Math.cos(sparkAngle) * sparkDist;
        const sparkY = swordEndY + Math.sin(sparkAngle) * sparkDist;
        ctx.fillRect(sparkX - 0.5, sparkY - 0.5, 1, 1);
      }

      ctx.globalAlpha = 1.0;
    }

    // Reset shadow and restore context
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.restore();
  },
};

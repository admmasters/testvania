import type { Player } from "@/objects/players/player";
import type { MPManager } from "@/systems/MPManager";

/**
 * Formats numeric values for display in the HUD
 * Handles abbreviation of large numbers to prevent overflow
 */
interface ValueFormattingOptions {
  abbreviateThreshold?: number; // When to start abbreviating (default: 1000)
  useKMBNotation?: boolean; // Use K, M, B notation for large numbers
  maxDecimalPlaces?: number; // Maximum decimal places for abbreviated values
  forceAbbreviate?: boolean; // Force abbreviation regardless of threshold
}

/**
 * Formats a numeric value for display in the HUD
 * Abbreviates large numbers to prevent overflow
 */
function formatHUDValue(value: number, options: ValueFormattingOptions = {}): string {
  const {
    abbreviateThreshold = 1000,
    useKMBNotation = true,
    maxDecimalPlaces = 1,
    forceAbbreviate = false,
  } = options;

  // Don't abbreviate small numbers unless forced
  if (value < abbreviateThreshold && !forceAbbreviate) {
    return value.toString();
  }

  // Abbreviate large numbers
  if (useKMBNotation) {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(maxDecimalPlaces).replace(/\.0$/, "")}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(maxDecimalPlaces).replace(/\.0$/, "")}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(maxDecimalPlaces).replace(/\.0$/, "")}K`;
    }
  } else {
    // Use H (hundred) notation for smaller abbreviation
    if (value >= 1000) {
      return `${(value / 1000).toFixed(maxDecimalPlaces).replace(/\.0$/, "")}K`;
    }
    if (value >= 100 && forceAbbreviate) {
      return `${(value / 100).toFixed(maxDecimalPlaces).replace(/\.0$/, "")}H`;
    }
  }

  return value.toString();
}

/**
 * Formats MP values for display in the HUD
 * Shows only current MP value to save space
 */
function formatMPValue(current: number, _max: number, _boxWidth: number): string {
  // For very large values, use abbreviated format
  if (current >= 1000) {
    return formatHUDValue(current, { forceAbbreviate: true });
  }

  // For normal values, show just the current MP
  return current.toString();
}

interface HUDPanelConfig {
  ctx: CanvasRenderingContext2D;
  player: Player;
  mpManager: MPManager;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
}

export class HUD {
  render(ctx: CanvasRenderingContext2D, player: Player, mpManager: MPManager): void {
    ctx.save();
    const config: HUDPanelConfig = {
      ctx,
      player,
      mpManager,
      panelX: 12,
      panelY: 12,
      panelWidth: 120, // Increased from 110 to 120 to accommodate wider MP box
      panelHeight: 108,
    };
    drawMainUIPanel(config);
    drawPlayerLevelDisplay(config);
    drawHealthAndManaBoxes(config);
    drawPowerBar(config);
    ctx.restore();
  }
}

function drawMainUIPanel(config: HUDPanelConfig): void {
  const { ctx, panelX, panelY, panelWidth, panelHeight } = config;
  // Enhanced multi-layer background with horizontal gradient for wider panel
  const mainGradient = ctx.createLinearGradient(panelX, 0, panelX + panelWidth, 0);
  mainGradient.addColorStop(0, "rgba(15, 5, 25, 0.98)");
  mainGradient.addColorStop(0.3, "rgba(25, 15, 40, 0.98)");
  mainGradient.addColorStop(0.7, "rgba(20, 10, 35, 0.98)");
  mainGradient.addColorStop(1, "rgba(15, 5, 25, 0.98)");

  // Apply a subtle shadow for depth
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = mainGradient;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  // Add subtle highlight at the top for depth
  const highlightGradient = ctx.createLinearGradient(0, panelY, 0, panelY + 5);
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = highlightGradient;
  ctx.fillRect(panelX + 1, panelY + 1, panelWidth - 2, 5);

  // Reset shadow for other elements
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  drawUIBorderDecoration(config);
}

function drawUIBorderDecoration(config: HUDPanelConfig): void {
  const { ctx, panelX, panelY, panelWidth, panelHeight } = config;
  // Ornate triple border system
  // Outer border - bright gold
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 3;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  // Middle border - darker gold with shadow effect
  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX + 2, panelY + 2, panelWidth - 4, panelHeight - 4);

  // Inner border - bronze accent
  ctx.strokeStyle = "#CD7F32";
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX + 4, panelY + 4, panelWidth - 8, panelHeight - 8);
}

function drawPlayerLevelDisplay(config: HUDPanelConfig): void {
  const { ctx, panelX, panelY, panelWidth, player } = config;
  // Player level with enhanced styling - centered in the wider panel
  ctx.font = "bold 14px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  const levelX = panelX + panelWidth / 2; // Center in the panel
  const levelY = panelY + 22;
  ctx.strokeText(`LEVEL ${player.level}`, levelX, levelY);
  ctx.fillText(`LEVEL ${player.level}`, levelX, levelY);
}

function drawHealthAndManaBoxes(config: HUDPanelConfig): void {
  const { ctx, panelX, panelY, player, mpManager } = config;
  const contentPadding = 8;
  const hpBoxX = panelX + contentPadding;
  const hpBoxY = panelY + 32;
  const hpBoxWidth = 42;
  const mpBoxWidth = 46; // Increased from 42 to 46 for better MP display
  const boxHeight = 32;

  // Health box
  drawHealthBox(ctx, hpBoxX, hpBoxY, hpBoxWidth, boxHeight, player);

  // Mana box - with proper spacing
  const mpBoxX = hpBoxX + hpBoxWidth + 8;
  const mpBoxY = hpBoxY;
  drawManaBox(ctx, mpBoxX, mpBoxY, mpBoxWidth, boxHeight, player, mpManager);
}

function drawHealthBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  player: Player,
): void {
  drawOrnateStatBox(ctx, x, y, width, height, "HP", String(player.health), "#8B0000", "#FF4444");
}

function drawManaBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  _player: Player,
  mpManager: MPManager,
): void {
  const currentMP = mpManager.getCurrentMP();
  const maxMP = mpManager.getMaxMP();

  // Format MP text to prevent overflow
  const mpText = formatMPValue(currentMP, maxMP, width);

  // Use different colors based on MP percentage for visual feedback
  const mpPercentage = mpManager.getMPPercentage();
  let accentColor = "#4444FF"; // Default blue

  if (mpPercentage >= 0.75) {
    accentColor = "#00FFFF"; // Cyan when high MP
  } else if (mpPercentage >= 0.5) {
    accentColor = "#4444FF"; // Blue when medium MP
  } else if (mpPercentage >= 0.25) {
    accentColor = "#8888FF"; // Light blue when low MP
  } else {
    accentColor = "#AAAAFF"; // Very light blue when very low MP
  }

  drawOrnateStatBox(ctx, x, y, width, height, "MP", mpText, "#000080", accentColor);
}

function drawPowerBar(config: HUDPanelConfig): void {
  const { ctx, panelX, panelY, player } = config;
  const contentPadding = 8;
  const hpBoxX = panelX + contentPadding;
  const hpBoxY = panelY + 48;
  const hpBoxWidth = 42;
  const mpBoxWidth = 46;
  const boxHeight = 32;

  // Sophisticated Energy Bar with multiple visual layers - with padding
  const powerBarX = hpBoxX;
  const powerBarY = hpBoxY + boxHeight + 6;
  const powerBarWidth = hpBoxWidth + mpBoxWidth + 8; // Adjusted to match the combined width of HP and MP boxes
  const powerBarHeight = 12;

  // Calculate power percentage
  const powerPercent = player.power / player.maxPower;

  // Add charging visual effects
  let chargingEffect = 0;
  if (player.isChargingAttack) {
    const powerPercent = player.power / player.maxPower;
    chargingEffect = powerPercent * (0.3 + 0.3 * Math.sin(Date.now() * 0.02)); // Faster and more intense
  }

  drawOrnatePowerBar(
    ctx,
    powerBarX,
    powerBarY,
    powerBarWidth,
    powerBarHeight,
    powerPercent,
    chargingEffect,
  );
}

function drawOrnateStatBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  bgColor: string,
  accentColor: string,
): void {
  drawStatBoxBackground(ctx, x, y, width, height, bgColor);
  drawStatBoxBorder(ctx, x, y, width, height, accentColor);
  drawStatBoxLabel(ctx, x, y, width, label);
  drawStatBoxValue(ctx, x, y, width, value, accentColor);
  drawStatBoxCornerAccents(ctx, x, y, width, height, accentColor);
}

function drawStatBoxBackground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  bgColor: string,
): void {
  // Multi-layered background with depth
  const boxGradient = ctx.createLinearGradient(x, y, x, y + height);
  boxGradient.addColorStop(0, `${bgColor}CC`);
  boxGradient.addColorStop(0.5, `${bgColor}FF`);
  boxGradient.addColorStop(1, `${bgColor}AA`);

  ctx.fillStyle = boxGradient;
  ctx.fillRect(x, y, width, height);
}

function drawStatBoxBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  accentColor: string,
): void {
  // Ornate border system
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);

  // Inner highlight
  ctx.strokeStyle = "#FFF8DC";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
}

function drawStatBoxLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
): void {
  // Label with enhanced styling
  ctx.font = "bold 10px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.strokeText(label, x + width / 2, y + 12);
  ctx.fillText(label, x + width / 2, y + 12);
}

function drawStatBoxValue(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: string,
  _accentColor: string,
): void {
  // Value with glow effect
  // Dynamically adjust font size based on text length to prevent overflow
  const baseFontSize = 16;
  const fontSize =
    value.length > 5 ? Math.max(10, baseFontSize - (value.length - 5) * 1.5) : baseFontSize;

  ctx.font = `bold ${fontSize}px 'Orbitron', monospace`;
  ctx.textAlign = "center";
  const textX = x + width / 2;
  const textY = y + 28;

  // Draw black outline for better contrast
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(2, fontSize / 6); // Thicker outline for better readability
  ctx.strokeText(value, textX, textY);

  // Draw white text fill
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(value, textX, textY);

  // Add subtle glow effect
  ctx.shadowColor = "#FFFFFF";
  ctx.shadowBlur = 2;
  ctx.fillText(value, textX, textY);
  ctx.shadowBlur = 0;
}

function drawStatBoxCornerAccents(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  accentColor: string,
): void {
  // Decorative corner accents
  ctx.fillStyle = accentColor;
  ctx.fillRect(x + 2, y + 2, 3, 3);
  ctx.fillRect(x + width - 5, y + 2, 3, 3);
  ctx.fillRect(x + 2, y + height - 5, 3, 3);
  ctx.fillRect(x + width - 5, y + height - 5, 3, 3);
}

function drawOrnatePowerBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
  chargingEffect: number = 0,
): void {
  drawEnergyBarBackground(ctx, x, y, width, height);
  drawEnergyBarBorder(ctx, x, y, width, height, chargingEffect);
  drawEnergyBarFill(ctx, x, y, width, height, percent, chargingEffect);
  drawEnergyBarParticles(ctx, x, y, width, height, percent);
  drawPowerBarLabel(ctx, x, y, width);
}

function drawEnergyBarBackground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  // Multi-layered background
  const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
  bgGradient.addColorStop(0, "rgba(20, 20, 20, 0.95)");
  bgGradient.addColorStop(0.5, "rgba(40, 40, 40, 0.95)");
  bgGradient.addColorStop(1, "rgba(20, 20, 20, 0.95)");

  ctx.fillStyle = bgGradient;
  ctx.fillRect(x, y, width, height);
}

function drawEnergyBarBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  chargingEffect: number = 0,
): void {
  // Ornate border with charging glow
  const glowIntensity = chargingEffect;

  ctx.strokeStyle = glowIntensity > 0 ? "#FFFF00" : "#FFD700";
  ctx.lineWidth = 2;
  if (glowIntensity > 0) {
    ctx.shadowColor = "#FFFF00";
    ctx.shadowBlur = 8 * glowIntensity;
  }
  ctx.strokeRect(x, y, width, height);

  ctx.strokeStyle = "#CD7F32";
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
}

function drawEnergyBarFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
  chargingEffect: number = 0,
): void {
  // Energy fill with gradient and glow
  const fillWidth = (width - 6) * percent;
  const energyGradient = ctx.createLinearGradient(x + 3, y + 3, x + 3, y + height - 3);

  // Change colors based on charging effect
  if (chargingEffect > 0) {
    energyGradient.addColorStop(0, "#FFFF00");
    energyGradient.addColorStop(0.5, "#FFA500");
    energyGradient.addColorStop(1, "#FF4500");
  } else {
    energyGradient.addColorStop(0, "#00FF88");
    energyGradient.addColorStop(0.5, "#00CC66");
    energyGradient.addColorStop(1, "#00AA44");
  }

  ctx.fillStyle = energyGradient;
  ctx.shadowColor = chargingEffect > 0 ? "#FFFF00" : "#00FF88";
  ctx.shadowBlur = 8 + chargingEffect * 8;
  ctx.fillRect(x + 3, y + 3, fillWidth, height - 6);
  ctx.shadowBlur = 0;
}

function drawEnergyBarParticles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
): void {
  // Animated energy particles
  const fillWidth = (width - 6) * percent;
  const time = Date.now() * 0.006; // 2x faster particle movement
  for (let i = 0; i < 5; i++) {
    const particleX = x + 3 + fillWidth * ((i / 5 + time) % 1);
    const particleY = y + height / 2 + Math.sin(time * 3 + i) * 3; // Faster and more pronounced movement

    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "#00FF88";
    ctx.shadowBlur = 4;
    ctx.fillRect(particleX, particleY - 1, 2, 2);
    ctx.shadowBlur = 0;
  }
}

function drawPowerBarLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
): void {
  // Energy label with enhanced styling - centered for better visual balance
  ctx.font = "bold 8px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.strokeText("POWER", x + width / 2, y - 3);
  ctx.fillText("POWER", x + width / 2, y - 3);
}

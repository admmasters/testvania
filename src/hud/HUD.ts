import type { Player } from "@/objects/player";

interface HUDPanelConfig {
  ctx: CanvasRenderingContext2D;
  player: Player;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
}
export class HUD {
  render(ctx: CanvasRenderingContext2D, player: Player): void {
    ctx.save();
    const config: HUDPanelConfig = {
      ctx,
      player,
      panelX: 12,
      panelY: 12,
      panelWidth: 110,
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
  // Sophisticated multi-layer background with depth
  const mainGradient = ctx.createLinearGradient(0, 0, 0, 95);
  mainGradient.addColorStop(0, "rgba(15, 5, 25, 0.98)");
  mainGradient.addColorStop(0.3, "rgba(25, 15, 40, 0.98)");
  mainGradient.addColorStop(0.7, "rgba(20, 10, 35, 0.98)");
  mainGradient.addColorStop(1, "rgba(10, 5, 20, 0.98)");

  ctx.fillStyle = mainGradient;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

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
  const { ctx, panelX, panelY, player } = config;
  // Player level with enhanced styling - with proper padding
  ctx.font = "bold 14px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 2;
  ctx.textAlign = "left";
  const levelX = panelX + 8;
  const levelY = panelY + 22;
  ctx.strokeText(`LEVEL ${player.level}`, levelX, levelY);
  ctx.fillText(`LEVEL ${player.level}`, levelX, levelY);
}

function drawHealthAndManaBoxes(config: HUDPanelConfig): void {
  const { ctx, panelX, panelY, player } = config;
  const contentPadding = 8;
  const hpBoxX = panelX + contentPadding;
  const hpBoxY = panelY + 32;
  const boxWidth = 42;
  const boxHeight = 32;

  // Health box
  drawHealthBox(ctx, hpBoxX, hpBoxY, boxWidth, boxHeight, player);

  // Mana box - with proper spacing
  const mpBoxX = hpBoxX + boxWidth + 8;
  const mpBoxY = hpBoxY;
  drawManaBox(ctx, mpBoxX, mpBoxY, boxWidth, boxHeight, player);
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
  player: Player,
): void {
  const currentMP = player.level * 5;
  drawOrnateStatBox(ctx, x, y, width, height, "MP", String(currentMP), "#000080", "#4444FF");
}

function drawPowerBar(config: HUDPanelConfig): void {
  const { ctx, panelX, panelY } = config;
  const contentPadding = 8;
  const hpBoxX = panelX + contentPadding;
  const hpBoxY = panelY + 48;
  const boxWidth = 42;
  const boxHeight = 32;

  // Sophisticated Energy Bar with multiple visual layers - with padding
  const powerBarX = hpBoxX;
  const powerBarY = hpBoxY + boxHeight + 6;
  const powerBarWidth = boxWidth * 2 + 8;
  const powerBarHeight = 12;

  drawOrnatePowerBar(ctx, powerBarX, powerBarY, powerBarWidth, powerBarHeight, 0.75);
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
  accentColor: string,
): void {
  // Value with glow effect
  ctx.font = "bold 16px 'Orbitron', monospace";
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 4;
  ctx.textAlign = "center";
  ctx.strokeText(value, x + width / 2, y + 28);
  ctx.fillText(value, x + width / 2, y + 28);
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
): void {
  drawEnergyBarBackground(ctx, x, y, width, height);
  drawEnergyBarBorder(ctx, x, y, width, height);
  drawEnergyBarFill(ctx, x, y, width, height, percent);
  drawEnergyBarParticles(ctx, x, y, width, height, percent);
  drawPowerBarLabel(ctx, x, y);
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
): void {
  // Ornate border
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.strokeStyle = "#CD7F32";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
}

function drawEnergyBarFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
): void {
  // Energy fill with gradient and glow
  const fillWidth = (width - 6) * percent;
  const energyGradient = ctx.createLinearGradient(x + 3, y + 3, x + 3, y + height - 3);
  energyGradient.addColorStop(0, "#00FF88");
  energyGradient.addColorStop(0.5, "#00CC66");
  energyGradient.addColorStop(1, "#00AA44");

  ctx.fillStyle = energyGradient;
  ctx.shadowColor = "#00FF88";
  ctx.shadowBlur = 8;
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
  const time = Date.now() * 0.003;
  for (let i = 0; i < 5; i++) {
    const particleX = x + 3 + fillWidth * ((i / 5 + time) % 1);
    const particleY = y + height / 2 + Math.sin(time * 2 + i) * 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "#00FF88";
    ctx.shadowBlur = 4;
    ctx.fillRect(particleX, particleY - 1, 2, 2);
    ctx.shadowBlur = 0;
  }
}

function drawPowerBarLabel(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Energy label with enhanced styling
  ctx.font = "bold 8px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 1;
  ctx.textAlign = "left";
  ctx.strokeText("POWER", x, y - 3);
  ctx.fillText("POWERx", x, y - 3);
}

import type { Player } from "@/objects/player";

export function drawCastlevaniaUI(ctx: CanvasRenderingContext2D, player: Player): void {
  // Sophisticated multi-layer background with depth - more compact
  const mainGradient = ctx.createLinearGradient(0, 0, 0, 95);
  mainGradient.addColorStop(0, "rgba(15, 5, 25, 0.98)");
  mainGradient.addColorStop(0.3, "rgba(25, 15, 40, 0.98)");
  mainGradient.addColorStop(0.7, "rgba(20, 10, 35, 0.98)");
  mainGradient.addColorStop(1, "rgba(10, 5, 20, 0.98)");

  // Main panel with proper padding
  const panelX = 12;
  const panelY = 12;
  const panelWidth = 260;
  const panelHeight = 95;

  ctx.fillStyle = mainGradient;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

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

  // Ornate header section with embossed effect - with padding
  const headerX = panelX + 6;
  const headerY = panelY + 6;
  const headerWidth = panelWidth - 12;
  const headerHeight = 18;

  const headerGradient = ctx.createLinearGradient(0, headerY, 0, headerY + headerHeight);
  headerGradient.addColorStop(0, "#FFD700");
  headerGradient.addColorStop(0.5, "#DAA520");
  headerGradient.addColorStop(1, "#B8860B");

  ctx.fillStyle = headerGradient;
  ctx.fillRect(headerX, headerY, headerWidth, headerHeight);

  // Header embossed borders
  ctx.strokeStyle = "#FFF8DC";
  ctx.lineWidth = 1;
  ctx.strokeRect(headerX, headerY, headerWidth, headerHeight);
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 1;
  ctx.strokeRect(headerX + 1, headerY + 1, headerWidth - 2, headerHeight - 2);

  // Intricate decorative pattern in header - adjusted for new width
  ctx.fillStyle = "#8B4513";
  for (let i = 0; i < 14; i++) {
    const x = headerX + 8 + i * 16;
    // Diamond pattern
    ctx.fillRect(x, headerY + 3, 4, 4);
    ctx.fillRect(x + 1, headerY + 2, 2, 6);
    ctx.fillRect(x + 2, headerY + 1, 1, 8);
    // Side accents
    ctx.fillRect(x - 1, headerY + 4, 1, 2);
    ctx.fillRect(x + 5, headerY + 4, 1, 2);
  }

  // Gothic corner flourishes - adjusted for new dimensions
  drawGothicCorners(ctx, panelX, panelY, panelWidth, panelHeight);

  // Player level with enhanced styling - with proper padding
  ctx.font = "bold 14px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 2;
  ctx.textAlign = "left";
  const levelX = panelX + 8;
  const levelY = panelY + 40;
  ctx.strokeText(`LEVEL ${player.level}`, levelX, levelY);
  ctx.fillText(`LEVEL ${player.level}`, levelX, levelY);

  // Enhanced HP Box with ornate styling - with padding
  const contentPadding = 8;
  const hpBoxX = panelX + contentPadding;
  const hpBoxY = panelY + 48;
  const boxWidth = 42;
  const boxHeight = 32;

  drawOrnateStatBox(
    ctx,
    hpBoxX,
    hpBoxY,
    boxWidth,
    boxHeight,
    "HP",
    String(player.health),
    "#8B0000",
    "#FF4444",
  );

  // Enhanced MP Box - with proper spacing
  const mpBoxX = hpBoxX + boxWidth + 8;
  const mpBoxY = hpBoxY;
  const currentMP = player.level * 5;

  drawOrnateStatBox(
    ctx,
    mpBoxX,
    mpBoxY,
    boxWidth,
    boxHeight,
    "MP",
    String(currentMP),
    "#000080",
    "#4444FF",
  );

  // Sophisticated Energy Bar with multiple visual layers - with padding
  const energyBarX = hpBoxX;
  const energyBarY = hpBoxY + boxHeight + 6;
  const energyBarWidth = boxWidth * 2 + 8;
  const energyBarHeight = 12;

  drawOrnateEnergyBar(ctx, energyBarX, energyBarY, energyBarWidth, energyBarHeight, 0.75);

  // Enhanced EXP display with progress visualization - positioned with padding
  drawExpDisplay(ctx, panelX + panelWidth - 8, panelY + 65, player);

  // Mystical ambient effects - adjusted for new dimensions
  drawMysticalEffects(ctx, panelX, panelY, panelWidth, panelHeight);
}

function drawGothicCorners(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
): void {
  // Elaborate Gothic corner flourishes
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;

  // Top-left ornate corner
  ctx.beginPath();
  ctx.moveTo(panelX + 3, panelY + 28);
  ctx.lineTo(panelX + 13, panelY + 28);
  ctx.lineTo(panelX + 13, panelY + 33);
  ctx.lineTo(panelX + 18, panelY + 33);
  ctx.moveTo(panelX + 3, panelY + 28);
  ctx.lineTo(panelX + 3, panelY + 38);
  ctx.lineTo(panelX + 8, panelY + 38);
  ctx.lineTo(panelX + 8, panelY + 43);
  ctx.stroke();

  // Top-right ornate corner
  ctx.beginPath();
  ctx.moveTo(panelX + panelWidth - 3, panelY + 28);
  ctx.lineTo(panelX + panelWidth - 13, panelY + 28);
  ctx.lineTo(panelX + panelWidth - 13, panelY + 33);
  ctx.lineTo(panelX + panelWidth - 18, panelY + 33);
  ctx.moveTo(panelX + panelWidth - 3, panelY + 28);
  ctx.lineTo(panelX + panelWidth - 3, panelY + 38);
  ctx.lineTo(panelX + panelWidth - 8, panelY + 38);
  ctx.lineTo(panelX + panelWidth - 8, panelY + 43);
  ctx.stroke();

  // Bottom-left ornate corner
  ctx.beginPath();
  ctx.moveTo(panelX + 3, panelY + panelHeight - 3);
  ctx.lineTo(panelX + 13, panelY + panelHeight - 3);
  ctx.lineTo(panelX + 13, panelY + panelHeight - 8);
  ctx.lineTo(panelX + 18, panelY + panelHeight - 8);
  ctx.moveTo(panelX + 3, panelY + panelHeight - 3);
  ctx.lineTo(panelX + 3, panelY + panelHeight - 13);
  ctx.lineTo(panelX + 8, panelY + panelHeight - 13);
  ctx.lineTo(panelX + 8, panelY + panelHeight - 18);
  ctx.stroke();

  // Bottom-right ornate corner
  ctx.beginPath();
  ctx.moveTo(panelX + panelWidth - 3, panelY + panelHeight - 3);
  ctx.lineTo(panelX + panelWidth - 13, panelY + panelHeight - 3);
  ctx.lineTo(panelX + panelWidth - 13, panelY + panelHeight - 8);
  ctx.lineTo(panelX + panelWidth - 18, panelY + panelHeight - 8);
  ctx.moveTo(panelX + panelWidth - 3, panelY + panelHeight - 3);
  ctx.lineTo(panelX + panelWidth - 3, panelY + panelHeight - 13);
  ctx.lineTo(panelX + panelWidth - 8, panelY + panelHeight - 13);
  ctx.lineTo(panelX + panelWidth - 8, panelY + panelHeight - 18);
  ctx.stroke();
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
  // Multi-layered background with depth
  const boxGradient = ctx.createLinearGradient(x, y, x, y + height);
  boxGradient.addColorStop(0, bgColor + "CC");
  boxGradient.addColorStop(0.5, bgColor + "FF");
  boxGradient.addColorStop(1, bgColor + "AA");

  ctx.fillStyle = boxGradient;
  ctx.fillRect(x, y, width, height);

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

  // Label with enhanced styling
  ctx.font = "bold 10px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.strokeText(label, x + width / 2, y + 12);
  ctx.fillText(label, x + width / 2, y + 12);

  // Value with glow effect
  ctx.font = "bold 16px 'Orbitron', monospace";
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 4;
  ctx.strokeText(value, x + width / 2, y + 28);
  ctx.fillText(value, x + width / 2, y + 28);
  ctx.shadowBlur = 0;

  // Decorative corner accents
  ctx.fillStyle = accentColor;
  ctx.fillRect(x + 2, y + 2, 3, 3);
  ctx.fillRect(x + width - 5, y + 2, 3, 3);
  ctx.fillRect(x + 2, y + height - 5, 3, 3);
  ctx.fillRect(x + width - 5, y + height - 5, 3, 3);
}

function drawOrnateEnergyBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
): void {
  // Multi-layered background
  const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
  bgGradient.addColorStop(0, "rgba(20, 20, 20, 0.95)");
  bgGradient.addColorStop(0.5, "rgba(40, 40, 40, 0.95)");
  bgGradient.addColorStop(1, "rgba(20, 20, 20, 0.95)");

  ctx.fillStyle = bgGradient;
  ctx.fillRect(x, y, width, height);

  // Ornate border
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.strokeStyle = "#CD7F32";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);

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

  // Animated energy particles
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

  // Energy label with enhanced styling
  ctx.font = "bold 8px 'Orbitron', monospace";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B4513";
  ctx.lineWidth = 1;
  ctx.textAlign = "left";
  ctx.strokeText("ENERGY", x, y - 3);
  ctx.fillText("ENERGY", x, y - 3);
}

function drawExpDisplay(ctx: CanvasRenderingContext2D, x: number, y: number, player: Player): void {
  // EXP text with enhanced styling
  ctx.font = "bold 12px 'Orbitron', monospace";
  ctx.fillStyle = "#00FFAA";
  ctx.strokeStyle = "#008866";
  ctx.lineWidth = 2;
  ctx.textAlign = "right";
  ctx.shadowColor = "#00FFAA";
  ctx.shadowBlur = 6;
  ctx.strokeText(`EXP: ${player.exp}/${player.expToNext}`, x, y);
  ctx.fillText(`EXP: ${player.exp}/${player.expToNext}`, x, y);
  ctx.shadowBlur = 0;

  // EXP progress bar
  const barWidth = 80;
  const barHeight = 6;
  const barX = x - barWidth;
  const barY = y + 5;
  const expPercent = player.exp / player.expToNext;

  // Progress bar background
  ctx.fillStyle = "rgba(20, 20, 20, 0.8)";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Progress bar border
  ctx.strokeStyle = "#00FFAA";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Progress bar fill
  const fillWidth = (barWidth - 2) * expPercent;
  const expGradient = ctx.createLinearGradient(barX + 1, barY + 1, barX + 1, barY + barHeight - 1);
  expGradient.addColorStop(0, "#00FFAA");
  expGradient.addColorStop(1, "#00CC88");

  ctx.fillStyle = expGradient;
  ctx.fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2);
}

function drawMysticalEffects(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
): void {
  // Subtle floating particles for mystical atmosphere
  const time = Date.now() * 0.002;

  for (let i = 0; i < 6; i++) {
    const x = panelX + 30 + i * 35 + Math.sin(time + i) * 8;
    const y = panelY + 15 + Math.cos(time * 0.7 + i) * 4;
    const alpha = 0.3 + Math.sin(time * 2 + i) * 0.2;

    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 3;
    ctx.fillRect(x, y, 1, 1);
    ctx.shadowBlur = 0;
  }

  // Mystical gems with enhanced effects - positioned relative to panel
  const gemPositions = [
    { x: panelX + panelWidth - 30, y: panelY + panelHeight - 10, color: "#FF6B6B" },
    { x: panelX + panelWidth - 18, y: panelY + panelHeight - 10, color: "#6B6BFF" },
    { x: panelX + panelWidth - 6, y: panelY + panelHeight - 10, color: "#6BFF6B" },
  ];

  gemPositions.forEach((gem, index) => {
    const pulse = 0.8 + Math.sin(time * 3 + index) * 0.2;
    ctx.fillStyle = gem.color;
    ctx.shadowColor = gem.color;
    ctx.shadowBlur = 8 * pulse;
    ctx.beginPath();
    ctx.arc(gem.x, gem.y, 3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
}

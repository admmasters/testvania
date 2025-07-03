export class Scanlines {
  private intensity: number;
  private lineSpacing: number;
  private opacity: number;

  constructor(intensity: number = 0.5, lineSpacing: number = 2, opacity: number = 0.4) {
    this.intensity = intensity;
    this.lineSpacing = lineSpacing;
    this.opacity = opacity;
  }

  /**
   * Render scanlines over the entire canvas
   * @param ctx Canvas rendering context
   * @param canvasWidth Width of the canvas
   * @param canvasHeight Height of the canvas
   */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    ctx.save();

    // Use source-over for better visibility
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = this.opacity;

    // Draw horizontal scanlines with alternating intensity
    for (let y = 0; y < canvasHeight; y += this.lineSpacing) {
      // Create more pronounced scanlines with gradient effect
      const gradient = ctx.createLinearGradient(0, y, 0, y + 1);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${this.intensity})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${this.intensity * 0.3})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, y, canvasWidth, 1);
    }

    // Add subtle vertical phosphor effect for authentic CRT look
    ctx.globalAlpha = this.opacity * 0.15;
    for (let x = 0; x < canvasWidth; x += 3) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.intensity * 0.2})`;
      ctx.fillRect(x, 0, 1, canvasHeight);
    }

    ctx.restore();
  }

  /**
   * Update scanline properties for dynamic effects
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  setLineSpacing(spacing: number): void {
    this.lineSpacing = Math.max(1, spacing);
  }

  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }
}

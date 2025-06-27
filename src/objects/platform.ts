import { GameObject } from "../engine/GameObject";

export class Platform extends GameObject {
  color: string;
  shadowColor: string;
  highlightColor: string;

  constructor(x: number, y: number, width: number, height: number, color = "#654321") {
    super(x, y, width, height);
    this.color = color;
    this.shadowColor = this.adjustColor(color, -20);
    this.highlightColor = this.adjustColor(color, 20);
  }

  // Helper to darken/lighten a color
  adjustColor(color: string, amount: number): string {
    const hex = color.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Get render position with shake offset
    const renderPos = this.getRenderPosition();

    // Main platform body
    ctx.fillStyle = this.color;
    ctx.fillRect(renderPos.x, renderPos.y, this.size.x, this.size.y);

    // Top highlight
    ctx.fillStyle = this.highlightColor;
    ctx.fillRect(renderPos.x, renderPos.y, this.size.x, 4);

    // Bottom shadow
    ctx.fillStyle = this.shadowColor;
    ctx.fillRect(renderPos.x, renderPos.y + this.size.y - 3, this.size.x, 3);

    // Brick pattern for larger platforms
    if (this.size.x > 50) {
      ctx.strokeStyle = this.shadowColor;
      ctx.lineWidth = 1;

      // Horizontal lines
      if (this.size.y > 30) {
        for (let y = renderPos.y + 10; y < renderPos.y + this.size.y - 5; y += 10) {
          ctx.beginPath();
          ctx.moveTo(renderPos.x, y);
          ctx.lineTo(renderPos.x + this.size.x, y);
          ctx.stroke();
        }
      }

      // Vertical lines (brick pattern)
      const brickWidth = 20;
      for (
        let x = renderPos.x + brickWidth;
        x < renderPos.x + this.size.x;
        x += brickWidth
      ) {
        // Make bricks offset for each row
        const offset = Math.floor((x - renderPos.x) / brickWidth) % 2 === 0 ? 5 : 5;

        ctx.beginPath();
        ctx.moveTo(x, renderPos.y + offset);
        ctx.lineTo(x, renderPos.y + this.size.y);
        ctx.stroke();
      }
    }
  }
}

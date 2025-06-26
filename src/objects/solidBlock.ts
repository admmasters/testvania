import { GameObject } from "../engine/GameObject";

export class SolidBlock extends GameObject {
  color: string;
  shadowColor: string;
  highlightColor: string;
  borderColor: string;

  constructor(x: number, y: number, width: number, height: number, color = "#4A4A4A") {
    super(x, y, width, height);
    this.color = color;
    this.shadowColor = this.adjustColor(color, -30);
    this.highlightColor = this.adjustColor(color, 40);
    this.borderColor = this.adjustColor(color, -50);
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
    // Main block body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);

    // Border
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);

    // Top-left highlight
    ctx.fillStyle = this.highlightColor;
    ctx.fillRect(this.position.x + 2, this.position.y + 2, this.size.x - 4, 3);
    ctx.fillRect(this.position.x + 2, this.position.y + 2, 3, this.size.y - 4);

    // Bottom-right shadow
    ctx.fillStyle = this.shadowColor;
    ctx.fillRect(this.position.x + 2, this.position.y + this.size.y - 5, this.size.x - 4, 3);
    ctx.fillRect(this.position.x + this.size.x - 5, this.position.y + 2, 3, this.size.y - 4);

    // Stone block pattern for larger blocks
    if (this.size.x > 32 && this.size.y > 32) {
      ctx.strokeStyle = this.shadowColor;
      ctx.lineWidth = 1;

      // Create a stone block pattern
      const blockSize = 16;
      for (let x = this.position.x + blockSize; x < this.position.x + this.size.x; x += blockSize) {
        ctx.beginPath();
        ctx.moveTo(x, this.position.y + 2);
        ctx.lineTo(x, this.position.y + this.size.y - 2);
        ctx.stroke();
      }

      for (let y = this.position.y + blockSize; y < this.position.y + this.size.y; y += blockSize) {
        ctx.beginPath();
        ctx.moveTo(this.position.x + 2, y);
        ctx.lineTo(this.position.x + this.size.x - 2, y);
        ctx.stroke();
      }

      // Add some texture dots for stone appearance
      ctx.fillStyle = this.shadowColor;
      for (let x = this.position.x + 8; x < this.position.x + this.size.x - 8; x += 16) {
        for (let y = this.position.y + 8; y < this.position.y + this.size.y - 8; y += 16) {
          ctx.fillRect(x, y, 2, 2);
          ctx.fillRect(x + 6, y + 6, 1, 1);
        }
      }
    }
  }
} 
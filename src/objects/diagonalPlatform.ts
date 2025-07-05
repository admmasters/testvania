import { GameObject } from "../engine/GameObject";
import { Vector2 } from "../engine/Vector2";

export class DiagonalPlatform extends GameObject {
  color: string;
  shadowColor: string;
  highlightColor: string;
  startPoint: Vector2;
  endPoint: Vector2;
  thickness: number;
  angle: number;
  slope: number;

  constructor(args: {
    startPoint: Vector2;
    endPoint: Vector2;
    thickness?: number;
    color?: string;
  }) {
    const { startPoint, endPoint, thickness = 16, color = "#654321" } = args;

    // Calculate bounding box for the diagonal platform
    const minX = Math.min(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const maxX = Math.max(startPoint.x, endPoint.x);
    const maxY = Math.max(startPoint.y, endPoint.y);

    super({
      x: minX,
      y: minY,
      width: maxX - minX + thickness,
      height: maxY - minY + thickness,
    });

    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.thickness = thickness;
    this.color = color;
    this.shadowColor = this.adjustColor(color, -20);
    this.highlightColor = this.adjustColor(color, 20);

    // Calculate angle and slope for collision detection
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    this.angle = Math.atan2(dy, dx);
    this.slope = dx !== 0 ? dy / dx : Infinity;
  }

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

  // Check if a point is on the diagonal platform surface
  isPointOnSurface(x: number, y: number): { isOn: boolean; surfaceY: number } {
    const { startPoint, endPoint, thickness } = this;

    // Check if point is within the x range of the platform
    const minX = Math.min(startPoint.x, endPoint.x);
    const maxX = Math.max(startPoint.x, endPoint.x);

    if (x < minX || x > maxX) {
      return { isOn: false, surfaceY: 0 };
    }

    // Calculate the y position on the line at the given x
    let surfaceY: number;
    if (this.slope === Infinity) {
      // Vertical line
      surfaceY = startPoint.y;
    } else {
      surfaceY = startPoint.y + this.slope * (x - startPoint.x);
    }

    // Check if the point is close enough to the surface (within thickness)
    const distance = Math.abs(y - surfaceY);
    const isOn = distance <= thickness / 2;

    return { isOn, surfaceY };
  }

  // Enhanced collision detection for player landing
  checkPlayerLanding(
    playerLeft: number,
    playerRight: number,
    playerBottom: number,
    nextPlayerBottom: number,
  ): {
    canLand: boolean;
    landingY: number;
    averageSurfaceY: number;
  } {
    const { startPoint, endPoint, thickness } = this;

    // Check if player overlaps with platform's X range
    const minX = Math.min(startPoint.x, endPoint.x);
    const maxX = Math.max(startPoint.x, endPoint.x);

    if (playerRight < minX || playerLeft > maxX) {
      return { canLand: false, landingY: 0, averageSurfaceY: 0 };
    }

    // Calculate the top surface corners (same as getPlayerSurfaceY)
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      const surfaceY = startPoint.y;
      const tolerance = thickness / 2 + 3;
      const canLand =
        playerBottom <= surfaceY + tolerance && nextPlayerBottom >= surfaceY - tolerance;
      return {
        canLand,
        landingY: surfaceY,
        averageSurfaceY: surfaceY,
      };
    }

    // Calculate the perpendicular vector representing half the thickness
    const perpX = ((-dy / length) * thickness) / 2;
    const perpY = ((dx / length) * thickness) / 2;

    // Walkable surface is located exactly at the top edge of the platform
    const surfaceOffsetX = perpX;
    const surfaceOffsetY = perpY;

    const topStartX = startPoint.x + surfaceOffsetX;
    const topStartY = startPoint.y + surfaceOffsetY;
    const topEndX = endPoint.x + surfaceOffsetX;
    const topEndY = endPoint.y + surfaceOffsetY;

    // Check if player overlaps with the surface X range
    const topMinX = Math.min(topStartX, topEndX);
    const topMaxX = Math.max(topStartX, topEndX);

    if (playerRight < topMinX || playerLeft > topMaxX) {
      return { canLand: false, landingY: 0, averageSurfaceY: 0 };
    }

    // Compute surface Y for both the player's left and right edges and take the higher surface (smaller Y)
    const computeSurfaceY = (x: number): number => {
      if (Math.abs(topEndX - topStartX) < 0.001) {
        return (topStartY + topEndY) / 2;
      }
      const t = (x - topStartX) / (topEndX - topStartX);
      return topStartY + t * (topEndY - topStartY);
    };

    const clampedLeftX = Math.max(topMinX, Math.min(topMaxX, playerLeft));
    const clampedRightX = Math.max(topMinX, Math.min(topMaxX, playerRight));

    const surfaceYLeft = computeSurfaceY(clampedLeftX);
    const surfaceYRight = computeSurfaceY(clampedRightX);

    // Use the highest point (smallest Y value) so the player never clips through the platform
    const surfaceY = Math.min(surfaceYLeft, surfaceYRight);

    // More lenient landing detection for smoother movement
    const tolerance = thickness / 2 + 3;
    const canLand =
      playerBottom <= surfaceY + tolerance && nextPlayerBottom >= surfaceY - tolerance;

    return {
      canLand,
      landingY: surfaceY,
      averageSurfaceY: surfaceY,
    };
  }

  // Get the surface Y position for a player standing on the platform
  getPlayerSurfaceY(playerLeft: number, playerRight: number): number | null {
    const { startPoint, endPoint, thickness } = this;

    // Calculate the top surface position
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return startPoint.y;

    // Calculate a surface slightly below the top edge for more natural positioning
    const perpX = ((-dy / length) * thickness) / 2;
    const perpY = ((dx / length) * thickness) / 2;

    // Position the walkable surface exactly at the top edge of the platform
    const surfaceOffsetX = perpX;
    const surfaceOffsetY = perpY;

    const topStartX = startPoint.x + surfaceOffsetX;
    const topStartY = startPoint.y + surfaceOffsetY;
    const topEndX = endPoint.x + surfaceOffsetX;
    const topEndY = endPoint.y + surfaceOffsetY;

    // Check if player overlaps with the surface X range
    const topMinX = Math.min(topStartX, topEndX);
    const topMaxX = Math.max(topStartX, topEndX);

    // Allow slight overlap for smoother movement
    const overlapTolerance = 8;
    if (playerRight < topMinX - overlapTolerance || playerLeft > topMaxX + overlapTolerance) {
      return null;
    }

    // Compute surface Y for both left and right edges and take the higher (smaller Y) point
    const computeSurfaceY2 = (x: number): number => {
      if (Math.abs(topEndX - topStartX) < 0.001) {
        return (topStartY + topEndY) / 2;
      }
      const t = (x - topStartX) / (topEndX - topStartX);
      return topStartY + t * (topEndY - topStartY);
    };

    const clampedLeftX2 = Math.max(topMinX, Math.min(topMaxX, playerLeft));
    const clampedRightX2 = Math.max(topMinX, Math.min(topMaxX, playerRight));

    const surfaceYLeft2 = computeSurfaceY2(clampedLeftX2);
    const surfaceYRight2 = computeSurfaceY2(clampedRightX2);

    const surfaceY = Math.min(surfaceYLeft2, surfaceYRight2);

    return surfaceY;
  }

  // Check if player is currently on the platform surface
  isPlayerOnSurface(playerLeft: number, playerRight: number, playerBottom: number): boolean {
    const surfaceY = this.getPlayerSurfaceY(playerLeft, playerRight);
    if (surfaceY === null) return false;

    const tolerance = this.thickness / 2 + 8; // Larger tolerance to prevent bouncing
    return Math.abs(playerBottom - surfaceY) <= tolerance;
  }

  // Get the surface normal at a given point (for collision response)
  getSurfaceNormal(): Vector2 {
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Normal is perpendicular to the surface, pointing upward
    return new Vector2(-dy / length, dx / length);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { startPoint, endPoint, thickness } = this;

    // Calculate the perpendicular vector for thickness
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    const perpX = ((-dy / length) * thickness) / 2;
    const perpY = ((dx / length) * thickness) / 2;

    // Calculate the four corners of the platform
    const corners = [
      { x: startPoint.x + perpX, y: startPoint.y + perpY },
      { x: startPoint.x - perpX, y: startPoint.y - perpY },
      { x: endPoint.x - perpX, y: endPoint.y - perpY },
      { x: endPoint.x + perpX, y: endPoint.y + perpY },
    ];

    // Main platform body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.forEach((corner) => {
      ctx.lineTo(corner.x, corner.y);
    });
    ctx.closePath();
    ctx.fill();

    // Add highlight on the top edge
    ctx.strokeStyle = this.highlightColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.stroke();

    // Add shadow on the bottom edge
    ctx.strokeStyle = this.shadowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.stroke();

    // Add texture lines for longer platforms
    if (length > 64) {
      ctx.strokeStyle = this.shadowColor;
      ctx.lineWidth = 1;

      const numLines = Math.floor(length / 32);
      for (let i = 1; i < numLines; i++) {
        const t = i / numLines;
        const lineX = startPoint.x + (endPoint.x - startPoint.x) * t;
        const lineY = startPoint.y + (endPoint.y - startPoint.y) * t;

        ctx.beginPath();
        ctx.moveTo(lineX + perpX, lineY + perpY);
        ctx.lineTo(lineX - perpX, lineY - perpY);
        ctx.stroke();
      }
    }
  }
}

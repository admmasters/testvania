import { Vector2 } from "@/engine/Vector2";
import type { EditorPlatform, ResizeHandle, ResizeState } from "./EditorTypes";

export class EditorUtils {
  private static HANDLE_SIZE = 8;

  // Snap to 16x16 grid
  snap16(n: number): number {
    return Math.round(n / 16) * 16;
  }

  snapVec2(v: Vector2): Vector2 {
    return new Vector2(this.snap16(v.x), this.snap16(v.y));
  }

  // Snap to center of 16x16 grid cells (8px offset)
  snapToCenter(v: Vector2): Vector2 {
    return new Vector2(Math.floor(v.x / 16) * 16 + 8, Math.floor(v.y / 16) * 16 + 8);
  }

  // Returns an array of handle positions for a given rect
  getResizeHandles(rect: { x: number; y: number; w: number; h: number }): ResizeHandle[] {
    const hs = EditorUtils.HANDLE_SIZE / 2;
    return [
      { name: "nw", x: rect.x - hs, y: rect.y - hs },
      { name: "n", x: rect.x + rect.w / 2 - hs, y: rect.y - hs },
      { name: "ne", x: rect.x + rect.w - hs, y: rect.y - hs },
      { name: "e", x: rect.x + rect.w - hs, y: rect.y + rect.h / 2 - hs },
      { name: "se", x: rect.x + rect.w - hs, y: rect.y + rect.h - hs },
      { name: "s", x: rect.x + rect.w / 2 - hs, y: rect.y + rect.h - hs },
      { name: "sw", x: rect.x - hs, y: rect.y + rect.h - hs },
      { name: "w", x: rect.x - hs, y: rect.y + rect.h / 2 - hs },
    ];
  }

  isPointInHandle(point: Vector2, handle: ResizeHandle): boolean {
    return (
      point.x >= handle.x &&
      point.x <= handle.x + EditorUtils.HANDLE_SIZE &&
      point.y >= handle.y &&
      point.y <= handle.y + EditorUtils.HANDLE_SIZE
    );
  }

  handleResize(resizing: ResizeState, selectedObject: EditorPlatform, mouse: Vector2): void {
    const dx = mouse.x - resizing.startMouse.x;
    const dy = mouse.y - resizing.startMouse.y;
    let { x, y, w, h } = resizing.startRect;

    switch (resizing.handle) {
      case "nw":
        x += dx;
        y += dy;
        w -= dx;
        h -= dy;
        break;
      case "n":
        y += dy;
        h -= dy;
        break;
      case "ne":
        w += dx;
        y += dy;
        h -= dy;
        break;
      case "e":
        w += dx;
        break;
      case "se":
        w += dx;
        h += dy;
        break;
      case "s":
        h += dy;
        break;
      case "sw":
        x += dx;
        w -= dx;
        h += dy;
        break;
      case "w":
        x += dx;
        w -= dx;
        break;
    }

    // Snap to grid and prevent negative size
    const minSize = 16;
    w = Math.max(minSize, Math.round(w / 16) * 16);
    h = Math.max(minSize, Math.round(h / 16) * 16);
    x = Math.round(x / 16) * 16;
    y = Math.round(y / 16) * 16;

    selectedObject.position.x = x;
    selectedObject.position.y = y;
    selectedObject.size.x = w;
    selectedObject.size.y = h;
  }

  clampScrollPosition(args: {
    scrollPosition: Vector2;
    canvas: HTMLCanvasElement;
    levelWidth?: number;
    levelHeight?: number;
  }): void {
    const { scrollPosition, canvas, levelWidth = 800, levelHeight = 600 } = args;
    // The visible area is the canvas size, so don't allow scrolling past the right/bottom edge
    const maxX = Math.max(0, levelWidth - canvas.width);
    const maxY = Math.max(0, levelHeight - canvas.height);
    scrollPosition.x = Math.max(0, Math.min(scrollPosition.x, maxX));
    scrollPosition.y = Math.max(0, Math.min(scrollPosition.y, maxY));
  }

  drawGrid(args: {
    ctx: CanvasRenderingContext2D;
    scrollPosition: Vector2;
    canvas: HTMLCanvasElement;
  }): void {
    const { ctx, scrollPosition, canvas } = args;

    // Calculate grid boundaries in world space (slightly extended to avoid gaps at edges)
    const startX = Math.floor(scrollPosition.x / 16) * 16;
    const startY = Math.floor(scrollPosition.y / 16) * 16;
    const endX = startX + canvas.width + 32;
    const endY = startY + canvas.height + 32;

    // Helper to draw a single line with the desired opacity and width
    const drawLine = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      alpha: number,
      width: number,
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    };

    // Draw vertical grid lines
    for (let x = startX; x < endX; x += 16) {
      const worldX = x;
      const is64 = worldX % 64 === 0;
      const is32 = worldX % 32 === 0;

      if (is64) {
        // Major line every 64px
        drawLine(x, startY, x, endY, 0.5, 1.5);
      } else if (is32) {
        // Medium line every 32px
        drawLine(x, startY, x, endY, 0.35, 1);
      } else {
        // Minor 16px grid line
        drawLine(x, startY, x, endY, 0.15, 0.5);
      }
    }

    // Draw horizontal grid lines
    for (let y = startY; y < endY; y += 16) {
      const worldY = y;
      const is64 = worldY % 64 === 0;
      const is32 = worldY % 32 === 0;

      if (is64) {
        drawLine(startX, y, endX, y, 0.5, 1.5);
      } else if (is32) {
        drawLine(startX, y, endX, y, 0.35, 1);
      } else {
        drawLine(startX, y, endX, y, 0.15, 0.5);
      }
    }

    // Reset default line width
    ctx.lineWidth = 1;
  }

  static getHandleSize(): number {
    return EditorUtils.HANDLE_SIZE;
  }
}

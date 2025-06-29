import { Vector2 } from "@/engine/Vector2";
import type { ResizeHandle, ResizeState } from "./EditorTypes";

export class EditorUtils {
  private static HANDLE_SIZE = 8;

  // Snap to 16x16 grid
  snap16(n: number): number {
    return Math.round(n / 16) * 16;
  }

  snapVec2(v: Vector2): Vector2 {
    return new Vector2(this.snap16(v.x), this.snap16(v.y));
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

  handleResize(resizing: ResizeState, selectedObject: any, mouse: Vector2): void {
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

  clampScrollPosition(
    scrollPosition: Vector2,
    canvas: HTMLCanvasElement,
    levelWidth: number = 800,
    levelHeight: number = 600,
  ): void {
    // The visible area is the canvas size, so don't allow scrolling past the right/bottom edge
    const maxX = Math.max(0, levelWidth - canvas.width);
    const maxY = Math.max(0, levelHeight - canvas.height);
    scrollPosition.x = Math.max(0, Math.min(scrollPosition.x, maxX));
    scrollPosition.y = Math.max(0, Math.min(scrollPosition.y, maxY));
  }

  drawGrid(
    ctx: CanvasRenderingContext2D,
    scrollPosition: Vector2,
    canvas: HTMLCanvasElement,
  ): void {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.5;

    // Calculate grid boundaries based on scroll position and canvas size
    // We need to calculate grid position in world space
    const startX = Math.floor(scrollPosition.x / 16) * 16;
    const startY = Math.floor(scrollPosition.y / 16) * 16;
    const endX = startX + canvas.width + 32;
    const endY = startY + canvas.height + 32;

    // Draw vertical lines
    for (let x = startX; x < endX; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y < endY; y += 16) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  static getHandleSize(): number {
    return EditorUtils.HANDLE_SIZE;
  }
}

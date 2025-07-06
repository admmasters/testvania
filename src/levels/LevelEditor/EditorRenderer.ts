import type { Vector2 } from "@/engine/Vector2";
import { Platform } from "@/objects/platform";
import { EditorMode } from "./EditorModes";
import type {
  EditorDiagonalPlatform,
  EditorObject,
  EditorPlatform,
  ResizeState,
} from "./EditorTypes";
import { EditorUtils } from "./EditorUtils";

export class EditorRenderer {
  private canvas: HTMLCanvasElement;
  private utils: EditorUtils;

  constructor(canvas: HTMLCanvasElement, utils: EditorUtils) {
    this.canvas = canvas;
    this.utils = utils;
  }

  render(
    ctx: CanvasRenderingContext2D,
    mode: EditorMode,
    currentPlatform: EditorPlatform | null,
    currentDiagonalPlatform: EditorDiagonalPlatform | null,
    selectedObject: EditorObject,
    scrollPosition: Vector2,
    areaSelectionStart: Vector2 | null,
    areaSelectionEnd: Vector2 | null,
    selectedObjects?: EditorObject[],
    mousePosition?: Vector2,
    resizing?: ResizeState,
  ): void {
    ctx.save();

    // Draw current platform being created
    if (mode === EditorMode.PLATFORM && currentPlatform) {
      this.drawCurrentPlatform(ctx, currentPlatform, "#FFFFFF");
    }

    // Draw current solid block being created
    if (mode === EditorMode.SOLID_BLOCK && currentPlatform) {
      this.drawCurrentPlatform(ctx, currentPlatform, "#87CEEB"); // Light blue to distinguish from platforms
    }

    // Draw current diagonal platform being created
    if (mode === EditorMode.DIAGONAL_PLATFORM && currentDiagonalPlatform) {
      this.drawCurrentDiagonalPlatform(ctx, currentDiagonalPlatform, "#FFD700"); // Gold to distinguish
    }

    // Highlight selected object
    if (mode === EditorMode.SELECT && selectedObject) {
      this.drawSelectedObject(ctx, selectedObject);
    }

    // Draw area selection rectangle
    if (mode === EditorMode.AREA_SELECT && areaSelectionStart && areaSelectionEnd) {
      this.drawAreaSelection(ctx, areaSelectionStart, areaSelectionEnd);
    }

    // Highlight selected objects in area selection
    if (selectedObjects && selectedObjects.length > 0) {
      this.drawSelectedObjects(ctx, selectedObjects);
    }

    // Draw grid for alignment
    this.utils.drawGrid({ ctx, scrollPosition, canvas: this.canvas });

    // Draw position/size feedback
    if (mousePosition) {
      this.drawModeFeedback(ctx, mode, mousePosition, scrollPosition, resizing);
    }

    ctx.restore();
  }

  private drawCurrentPlatform(
    ctx: CanvasRenderingContext2D,
    platform: EditorPlatform,
    strokeColor: string,
  ): void {
    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.position.x, platform.position.y, platform.size.x, platform.size.y);

    ctx.strokeStyle = strokeColor;
    ctx.strokeRect(platform.position.x, platform.position.y, platform.size.x, platform.size.y);
  }

  private drawCurrentDiagonalPlatform(
    ctx: CanvasRenderingContext2D,
    diagonalPlatform: EditorDiagonalPlatform,
    strokeColor: string,
  ): void {
    const { startPoint, endPoint, thickness } = diagonalPlatform;

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
    ctx.fillStyle = diagonalPlatform.color;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.forEach((corner) => {
      ctx.lineTo(corner.x, corner.y);
    });
    ctx.closePath();
    ctx.fill();

    // Stroke outline
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  private drawSelectedObject(ctx: CanvasRenderingContext2D, selectedObject: EditorObject): void {
    const obj = selectedObject as { position: Vector2; size: Vector2 };
    if (obj.position && obj.size) {
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(obj.position.x - 2, obj.position.y - 2, obj.size.x + 4, obj.size.y + 4);
      ctx.lineWidth = 1;

      // Draw resize handles if it's a platform
      if (selectedObject instanceof Platform) {
        this.drawResizeHandles(ctx, obj);
      }
    }
  }

  private drawResizeHandles(
    ctx: CanvasRenderingContext2D,
    obj: { position: Vector2; size: Vector2 },
  ): void {
    const rect = {
      x: obj.position.x,
      y: obj.position.y,
      w: obj.size.x,
      h: obj.size.y,
    };
    const handles = this.utils.getResizeHandles(rect);
    const handleSize = EditorUtils.getHandleSize();

    ctx.save();
    for (const handle of handles) {
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeStyle = "#222";
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    }
    ctx.restore();
  }

  private drawAreaSelection(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2): void {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    ctx.save();
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    // Semi-transparent fill
    ctx.fillStyle = "rgba(212, 175, 55, 0.1)";
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    ctx.restore();
  }

  private drawSelectedObjects(ctx: CanvasRenderingContext2D, objects: EditorObject[]): void {
    ctx.save();
    ctx.strokeStyle = "#FF00FF";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);

    for (const obj of objects) {
      const typedObj = obj as { position: Vector2; size: Vector2 };
      if (typedObj.position && typedObj.size) {
        ctx.strokeRect(
          typedObj.position.x - 1,
          typedObj.position.y - 1,
          typedObj.size.x + 2,
          typedObj.size.y + 2,
        );
      }
    }
    ctx.restore();
  }

  private drawModeFeedback(
    ctx: CanvasRenderingContext2D,
    mode: EditorMode,
    mousePosition: Vector2,
    _scrollPosition: Vector2,
    _resizing?: ResizeState,
  ): void {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";

    switch (mode) {
      case EditorMode.PLATFORM: {
        // Show grid snap preview for platform placement
        const snappedPos = this.utils.snapVec2(mousePosition);
        ctx.strokeRect(snappedPos.x, snappedPos.y, 64, 32);
        break;
      }
      case EditorMode.SOLID_BLOCK: {
        // Show grid snap preview for solid block placement
        const snappedBlockPos = this.utils.snapVec2(mousePosition);
        ctx.strokeRect(snappedBlockPos.x, snappedBlockPos.y, 32, 32);
        break;
      }
      case EditorMode.DIAGONAL_PLATFORM: {
        // Show crosshair for diagonal platform placement
        const snappedPos = this.utils.snapVec2(mousePosition);
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        // Draw crosshair
        ctx.beginPath();
        ctx.moveTo(snappedPos.x - 8, snappedPos.y);
        ctx.lineTo(snappedPos.x + 8, snappedPos.y);
        ctx.moveTo(snappedPos.x, snappedPos.y - 8);
        ctx.lineTo(snappedPos.x, snappedPos.y + 8);
        ctx.stroke();
        ctx.lineWidth = 1;
        break;
      }
      case EditorMode.CANDLE: {
        // Show placement preview for candle
        const candlePos = this.utils.snapVec2(mousePosition);
        ctx.strokeRect(candlePos.x, candlePos.y, 16, 32);
        break;
      }
      case EditorMode.GHOST: {
        // Show placement preview for ghost enemy
        const enemyPos = this.utils.snapVec2(mousePosition);
        ctx.strokeRect(enemyPos.x, enemyPos.y, 32, 32);
        break;
      }
      case EditorMode.LANDGHOST: {
        // Show placement preview for landghost enemy
        const enemyPos = this.utils.snapVec2(mousePosition);
        ctx.strokeRect(enemyPos.x, enemyPos.y, 32, 32);
        break;
      }
      case EditorMode.PLAYER: {
        // Show placement preview for player
        const playerPos = this.utils.snapVec2(mousePosition);
        ctx.strokeRect(playerPos.x, playerPos.y, 32, 48);
        break;
      }
    }

    ctx.restore();
  }
}

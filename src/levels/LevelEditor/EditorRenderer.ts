import type { Vector2 } from "@/engine/Vector2";
import { Platform } from "@/objects/platform";
import { EditorMode } from "./EditorModes";
import type { EditorObject, EditorPlatform } from "./EditorTypes";
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
    selectedObject: EditorObject,
    scrollPosition: Vector2,
    areaSelectionStart?: Vector2 | null,
    areaSelectionEnd?: Vector2 | null,
    selectedObjects?: EditorObject[],
    mousePosition?: Vector2,
    resizing?: any,
  ): void {
    ctx.save();

    // Draw current platform being created
    if (mode === EditorMode.PLATFORM && currentPlatform) {
      this.drawCurrentPlatform(ctx, currentPlatform, "#FFFFFF");
    }

    // Draw current solid block being created
    if (mode === EditorMode.SOLID_BLOCK && currentPlatform) {
      this.drawCurrentPlatform(ctx, currentPlatform, "#00FFFF"); // Cyan to distinguish from platforms
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
      this.drawFeedback(
        ctx,
        mode,
        currentPlatform,
        selectedObject,
        mousePosition,
        scrollPosition,
        resizing,
      );
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
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    // Semi-transparent fill
    ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
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

  private drawFeedback(
    ctx: CanvasRenderingContext2D,
    mode: EditorMode,
    currentPlatform: EditorPlatform | null,
    selectedObject: EditorObject,
    mousePosition: Vector2,
    scrollPosition: Vector2,
    resizing?: any,
  ): void {
    ctx.save();

    // Convert world coordinates to screen coordinates for text positioning
    const screenX = mousePosition.x - scrollPosition.x;
    const screenY = mousePosition.y - scrollPosition.y;

    // Set up text styling
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.font = "12px monospace";

    let feedbackText = "";

    // Show position feedback when placing items
    if (
      mode === EditorMode.CANDLE ||
      mode === EditorMode.GHOST ||
      mode === EditorMode.LANDGHOST ||
      mode === EditorMode.PLAYER
    ) {
      feedbackText = `Position: (${Math.round(mousePosition.x)}, ${Math.round(mousePosition.y)})`;
    }

    // Show size feedback when scaling platforms/solid blocks
    if ((mode === EditorMode.PLATFORM || mode === EditorMode.SOLID_BLOCK) && currentPlatform) {
      const width = Math.round(currentPlatform.size.x);
      const height = Math.round(currentPlatform.size.y);
      const x = Math.round(currentPlatform.position.x);
      const y = Math.round(currentPlatform.position.y);
      feedbackText = `Size: ${width}×${height} | Position: (${x}, ${y})`;
    }

    // Show size feedback when resizing selected objects
    if (resizing && selectedObject && "position" in selectedObject && "size" in selectedObject) {
      const obj = selectedObject as { position: Vector2; size: Vector2 };
      const width = Math.round(obj.size.x);
      const height = Math.round(obj.size.y);
      const x = Math.round(obj.position.x);
      const y = Math.round(obj.position.y);
      feedbackText = `Size: ${width}×${height} | Position: (${x}, ${y})`;
    }

    if (feedbackText) {
      // Position text near cursor but avoid going off screen
      let textX = screenX + 15;
      let textY = screenY - 10;

      // Measure text to avoid going off screen
      const textMetrics = ctx.measureText(feedbackText);
      const textWidth = textMetrics.width;
      const textHeight = 16; // Approximate height for 12px font

      if (textX + textWidth > this.canvas.width) {
        textX = screenX - textWidth - 15;
      }
      if (textY < textHeight) {
        textY = screenY + textHeight + 10;
      }

      // Draw text background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(textX - 4, textY - textHeight + 2, textWidth + 8, textHeight + 4);

      // Draw text with outline for better visibility
      ctx.strokeText(feedbackText, textX, textY);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(feedbackText, textX, textY);
    }

    ctx.restore();
  }
}

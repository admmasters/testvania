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

    // Draw grid for alignment
    this.utils.drawGrid({ ctx, scrollPosition, canvas: this.canvas });

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
}

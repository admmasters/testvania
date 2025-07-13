import { Vector2 } from "@/engine/Vector2";
import { EditorMode } from "./EditorModes";
import type { EditorObjectManager } from "./EditorObjectManager";
import type {
  EditorDiagonalPlatform,
  EditorObject,
  EditorPlatform,
  ResizeState,
} from "./EditorTypes";
import type { EditorUtils } from "./EditorUtils";

interface HandleMouseDownArgs {
  e: MouseEvent;
  mode: EditorMode;
  selectedObject: EditorObject;
  scrollPosition: Vector2;
  onStartPosition: (pos: Vector2 | null) => void;
  onCurrentPlatform: (platform: EditorPlatform | null) => void;
  onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => void;
  onResizing: (resizing: ResizeState | null) => void;
  onScrolling: () => void;
  onSelectedObject: (obj: EditorObject) => void;
  onPushUndoState: () => void;
  onAreaSelectionStart?: (worldPos: Vector2) => void;
}

interface HandleMouseMoveArgs {
  e: MouseEvent;
  mode: EditorMode;
  selectedObject: EditorObject;
  currentPlatform: EditorPlatform | null;
  currentDiagonalPlatform: EditorDiagonalPlatform | null;
  resizing: ResizeState | null;
  startPosition: Vector2 | null;
  scrollPosition: Vector2;
  onScrollPosition: () => void;
  onScrolling: () => void;
  onCurrentPlatform: (platform: EditorPlatform | null) => void;
  onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => void;
  onUpdateScrollIndicator: () => void;
  onAreaSelectionUpdate?: (worldPos: Vector2) => void;
}

interface HandleMouseUpArgs {
  e: MouseEvent;
  mode: EditorMode;
  selectedObject: EditorObject;
  currentPlatform: EditorPlatform | null;
  currentDiagonalPlatform: EditorDiagonalPlatform | null;
  resizing: ResizeState | null;
  startPosition: Vector2 | null;
  scrollPosition: Vector2;
  onScrolling: () => void;
  onResizing: (resizing: ResizeState | null) => void;
  onStartPosition: (pos: Vector2 | null) => void;
  onCurrentPlatform: (platform: EditorPlatform | null) => void;
  onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => void;
  onPushUndoState: () => void;
  onAreaSelectionFinish?: () => void;
}

export class EditorMouseHandler {
  private canvas: HTMLCanvasElement;
  private objectManager: EditorObjectManager;
  private utils: EditorUtils;
  private currentCrystalType: string = "azure";

  private isScrolling: boolean = false;
  private scrollStart: Vector2 | null = null;
  private dragButton: number = 1; // Middle mouse button

  constructor(args: {
    canvas: HTMLCanvasElement;
    objectManager: EditorObjectManager;
    utils: EditorUtils;
  }) {
    this.canvas = args.canvas;
    this.objectManager = args.objectManager;
    this.utils = args.utils;
  }

  setCrystalType(type: string): void {
    this.currentCrystalType = type;
  }

  handleMouseDown = (args: HandleMouseDownArgs) => {
    const {
      e,
      mode,
      selectedObject,
      scrollPosition,
      onStartPosition,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onResizing,
      onScrolling,
      onSelectedObject,
      onPushUndoState,
      onAreaSelectionStart,
    } = args;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    // Handle middle mouse button for scrolling
    if (e.button === this.dragButton) {
      e.preventDefault();
      this.isScrolling = true;
      this.scrollStart = pos.copy();
      onScrolling();
      return;
    }

    // Convert screen position to world position (accounting for scroll)
    const worldPos = new Vector2(pos.x + scrollPosition.x, pos.y + scrollPosition.y);

    // Handle resize logic
    if (this.handleResizeStart({ mode, selectedObject, worldPos, onResizing, onPushUndoState })) {
      return;
    }

    // Handle mode-specific actions
    this.handleModeActions({
      mode,
      worldPos,
      onStartPosition,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onSelectedObject,
      onPushUndoState,
      onAreaSelectionStart,
    });
  };

  handleMouseMove = (args: HandleMouseMoveArgs) => {
    const {
      e,
      mode,
      selectedObject,
      currentPlatform,
      currentDiagonalPlatform,
      resizing,
      startPosition,
      scrollPosition,
      onScrollPosition,
      onScrolling,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onUpdateScrollIndicator,
      onAreaSelectionUpdate,
    } = args;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    // Handle scrolling with middle mouse button
    if (this.isScrolling && this.scrollStart) {
      const deltaX = this.scrollStart.x - pos.x;
      const deltaY = this.scrollStart.y - pos.y;

      scrollPosition.x += deltaX;
      scrollPosition.y += deltaY;

      this.utils.clampScrollPosition({ scrollPosition, canvas: this.canvas });
      onScrollPosition();

      this.scrollStart = pos.copy();
      onScrolling();
      onUpdateScrollIndicator();
      return;
    }

    // Handle resize logic
    if (this.handleResizeMove({ resizing, selectedObject, pos, scrollPosition })) {
      return;
    }

    if (!startPosition) return;

    // Convert screen position to world position
    const worldPos = new Vector2(pos.x + scrollPosition.x, pos.y + scrollPosition.y);

    this.handleModeMovement({
      mode,
      worldPos,
      selectedObject,
      currentPlatform,
      currentDiagonalPlatform,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onAreaSelectionUpdate,
    });
  };

  handleMouseUp = (args: HandleMouseUpArgs) => {
    const {
      e,
      mode,
      selectedObject,
      currentPlatform,
      currentDiagonalPlatform,
      resizing,
      startPosition,
      scrollPosition,
      onScrolling,
      onResizing,
      onStartPosition,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onPushUndoState,
      onAreaSelectionFinish,
    } = args;
    // Stop scrolling if middle mouse button was released
    if (e.button === this.dragButton) {
      this.isScrolling = false;
      this.scrollStart = null;
      onScrolling();
      return;
    }

    // End resize if resizing
    if (resizing) {
      onResizing(null);
      return;
    }

    if (!startPosition) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    // Convert to world position
    const worldPos = new Vector2(pos.x + scrollPosition.x, pos.y + scrollPosition.y);

    this.handleModeCompletion({
      mode,
      worldPos,
      selectedObject,
      currentPlatform,
      currentDiagonalPlatform,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onPushUndoState,
      onAreaSelectionFinish,
    });

    onStartPosition(null);
  };

  private handleResizeStart(args: {
    mode: EditorMode;
    selectedObject: EditorObject;
    worldPos: Vector2;
    onResizing: (resizing: ResizeState | null) => void;
    onPushUndoState: () => void;
  }): boolean {
    const { mode, selectedObject, worldPos, onResizing, onPushUndoState } = args;
    if (
      mode === EditorMode.SELECT &&
      selectedObject &&
      (this.objectManager.isPlatform(selectedObject) ||
        this.objectManager.isSolidBlock(selectedObject))
    ) {
      const obj = selectedObject as EditorPlatform;
      const rect = {
        x: obj.position.x,
        y: obj.position.y,
        w: obj.size.x,
        h: obj.size.y,
      };
      const handles = this.utils.getResizeHandles(rect);

      for (const handle of handles) {
        if (this.utils.isPointInHandle(worldPos, handle)) {
          onResizing({
            handle: handle.name,
            startMouse: worldPos.copy(),
            startRect: { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
          });
          onPushUndoState();
          return true;
        }
      }
    }
    return false;
  }

  private handleResizeMove(args: {
    resizing: ResizeState | null;
    selectedObject: EditorObject;
    pos: Vector2;
    scrollPosition: Vector2;
  }): boolean {
    const { resizing, selectedObject, pos, scrollPosition } = args;
    if (
      resizing &&
      selectedObject &&
      (this.objectManager.isPlatform(selectedObject) ||
        this.objectManager.isSolidBlock(selectedObject))
    ) {
      const mouse = new Vector2(pos.x + scrollPosition.x, pos.y + scrollPosition.y);
      this.utils.handleResize(resizing, selectedObject as EditorPlatform, mouse);
      return true;
    }
    return false;
  }

  private handleModeActions(args: {
    mode: EditorMode;
    worldPos: Vector2;
    onStartPosition: (pos: Vector2 | null) => void;
    onCurrentPlatform: (platform: EditorPlatform | null) => void;
    onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => void;
    onSelectedObject: (obj: EditorObject) => void;
    onPushUndoState: () => void;
    onAreaSelectionStart?: (worldPos: Vector2) => void;
  }): void {
    const {
      mode,
      worldPos,
      onStartPosition,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onSelectedObject,
      onPushUndoState,
      onAreaSelectionStart,
    } = args;
    switch (mode) {
      case EditorMode.SELECT: {
        const selected = this.objectManager.selectObjectAt(worldPos);
        onSelectedObject(selected);
        if (selected && this.objectManager.isPlatform(selected)) {
          const platform = selected as EditorPlatform;
          onCurrentPlatform({
            position: platform.position.copy(),
            size: platform.size.copy(),
            color: platform.color,
          });
          onStartPosition(platform.position.copy());
        } else {
          onStartPosition(null);
        }
        break;
      }
      case EditorMode.PLATFORM:
        onPushUndoState();
        onCurrentPlatform(this.objectManager.startPlatformCreation(worldPos, "#654321"));
        onStartPosition(worldPos);
        break;
      case EditorMode.SOLID_BLOCK:
        onPushUndoState();
        onCurrentPlatform(this.objectManager.startSolidBlockCreation(worldPos));
        onStartPosition(worldPos);
        break;
      case EditorMode.DIAGONAL_PLATFORM:
        onPushUndoState();
        onCurrentDiagonalPlatform(
          this.objectManager.startDiagonalPlatformCreation(worldPos, "#654321"),
        );
        onStartPosition(worldPos);
        break;
      case EditorMode.MEMORY_CRYSTAL:
        onPushUndoState();
        this.objectManager.placeMemoryCrystal(worldPos, this.currentCrystalType);
        break;
      case EditorMode.GHOST:
        onPushUndoState();
        this.objectManager.placeGhost(worldPos);
        break;
      case EditorMode.LANDGHOST:
        onPushUndoState();
        this.objectManager.placeLandGhost(worldPos);
        break;
      case EditorMode.PLAYER:
        onPushUndoState();
        this.objectManager.placePlayer(worldPos);
        break;
      case EditorMode.DELETE:
        onPushUndoState();
        this.objectManager.deleteObjectAt(worldPos);
        break;
      case EditorMode.AREA_SELECT:
        if (onAreaSelectionStart) {
          onAreaSelectionStart(worldPos);
        }
        onStartPosition(worldPos);
        break;
    }
  }

  private handleModeMovement(args: {
    mode: EditorMode;
    worldPos: Vector2;
    selectedObject: EditorObject;
    currentPlatform: EditorPlatform | null;
    currentDiagonalPlatform: EditorDiagonalPlatform | null;
    onCurrentPlatform: (platform: EditorPlatform | null) => void;
    onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => void;
    onAreaSelectionUpdate?: (worldPos: Vector2) => void;
  }): void {
    const {
      mode,
      worldPos,
      selectedObject,
      currentPlatform,
      currentDiagonalPlatform,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onAreaSelectionUpdate,
    } = args;
    switch (mode) {
      case EditorMode.PLATFORM:
      case EditorMode.SOLID_BLOCK:
        if (currentPlatform) {
          this.objectManager.updatePlatformSize(currentPlatform, worldPos);
          onCurrentPlatform(currentPlatform);
        }
        break;
      case EditorMode.DIAGONAL_PLATFORM:
        if (currentDiagonalPlatform) {
          this.objectManager.updateDiagonalPlatformSize(currentDiagonalPlatform, worldPos);
          onCurrentDiagonalPlatform(currentDiagonalPlatform);
        }
        break;
      case EditorMode.SELECT:
        if (selectedObject && this.objectManager.isPlatform(selectedObject) && currentPlatform) {
          this.objectManager.updatePlatformSize(currentPlatform, worldPos);
          onCurrentPlatform(currentPlatform);
        }
        break;
      case EditorMode.AREA_SELECT:
        if (onAreaSelectionUpdate) {
          onAreaSelectionUpdate(worldPos);
        }
        break;
    }
  }

  private handleModeCompletion(args: {
    mode: EditorMode;
    worldPos: Vector2;
    selectedObject: EditorObject;
    currentPlatform: EditorPlatform | null;
    currentDiagonalPlatform: EditorDiagonalPlatform | null;
    onCurrentPlatform: (platform: EditorPlatform | null) => void;
    onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => void;
    onPushUndoState: () => void;
    onAreaSelectionFinish?: () => void;
  }): void {
    const {
      mode,
      worldPos,
      selectedObject,
      currentPlatform,
      currentDiagonalPlatform,
      onCurrentPlatform,
      onCurrentDiagonalPlatform,
      onPushUndoState,
      onAreaSelectionFinish,
    } = args;
    switch (mode) {
      case EditorMode.PLATFORM:
        this.objectManager.finishPlatform(currentPlatform, worldPos);
        onCurrentPlatform(null);
        break;
      case EditorMode.SOLID_BLOCK:
        this.objectManager.finishSolidBlock(currentPlatform, worldPos);
        onCurrentPlatform(null);
        break;
      case EditorMode.DIAGONAL_PLATFORM:
        this.objectManager.finishDiagonalPlatform(currentDiagonalPlatform, worldPos);
        onCurrentDiagonalPlatform(null);
        break;
      case EditorMode.SELECT:
        if (
          selectedObject &&
          (this.objectManager.isPlatform(selectedObject) ||
            this.objectManager.isSolidBlock(selectedObject)) &&
          currentPlatform
        ) {
          onPushUndoState();
          const obj = selectedObject as EditorPlatform;
          obj.position.x = currentPlatform.position.x;
          obj.position.y = currentPlatform.position.y;
          obj.size.x = currentPlatform.size.x;
          obj.size.y = currentPlatform.size.y;
          onCurrentPlatform(null);
        }
        break;
      case EditorMode.AREA_SELECT:
        if (onAreaSelectionFinish) {
          onAreaSelectionFinish();
        }
        break;
    }
  }
}

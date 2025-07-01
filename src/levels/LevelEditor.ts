import type { GameState } from "@/engine/GameState";
import { Vector2 } from "@/engine/Vector2";
import { EditorLevelSaver } from "./LevelEditor/EditorLevelSaver";
import { EditorMode } from "./LevelEditor/EditorModes";
import { EditorMouseHandler } from "./LevelEditor/EditorMouseHandler";
import { EditorObjectManager } from "./LevelEditor/EditorObjectManager";
import { EditorRenderer } from "./LevelEditor/EditorRenderer";
import { EditorStateManager } from "./LevelEditor/EditorStateManager";
import type { EditorObject, EditorPlatform, ResizeState } from "./LevelEditor/EditorTypes";
import { EditorUI } from "./LevelEditor/EditorUI";
import { EditorUtils } from "./LevelEditor/EditorUtils";

interface HasLevelData {
  levelData?: { width?: number; height?: number };
}

export class LevelEditor {
  private gameState: GameState;
  private canvas: HTMLCanvasElement;
  private isActive: boolean = false;

  // Core state
  private mode: EditorMode = EditorMode.SELECT;
  private startPosition: Vector2 | null = null;
  private currentPlatform: EditorPlatform | null = null;
  private selectedObject: EditorObject = null;
  private resizing: ResizeState | null = null;
  private platformColor: string = "#654321";
  private scrollPosition: Vector2 = new Vector2(0, 0);
  private levelWidth: number = 800;
  private levelHeight: number = 600;

  // Module instances
  private ui: EditorUI;
  private mouseHandler: EditorMouseHandler;
  private objectManager: EditorObjectManager;
  private utils: EditorUtils;
  private stateManager: EditorStateManager;
  private renderer: EditorRenderer;
  private levelSaver: EditorLevelSaver;

  constructor(gameState: GameState, canvas: HTMLCanvasElement) {
    this.gameState = gameState;
    this.canvas = canvas;

    // Initialize modules
    this.utils = new EditorUtils();
    this.objectManager = new EditorObjectManager(gameState, this.utils);
    this.stateManager = new EditorStateManager(gameState);
    this.renderer = new EditorRenderer(canvas, this.utils);
    this.levelSaver = new EditorLevelSaver(gameState, this.utils);
    this.mouseHandler = new EditorMouseHandler({
      canvas,
      objectManager: this.objectManager,
      utils: this.utils,
    });

    // Initialize UI with callbacks
    this.ui = new EditorUI({
      onModeChange: (mode) => {
        this.mode = mode;
      },
      onUndo: () => this.undo(),
      onRedo: () => this.redo(),
      onSave: () => this.levelSaver.saveCurrentLevel(this.levelWidth, this.levelHeight),
      onClose: () => this.deactivate(),
      onColorChange: (color) => {
        this.platformColor = color;
      },
      onLevelSizeChange: (width, height) => {
        this.levelWidth = width;
        this.levelHeight = height;
      },
      onDirectionChange: (direction) => {
        this.changeSelectedEnemyDirection(direction);
      },
    });
  }

  activate(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Initialize level size from current level if available
    if ("levelData" in this.gameState) {
      const levelData = (this.gameState as HasLevelData).levelData;
      if (levelData) {
        this.levelWidth = levelData.width ?? 800;
        this.levelHeight = levelData.height ?? 600;
      }
    }

    // Synchronize editor scroll position with game camera
    this.scrollPosition.x = this.gameState.camera.position.x;
    this.scrollPosition.y = this.gameState.camera.position.y;

    // Create UI
    this.ui.createEditorUI(
      this.mode,
      this.platformColor,
      this.levelWidth,
      this.levelHeight,
      this.handleUndoRedoKeys,
    );

    // Show direction controls if an enemy is selected
    this.updateDirectionControls();

    // Add event listeners
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("wheel", this.handleWheel);
    window.addEventListener("keydown", this.handleKeyDown);

    // Initialize scroll indicator
    this.ui.createScrollIndicator();
    this.updateScrollIndicator();
  }

  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;

    // Synchronize game camera with editor scroll position
    this.gameState.camera.position.x = this.scrollPosition.x;
    this.gameState.camera.position.y = this.scrollPosition.y;

    // Remove event listeners
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keydown", this.handleUndoRedoKeys);

    // Cleanup UI
    this.ui.cleanup();
  }

  isEditorActive(): boolean {
    return this.isActive;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;
    this.renderer.render(
      ctx,
      this.mode,
      this.currentPlatform,
      this.selectedObject,
      this.scrollPosition,
    );
  }

  private undo(): void {
    this.scrollPosition = this.stateManager.undo(this.scrollPosition);
    this.syncCameraWithScroll();
    this.updateScrollIndicator();
  }

  private redo(): void {
    this.scrollPosition = this.stateManager.redo(this.scrollPosition);
    this.syncCameraWithScroll();
    this.updateScrollIndicator();
  }

  private pushUndoState(): void {
    this.stateManager.pushUndoState(this.scrollPosition);
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.mouseHandler.handleMouseDown({
      e,
      mode: this.mode,
      selectedObject: this.selectedObject,
      scrollPosition: this.scrollPosition,
      onStartPosition: (pos: Vector2 | null) => {
        this.startPosition = pos;
      },
      onCurrentPlatform: (platform: EditorPlatform | null) => {
        this.currentPlatform = platform;
      },
      onResizing: (resizing: ResizeState | null) => {
        this.resizing = resizing;
      },
      onScrolling: () => {
        /* handled internally */
      },
      onSelectedObject: (obj: EditorObject) => {
        this.selectedObject = obj;
        this.updateDirectionControls();
      },
      onPushUndoState: () => this.pushUndoState(),
    });
  };

  private handleMouseMove = (e: MouseEvent) => {
    this.mouseHandler.handleMouseMove({
      e,
      mode: this.mode,
      selectedObject: this.selectedObject,
      currentPlatform: this.currentPlatform,
      resizing: this.resizing,
      startPosition: this.startPosition,
      scrollPosition: this.scrollPosition,
      onScrollPosition: () => this.syncCameraWithScroll(),
      onScrolling: () => {
        /* handled internally */
      },
      onCurrentPlatform: (platform: EditorPlatform | null) => {
        this.currentPlatform = platform;
      },
      onUpdateScrollIndicator: () => this.updateScrollIndicator(),
    });
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.mouseHandler.handleMouseUp({
      e,
      mode: this.mode,
      selectedObject: this.selectedObject,
      currentPlatform: this.currentPlatform,
      resizing: this.resizing,
      startPosition: this.startPosition,
      scrollPosition: this.scrollPosition,
      onScrolling: () => {
        /* handled internally */
      },
      onResizing: (resizing: ResizeState | null) => {
        this.resizing = resizing;
      },
      onStartPosition: (pos: Vector2 | null) => {
        this.startPosition = pos;
      },
      onCurrentPlatform: (platform: EditorPlatform | null) => {
        this.currentPlatform = platform;
      },
      onPushUndoState: () => this.pushUndoState(),
    });
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY;
    const scrollSpeed = 32;
    if (e.shiftKey) {
      this.scrollPosition.x += (delta > 0 ? 1 : -1) * scrollSpeed;
    } else {
      this.scrollPosition.y += (delta > 0 ? 1 : -1) * scrollSpeed;
    }
    this.utils.clampScrollPosition({
      scrollPosition: this.scrollPosition,
      canvas: this.canvas,
      levelWidth: this.levelWidth,
      levelHeight: this.levelHeight,
    });
    this.syncCameraWithScroll();
    this.updateScrollIndicator();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const scrollAmount = e.shiftKey ? 64 : 16;
    switch (e.key) {
      case "ArrowUp":
        this.scrollPosition.y -= scrollAmount;
        e.preventDefault();
        break;
      case "ArrowDown":
        this.scrollPosition.y += scrollAmount;
        e.preventDefault();
        break;
      case "ArrowLeft":
        this.scrollPosition.x -= scrollAmount;
        e.preventDefault();
        break;
      case "ArrowRight":
        this.scrollPosition.x += scrollAmount;
        e.preventDefault();
        break;
      default:
        return;
    }
    this.utils.clampScrollPosition({
      scrollPosition: this.scrollPosition,
      canvas: this.canvas,
      levelWidth: this.levelWidth,
      levelHeight: this.levelHeight,
    });
    this.syncCameraWithScroll();
    this.updateScrollIndicator();
  };

  private handleUndoRedoKeys = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    if ((isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      this.undo();
    } else if (
      ((isMac && e.metaKey && e.shiftKey) ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === "y")) &&
      e.key.toLowerCase() === (isMac ? "z" : "y")
    ) {
      e.preventDefault();
      this.redo();
    }
  };

  private syncCameraWithScroll(): void {
    this.gameState.camera.position.x = this.scrollPosition.x;
    this.gameState.camera.position.y = this.scrollPosition.y;
  }

  private updateScrollIndicator(): void {
    this.ui.updateScrollIndicator(this.scrollPosition.x, this.scrollPosition.y);
  }

  private changeSelectedEnemyDirection(direction: number): void {
    if (
      this.selectedObject &&
      "type" in this.selectedObject &&
      (this.selectedObject.type === "ghost" || this.selectedObject.type === "landghost")
    ) {
      this.pushUndoState();
      (this.selectedObject as any).direction = direction;
      this.updateDirectionControls(); // Update UI to reflect the change
    }
  }

  private updateDirectionControls(): void {
    const container = this.ui.getEditorContainer();
    if (container) {
      this.ui.createDirectionControls(container, this.selectedObject);
    }
  }
}

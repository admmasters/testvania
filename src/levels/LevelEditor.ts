import type { GameState } from "@/engine/GameState";
import { Vector2 } from "@/engine/Vector2";
import type { DiagonalPlatform } from "@/objects/diagonalPlatform";
import type { Ghost } from "@/objects/enemies/Ghost";
import type { LandGhost } from "@/objects/enemies/LandGhost";
import type { MemoryCrystal } from "@/objects/memoryCrystal";
import type { Platform } from "@/objects/platform";
import type { SolidBlock } from "@/objects/solidBlock";
import { EditorLevelSaver } from "./LevelEditor/EditorLevelSaver";
import { EditorMode } from "./LevelEditor/EditorModes";
import { EditorMouseHandler } from "./LevelEditor/EditorMouseHandler";
import { EditorObjectManager } from "./LevelEditor/EditorObjectManager";
import { EditorRenderer } from "./LevelEditor/EditorRenderer";
import { EditorStateManager } from "./LevelEditor/EditorStateManager";
import type {
  EditorDiagonalPlatform,
  EditorObject,
  EditorPlatform,
  PositionedObject,
  ResizeState,
  SelectableEnemy,
} from "./LevelEditor/EditorTypes";
import { EditorUI } from "./LevelEditor/EditorUI";
import { EditorUtils } from "./LevelEditor/EditorUtils";

export class LevelEditor {
  private gameState: GameState;
  private canvas: HTMLCanvasElement;
  private isActive: boolean = false;

  // Core state
  private mode: EditorMode = EditorMode.SELECT;
  private startPosition: Vector2 | null = null;
  private currentPlatform: EditorPlatform | null = null;
  private currentDiagonalPlatform: EditorDiagonalPlatform | null = null;
  private selectedObject: EditorObject = null;
  private resizing: ResizeState | null = null;
  private platformColor: string = "#654321";
  private crystalType: string = "azure";
  private scrollPosition: Vector2 = new Vector2(0, 0);
  private levelWidth: number = 800;
  private levelHeight: number = 600;
  private mousePosition: Vector2 = new Vector2(0, 0); // Current mouse position in world coordinates

  // Area selection state
  private areaSelectionStart: Vector2 | null = null;
  private areaSelectionEnd: Vector2 | null = null;
  private selectedObjects: EditorObject[] = [];

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

    // Set initial crystal type
    this.mouseHandler.setCrystalType(this.crystalType);

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
      onCrystalTypeChange: (type) => {
        this.crystalType = type;
        this.mouseHandler.setCrystalType(type);
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
    const currentLevelData = this.gameState.levelManager.getLevelData(
      this.gameState.currentLevelId ?? "",
    );
    if (currentLevelData) {
      this.levelWidth = currentLevelData.width;
      this.levelHeight = currentLevelData.height;
    }

    // Synchronize editor scroll position with game camera
    this.scrollPosition.x = this.gameState.camera.position.x;
    this.scrollPosition.y = this.gameState.camera.position.y;

    // Create UI
    this.ui.createEditorUI(
      this.mode,
      this.platformColor,
      this.crystalType,
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
      this.currentDiagonalPlatform,
      this.selectedObject,
      this.scrollPosition,
      this.areaSelectionStart,
      this.areaSelectionEnd,
      this.selectedObjects,
      this.mousePosition,
      this.resizing ?? undefined,
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
      onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => {
        this.currentDiagonalPlatform = platform;
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
      onAreaSelectionStart: (worldPos: Vector2) => {
        this.startAreaSelection(worldPos);
      },
      onPushUndoState: () => this.pushUndoState(),
    });
  };

  private handleMouseMove = (e: MouseEvent) => {
    // Update mouse position for display feedback
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mousePosition.x = x + this.scrollPosition.x;
    this.mousePosition.y = y + this.scrollPosition.y;

    this.mouseHandler.handleMouseMove({
      e,
      mode: this.mode,
      selectedObject: this.selectedObject,
      currentPlatform: this.currentPlatform,
      currentDiagonalPlatform: this.currentDiagonalPlatform,
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
      onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => {
        this.currentDiagonalPlatform = platform;
      },
      onUpdateScrollIndicator: () => this.updateScrollIndicator(),
      onAreaSelectionUpdate: (worldPos: Vector2) => {
        this.updateAreaSelection(worldPos);
      },
    });
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.mouseHandler.handleMouseUp({
      e,
      mode: this.mode,
      selectedObject: this.selectedObject,
      currentPlatform: this.currentPlatform,
      currentDiagonalPlatform: this.currentDiagonalPlatform,
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
      onCurrentDiagonalPlatform: (platform: EditorDiagonalPlatform | null) => {
        this.currentDiagonalPlatform = platform;
      },
      onPushUndoState: () => this.pushUndoState(),
      onAreaSelectionFinish: () => {
        this.finishAreaSelection();
      },
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
      case "Delete":
      case "Backspace":
        if (this.selectedObjects.length > 0) {
          this.deleteSelectedObjects();
          e.preventDefault();
        }
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
      (this.selectedObject as SelectableEnemy).direction = direction;
      this.updateDirectionControls(); // Update UI to reflect the change
    }
  }

  private updateDirectionControls(): void {
    const container = this.ui.getEditorContainer();
    if (container) {
      // Only pass the selected object if it's an enemy with direction property
      const enemyObject =
        this.selectedObject &&
        "type" in this.selectedObject &&
        (this.selectedObject.type === "ghost" || this.selectedObject.type === "landghost")
          ? (this.selectedObject as { type: string; direction?: number })
          : null;
      this.ui.createDirectionControls(container, enemyObject);
    }
  }

  private startAreaSelection(worldPos: Vector2): void {
    this.areaSelectionStart = worldPos.copy();
    this.areaSelectionEnd = worldPos.copy();
    this.selectedObjects = [];
  }

  private updateAreaSelection(worldPos: Vector2): void {
    if (this.areaSelectionStart) {
      this.areaSelectionEnd = worldPos.copy();
      this.updateSelectedObjectsInArea();
    }
  }

  private finishAreaSelection(): void {
    // Keep the selected objects for potential deletion
    // Clear the selection rectangle
    this.areaSelectionStart = null;
    this.areaSelectionEnd = null;
  }

  private updateSelectedObjectsInArea(): void {
    if (!this.areaSelectionStart || !this.areaSelectionEnd) return;

    const minX = Math.min(this.areaSelectionStart.x, this.areaSelectionEnd.x);
    const maxX = Math.max(this.areaSelectionStart.x, this.areaSelectionEnd.x);
    const minY = Math.min(this.areaSelectionStart.y, this.areaSelectionEnd.y);
    const maxY = Math.max(this.areaSelectionStart.y, this.areaSelectionEnd.y);

    this.selectedObjects = [];

    // Check platforms
    for (const platform of this.gameState.platforms) {
      if (this.isObjectInArea(platform, minX, minY, maxX, maxY)) {
        this.selectedObjects.push(platform);
      }
    }

    // Check solid blocks
    for (const solidBlock of this.gameState.solidBlocks) {
      if (this.isObjectInArea(solidBlock, minX, minY, maxX, maxY)) {
        this.selectedObjects.push(solidBlock);
      }
    }

    // Check memory crystals
    for (const crystal of this.gameState.memoryCrystals) {
      if (this.isObjectInArea(crystal, minX, minY, maxX, maxY)) {
        this.selectedObjects.push(crystal);
      }
    }

    // Check diagonal platforms
    for (const diagonalPlatform of this.gameState.diagonalPlatforms) {
      if (this.isObjectInArea(diagonalPlatform, minX, minY, maxX, maxY)) {
        this.selectedObjects.push(diagonalPlatform);
      }
    }

    // Check enemies
    for (const enemy of this.gameState.enemies) {
      if (this.isObjectInArea(enemy, minX, minY, maxX, maxY)) {
        this.selectedObjects.push(enemy);
      }
    }

    // Update UI to show selection count
    this.ui.updateSelectionInfo(this.selectedObjects.length);
  }

  private isObjectInArea(
    obj: PositionedObject,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): boolean {
    if (!obj.position || !obj.size) return false;

    const objLeft = obj.position.x;
    const objRight = obj.position.x + obj.size.x;
    const objTop = obj.position.y;
    const objBottom = obj.position.y + obj.size.y;

    // Check if object overlaps with selection area
    return !(objRight < minX || objLeft > maxX || objBottom < minY || objTop > maxY);
  }

  private deleteSelectedObjects(): void {
    if (this.selectedObjects.length === 0) return;

    this.pushUndoState();

    // Remove selected objects from their respective arrays
    for (const obj of this.selectedObjects) {
      // Remove platforms
      const platformIndex = this.gameState.platforms.indexOf(obj as Platform);
      if (platformIndex !== -1) {
        this.gameState.platforms.splice(platformIndex, 1);
        continue;
      }

      // Remove solid blocks
      const solidBlockIndex = this.gameState.solidBlocks.indexOf(obj as SolidBlock);
      if (solidBlockIndex !== -1) {
        this.gameState.solidBlocks.splice(solidBlockIndex, 1);
        continue;
      }

      // Remove memory crystals
      const crystalIndex = this.gameState.memoryCrystals.indexOf(obj as MemoryCrystal);
      if (crystalIndex !== -1) {
        this.gameState.memoryCrystals.splice(crystalIndex, 1);
        continue;
      }

      // Remove diagonal platforms
      const diagonalPlatformIndex = this.gameState.diagonalPlatforms.indexOf(
        obj as DiagonalPlatform,
      );
      if (diagonalPlatformIndex !== -1) {
        this.gameState.diagonalPlatforms.splice(diagonalPlatformIndex, 1);
        continue;
      }

      // Remove enemies
      const enemyIndex = this.gameState.enemies.indexOf(obj as Ghost | LandGhost);
      if (enemyIndex !== -1) {
        this.gameState.enemies.splice(enemyIndex, 1);
      }
    }

    this.selectedObjects = [];
    this.ui.updateSelectionInfo(0);
  }
}

import type { GameState } from "@/engine/GameState";
import { Vector2 } from "@/engine/Vector2";
import { Candle } from "@/objects/candle";
import { Ghost } from "@/objects/Ghost";
import { LandGhost } from "@/objects/LandGhost";
import { Platform } from "@/objects/platform";
import { SolidBlock } from "@/objects/solidBlock";
import { EditorMode } from "./LevelEditor/EditorModes";
import { LevelManager } from "./LevelManager";

interface EditorPlatform {
  position: Vector2;
  size: Vector2;
  color: string;
}

interface EditorState {
  platforms: { position: Vector2; size: Vector2; color: string }[];
  solidBlocks: { position: Vector2; size: Vector2; color: string }[];
  candles: { position: Vector2 }[];
  enemies: { position: Vector2; type: string }[];
  player: { position: Vector2 };
  scrollPosition: Vector2;
}

export class LevelEditor {
  private gameState: GameState;
  private canvas: HTMLCanvasElement;
  private isActive: boolean = false;
  private mode: EditorMode = EditorMode.SELECT;
  private startPosition: Vector2 | null = null;
  private currentPlatform: EditorPlatform | null = null;
  private editorContainer: HTMLDivElement | null = null;
  private selectedObject:
    | Platform
    | SolidBlock
    | Candle
    | LandGhost
    | Ghost
    | object
    | null = null; // Using object type for player
  private resizing: {
    handle: string;
    startMouse: Vector2;
    startRect: { x: number; y: number; w: number; h: number };
  } | null = null;
  // Resize handle size in pixels
  private static HANDLE_SIZE = 8;

  // Returns an array of handle positions for a given rect
  private getResizeHandles(rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) {
    const hs = LevelEditor.HANDLE_SIZE / 2;
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
  private platformColor: string = "#654321";

  // Scrolling properties
  private isScrolling: boolean = false;
  private scrollStart: Vector2 | null = null;
  private scrollPosition: Vector2 = new Vector2(0, 0);
  private scrollIndicator: HTMLDivElement | null = null;
  private dragButton: number = 1; // Middle mouse button (1)

  private undoStack: EditorState[] = [];
  private redoStack: EditorState[] = [];

  private levelWidth: number = 800;
  private levelHeight: number = 600;

  constructor(gameState: GameState, canvas: HTMLCanvasElement) {
    this.gameState = gameState;
    this.canvas = canvas;
  }

  activate(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Initialize level size from current level if available
    if ((this.gameState as any).levelData) {
      this.levelWidth = (this.gameState as any).levelData.width || 800;
      this.levelHeight = (this.gameState as any).levelData.height || 600;
    }

    // Synchronize editor scroll position with game camera
    this.scrollPosition.x = this.gameState.camera.position.x;
    this.scrollPosition.y = this.gameState.camera.position.y;

    // Create editor UI
    this.createEditorUI();

    // Add event listeners
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);

    // Add scroll wheel support
    this.canvas.addEventListener("wheel", this.handleWheel);

    // Add keyboard navigation support
    window.addEventListener("keydown", this.handleKeyDown);

    // Initialize scroll indicator
    this.createScrollIndicator();
  }

  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;

    // Synchronize game camera with editor scroll position
    this.gameState.camera.position.x = this.scrollPosition.x;
    this.gameState.camera.position.y = this.scrollPosition.y;

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keydown", this.handleUndoRedoKeys);

    if (this.editorContainer?.parentElement) {
      this.editorContainer.parentElement.removeChild(this.editorContainer);
      this.editorContainer = null;
    }

    if (this.scrollIndicator?.parentElement) {
      this.scrollIndicator.parentElement.removeChild(this.scrollIndicator);
      this.scrollIndicator = null;
    }
  }

  isEditorActive(): boolean {
    return this.isActive;
  }

  private createEditorUI(): void {
    // Create editor container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "10px";
    container.style.left = "10px";
    container.style.padding = "10px";
    container.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    container.style.color = "white";
    container.style.borderRadius = "5px";
    container.style.zIndex = "1000";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "14px";

    // Create title
    const title = document.createElement("h3");
    title.textContent = "Level Editor";
    title.style.margin = "0 0 10px 0";
    container.appendChild(title);

    // Level size controls
    const sizeContainer = document.createElement("div");
    sizeContainer.style.marginBottom = "10px";
    sizeContainer.style.display = "flex";
    sizeContainer.style.gap = "10px";
    sizeContainer.style.alignItems = "center";

    const widthLabel = document.createElement("label");
    widthLabel.textContent = "Width: ";
    sizeContainer.appendChild(widthLabel);
    const widthInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.min = "320";
    widthInput.max = "10000";
    widthInput.value = String(this.levelWidth);
    widthInput.style.width = "70px";
    widthInput.addEventListener("change", () => {
      const val = Math.max(
        320,
        Math.min(10000, parseInt(widthInput.value, 10))
      );
      widthInput.value = String(val);
      this.levelWidth = val;
    });
    sizeContainer.appendChild(widthInput);

    const heightLabel = document.createElement("label");
    heightLabel.textContent = "Height: ";
    sizeContainer.appendChild(heightLabel);
    const heightInput = document.createElement("input");
    heightInput.type = "number";
    heightInput.min = "240";
    heightInput.max = "2000";
    heightInput.value = String(this.levelHeight);
    heightInput.style.width = "70px";
    heightInput.addEventListener("change", () => {
      const val = Math.max(
        240,
        Math.min(2000, parseInt(heightInput.value, 10))
      );
      heightInput.value = String(val);
      this.levelHeight = val;
    });
    sizeContainer.appendChild(heightInput);

    container.appendChild(sizeContainer);

    // Create instructions for scrolling
    const scrollInstructions = document.createElement("div");
    scrollInstructions.style.fontSize = "12px";
    scrollInstructions.style.marginBottom = "10px";
    scrollInstructions.style.color = "#aaa";
    scrollInstructions.innerHTML =
      "Scroll: Middle mouse drag, mouse wheel, or arrow keys<br>" +
      "Hold Shift + arrows for faster scrolling";
    container.appendChild(scrollInstructions);

    // Create mode buttons
    const modeContainer = document.createElement("div");
    modeContainer.style.marginBottom = "10px";

    const createModeButton = (mode: EditorMode, label: string) => {
      const button = document.createElement("button");
      button.textContent = label;
      button.style.margin = "0 5px 5px 0";
      button.style.padding = "5px 10px";
      button.style.cursor = "pointer";
      button.style.backgroundColor = this.mode === mode ? "#007bff" : "#343a40";
      button.style.border = "none";
      button.style.borderRadius = "3px";
      button.style.color = "white";

      button.addEventListener("click", () => {
        this.mode = mode;

        // Update button styles
        Array.from(modeContainer.children).forEach((btn) => {
          (btn as HTMLButtonElement).style.backgroundColor = "#343a40";
        });
        button.style.backgroundColor = "#007bff";
      });

      modeContainer.appendChild(button);
    };

    createModeButton(EditorMode.SELECT, "Select");
    createModeButton(EditorMode.PLATFORM, "Platform");
    createModeButton(EditorMode.SOLID_BLOCK, "Solid Block");
    createModeButton(EditorMode.CANDLE, "Candle");
    createModeButton(EditorMode.GHOST, "Ghost");
    createModeButton(EditorMode.LANDGHOST, "Land Ghost");
    createModeButton(EditorMode.PLAYER, "Player");
    createModeButton(EditorMode.DELETE, "Delete");

    container.appendChild(modeContainer);

    // Color picker for platforms
    if (this.mode === EditorMode.PLATFORM) {
      const colorContainer = document.createElement("div");
      colorContainer.style.marginBottom = "10px";

      const colorLabel = document.createElement("label");
      colorLabel.textContent = "Platform Color: ";
      colorContainer.appendChild(colorLabel);

      const colorPicker = document.createElement("input");
      colorPicker.type = "color";
      colorPicker.value = this.platformColor;
      colorPicker.addEventListener("change", (e) => {
        this.platformColor = (e.target as HTMLInputElement).value;
      });
      colorContainer.appendChild(colorPicker);

      container.appendChild(colorContainer);
    }

    // Save/Load buttons
    const actionContainer = document.createElement("div");

    // Undo button
    const undoButton = document.createElement("button");
    undoButton.textContent = "Undo";
    undoButton.style.margin = "0 5px 0 0";
    undoButton.style.padding = "5px 10px";
    undoButton.style.cursor = "pointer";
    undoButton.style.backgroundColor = "#ffc107";
    undoButton.style.border = "none";
    undoButton.style.borderRadius = "3px";
    undoButton.style.color = "black";
    undoButton.addEventListener("click", () => this.undo());
    actionContainer.appendChild(undoButton);

    // Redo button
    const redoButton = document.createElement("button");
    redoButton.textContent = "Redo";
    redoButton.style.margin = "0 5px 0 0";
    redoButton.style.padding = "5px 10px";
    redoButton.style.cursor = "pointer";
    redoButton.style.backgroundColor = "#17a2b8";
    redoButton.style.border = "none";
    redoButton.style.borderRadius = "3px";
    redoButton.style.color = "white";
    redoButton.addEventListener("click", () => this.redo());
    actionContainer.appendChild(redoButton);

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Level";
    saveButton.style.margin = "0 5px 0 0";
    saveButton.style.padding = "5px 10px";
    saveButton.style.cursor = "pointer";
    saveButton.style.backgroundColor = "#28a745";
    saveButton.style.border = "none";
    saveButton.style.borderRadius = "3px";
    saveButton.style.color = "white";

    saveButton.addEventListener("click", () => {
      this.saveCurrentLevel();
    });

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Close Editor";
    cancelButton.style.margin = "0";
    cancelButton.style.padding = "5px 10px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.backgroundColor = "#dc3545";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "3px";
    cancelButton.style.color = "white";

    cancelButton.addEventListener("click", () => {
      this.deactivate();
    });

    actionContainer.appendChild(saveButton);
    actionContainer.appendChild(cancelButton);
    container.appendChild(actionContainer);

    // Add container to page
    document.body.appendChild(container);
    this.editorContainer = container;

    // Keyboard shortcuts
    window.addEventListener("keydown", this.handleUndoRedoKeys);
  }

  private undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(this.captureCurrentState());
    const prev = this.undoStack.pop();
    if (prev) this.restoreState(prev);
  }

  private redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(this.captureCurrentState());
    const next = this.redoStack.pop();
    if (next) this.restoreState(next);
  }

  private pushUndoState() {
    // Deep copy relevant arrays and player position
    this.undoStack.push({
      platforms: this.gameState.platforms.map((p) => ({
        position: p.position.copy(),
        size: p.size.copy(),
        color: p.color,
      })),
      solidBlocks: this.gameState.solidBlocks.map((sb) => ({
        position: sb.position.copy(),
        size: sb.size.copy(),
        color: sb.color,
      })),
      candles: this.gameState.candles.map((c) => ({
        position: c.position.copy(),
      })),
      enemies: this.gameState.enemies.map((e) => ({
        position: e.position.copy(),
        type: e.type,
      })),
      player: { position: this.gameState.player.position.copy() },
      scrollPosition: this.scrollPosition.copy(), // Save scroll position
    });
    // Limit stack size
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }

  private captureCurrentState() {
    return {
      platforms: this.gameState.platforms.map((p) => ({
        position: p.position.copy(),
        size: p.size.copy(),
        color: p.color,
      })),
      solidBlocks: this.gameState.solidBlocks.map((sb) => ({
        position: sb.position.copy(),
        size: sb.size.copy(),
        color: sb.color,
      })),
      candles: this.gameState.candles.map((c) => ({
        position: c.position.copy(),
      })),
      enemies: this.gameState.enemies.map((e) => ({
        position: e.position.copy(),
        type: e.type,
      })),
      player: { position: this.gameState.player.position.copy() },
      scrollPosition: this.scrollPosition.copy(), // Save scroll position
    };
  }

  private restoreState(state: {
    platforms: { position: Vector2; size: Vector2; color: string }[];
    solidBlocks?: { position: Vector2; size: Vector2; color: string }[]; // Optional for backward compatibility
    candles: { position: Vector2 }[];
    enemies: { position: Vector2; type?: string }[]; // Make type optional for backward compatibility
    player: { position: Vector2 };
    scrollPosition?: Vector2; // Optional for backward compatibility
  }) {
    // Restore platforms
    this.gameState.platforms = state.platforms.map(
      (p) =>
        new Platform(p.position.x, p.position.y, p.size.x, p.size.y, p.color)
    );
    // Restore solid blocks
    this.gameState.solidBlocks = (state.solidBlocks || []).map(
      (sb) =>
        new SolidBlock(
          sb.position.x,
          sb.position.y,
          sb.size.x,
          sb.size.y,
          sb.color
        )
    );
    // Restore candles
    this.gameState.candles = state.candles.map(
      (c) => new Candle(c.position.x, c.position.y)
    );
    // Restore enemies
    this.gameState.enemies = state.enemies.map((e) => {
      const enemyType = e.type || "landghost"; // Default to landghost for backward compatibility
      if (enemyType === "ghost") {
        return new Ghost(e.position.x, e.position.y);
      } else {
        return new LandGhost(e.position.x, e.position.y);
      }
    });
    // Restore player
    this.gameState.player.position.x = state.player.position.x;
    this.gameState.player.position.y = state.player.position.y;

    // Restore scroll position if available
    if (state.scrollPosition) {
      this.scrollPosition = state.scrollPosition.copy();
    }
  }

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    // Handle middle mouse button for scrolling
    if (e.button === this.dragButton) {
      e.preventDefault();
      this.isScrolling = true;
      this.scrollStart = pos.copy();
      return;
    }

    // Convert screen position to world position (accounting for scroll)
    const worldPos = new Vector2(
      pos.x + this.scrollPosition.x,
      pos.y + this.scrollPosition.y
    );

    // --- Resize handle logic ---
    if (
      this.mode === EditorMode.SELECT &&
      this.selectedObject &&
      this.selectedObject instanceof Platform
    ) {
      const platform = this.selectedObject as Platform;
      const rect = {
        x: platform.position.x,
        y: platform.position.y,
        w: platform.size.x,
        h: platform.size.y,
      };
      const handles = this.getResizeHandles(rect);
      for (const handle of handles) {
        if (
          worldPos.x >= handle.x &&
          worldPos.x <= handle.x + LevelEditor.HANDLE_SIZE &&
          worldPos.y >= handle.y &&
          worldPos.y <= handle.y + LevelEditor.HANDLE_SIZE
        ) {
          // Start resizing
          this.resizing = {
            handle: handle.name,
            startMouse: worldPos.copy(),
            startRect: { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
          };
          this.pushUndoState();
          return;
        }
      }
    }

    switch (this.mode) {
      case EditorMode.SELECT:
        this.startSelectMode(worldPos);
        // If a platform is selected, allow extending it by dragging (legacy drag-to-resize)
        if (this.selectedObject && this.selectedObject instanceof Platform) {
          this.currentPlatform = {
            position: (this.selectedObject as Platform).position.copy(),
            size: (this.selectedObject as Platform).size.copy(),
            color: (this.selectedObject as Platform).color,
          };
          this.startPosition = this.currentPlatform.position.copy();
        } else {
          this.startPosition = null;
        }
        break;
      case EditorMode.PLATFORM:
        this.pushUndoState();
        this.startPlatformMode(worldPos);
        this.startPosition = worldPos;
        break;
      case EditorMode.SOLID_BLOCK:
        this.pushUndoState();
        this.startSolidBlockMode(worldPos);
        this.startPosition = worldPos;
        break;
      case EditorMode.CANDLE:
        this.pushUndoState();
        this.placeCandle(worldPos);
        break;
      case EditorMode.GHOST:
        this.pushUndoState();
        this.placeGhost(worldPos);
        break;
      case EditorMode.LANDGHOST:
        this.pushUndoState();
        this.placeLandGhost(worldPos);
        break;
      case EditorMode.PLAYER:
        this.pushUndoState();
        this.placePlayer(worldPos);
        break;
      case EditorMode.DELETE:
        this.pushUndoState();
        this.startDeleteMode(worldPos);
        break;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    // Handle scrolling with middle mouse button
    if (this.isScrolling && this.scrollStart) {
      const deltaX = this.scrollStart.x - pos.x;
      const deltaY = this.scrollStart.y - pos.y;

      this.scrollPosition.x += deltaX;
      this.scrollPosition.y += deltaY;

      // Keep scroll position positive
      this.scrollPosition.x = Math.max(0, this.scrollPosition.x);
      this.scrollPosition.y = Math.max(0, this.scrollPosition.y);

      // Sync camera
      this.gameState.camera.position.x = this.scrollPosition.x;
      this.gameState.camera.position.y = this.scrollPosition.y;

      this.scrollStart = pos.copy();
      this.updateScrollIndicator();
      return;
    }

    // --- Resize logic ---
    if (
      this.resizing &&
      this.selectedObject &&
      this.selectedObject instanceof Platform
    ) {
      const mouse = new Vector2(
        pos.x + this.scrollPosition.x,
        pos.y + this.scrollPosition.y
      );
      const dx = mouse.x - this.resizing.startMouse.x;
      const dy = mouse.y - this.resizing.startMouse.y;
      let { x, y, w, h } = this.resizing.startRect;
      switch (this.resizing.handle) {
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
      this.selectedObject.position.x = x;
      this.selectedObject.position.y = y;
      this.selectedObject.size.x = w;
      this.selectedObject.size.y = h;
      return;
    }

    if (!this.startPosition) return;

    // Convert screen position to world position
    const worldPos = new Vector2(
      pos.x + this.scrollPosition.x,
      pos.y + this.scrollPosition.y
    );

    switch (this.mode) {
      case EditorMode.PLATFORM:
        this.updatePlatformSize(worldPos);
        break;
      case EditorMode.SOLID_BLOCK:
        this.updatePlatformSize(worldPos);
        break;
      case EditorMode.SELECT:
        // If a platform is selected and being extended
        if (
          this.selectedObject &&
          this.selectedObject instanceof Platform &&
          this.currentPlatform
        ) {
          this.updatePlatformSize(worldPos);
        }
        break;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    // Stop scrolling if middle mouse button was released
    if (e.button === this.dragButton) {
      this.isScrolling = false;
      this.scrollStart = null;
      return;
    }

    // --- End resize if resizing ---
    if (this.resizing) {
      this.resizing = null;
      return;
    }

    if (!this.startPosition) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    // Convert to world position
    const worldPos = new Vector2(
      pos.x + this.scrollPosition.x,
      pos.y + this.scrollPosition.y
    );

    switch (this.mode) {
      case EditorMode.PLATFORM:
        this.finishPlatform(worldPos);
        break;
      case EditorMode.SOLID_BLOCK:
        this.finishSolidBlock(worldPos);
        break;
      case EditorMode.SELECT:
        // If a platform is selected and being extended
        if (
          this.selectedObject &&
          this.selectedObject instanceof Platform &&
          this.currentPlatform
        ) {
          // Save undo state before changing
          this.pushUndoState();
          // Update platform's position and size
          const platform = this.selectedObject as Platform;
          platform.position.x = this.currentPlatform.position.x;
          platform.position.y = this.currentPlatform.position.y;
          platform.size.x = this.currentPlatform.size.x;
          platform.size.y = this.currentPlatform.size.y;
          this.currentPlatform = null;
        }
        break;
    }

    this.startPosition = null;
  };

  private startSelectMode(pos: Vector2): void {
    // Prioritize: enemy > candle > platform > player
    this.selectedObject = null;

    // Check enemies first
    for (const enemy of this.gameState.enemies) {
      if (
        pos.x >= enemy.position.x &&
        pos.x <= enemy.position.x + enemy.size.x &&
        pos.y >= enemy.position.y &&
        pos.y <= enemy.position.y + enemy.size.y
      ) {
        this.selectedObject = enemy;
        return;
      }
    }

    // Check candles
    for (const candle of this.gameState.candles) {
      if (
        pos.x >= candle.position.x &&
        pos.x <= candle.position.x + candle.size.x &&
        pos.y >= candle.position.y &&
        pos.y <= candle.position.y + candle.size.y
      ) {
        this.selectedObject = candle;
        return;
      }
    }

    // Check platforms
    for (const platform of this.gameState.platforms) {
      if (
        pos.x >= platform.position.x &&
        pos.x <= platform.position.x + platform.size.x &&
        pos.y >= platform.position.y &&
        pos.y <= platform.position.y + platform.size.y
      ) {
        this.selectedObject = platform;
        return;
      }
    }

    // Check solid blocks
    for (const solidBlock of this.gameState.solidBlocks) {
      if (
        pos.x >= solidBlock.position.x &&
        pos.x <= solidBlock.position.x + solidBlock.size.x &&
        pos.y >= solidBlock.position.y &&
        pos.y <= solidBlock.position.y + solidBlock.size.y
      ) {
        this.selectedObject = solidBlock;
        return;
      }
    }

    // Check player
    const player = this.gameState.player;
    if (
      pos.x >= player.position.x &&
      pos.x <= player.position.x + player.size.x &&
      pos.y >= player.position.y &&
      pos.y <= player.position.y + player.size.y
    ) {
      this.selectedObject = player;
    }
  }

  private startPlatformMode(pos: Vector2): void {
    const snapped = this.snapVec2(pos);
    this.currentPlatform = {
      position: snapped,
      size: new Vector2(0, 0),
      color: this.platformColor,
    };
  }

  private updatePlatformSize(pos: Vector2): void {
    if (!this.currentPlatform || !this.startPosition) return;
    const snapped = this.snapVec2(pos);
    this.currentPlatform.size.x = snapped.x - this.currentPlatform.position.x;
    this.currentPlatform.size.y = snapped.y - this.currentPlatform.position.y;
    if (this.currentPlatform.size.x < 0) {
      this.currentPlatform.position.x = snapped.x;
      this.currentPlatform.size.x = Math.abs(this.currentPlatform.size.x);
    }
    if (this.currentPlatform.size.y < 0) {
      this.currentPlatform.position.y = snapped.y;
      this.currentPlatform.size.y = Math.abs(this.currentPlatform.size.y);
    }
  }

  private finishPlatform(pos: Vector2): void {
    if (!this.currentPlatform || !this.startPosition) return;

    // Update size one last time
    this.updatePlatformSize(pos);

    // Add platform to game state
    this.gameState.platforms.push(
      new Platform(
        this.currentPlatform.position.x,
        this.currentPlatform.position.y,
        this.currentPlatform.size.x,
        this.currentPlatform.size.y,
        this.currentPlatform.color
      )
    );

    this.currentPlatform = null;
  }

  private placeCandle(pos: Vector2): void {
    const snapped = this.snapVec2(pos);
    // Create new candle at position (bottom center at snapped position)
    this.gameState.candles.push(new Candle(snapped.x - 8, snapped.y - 32));
  }

  private placeGhost(pos: Vector2): void {
    const snapped = this.snapVec2(pos);
    // Create new ghost at position
    // Ghosts float, so position them slightly above the snap point
    const ghostX = snapped.x - 12; // Center the 24px wide ghost
    const ghostY = snapped.y - 16; // Position the 32px tall ghost

    // Create the ghost
    const newGhost = new Ghost(ghostX, ghostY);

    this.gameState.enemies.push(newGhost);
  }

  private placeLandGhost(pos: Vector2): void {
    const snapped = this.snapVec2(pos);
    // Create new land ghost at position
    // Make sure to position the enemy on the ground by aligning to the 16-pixel grid
    const enemyX = snapped.x - 12; // Center the 24px wide enemy
    const enemyY = snapped.y - 16; // Position the 32px tall enemy

    // Create the enemy
    const newEnemy = new LandGhost(enemyX, enemyY);

    // When creating an enemy through the editor, initialize with zero vertical velocity
    // to prevent immediate falling
    newEnemy.velocity.y = 0;

    this.gameState.enemies.push(newEnemy);
  }

  private placePlayer(pos: Vector2): void {
    const snapped = this.snapVec2(pos);
    // Update player position
    this.gameState.player.position.x = snapped.x - 16;
    this.gameState.player.position.y = snapped.y - 20;
  }

  private startDeleteMode(pos: Vector2): void {
    // Find and delete object under cursor
    // The pos parameter is already adjusted for scrolling in handleMouseDown

    // Check platforms
    for (let i = 0; i < this.gameState.platforms.length; i++) {
      const platform = this.gameState.platforms[i];
      if (
        pos.x >= platform.position.x &&
        pos.x <= platform.position.x + platform.size.x &&
        pos.y >= platform.position.y &&
        pos.y <= platform.position.y + platform.size.y
      ) {
        this.gameState.platforms.splice(i, 1);
        return;
      }
    }

    // Check solid blocks
    for (let i = 0; i < this.gameState.solidBlocks.length; i++) {
      const solidBlock = this.gameState.solidBlocks[i];
      if (
        pos.x >= solidBlock.position.x &&
        pos.x <= solidBlock.position.x + solidBlock.size.x &&
        pos.y >= solidBlock.position.y &&
        pos.y <= solidBlock.position.y + solidBlock.size.y
      ) {
        this.gameState.solidBlocks.splice(i, 1);
        return;
      }
    }

    // Check candles
    for (let i = 0; i < this.gameState.candles.length; i++) {
      const candle = this.gameState.candles[i];
      if (
        pos.x >= candle.position.x &&
        pos.x <= candle.position.x + candle.size.x &&
        pos.y >= candle.position.y &&
        pos.y <= candle.position.y + candle.size.y
      ) {
        this.gameState.candles.splice(i, 1);
        return;
      }
    }

    // Check enemies
    for (let i = 0; i < this.gameState.enemies.length; i++) {
      const enemy = this.gameState.enemies[i];
      if (
        pos.x >= enemy.position.x &&
        pos.x <= enemy.position.x + enemy.size.x &&
        pos.y >= enemy.position.y &&
        pos.y <= enemy.position.y + enemy.size.y
      ) {
        this.gameState.enemies.splice(i, 1);
        return;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    ctx.save();

    // Draw current platform being created
    if (this.mode === EditorMode.PLATFORM && this.currentPlatform) {
      ctx.fillStyle = this.currentPlatform.color;
      ctx.fillRect(
        this.currentPlatform.position.x,
        this.currentPlatform.position.y,
        this.currentPlatform.size.x,
        this.currentPlatform.size.y
      );

      ctx.strokeStyle = "#FFFFFF";
      ctx.strokeRect(
        this.currentPlatform.position.x,
        this.currentPlatform.position.y,
        this.currentPlatform.size.x,
        this.currentPlatform.size.y
      );
    }

    // Draw current solid block being created
    if (this.mode === EditorMode.SOLID_BLOCK && this.currentPlatform) {
      ctx.fillStyle = this.currentPlatform.color;
      ctx.fillRect(
        this.currentPlatform.position.x,
        this.currentPlatform.position.y,
        this.currentPlatform.size.x,
        this.currentPlatform.size.y
      );

      ctx.strokeStyle = "#00FFFF"; // Cyan to distinguish from platforms
      ctx.strokeRect(
        this.currentPlatform.position.x,
        this.currentPlatform.position.y,
        this.currentPlatform.size.x,
        this.currentPlatform.size.y
      );
    }

    // Highlight selected object
    if (this.mode === EditorMode.SELECT && this.selectedObject) {
      const obj = this.selectedObject as { position: Vector2; size: Vector2 };
      if (obj.position && obj.size) {
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          obj.position.x - 2,
          obj.position.y - 2,
          obj.size.x + 4,
          obj.size.y + 4
        );
        ctx.lineWidth = 1;

        // Draw resize handles if it's a platform
        if (this.selectedObject instanceof Platform) {
          const rect = {
            x: obj.position.x,
            y: obj.position.y,
            w: obj.size.x,
            h: obj.size.y,
          };
          const handles = this.getResizeHandles(rect);
          ctx.save();
          for (const handle of handles) {
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(
              handle.x,
              handle.y,
              LevelEditor.HANDLE_SIZE,
              LevelEditor.HANDLE_SIZE
            );
            ctx.strokeStyle = "#222";
            ctx.strokeRect(
              handle.x,
              handle.y,
              LevelEditor.HANDLE_SIZE,
              LevelEditor.HANDLE_SIZE
            );
          }
          ctx.restore();
        }
      }
    }

    // Draw grid for alignment
    this.drawGrid(ctx);

    ctx.restore();
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.5;

    // Calculate grid boundaries based on scroll position and canvas size
    // We need to calculate grid position in world space
    const startX = Math.floor(this.scrollPosition.x / 16) * 16;
    const startY = Math.floor(this.scrollPosition.y / 16) * 16;
    const endX = startX + this.canvas.width + 32;
    const endY = startY + this.canvas.height + 32;

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

  private saveCurrentLevel(): void {
    // Generate a level ID
    const levelId = prompt(
      "Enter a level ID (e.g., 'level3'):",
      `level${this.gameState.levelManager.getLevelIds().length + 1}`
    );

    if (!levelId) return;

    // Generate a level name
    const levelName = prompt(
      "Enter a level name:",
      `Custom Level ${this.gameState.levelManager.getLevelIds().length + 1}`
    );

    if (!levelName) return;

    // Create level data from current game state
    const levelData = LevelManager.createLevelFromGameState(
      this.gameState,
      levelId,
      levelName
    );
    // Set width and height
    levelData.width = this.levelWidth;
    levelData.height = this.levelHeight;

    // Function to format Vector2 values is removed as it's not needed
    // We're formatting the data directly in the template literals below

    const platforms = (levelData.platforms || [])
      .map(
        (p) =>
          `  { position: vec2(${this.snap16(p.position.x)}, ${this.snap16(
            p.position.y
          )}), size: vec2(${this.snap16(p.size.x)}, ${this.snap16(
            p.size.y
          )}), color: "${p.color}" },`
      )
      .join("\n");
    const solidBlocks = this.gameState.solidBlocks
      .map(
        (sb) =>
          `  { position: vec2(${this.snap16(sb.position.x)}, ${this.snap16(
            sb.position.y
          )}), size: vec2(${this.snap16(sb.size.x)}, ${this.snap16(
            sb.size.y
          )}), color: "${sb.color}" },`
      )
      .join("\n");
    const candles = (levelData.candles || [])
      .map(
        (c) =>
          `  { position: vec2(${this.snap16(c.position.x)}, ${this.snap16(
            c.position.y
          )}) },`
      )
      .join("\n");
    const enemies = this.gameState.enemies
      .map((e) => {
        const enemyType = e.type === "ghost" ? "ghost" : "landghost";
        return `  { position: vec2(${this.snap16(e.position.x)}, ${this.snap16(
          e.position.y
        )}), type: "${enemyType}" },`;
      })
      .join("\n");
    const player = `  position: vec2(${this.snap16(
      levelData.player.position.x
    )}, ${this.snap16(levelData.player.position.y)})`;

    const formattedLevelCode = `{
  id: "${levelId}",
  name: "${levelName}",
  width: ${this.levelWidth},
  height: ${this.levelHeight},
  background: {
    color: "${levelData.background.color}",
  },
  platforms: [
${platforms}
  ],
  solidBlocks: [
${solidBlocks}
  ],
  candles: [
${candles}
  ],
  enemies: [
${enemies}
  ],
  player: {
${player}
  },
},`;

    // Create a modal to display the JSON
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.padding = "20px";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    modal.style.color = "white";
    modal.style.borderRadius = "5px";
    modal.style.zIndex = "1001";
    modal.style.maxWidth = "800px";
    modal.style.maxHeight = "80vh";
    modal.style.overflowY = "auto";

    const title = document.createElement("h3");
    title.textContent = "Level Data JSON";
    title.style.marginTop = "0";
    modal.appendChild(title);

    const info = document.createElement("p");
    info.textContent = "Copy this JSON and add it to the levels.ts file:";
    modal.appendChild(info);

    const textarea = document.createElement("textarea");
    textarea.value = formattedLevelCode;
    textarea.style.width = "100%";
    textarea.style.height = "300px";
    textarea.style.backgroundColor = "#222";
    textarea.style.color = "#0F0";
    textarea.style.padding = "10px";
    textarea.style.borderRadius = "3px";
    textarea.style.fontFamily = "monospace";
    modal.appendChild(textarea);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.marginTop = "10px";
    closeButton.style.padding = "5px 10px";
    closeButton.style.cursor = "pointer";
    closeButton.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
    modal.appendChild(closeButton);

    document.body.appendChild(modal);
  }

  private handleUndoRedoKeys = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    if (
      (isMac ? e.metaKey : e.ctrlKey) &&
      !e.shiftKey &&
      e.key.toLowerCase() === "z"
    ) {
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

  // Snap to 16x16 grid
  private snap16(n: number) {
    return Math.round(n / 16) * 16;
  }
  private snapVec2(v: Vector2) {
    return new Vector2(this.snap16(v.x), this.snap16(v.y));
  }

  private createScrollIndicator(): void {
    // Create a scroll position indicator
    const indicator = document.createElement("div");
    indicator.style.position = "fixed";
    indicator.style.bottom = "10px";
    indicator.style.right = "10px";
    indicator.style.padding = "5px 10px";
    indicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    indicator.style.color = "white";
    indicator.style.borderRadius = "3px";
    indicator.style.zIndex = "1000";
    indicator.style.fontFamily = "Arial, sans-serif";
    indicator.style.fontSize = "12px";
    indicator.textContent = "Scroll: 0, 0";

    document.body.appendChild(indicator);
    this.scrollIndicator = indicator;
    this.updateScrollIndicator();
  }

  private updateScrollIndicator(): void {
    if (!this.scrollIndicator) return;
    this.scrollIndicator.textContent = `Scroll: ${Math.round(
      this.scrollPosition.x
    )}, ${Math.round(this.scrollPosition.y)}`;
  }

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY;
    const scrollSpeed = 32;
    if (e.shiftKey) {
      this.scrollPosition.x += (delta > 0 ? 1 : -1) * scrollSpeed;
    } else {
      this.scrollPosition.y += (delta > 0 ? 1 : -1) * scrollSpeed;
    }
    this.scrollPosition.x = Math.max(0, this.scrollPosition.x);
    this.scrollPosition.y = Math.max(0, this.scrollPosition.y);
    // Sync camera
    this.gameState.camera.position.x = this.scrollPosition.x;
    this.gameState.camera.position.y = this.scrollPosition.y;
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
        break;
    }
    this.scrollPosition.x = Math.max(0, this.scrollPosition.x);
    this.scrollPosition.y = Math.max(0, this.scrollPosition.y);
    // Sync camera
    this.gameState.camera.position.x = this.scrollPosition.x;
    this.gameState.camera.position.y = this.scrollPosition.y;
    this.updateScrollIndicator();
  };

  private startSolidBlockMode(pos: Vector2): void {
    this.currentPlatform = {
      position: this.snapVec2(pos),
      size: new Vector2(0, 0),
      color: "#4A4A4A", // Default solid block color
    };
  }

  private finishSolidBlock(pos: Vector2): void {
    if (!this.currentPlatform) return;

    const snappedPos = this.snapVec2(pos);
    const width = Math.abs(snappedPos.x - this.currentPlatform.position.x);
    const height = Math.abs(snappedPos.y - this.currentPlatform.position.y);

    if (width > 0 && height > 0) {
      const minX = Math.min(this.currentPlatform.position.x, snappedPos.x);
      const minY = Math.min(this.currentPlatform.position.y, snappedPos.y);

      this.gameState.solidBlocks.push(
        new SolidBlock(minX, minY, width, height, this.currentPlatform.color)
      );
    }

    this.currentPlatform = null;
  }
}

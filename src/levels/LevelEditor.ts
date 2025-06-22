import { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2";
import { LevelManager } from "./LevelManager";
import { Platform } from "../objects/platform";
import { Candle } from "../objects/candle";
import { Enemy } from "../objects/enemy";

export enum EditorMode {
  PLATFORM,
  CANDLE,
  ENEMY,
  PLAYER,
  SELECT,
  DELETE,
}

interface EditorPlatform {
  position: Vector2;
  size: Vector2;
  color: string;
}

export class LevelEditor {
  private gameState: GameState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isActive: boolean = false;
  private mode: EditorMode = EditorMode.SELECT;
  private startPosition: Vector2 | null = null;
  private currentPlatform: EditorPlatform | null = null;
  private editorContainer: HTMLDivElement | null = null;
  private selectedObject: any = null;
  private platformColor: string = "#654321";

  constructor(gameState: GameState, canvas: HTMLCanvasElement) {
    this.gameState = gameState;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  activate(): void {
    if (this.isActive) return;

    this.isActive = true;

    // Create editor UI
    this.createEditorUI();

    // Add event listeners
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
  }

  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // Remove event listeners
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);

    // Remove editor UI
    if (this.editorContainer && this.editorContainer.parentElement) {
      this.editorContainer.parentElement.removeChild(this.editorContainer);
      this.editorContainer = null;
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
    createModeButton(EditorMode.CANDLE, "Candle");
    createModeButton(EditorMode.ENEMY, "Enemy");
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
  }

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    switch (this.mode) {
      case EditorMode.SELECT:
        this.startSelectMode(pos);
        break;

      case EditorMode.PLATFORM:
        this.startPlatformMode(pos);
        break;

      case EditorMode.CANDLE:
        this.placeCandle(pos);
        break;

      case EditorMode.ENEMY:
        this.placeEnemy(pos);
        break;

      case EditorMode.PLAYER:
        this.placePlayer(pos);
        break;

      case EditorMode.DELETE:
        this.startDeleteMode(pos);
        break;
    }

    this.startPosition = pos;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.startPosition) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    switch (this.mode) {
      case EditorMode.PLATFORM:
        this.updatePlatformSize(pos);
        break;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (!this.startPosition) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = new Vector2(x, y);

    switch (this.mode) {
      case EditorMode.PLATFORM:
        this.finishPlatform(pos);
        break;
    }

    this.startPosition = null;
  };

  private startSelectMode(pos: Vector2): void {
    // Find the object under cursor
    this.selectedObject = null;

    // Check platforms
    for (const platform of this.gameState.platforms) {
      if (
        pos.x >= platform.position.x &&
        pos.x <= platform.position.x + platform.size.x &&
        pos.y >= platform.position.y &&
        pos.y <= platform.position.y + platform.size.y
      ) {
        this.selectedObject = platform;
        break;
      }
    }

    // Check candles
    if (!this.selectedObject) {
      for (const candle of this.gameState.candles) {
        if (
          pos.x >= candle.position.x &&
          pos.x <= candle.position.x + candle.size.x &&
          pos.y >= candle.position.y &&
          pos.y <= candle.position.y + candle.size.y
        ) {
          this.selectedObject = candle;
          break;
        }
      }
    }

    // Check enemies
    if (!this.selectedObject) {
      for (const enemy of this.gameState.enemies) {
        if (
          pos.x >= enemy.position.x &&
          pos.x <= enemy.position.x + enemy.size.x &&
          pos.y >= enemy.position.y &&
          pos.y <= enemy.position.y + enemy.size.y
        ) {
          this.selectedObject = enemy;
          break;
        }
      }
    }

    // Check player
    if (!this.selectedObject) {
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
  }

  private startPlatformMode(pos: Vector2): void {
    this.currentPlatform = {
      position: new Vector2(pos.x, pos.y),
      size: new Vector2(0, 0),
      color: this.platformColor,
    };
  }

  private updatePlatformSize(pos: Vector2): void {
    if (!this.currentPlatform || !this.startPosition) return;

    this.currentPlatform.size.x = pos.x - this.startPosition.x;
    this.currentPlatform.size.y = pos.y - this.startPosition.y;

    // Handle negative sizes (dragging left/up)
    if (this.currentPlatform.size.x < 0) {
      this.currentPlatform.position.x = pos.x;
      this.currentPlatform.size.x = Math.abs(this.currentPlatform.size.x);
    }

    if (this.currentPlatform.size.y < 0) {
      this.currentPlatform.position.y = pos.y;
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
    // Create new candle at position
    this.gameState.candles.push(new Candle(pos.x - 8, pos.y - 12));
  }

  private placeEnemy(pos: Vector2): void {
    // Create new enemy at position
    this.gameState.enemies.push(new Enemy(pos.x - 12, pos.y - 16));
  }

  private placePlayer(pos: Vector2): void {
    // Update player position
    this.gameState.player.position.x = pos.x - 16;
    this.gameState.player.position.y = pos.y - 20;
  }

  private startDeleteMode(pos: Vector2): void {
    // Find and delete object under cursor

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

    // Highlight selected object
    if (this.mode === EditorMode.SELECT && this.selectedObject) {
      const obj = this.selectedObject;
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        obj.position.x - 2,
        obj.position.y - 2,
        obj.size.x + 4,
        obj.size.y + 4
      );
      ctx.lineWidth = 1;
    }

    // Draw grid for alignment
    this.drawGrid(ctx);

    // Draw cursor based on current mode
    this.drawCursor(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.5;

    // Draw vertical lines
    for (let x = 0; x < this.canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < this.canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawCursor(ctx: CanvasRenderingContext2D): void {
    // No custom cursor in this implementation
  }

  private saveCurrentLevel(): void {
    // Generate a level ID
    const levelId = prompt(
      "Enter a level ID (e.g., 'level3'):",
      "level" + (this.gameState.levelManager.getLevelIds().length + 1)
    );

    if (!levelId) return;

    // Generate a level name
    const levelName = prompt(
      "Enter a level name:",
      "Custom Level " + (this.gameState.levelManager.getLevelIds().length + 1)
    );

    if (!levelName) return;

    // Create level data from current game state
    const levelData = LevelManager.createLevelFromGameState(
      this.gameState,
      levelId,
      levelName
    );

    // Display the level data as JSON
    const jsonStr = JSON.stringify(levelData, null, 2);

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
    textarea.value = jsonStr;
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
}

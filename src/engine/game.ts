import { LevelEditor } from "../levels/LevelEditor";
import { GameState } from "./GameState";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  lastTime: number;
  running: boolean;

  constructor(initialLevelId: string = "level1") {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.gameState = new GameState(initialLevelId);
    this.lastTime = 0;
    this.running = true;

    // Set up UI for level switching
    this.setupLevelSwitchUI();

    this.start();
  }

  setupLevelSwitchUI(): void {
    const levelManager = this.gameState.levelManager;
    const levelIds = levelManager.getLevelIds();

    if (levelIds.length === 0) {
      return;
    }

    // Create a UI container
    const uiContainer = document.createElement("div");
    uiContainer.style.position = "fixed";
    uiContainer.style.bottom = "10px";
    uiContainer.style.left = "50%";
    uiContainer.style.transform = "translateX(-50%)";
    uiContainer.style.padding = "10px";
    uiContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    uiContainer.style.borderRadius = "5px";
    uiContainer.style.zIndex = "1000";

    // Create level buttons
    levelIds.forEach((levelId) => {
      const button = document.createElement("button");
      button.textContent = `Level ${levelId.replace("level", "")}`;
      button.style.margin = "0 5px";
      button.style.padding = "5px 10px";
      button.style.cursor = "pointer";

      button.addEventListener("click", () => {
        this.gameState.loadLevel(levelId);
      });

      uiContainer.appendChild(button);
    });

    // Add level editor button
    const editorButton = document.createElement("button");
    editorButton.textContent = "Level Editor";
    editorButton.style.margin = "0 5px";
    editorButton.style.padding = "5px 10px";
    editorButton.style.backgroundColor = "#007bff";
    editorButton.style.color = "white";
    editorButton.style.border = "none";
    editorButton.style.borderRadius = "3px";
    editorButton.style.cursor = "pointer";

    // Create level editor instance if not exists
    if (!this.gameState.levelEditor) {
      this.gameState.levelEditor = new LevelEditor(this.gameState, this.canvas);
    }

    editorButton.addEventListener("click", () => {
      if (this.gameState.levelEditor?.isEditorActive()) {
        this.gameState.levelEditor.deactivate();
        editorButton.textContent = "Level Editor";
        this.running = true; // Resume game loop
      } else if (this.gameState.levelEditor) {
        this.gameState.levelEditor.activate();
        editorButton.textContent = "Close Editor";
        this.running = false; // Pause game loop when editor is active
      }
    });

    uiContainer.appendChild(editorButton);

    document.body.appendChild(uiContainer);
  }

  start(): void {
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  gameLoop(currentTime: number): void {
    // Always update the time even if paused
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // If game is paused but editor is active, render only (no game updates)
    const isEditorActive = this.gameState.levelEditor?.isEditorActive();

    if (!this.running && !isEditorActive) {
      requestAnimationFrame((time) => this.gameLoop(time));
      return;
    }

    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 0.016);

    // If editor is active, skip game state update but still render
    if (!isEditorActive) {
      this.gameState.update(cappedDeltaTime);
    }

    // Always render, even in editor mode
    this.gameState.render(this.ctx);

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

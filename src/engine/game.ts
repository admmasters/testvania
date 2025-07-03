import { LevelEditor } from "../levels/LevelEditor";
import { GameState } from "./GameState";
import { Scanlines } from "./Scanlines";

interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  webkitImageSmoothingEnabled?: boolean;
  mozImageSmoothingEnabled?: boolean;
  msImageSmoothingEnabled?: boolean;
  oImageSmoothingEnabled?: boolean;
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  lastTime: number;
  running: boolean;
  scanlines: Scanlines;

  constructor(initialLevelId: string = "level1") {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // Configure canvas for pixel-perfect rendering
    this.setupPixelPerfectCanvas();

    this.gameState = new GameState(initialLevelId);
    this.lastTime = 0;
    this.running = true;
    this.scanlines = new Scanlines(0.6, 2, 0.5); // More pronounced scanlines for authentic retro look

    // Set up UI for level switching
    this.setupLevelSwitchUI();

    this.start();
  }

  setupPixelPerfectCanvas(): void {
    const extendedCtx = this.ctx as ExtendedCanvasRenderingContext2D;

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;

    // Also disable vendor-specific smoothing properties for older browsers
    if (extendedCtx.webkitImageSmoothingEnabled !== undefined) {
      extendedCtx.webkitImageSmoothingEnabled = false;
    }
    if (extendedCtx.mozImageSmoothingEnabled !== undefined) {
      extendedCtx.mozImageSmoothingEnabled = false;
    }
    if (extendedCtx.msImageSmoothingEnabled !== undefined) {
      extendedCtx.msImageSmoothingEnabled = false;
    }
    if (extendedCtx.oImageSmoothingEnabled !== undefined) {
      extendedCtx.oImageSmoothingEnabled = false;
    }

    // Ensure integer pixel positions by using device pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;

    // Get the canvas size from HTML attributes (800x600)
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Set actual canvas size in memory (scaled for high DPI if needed)
    this.canvas.width = canvasWidth * pixelRatio;
    this.canvas.height = canvasHeight * pixelRatio;

    // Scale the canvas back down using CSS to maintain 800x600 display size
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(pixelRatio, pixelRatio);

    // Re-apply smoothing settings after scaling
    this.ctx.imageSmoothingEnabled = false;
    if (extendedCtx.webkitImageSmoothingEnabled !== undefined) {
      extendedCtx.webkitImageSmoothingEnabled = false;
    }
    if (extendedCtx.mozImageSmoothingEnabled !== undefined) {
      extendedCtx.mozImageSmoothingEnabled = false;
    }
    if (extendedCtx.msImageSmoothingEnabled !== undefined) {
      extendedCtx.msImageSmoothingEnabled = false;
    }
    if (extendedCtx.oImageSmoothingEnabled !== undefined) {
      extendedCtx.oImageSmoothingEnabled = false;
    }
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

    // Apply scanlines effect over everything
    this.scanlines.render(this.ctx, this.canvas.width, this.canvas.height);

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

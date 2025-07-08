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

  constructor(initialLevelId: string = "tutorial") {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // Configure canvas for pixel-perfect rendering
    this.setupPixelPerfectCanvas();

    this.gameState = new GameState(initialLevelId);
    this.lastTime = 0;
    this.running = true;
    this.scanlines = new Scanlines(0.6, 2, 0.5);

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
    uiContainer.style.padding = "15px";
    uiContainer.style.background =
      "linear-gradient(145deg, rgba(0, 0, 0, 0.9), rgba(26, 26, 46, 0.9))";
    uiContainer.style.borderRadius = "10px";
    uiContainer.style.zIndex = "1000";
    uiContainer.style.border = "2px solid #D4AF37";
    uiContainer.style.boxShadow = "0 0 20px rgba(212, 175, 55, 0.3)";
    uiContainer.style.fontFamily = "'Orbitron', monospace";

    levelIds.forEach((levelId) => {
      const button = document.createElement("button");
      button.textContent = `Level ${levelId.replace("level", "")}`;
      button.className = "arcade-button";
      button.style.margin = "0 5px";

      button.addEventListener("click", () => {
        this.gameState.loadLevel(levelId);
      });

      uiContainer.appendChild(button);
    });

    const editorButton = document.createElement("button");
    editorButton.textContent = "Level Editor";
    editorButton.className = "arcade-button";
    editorButton.style.margin = "0 5px";

    if (!this.gameState.levelEditor) {
      this.gameState.levelEditor = new LevelEditor(this.gameState, this.canvas);
    }

    editorButton.addEventListener("click", () => {
      if (this.gameState.levelEditor?.isEditorActive()) {
        this.gameState.levelEditor.deactivate();
        editorButton.textContent = "Level Editor";
        editorButton.classList.remove("selected");
        this.running = true; // Resume game loop
      } else if (this.gameState.levelEditor) {
        this.gameState.levelEditor.activate();
        editorButton.textContent = "Close Editor";
        editorButton.classList.add("selected");
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

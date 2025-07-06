import type { GameState } from "@/engine/GameState";
import type { Vector2 } from "@/engine/Vector2";
import { Candle } from "@/objects/candle";
import { DiagonalPlatform } from "@/objects/diagonalPlatform";
import { Ghost } from "@/objects/Ghost";
import { LandGhost } from "@/objects/LandGhost";
import { Platform } from "@/objects/platform";
import { SolidBlock } from "@/objects/solidBlock";
import type { EditorState } from "./EditorTypes";

export class EditorStateManager {
  private gameState: GameState;
  private undoStack: EditorState[] = [];
  private redoStack: EditorState[] = [];

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  pushUndoState(scrollPosition: Vector2): void {
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
      diagonalPlatforms: this.gameState.diagonalPlatforms.map((dp) => ({
        startPoint: dp.startPoint.copy(),
        endPoint: dp.endPoint.copy(),
        thickness: dp.thickness,
        color: dp.color,
      })),
      candles: this.gameState.candles.map((c) => ({
        position: c.position.copy(),
      })),
      enemies: this.gameState.enemies.map((e) => ({
        position: e.position.copy(),
        type: e.type,
        direction: e.direction,
      })),
      player: { position: this.gameState.player.position.copy() },
      scrollPosition: scrollPosition.copy(),
    });

    // Limit stack size
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(scrollPosition: Vector2): Vector2 {
    if (this.undoStack.length === 0) return scrollPosition;

    this.redoStack.push(this.captureCurrentState(scrollPosition));
    const prev = this.undoStack.pop();
    if (prev) {
      this.restoreState(prev);
      return prev.scrollPosition || scrollPosition;
    }
    return scrollPosition;
  }

  redo(scrollPosition: Vector2): Vector2 {
    if (this.redoStack.length === 0) return scrollPosition;

    this.undoStack.push(this.captureCurrentState(scrollPosition));
    const next = this.redoStack.pop();
    if (next) {
      this.restoreState(next);
      return next.scrollPosition || scrollPosition;
    }
    return scrollPosition;
  }

  private captureCurrentState(scrollPosition: Vector2): EditorState {
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
      diagonalPlatforms: this.gameState.diagonalPlatforms.map((dp) => ({
        startPoint: dp.startPoint.copy(),
        endPoint: dp.endPoint.copy(),
        thickness: dp.thickness,
        color: dp.color,
      })),
      candles: this.gameState.candles.map((c) => ({
        position: c.position.copy(),
      })),
      enemies: this.gameState.enemies.map((e) => ({
        position: e.position.copy(),
        type: e.type,
        direction: e.direction,
      })),
      player: { position: this.gameState.player.position.copy() },
      scrollPosition: scrollPosition.copy(),
    };
  }

  private restoreState(state: EditorState): void {
    // Restore platforms
    this.gameState.platforms = state.platforms.map(
      (p) =>
        new Platform({
          x: p.position.x,
          y: p.position.y,
          width: p.size.x,
          height: p.size.y,
          color: p.color,
        }),
    );

    // Restore solid blocks
    this.gameState.solidBlocks = (state.solidBlocks || []).map(
      (sb) =>
        new SolidBlock({
          x: sb.position.x,
          y: sb.position.y,
          width: sb.size.x,
          height: sb.size.y,
          color: sb.color,
        }),
    );

    // Restore diagonal platforms
    this.gameState.diagonalPlatforms = (state.diagonalPlatforms || []).map(
      (dp) =>
        new DiagonalPlatform({
          startPoint: dp.startPoint,
          endPoint: dp.endPoint,
          thickness: dp.thickness,
          color: dp.color,
        }),
    );

    // Restore candles
    this.gameState.candles = state.candles.map((c) => new Candle(c.position.x, c.position.y));

    // Restore enemies
    this.gameState.enemies = state.enemies.map((e) => {
      const enemyType = e.type || "landghost"; // Default to landghost for backward compatibility
      if (enemyType === "ghost") {
        return new Ghost(e.position.x, e.position.y, e.direction);
      } else {
        return new LandGhost(e.position.x, e.position.y, e.direction);
      }
    });

    // Restore player
    this.gameState.player.position.x = state.player.position.x;
    this.gameState.player.position.y = state.player.position.y;
  }
}

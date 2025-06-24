import type { Vector2 } from "../../engine/Vector2";

export interface EditorState {
  platforms: { position: Vector2; size: Vector2; color: string }[];
  candles: { position: Vector2 }[];
  enemies: { position: Vector2 }[];
  player: { position: Vector2 };
  scrollPosition: Vector2;
}

export class EditorHistory {
  private undoStack: EditorState[] = [];
  private redoStack: EditorState[] = [];

  pushUndoState(state: EditorState) {
    this.undoStack.push(structuredClone(state));
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(currentState: EditorState, restore: (state: EditorState) => void) {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(structuredClone(currentState));
    const prev = this.undoStack.pop();
    if (prev) restore(prev);
  }

  redo(currentState: EditorState, restore: (state: EditorState) => void) {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(structuredClone(currentState));
    const next = this.redoStack.pop();
    if (next) restore(next);
  }
}

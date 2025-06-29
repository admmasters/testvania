import type { GameState } from "@/engine/GameState";
import { LevelManager } from "../LevelManager";
import type { EditorUtils } from "./EditorUtils";

export class EditorLevelSaver {
  private gameState: GameState;
  private utils: EditorUtils;

  constructor(gameState: GameState, utils: EditorUtils) {
    this.gameState = gameState;
    this.utils = utils;
  }

  saveCurrentLevel(levelWidth: number, levelHeight: number): void {
    // Generate a level ID
    const levelId = prompt(
      "Enter a level ID (e.g., 'level3'):",
      `level${this.gameState.levelManager.getLevelIds().length + 1}`,
    );

    if (!levelId) return;

    // Generate a level name
    const levelName = prompt(
      "Enter a level name:",
      `Custom Level ${this.gameState.levelManager.getLevelIds().length + 1}`,
    );

    if (!levelName) return;

    // Create level data from current game state
    const levelData = LevelManager.createLevelFromGameState(this.gameState, levelId, levelName);

    // Set width and height
    levelData.width = levelWidth;
    levelData.height = levelHeight;

    const platforms = (levelData.platforms || [])
      .map(
        (p) =>
          `  { position: vec2(${this.utils.snap16(p.position.x)}, ${this.utils.snap16(
            p.position.y,
          )}), size: vec2(${this.utils.snap16(p.size.x)}, ${this.utils.snap16(
            p.size.y,
          )}), color: "${p.color}" },`,
      )
      .join("\n");

    const solidBlocks = this.gameState.solidBlocks
      .map(
        (sb) =>
          `  { position: vec2(${this.utils.snap16(sb.position.x)}, ${this.utils.snap16(
            sb.position.y,
          )}), size: vec2(${this.utils.snap16(sb.size.x)}, ${this.utils.snap16(
            sb.size.y,
          )}), color: "${sb.color}" },`,
      )
      .join("\n");

    const candles = (levelData.candles || [])
      .map(
        (c) =>
          `  { position: vec2(${this.utils.snap16(c.position.x)}, ${this.utils.snap16(
            c.position.y,
          )}) },`,
      )
      .join("\n");

    const enemies = this.gameState.enemies
      .map((e) => {
        const enemyType = e.type === "ghost" ? "ghost" : "landghost";
        return `  { position: vec2(${this.utils.snap16(e.position.x)}, ${this.utils.snap16(
          e.position.y,
        )}), type: "${enemyType}" },`;
      })
      .join("\n");

    const player = `  position: vec2(${this.utils.snap16(
      levelData.player.position.x,
    )}, ${this.utils.snap16(levelData.player.position.y)})`;

    const formattedLevelCode = `{
  id: "${levelId}",
  name: "${levelName}",
  width: ${levelWidth},
  height: ${levelHeight},
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

    this.showLevelDataModal(formattedLevelCode);
  }

  private showLevelDataModal(formattedLevelCode: string): void {
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
}

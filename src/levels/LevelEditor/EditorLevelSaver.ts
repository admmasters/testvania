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
    // Open form modal for ID and Name collection
    this.showSaveForm((levelId: string, levelName: string) => {
      // Create level data from current GameState
      const levelData = LevelManager.createLevelFromGameState(this.gameState, levelId, levelName);

      // Apply width/height overrides from editor controls
      levelData.width = levelWidth;
      levelData.height = levelHeight;

      // Prepare string fragments for arrays
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

      const memoryCrystals = (levelData.memoryCrystals || [])
        .map((c) => `  { position: vec2(${c.position.x}, ${c.position.y}), type: '${c.type || 'azure'}' },`)
        .join("\n");

      const enemies = this.gameState.enemies
        .map((e) => {
          const enemyType = e.type === "ghost" ? "ghost" : "landghost";
          const directionStr = e.direction !== undefined ? `, direction: ${e.direction}` : "";
          return `  { position: vec2(${e.position.x}, ${e.position.y}), type: "${enemyType}"${directionStr} },`;
        })
        .join("\n");

      const player = `  position: vec2(${levelData.player.position.x}, ${levelData.player.position.y})`;

      // Generate TS module content for new level file
      const fileContent = `import type { LevelData } from "../LevelData";\nimport { Vector2 } from "@/engine/Vector2";\n\nconst vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);\n\nexport const ${levelId}: LevelData = {\n  id: "${levelId}",\n  name: "${levelName}",\n  width: ${levelWidth},\n  height: ${levelHeight},\n  background: {\n    color: "${levelData.background.color}",\n  },\n  platforms: [\n${platforms}\n  ],\n  solidBlocks: [\n${solidBlocks}\n  ],\n  diagonalPlatforms: [],\n  memoryCrystals: [\n${memoryCrystals}\n  ],\n  enemies: [\n${enemies}\n  ],\n  player: {\n${player}\n  },\n};\n\nexport default ${levelId};\n`;

      this.downloadLevelFile(`${levelId}.ts`, fileContent);
    });
  }

  /**
   * Present a small modal form to collect level ID and name in one go.
   */
  private showSaveForm(onSave: (id: string, name: string) => void): void {
    const modal = document.createElement("div");
    Object.assign(modal.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: "1002",
    });

    const form = document.createElement("div");
    Object.assign(form.style, {
      backgroundColor: "#222",
      padding: "20px",
      borderRadius: "8px",
      width: "300px",
      color: "white",
      fontFamily: "monospace",
    });

    const title = document.createElement("h3");
    title.textContent = "Save Level";
    title.style.marginTop = "0";
    form.appendChild(title);

    const idInput = document.createElement("input");
    idInput.type = "text";
    idInput.placeholder = "level id (e.g., level3)";
    idInput.value = `level${this.gameState.levelManager.getLevelIds().length + 1}`;
    Object.assign(idInput.style, { width: "100%", marginBottom: "10px" });
    form.appendChild(idInput);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "level name";
    nameInput.value = `Custom Level ${this.gameState.levelManager.getLevelIds().length + 1}`;
    Object.assign(nameInput.style, { width: "100%", marginBottom: "10px" });
    form.appendChild(nameInput);

    const buttonContainer = document.createElement("div");
    Object.assign(buttonContainer.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(modal);
    buttonContainer.appendChild(cancelBtn);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Download";
    saveBtn.onclick = () => {
      const idVal = idInput.value.trim();
      const nameVal = nameInput.value.trim();
      if (!idVal || !nameVal) {
        alert("Please provide both ID and name.");
        return;
      }
      document.body.removeChild(modal);
      onSave(idVal, nameVal);
    };
    buttonContainer.appendChild(saveBtn);

    form.appendChild(buttonContainer);
    modal.appendChild(form);
    document.body.appendChild(modal);
  }

  /**
   * Trigger a client-side download of the generated level file.
   */
  private downloadLevelFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

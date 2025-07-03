import { EditorMode } from "./EditorModes";

export class EditorUI {
  private editorContainer: HTMLDivElement | null = null;
  private scrollIndicator: HTMLDivElement | null = null;
  private onModeChange: (mode: EditorMode) => void;
  private onUndo: () => void;
  private onRedo: () => void;
  private onSave: () => void;
  private onClose: () => void;
  private onColorChange: (color: string) => void;
  private onLevelSizeChange: (width: number, height: number) => void;
  private onDirectionChange: (direction: number) => void;

  constructor(callbacks: {
    onModeChange: (mode: EditorMode) => void;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    onClose: () => void;
    onColorChange: (color: string) => void;
    onLevelSizeChange: (width: number, height: number) => void;
    onDirectionChange: (direction: number) => void;
  }) {
    this.onModeChange = callbacks.onModeChange;
    this.onUndo = callbacks.onUndo;
    this.onRedo = callbacks.onRedo;
    this.onSave = callbacks.onSave;
    this.onClose = callbacks.onClose;
    this.onColorChange = callbacks.onColorChange;
    this.onLevelSizeChange = callbacks.onLevelSizeChange;
    this.onDirectionChange = callbacks.onDirectionChange;
  }

  createEditorUI(
    currentMode: EditorMode,
    platformColor: string,
    levelWidth: number,
    levelHeight: number,
    onUndoRedoKeys: (e: KeyboardEvent) => void,
  ): void {
    // Create editor container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "10px";
    container.style.left = "10px";
    container.style.padding = "15px";
    container.style.background =
      "linear-gradient(145deg, rgba(25, 15, 40, 0.95), rgba(15, 10, 30, 0.95))";
    container.style.color = "#FFD700";
    container.style.borderRadius = "10px";
    container.style.zIndex = "1000";
    container.style.fontFamily = "'Orbitron', monospace";
    container.style.fontSize = "14px";
    container.style.border = "2px solid #D4AF37";
    container.style.boxShadow = "0 0 20px rgba(212, 175, 55, 0.3)";

    // Create title
    const title = document.createElement("h3");
    title.textContent = "Level Editor";
    title.style.margin = "0 0 10px 0";
    container.appendChild(title);

    // Level size controls
    this.createLevelSizeControls(container, levelWidth, levelHeight);

    // Create instructions for scrolling
    this.createScrollInstructions(container);

    // Create mode buttons
    this.createModeButtons(container, currentMode);

    // Color picker for platforms
    this.createColorPicker(container, currentMode, platformColor);

    // Action buttons (Save/Load/Undo/Redo)
    this.createActionButtons(container);

    // Add container to page
    document.body.appendChild(container);
    this.editorContainer = container;

    // Keyboard shortcuts
    window.addEventListener("keydown", onUndoRedoKeys);
  }

  private createLevelSizeControls(
    container: HTMLDivElement,
    levelWidth: number,
    levelHeight: number,
  ): void {
    const sizeContainer = document.createElement("div");
    sizeContainer.style.marginBottom = "10px";
    sizeContainer.style.display = "flex";
    sizeContainer.style.gap = "10px";
    sizeContainer.style.alignItems = "center";

    // Width input
    const widthLabel = document.createElement("label");
    widthLabel.textContent = "Width: ";
    sizeContainer.appendChild(widthLabel);

    const widthInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.min = "320";
    widthInput.max = "10000";
    widthInput.value = String(levelWidth);
    widthInput.style.width = "70px";
    widthInput.addEventListener("change", () => {
      const val = Math.max(320, Math.min(10000, parseInt(widthInput.value, 10)));
      widthInput.value = String(val);
      this.onLevelSizeChange(val, parseInt(heightInput.value, 10));
    });
    sizeContainer.appendChild(widthInput);

    // Height input
    const heightLabel = document.createElement("label");
    heightLabel.textContent = "Height: ";
    sizeContainer.appendChild(heightLabel);

    const heightInput = document.createElement("input");
    heightInput.type = "number";
    heightInput.min = "240";
    heightInput.max = "2000";
    heightInput.value = String(levelHeight);
    heightInput.style.width = "70px";
    heightInput.addEventListener("change", () => {
      const val = Math.max(240, Math.min(2000, parseInt(heightInput.value, 10)));
      heightInput.value = String(val);
      this.onLevelSizeChange(parseInt(widthInput.value, 10), val);
    });
    sizeContainer.appendChild(heightInput);

    container.appendChild(sizeContainer);
  }

  private createScrollInstructions(container: HTMLDivElement): void {
    const scrollInstructions = document.createElement("div");
    scrollInstructions.style.fontSize = "12px";
    scrollInstructions.style.marginBottom = "10px";
    scrollInstructions.style.color = "#aaa";
    scrollInstructions.innerHTML =
      "Scroll: Middle mouse drag, mouse wheel, or arrow keys<br>" +
      "Hold Shift + arrows for faster scrolling";
    container.appendChild(scrollInstructions);
  }

  private createModeButtons(container: HTMLDivElement, currentMode: EditorMode): void {
    const modeContainer = document.createElement("div");
    modeContainer.style.marginBottom = "10px";

    const createModeButton = (mode: EditorMode, label: string) => {
      const button = document.createElement("button");
      button.textContent = label;
      button.className = "arcade-button";
      button.style.margin = "0 5px 5px 0";
      if (currentMode === mode) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        this.onModeChange(mode);
        // Update button styles
        Array.from(modeContainer.children).forEach((btn) => {
          (btn as HTMLButtonElement).classList.remove("selected");
        });
        button.classList.add("selected");
      });

      modeContainer.appendChild(button);
    };

    createModeButton(EditorMode.SELECT, "Select");
    createModeButton(EditorMode.AREA_SELECT, "Area Select");
    createModeButton(EditorMode.PLATFORM, "Platform");
    createModeButton(EditorMode.SOLID_BLOCK, "Solid Block");
    createModeButton(EditorMode.CANDLE, "Candle");
    createModeButton(EditorMode.GHOST, "Ghost");
    createModeButton(EditorMode.LANDGHOST, "Land Ghost");
    createModeButton(EditorMode.PLAYER, "Player");
    createModeButton(EditorMode.DELETE, "Delete");

    container.appendChild(modeContainer);
  }

  private createColorPicker(
    container: HTMLDivElement,
    currentMode: EditorMode,
    platformColor: string,
  ): void {
    if (currentMode === EditorMode.PLATFORM) {
      const colorContainer = document.createElement("div");
      colorContainer.style.marginBottom = "10px";

      const colorLabel = document.createElement("label");
      colorLabel.textContent = "Platform Color: ";
      colorContainer.appendChild(colorLabel);

      const colorPicker = document.createElement("input");
      colorPicker.type = "color";
      colorPicker.value = platformColor;
      colorPicker.addEventListener("change", (e) => {
        this.onColorChange((e.target as HTMLInputElement).value);
      });
      colorContainer.appendChild(colorPicker);

      container.appendChild(colorContainer);
    }
  }

  private createActionButtons(container: HTMLDivElement): void {
    const actionContainer = document.createElement("div");

    // Undo button
    const undoButton = document.createElement("button");
    undoButton.textContent = "Undo";
    undoButton.className = "arcade-button";
    undoButton.style.margin = "0 5px 0 0";
    undoButton.addEventListener("click", () => this.onUndo());
    actionContainer.appendChild(undoButton);

    // Redo button
    const redoButton = document.createElement("button");
    redoButton.textContent = "Redo";
    redoButton.className = "arcade-button";
    redoButton.style.margin = "0 5px 0 0";
    redoButton.addEventListener("click", () => this.onRedo());
    actionContainer.appendChild(redoButton);

    // Save button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Level";
    saveButton.className = "arcade-button";
    saveButton.style.margin = "0 5px 0 0";
    saveButton.addEventListener("click", () => this.onSave());
    actionContainer.appendChild(saveButton);

    // Close button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Close Editor";
    cancelButton.className = "arcade-button";
    cancelButton.style.margin = "0";
    cancelButton.addEventListener("click", () => this.onClose());
    actionContainer.appendChild(cancelButton);

    container.appendChild(actionContainer);
  }

  createScrollIndicator(): void {
    const indicator = document.createElement("div");
    indicator.style.position = "fixed";
    indicator.style.bottom = "10px";
    indicator.style.right = "10px";
    indicator.style.padding = "8px 12px";
    indicator.style.background =
      "linear-gradient(145deg, rgba(25, 15, 40, 0.95), rgba(15, 10, 30, 0.95))";
    indicator.style.color = "#FFD700";
    indicator.style.borderRadius = "5px";
    indicator.style.zIndex = "1000";
    indicator.style.fontFamily = "'Orbitron', monospace";
    indicator.style.fontSize = "12px";
    indicator.style.border = "1px solid #D4AF37";
    indicator.style.boxShadow = "0 0 10px rgba(212, 175, 55, 0.3)";
    indicator.textContent = "Scroll: 0, 0";

    document.body.appendChild(indicator);
    this.scrollIndicator = indicator;
  }

  updateScrollIndicator(x: number, y: number): void {
    if (!this.scrollIndicator) return;
    this.scrollIndicator.textContent = `Scroll: ${Math.round(x)}, ${Math.round(y)}`;
  }

  getEditorContainer(): HTMLDivElement | null {
    return this.editorContainer;
  }

  updateSelectionInfo(selectedCount: number): void {
    const container = this.getEditorContainer();
    if (!container) return;

    // Remove existing selection info
    const existingInfo = container.querySelector(".selection-info");
    if (existingInfo) {
      existingInfo.remove();
    }

    if (selectedCount > 0) {
      const infoContainer = document.createElement("div");
      infoContainer.className = "selection-info";
      infoContainer.style.marginBottom = "10px";
      infoContainer.style.padding = "8px";
      infoContainer.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
      infoContainer.style.borderRadius = "3px";
      infoContainer.style.border = "1px solid #D4AF37";
      infoContainer.style.fontSize = "12px";

      const text = document.createElement("div");
      text.textContent = `${selectedCount} object${selectedCount > 1 ? "s" : ""} selected`;
      text.style.marginBottom = "5px";
      infoContainer.appendChild(text);

      const deleteHint = document.createElement("div");
      deleteHint.textContent = "Press Delete or Backspace to remove";
      deleteHint.style.fontSize = "11px";
      deleteHint.style.color = "#aaa";
      infoContainer.appendChild(deleteHint);

      container.appendChild(infoContainer);
    }
  }

  createDirectionControls(
    container: HTMLDivElement,
    selectedEnemy: { type?: string; direction?: number } | null,
  ): void {
    // Remove any existing direction controls
    const existingControls = container.querySelector(".direction-controls");
    if (existingControls) {
      existingControls.remove();
    }

    if (!selectedEnemy || (selectedEnemy.type !== "ghost" && selectedEnemy.type !== "landghost")) {
      return;
    }

    const directionContainer = document.createElement("div");
    directionContainer.className = "direction-controls";
    directionContainer.style.marginBottom = "10px";
    directionContainer.style.padding = "10px";
    directionContainer.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    directionContainer.style.borderRadius = "3px";

    const title = document.createElement("div");
    title.textContent = "Enemy Direction:";
    title.style.marginBottom = "5px";
    title.style.fontWeight = "bold";
    directionContainer.appendChild(title);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "5px";

    // Left direction button
    const leftButton = document.createElement("button");
    leftButton.textContent = "← Left";
    leftButton.className = "arcade-button";
    if (selectedEnemy.direction === -1) {
      leftButton.classList.add("selected");
    }
    leftButton.addEventListener("click", () => {
      this.onDirectionChange(-1);
      leftButton.classList.add("selected");
      rightButton.classList.remove("selected");
    });
    buttonContainer.appendChild(leftButton);

    // Right direction button
    const rightButton = document.createElement("button");
    rightButton.textContent = "Right →";
    rightButton.className = "arcade-button";
    if (selectedEnemy.direction === 1) {
      rightButton.classList.add("selected");
    }
    rightButton.addEventListener("click", () => {
      this.onDirectionChange(1);
      rightButton.classList.add("selected");
      leftButton.classList.remove("selected");
    });
    buttonContainer.appendChild(rightButton);

    directionContainer.appendChild(buttonContainer);
    container.appendChild(directionContainer);
  }

  cleanup(): void {
    if (this.editorContainer?.parentElement) {
      this.editorContainer.parentElement.removeChild(this.editorContainer);
      this.editorContainer = null;
    }

    if (this.scrollIndicator?.parentElement) {
      this.scrollIndicator.parentElement.removeChild(this.scrollIndicator);
      this.scrollIndicator = null;
    }
  }
}

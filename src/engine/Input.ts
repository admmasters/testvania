export class Input {
  keys: Record<string, boolean>;
  keysPressed: Record<string, boolean>;

  constructor() {
    this.keys = {};
    this.keysPressed = {};
    this.setupEventListeners();
  }

  setupEventListeners(): void {
    document.addEventListener("keydown", (e) => {
      console.log("Key pressed:", e.code);
      if (!this.keys[e.code]) {
        this.keysPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
      this.keysPressed[e.code] = false;
    });
  }

  isKeyDown(key: string): boolean {
    return !!this.keys[key];
  }

  isKeyPressed(key: string): boolean {
    return !!this.keysPressed[key];
  }

  isAnyKeyPressed(): boolean {
    return Object.keys(this.keysPressed).some((key) => this.keysPressed[key]);
  }

  update(): void {
    // Clear pressed keys after each frame
    this.keysPressed = {};
  }
}

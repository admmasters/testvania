import { Vector2 } from "./Vector2";

export class Camera {
  position: Vector2;
  shakeTimer: number;
  shakeDuration: number;
  shakeIntensity: number;
  shakeOffset: Vector2;

  constructor() {
    this.position = new Vector2(0, 0);
    this.shakeTimer = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffset = new Vector2(0, 0);
  }

  /**
   * Center the camera on the player, clamped to the level bounds.
   * @param playerPos The player's position (Vector2)
   * @param levelWidth The width of the level in pixels
   * @param levelHeight The height of the level in pixels
   * @param viewportWidth The width of the viewport (canvas)
   * @param viewportHeight The height of the viewport (canvas)
   */
  followPlayer(
    playerPos: Vector2,
    levelWidth: number,
    levelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    // Center camera on player
    let camX = playerPos.x - viewportWidth / 2;
    let camY = playerPos.y - viewportHeight / 2;

    // Clamp camera to level bounds
    camX = Math.max(0, Math.min(camX, levelWidth - viewportWidth));
    camY = Math.max(0, Math.min(camY, levelHeight - viewportHeight));

    // Round to integer pixels for pixel-perfect rendering
    this.position.x = Math.round(camX);
    this.position.y = Math.round(camY);
  }

  update(deltaTime: number): void {
    this.updateShake(deltaTime);
  }

  updateShake(deltaTime: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;

      const intensity = (this.shakeTimer / this.shakeDuration) * this.shakeIntensity;
      this.shakeOffset.x = (Math.random() - 0.5) * intensity * 2;
      this.shakeOffset.y = (Math.random() - 0.5) * intensity * 2;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }

  shake(duration: number, intensity: number): void {
    this.shakeTimer = duration;
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  apply(ctx: CanvasRenderingContext2D): void {
    // Round to integer pixels for pixel-perfect rendering
    const x = Math.round(-this.position.x + this.shakeOffset.x);
    const y = Math.round(-this.position.y + this.shakeOffset.y);
    ctx.translate(x, y);
  }

  reset(ctx: CanvasRenderingContext2D): void {
    // Round to integer pixels for pixel-perfect rendering
    const x = Math.round(this.position.x - this.shakeOffset.x);
    const y = Math.round(this.position.y - this.shakeOffset.y);
    ctx.translate(x, y);
  }
}

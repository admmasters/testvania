import { Vector2 } from "./Vector2";
import { GameState } from "./GameState";

export class GameObject {
  position: Vector2;
  velocity: Vector2;
  size: Vector2;
  active: boolean;
  health: number;
  maxHealth: number;
  shakeOffset: Vector2;
  shakeIntensity: number;
  shakeTimer: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.size = new Vector2(width, height);
    this.active = true;
    this.health = 1;
    this.maxHealth = 1;
    this.shakeOffset = new Vector2(0, 0);
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_deltaTime: number, _gameState: GameState): void {
    // Override in subclasses
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(_ctx: CanvasRenderingContext2D): void {
    // Override in subclasses
  }

  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.position.x,
      right: this.position.x + this.size.x,
      top: this.position.y,
      bottom: this.position.y + this.size.y,
    };
  }

  checkCollision(other: GameObject): boolean {
    const a = this.getBounds();
    const b = other.getBounds();

    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
    }
  }

  startShake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  updateShake(deltaTime: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      
      // Generate random shake offset
      const shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeOffset.x = shakeX;
      this.shakeOffset.y = shakeY;
      
      if (this.shakeTimer <= 0) {
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
        this.shakeIntensity = 0;
      }
    }
  }

  getRenderPosition(): Vector2 {
    return new Vector2(
      this.position.x + this.shakeOffset.x,
      this.position.y + this.shakeOffset.y
    );
  }
}

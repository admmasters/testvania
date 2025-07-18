import type { GameState } from "./GameState";
import { Vector2 } from "./Vector2";

export type ShakeType = 'random' | 'horizontal' | 'vertical';

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
  shakeType: ShakeType;
  shakeFrequency: number;

  constructor(args: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    const { x, y, width, height } = args;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.size = new Vector2(width, height);
    this.active = true;
    this.health = 1;
    this.maxHealth = 1;
    this.shakeOffset = new Vector2(0, 0);
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.shakeType = 'random';
    this.shakeFrequency = 15; // Hz - how fast the shake oscillates
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

  startShake(intensity: number, duration: number, shakeType: ShakeType = 'random', frequency: number = 15): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
    this.shakeType = shakeType;
    this.shakeFrequency = frequency;
  }

  updateShake(deltaTime: number, isFrozen: boolean): void {
    if (isFrozen) return;
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;

      // Calculate shake offset based on shake type
      switch (this.shakeType) {
        case 'horizontal': {
          // Side-to-side motion using sine wave for smooth oscillation
          const time = Date.now() / 1000; // Convert to seconds
          this.shakeOffset.x = Math.sin(time * this.shakeFrequency * Math.PI * 2) * this.shakeIntensity;
          this.shakeOffset.y = 0;
          break;
        }
        
        case 'vertical': {
          // Up-and-down motion
          const timeV = Date.now() / 1000;
          this.shakeOffset.x = 0;
          this.shakeOffset.y = Math.sin(timeV * this.shakeFrequency * Math.PI * 2) * this.shakeIntensity;
          break;
        }
        
        default:
          // Original random shake
          this.shakeOffset.x = (Math.random() - 0.5) * 2 * this.shakeIntensity;
          this.shakeOffset.y = (Math.random() - 0.5) * 2 * this.shakeIntensity;
          break;
      }

      if (this.shakeTimer <= 0) {
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
        this.shakeIntensity = 0;
      }
    }
  }

  getRenderPosition(): Vector2 {
    // Round to integer pixels for pixel-perfect rendering
    const x = Math.round(this.position.x + this.shakeOffset.x);
    const y = Math.round(this.position.y + this.shakeOffset.y);
    return new Vector2(x, y);
  }
}

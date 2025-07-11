import { Vector2 } from "../../engine/Vector2.js";

export class CrystalVisualEffects {
  private pulseTimer: number = 0;
  private pulsePhase: number;
  private resonanceLevel: number = 0;
  private colorPhase: number = 0;

  constructor() {
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(deltaTime: number, playerPosition?: Vector2, crystalPosition?: Vector2): void {
    this.pulseTimer += deltaTime;
    this.colorPhase += deltaTime * 0.5;

    if (playerPosition && crystalPosition) {
      this.updateResonance(playerPosition, crystalPosition);
    }
  }

  private updateResonance(playerPosition: Vector2, crystalPosition: Vector2): void {
    const distance = Vector2.distance(crystalPosition, playerPosition);
    const maxResonanceDistance = 80;
    this.resonanceLevel = Math.max(0, 1 - distance / maxResonanceDistance);
  }

  getPulseIntensity(): number {
    return 0.3 + Math.sin(this.pulseTimer * 4 + this.pulsePhase) * 0.2;
  }

  getResonanceLevel(): number {
    return this.resonanceLevel;
  }

  getColorPhase(): number {
    return this.colorPhase;
  }

  getPulseTimer(): number {
    return this.pulseTimer;
  }

  reset(): void {
    this.pulseTimer = 0;
    this.resonanceLevel = 0;
    this.colorPhase = 0;
  }
}
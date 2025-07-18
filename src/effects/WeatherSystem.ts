import type { GameState } from "../engine/GameState";
import type { RainSystem } from "./RainSystem";
import type { LightningSystem } from "./LightningSystem";

export class WeatherSystem {
  private rainSystem: RainSystem;
  private lightningSystem: LightningSystem;
  private stormIntensity: number = 0.5;
  private weatherTransitionTimer: number = 0;
  private targetStormIntensity: number = 0.5;
  private transitionSpeed: number = 0.1;

  constructor(rainSystem: RainSystem, lightningSystem: LightningSystem) {
    this.rainSystem = rainSystem;
    this.lightningSystem = lightningSystem;
    this.synchronizeWeatherSystems();
  }

  private synchronizeWeatherSystems(): void {
    this.rainSystem.setIntensity(this.stormIntensity);
    this.lightningSystem.setStormIntensity(this.stormIntensity);
  }

  update(deltaTime: number): void {
    this.weatherTransitionTimer += deltaTime;

    if (Math.abs(this.stormIntensity - this.targetStormIntensity) > 0.01) {
      const direction = this.targetStormIntensity > this.stormIntensity ? 1 : -1;
      this.stormIntensity += direction * this.transitionSpeed * deltaTime;
      this.stormIntensity = Math.max(0, Math.min(1, this.stormIntensity));
      
      this.synchronizeWeatherSystems();
    }

    if (this.weatherTransitionTimer > 30 + Math.random() * 60) {
      this.targetStormIntensity = Math.random();
      this.weatherTransitionTimer = 0;
    }
  }

  setStormIntensity(intensity: number): void {
    this.targetStormIntensity = Math.max(0, Math.min(1, intensity));
  }

  getStormIntensity(): number {
    return this.stormIntensity;
  }

  triggerLightningStrike(gameState: GameState): void {
    this.lightningSystem.triggerImmediateLightning(gameState);
  }

  setWeatherMode(mode: 'clear' | 'light' | 'moderate' | 'heavy' | 'storm'): void {
    switch (mode) {
      case 'clear':
        this.setStormIntensity(0);
        break;
      case 'light':
        this.setStormIntensity(0.2);
        break;
      case 'moderate':
        this.setStormIntensity(0.5);
        break;
      case 'heavy':
        this.setStormIntensity(0.8);
        break;
      case 'storm':
        this.setStormIntensity(1.0);
        break;
    }
  }

  clear(): void {
    this.rainSystem.clear();
    this.lightningSystem.clear();
    this.stormIntensity = 0;
    this.targetStormIntensity = 0;
  }
}
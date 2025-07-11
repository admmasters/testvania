import { Vector2 } from "../engine/Vector2";

export class LightingEffects {
  private lightningLightSources: Array<{
    position: Vector2;
    intensity: number;
    radius: number;
    life: number;
    maxLife: number;
    color: string;
  }> = [];

  addLightningLight(position: Vector2, intensity: number): void {
    this.lightningLightSources.push({
      position: position.copy(),
      intensity,
      radius: 200 + intensity * 300,
      life: 0,
      maxLife: 0.2,
      color: `rgba(200, 220, 255, ${intensity * 0.3})`,
    });
  }

  update(deltaTime: number): void {
    for (let i = this.lightningLightSources.length - 1; i >= 0; i--) {
      const light = this.lightningLightSources[i];
      light.life += deltaTime;
      
      if (light.life >= light.maxLife) {
        this.lightningLightSources.splice(i, 1);
      }
    }
  }

  renderObjectLighting(ctx: CanvasRenderingContext2D, objectPosition: Vector2, objectSize: Vector2): void {
    if (this.lightningLightSources.length === 0) return;
    
    ctx.save();
    
    for (const light of this.lightningLightSources) {
      const distance = Vector2.distance(light.position, objectPosition);
      
      if (distance < light.radius) {
        const lightStrength = (1 - distance / light.radius) * light.intensity;
        const lifeRatio = 1 - (light.life / light.maxLife);
        const finalStrength = lightStrength * lifeRatio;
        
        if (finalStrength > 0.1) {
          ctx.fillStyle = `rgba(200, 220, 255, ${finalStrength * 0.2})`;
          ctx.fillRect(
            objectPosition.x - 5,
            objectPosition.y - 5,
            objectSize.x + 10,
            objectSize.y + 10
          );
        }
      }
    }
    
    ctx.restore();
  }

  renderAmbientLighting(ctx: CanvasRenderingContext2D): void {
    if (this.lightningLightSources.length === 0) return;
    
    ctx.save();
    
    for (const light of this.lightningLightSources) {
      const lifeRatio = 1 - (light.life / light.maxLife);
      const alpha = light.intensity * lifeRatio * 0.1;
      
      if (alpha > 0.01) {
        const gradient = ctx.createRadialGradient(
          light.position.x,
          light.position.y,
          0,
          light.position.x,
          light.position.y,
          light.radius
        );
        
        gradient.addColorStop(0, `rgba(200, 220, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          light.position.x - light.radius,
          light.position.y - light.radius,
          light.radius * 2,
          light.radius * 2
        );
      }
    }
    
    ctx.restore();
  }

  clear(): void {
    this.lightningLightSources = [];
  }
}
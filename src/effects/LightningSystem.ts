import { Vector2 } from "../engine/Vector2";
import type { GameState } from "../engine/GameState";
import { LightingEffects } from "./LightingEffects";

interface LightningSegment {
  start: Vector2;
  end: Vector2;
  thickness: number;
  brightness: number;
  branchLevel: number;
}

interface LightningBolt {
  segments: LightningSegment[];
  mainPath: Vector2[];
  branches: LightningSegment[];
  life: number;
  maxLife: number;
  flickerTimer: number;
  flickerState: boolean;
  intensity: number;
  active: boolean;
}

interface LightningFlash {
  intensity: number;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}

interface ThunderEffect {
  shakeIntensity: number;
  shakeTimer: number;
  shakeDuration: number;
  active: boolean;
}

export class LightningSystem {
  private lightningBolts: LightningBolt[] = [];
  private lightningFlashes: LightningFlash[] = [];
  private thunderEffects: ThunderEffect[] = [];
  private nextLightningTimer: number = 0;
  private minLightningInterval: number = 3;
  private maxLightningInterval: number = 8;
  private ambientLightLevel: number = 0;
  private stormIntensity: number = 0.5;
  private lightingEffects: LightingEffects;

  constructor() {
    this.lightingEffects = new LightingEffects();
    this.scheduleNextLightning();
  }

  private scheduleNextLightning(): void {
    const interval = this.minLightningInterval + 
      Math.random() * (this.maxLightningInterval - this.minLightningInterval);
    this.nextLightningTimer = interval / (0.5 + this.stormIntensity);
  }

  private generateLightningBolt(gameState: GameState): LightningBolt {
    const camera = gameState.camera;
    const screenTop = camera.position.y - 200;
    const screenBottom = camera.position.y + 800;
    const screenLeft = camera.position.x - 100;
    const screenRight = camera.position.x + 900;

    const startX = screenLeft + Math.random() * (screenRight - screenLeft);
    const startY = screenTop;
    const endX = startX + (Math.random() - 0.5) * 400;
    const endY = screenBottom;

    const mainPath = this.generateMainPath(
      new Vector2(startX, startY),
      new Vector2(endX, endY)
    );

    const segments = this.generateSegments(mainPath);
    const branches = this.generateBranches(mainPath);

    return {
      segments,
      mainPath,
      branches,
      life: 0,
      maxLife: 0.15 + Math.random() * 0.15,
      flickerTimer: 0,
      flickerState: true,
      intensity: 0.8 + Math.random() * 0.2,
      active: true,
    };
  }

  private generateMainPath(start: Vector2, end: Vector2): Vector2[] {
    const path: Vector2[] = [start];
    const segments = 15 + Math.random() * 10;
    
    for (let i = 1; i < segments; i++) {
      const progress = i / segments;
      const baseX = start.x + (end.x - start.x) * progress;
      const baseY = start.y + (end.y - start.y) * progress;
      
      const jitterX = (Math.random() - 0.5) * 80 * (1 - Math.abs(progress - 0.5) * 2);
      const jitterY = (Math.random() - 0.5) * 40;
      
      path.push(new Vector2(baseX + jitterX, baseY + jitterY));
    }
    
    path.push(end);
    return path;
  }

  private generateSegments(path: Vector2[]): LightningSegment[] {
    const segments: LightningSegment[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const progress = i / (path.length - 1);
      const thickness = 3 + (1 - progress) * 4;
      const brightness = 0.8 + Math.random() * 0.2;
      
      segments.push({
        start: path[i],
        end: path[i + 1],
        thickness,
        brightness,
        branchLevel: 0,
      });
    }
    
    return segments;
  }

  private generateBranches(mainPath: Vector2[]): LightningSegment[] {
    const branches: LightningSegment[] = [];
    const branchPoints = Math.floor(mainPath.length * 0.3);
    
    for (let i = 0; i < branchPoints; i++) {
      const mainIndex = Math.floor(Math.random() * (mainPath.length - 1));
      const branchStart = mainPath[mainIndex];
      
      const branchLength = 80 + Math.random() * 120;
      const branchAngle = (Math.random() - 0.5) * Math.PI * 0.8;
      
      const branchSegments = 3 + Math.random() * 4;
      let currentPoint = branchStart;
      
      for (let j = 0; j < branchSegments; j++) {
        const segmentLength = branchLength / branchSegments;
        const jitter = (Math.random() - 0.5) * 30;
        
        const nextPoint = new Vector2(
          currentPoint.x + Math.cos(branchAngle) * segmentLength + jitter,
          currentPoint.y + Math.sin(branchAngle) * segmentLength + jitter
        );
        
        branches.push({
          start: currentPoint,
          end: nextPoint,
          thickness: 1 + Math.random() * 2,
          brightness: 0.6 + Math.random() * 0.3,
          branchLevel: 1,
        });
        
        currentPoint = nextPoint;
        
        if (Math.random() < 0.3) {
          const subBranch = this.generateSubBranch(currentPoint, branchAngle, 2);
          branches.push(...subBranch);
        }
      }
    }
    
    return branches;
  }

  private generateSubBranch(start: Vector2, baseAngle: number, level: number): LightningSegment[] {
    if (level > 3) return [];
    
    const branches: LightningSegment[] = [];
    const branchLength = 40 / level;
    const branchAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.6;
    
    const segments = 2 + Math.random() * 2;
    let currentPoint = start;
    
    for (let i = 0; i < segments; i++) {
      const segmentLength = branchLength / segments;
      const jitter = (Math.random() - 0.5) * 20;
      
      const nextPoint = new Vector2(
        currentPoint.x + Math.cos(branchAngle) * segmentLength + jitter,
        currentPoint.y + Math.sin(branchAngle) * segmentLength + jitter
      );
      
      branches.push({
        start: currentPoint,
        end: nextPoint,
        thickness: Math.max(0.5, 2 - level * 0.5),
        brightness: Math.max(0.3, 0.8 - level * 0.2),
        branchLevel: level,
      });
      
      currentPoint = nextPoint;
    }
    
    return branches;
  }

  private createLightningFlash(intensity: number): void {
    this.lightningFlashes.push({
      intensity,
      life: 0,
      maxLife: 0.08,
      color: "#FFFFFF",
      active: true,
    });
  }

  private createThunderEffect(delay: number): void {
    setTimeout(() => {
      this.thunderEffects.push({
        shakeIntensity: 4 + Math.random() * 6,
        shakeTimer: 0,
        shakeDuration: 0.3 + Math.random() * 0.4,
        active: true,
      });
    }, delay * 1000);
  }

  private triggerLightning(gameState: GameState): void {
    const bolt = this.generateLightningBolt(gameState);
    this.lightningBolts.push(bolt);
    
    this.createLightningFlash(bolt.intensity);
    
    const thunderDelay = 1 + Math.random() * 3;
    this.createThunderEffect(thunderDelay);
    
    this.ambientLightLevel = 0.3;
    
    // Add lighting effects for the main path
    const midPoint = Math.floor(bolt.mainPath.length / 2);
    if (bolt.mainPath[midPoint]) {
      this.lightingEffects.addLightningLight(bolt.mainPath[midPoint], bolt.intensity);
    }
  }

  update(deltaTime: number, gameState: GameState): void {
    this.nextLightningTimer -= deltaTime;
    if (this.nextLightningTimer <= 0) {
      this.triggerLightning(gameState);
      this.scheduleNextLightning();
    }

    this.ambientLightLevel = Math.max(0, this.ambientLightLevel - deltaTime * 0.5);

    this.lightingEffects.update(deltaTime);

    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      bolt.life += deltaTime;
      
      bolt.flickerTimer += deltaTime;
      if (bolt.flickerTimer > 0.02) {
        bolt.flickerState = !bolt.flickerState;
        bolt.flickerTimer = 0;
      }
      
      if (bolt.life >= bolt.maxLife) {
        bolt.active = false;
        this.lightningBolts.splice(i, 1);
      }
    }

    for (let i = this.lightningFlashes.length - 1; i >= 0; i--) {
      const flash = this.lightningFlashes[i];
      flash.life += deltaTime;
      
      if (flash.life >= flash.maxLife) {
        flash.active = false;
        this.lightningFlashes.splice(i, 1);
      }
    }

    for (let i = this.thunderEffects.length - 1; i >= 0; i--) {
      const thunder = this.thunderEffects[i];
      thunder.shakeTimer += deltaTime;
      
      if (thunder.shakeTimer >= thunder.shakeDuration) {
        thunder.active = false;
        this.thunderEffects.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    this.renderFlashEffects(ctx);
    this.lightingEffects.renderAmbientLighting(ctx);
    this.renderLightningBolts(ctx);
    this.renderAmbientLighting(ctx);
    this.applyThunderShake(ctx);

    ctx.restore();
  }

  private renderFlashEffects(ctx: CanvasRenderingContext2D): void {
    for (const flash of this.lightningFlashes) {
      if (!flash.active) continue;
      
      const flashProgress = flash.life / flash.maxLife;
      const flashIntensity = flash.intensity * (1 - flashProgress);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.4})`;
      ctx.fillRect(-2000, -2000, 4000, 4000);
      
      ctx.fillStyle = `rgba(200, 220, 255, ${flashIntensity * 0.2})`;
      ctx.fillRect(-2000, -2000, 4000, 4000);
    }
  }

  private renderLightningBolts(ctx: CanvasRenderingContext2D): void {
    for (const bolt of this.lightningBolts) {
      if (!bolt.active || !bolt.flickerState) continue;
      
      const boltProgress = bolt.life / bolt.maxLife;
      const boltAlpha = bolt.intensity * (1 - boltProgress);
      
      this.renderMainBolt(ctx, bolt, boltAlpha);
      this.renderBranches(ctx, bolt, boltAlpha);
      this.renderGlowEffects(ctx, bolt, boltAlpha);
    }
  }

  private renderMainBolt(ctx: CanvasRenderingContext2D, bolt: LightningBolt, alpha: number): void {
    for (const segment of bolt.segments) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * segment.brightness})`;
      ctx.lineWidth = segment.thickness;
      ctx.beginPath();
      ctx.moveTo(segment.start.x, segment.start.y);
      ctx.lineTo(segment.end.x, segment.end.y);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * segment.brightness * 0.8})`;
      ctx.lineWidth = segment.thickness * 0.5;
      ctx.beginPath();
      ctx.moveTo(segment.start.x, segment.start.y);
      ctx.lineTo(segment.end.x, segment.end.y);
      ctx.stroke();
    }
  }

  private renderBranches(ctx: CanvasRenderingContext2D, bolt: LightningBolt, alpha: number): void {
    for (const branch of bolt.branches) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * branch.brightness * 0.7})`;
      ctx.lineWidth = branch.thickness;
      ctx.beginPath();
      ctx.moveTo(branch.start.x, branch.start.y);
      ctx.lineTo(branch.end.x, branch.end.y);
      ctx.stroke();
    }
  }

  private renderGlowEffects(ctx: CanvasRenderingContext2D, bolt: LightningBolt, alpha: number): void {
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.5})`;
    
    for (const segment of bolt.segments) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * segment.brightness * 0.3})`;
      ctx.lineWidth = segment.thickness * 3;
      ctx.beginPath();
      ctx.moveTo(segment.start.x, segment.start.y);
      ctx.lineTo(segment.end.x, segment.end.y);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
  }

  private renderAmbientLighting(ctx: CanvasRenderingContext2D): void {
    if (this.ambientLightLevel > 0) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1000);
      gradient.addColorStop(0, `rgba(200, 220, 255, ${this.ambientLightLevel * 0.1})`);
      gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(-2000, -2000, 4000, 4000);
    }
  }

  private applyThunderShake(ctx: CanvasRenderingContext2D): void {
    for (const thunder of this.thunderEffects) {
      if (!thunder.active) continue;
      
      const shakeProgress = thunder.shakeTimer / thunder.shakeDuration;
      const shakeIntensity = thunder.shakeIntensity * (1 - shakeProgress);
      
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      
      ctx.translate(shakeX, shakeY);
    }
  }

  setStormIntensity(intensity: number): void {
    this.stormIntensity = Math.max(0, Math.min(1, intensity));
    this.minLightningInterval = 8 - intensity * 6;
    this.maxLightningInterval = 15 - intensity * 10;
  }

  getStormIntensity(): number {
    return this.stormIntensity;
  }

  triggerImmediateLightning(gameState: GameState): void {
    this.triggerLightning(gameState);
  }

  clear(): void {
    this.lightningBolts = [];
    this.lightningFlashes = [];
    this.thunderEffects = [];
    this.ambientLightLevel = 0;
    this.lightingEffects.clear();
  }

  getLightingEffects(): LightingEffects {
    return this.lightingEffects;
  }
}
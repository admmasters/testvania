import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2";
import type { DiagonalPlatform } from "../objects/diagonalPlatform";
import type { Platform } from "../objects/platform";
import type { SolidBlock } from "../objects/solidBlock";

interface RainDrop {
  position: Vector2;
  velocity: Vector2;
  size: number;
  alpha: number;
  active: boolean;
}

interface RainSplash {
  position: Vector2;
  particles: Array<{
    position: Vector2;
    velocity: Vector2;
    size: number;
    life: number;
    maxLife: number;
  }>;
  active: boolean;
}

export class RainSystem {
  private rainDrops: RainDrop[] = [];
  private splashes: RainSplash[] = [];
  private maxRainDrops: number = 150;
  private spawnRate: number = 0.04;
  private spawnTimer: number = 0;
  private windForce: number = 0.5;
  private gravity: number = 500;
  private pooledDrops: RainDrop[] = [];
  private pooledSplashes: RainSplash[] = [];

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.maxRainDrops; i++) {
      this.pooledDrops.push(this.createRainDrop());
    }
    for (let i = 0; i < 50; i++) {
      this.pooledSplashes.push(this.createSplashTemplate());
    }
  }

  private createRainDrop(): RainDrop {
    return {
      position: new Vector2(0, 0),
      velocity: new Vector2(0, 0),
      size: 0,
      alpha: 0,
      active: false,
    };
  }

  private createSplashTemplate(): RainSplash {
    return {
      position: new Vector2(0, 0),
      particles: [],
      active: false,
    };
  }

  private getPooledRainDrop(): RainDrop | null {
    const drop = this.pooledDrops.find((d) => !d.active);
    if (drop) {
      drop.active = true;
      return drop;
    }
    return null;
  }

  private getPooledSplash(): RainSplash | null {
    const splash = this.pooledSplashes.find((s) => !s.active);
    if (splash) {
      splash.active = true;
      splash.particles = [];
      return splash;
    }
    return null;
  }

  private spawnRainDrop(gameState: GameState): void {
    const drop = this.getPooledRainDrop();
    if (!drop) return;

    const camera = gameState.camera;
    const screenLeft = camera.position.x - 100;
    const screenRight = camera.position.x + 900;
    const screenTop = camera.position.y - 100;

    drop.position.x = screenLeft + Math.random() * (screenRight - screenLeft);
    drop.position.y = screenTop + Math.random() * 50;
    drop.velocity.x = -this.windForce + Math.random() * this.windForce * 2;
    drop.velocity.y = 200 + Math.random() * 100;
    drop.size = 2 + Math.random() * 2;
    drop.alpha = 0.4 + Math.random() * 0.4;

    this.rainDrops.push(drop);
  }

  private checkCollision(drop: RainDrop, gameState: GameState): boolean {
    const dropBottom = drop.position.y + drop.size;
    const dropLeft = drop.position.x - drop.size / 2;
    const dropRight = drop.position.x + drop.size / 2;

    const checkPlatformCollision = (platform: Platform | SolidBlock): boolean => {
      return (
        dropBottom >= platform.position.y &&
        drop.position.y <= platform.position.y + platform.size.y &&
        dropRight >= platform.position.x &&
        dropLeft <= platform.position.x + platform.size.x
      );
    };

    const checkDiagonalPlatformCollision = (platform: DiagonalPlatform): boolean => {
      const platformTop = platform.position.y;
      const platformBottom = platform.position.y + platform.size.y;
      const platformLeft = platform.position.x;
      const platformRight = platform.position.x + platform.size.x;

      if (
        dropBottom >= platformTop &&
        drop.position.y <= platformBottom &&
        dropRight >= platformLeft &&
        dropLeft <= platformRight
      ) {
        const relativeX = drop.position.x - platformLeft;
        const normalizedX = relativeX / platform.size.x;
        const expectedY = platformTop + normalizedX * platform.size.y;
        return dropBottom >= expectedY;
      }
      return false;
    };

    for (const platform of gameState.platforms) {
      if (checkPlatformCollision(platform)) {
        this.createSplash(drop.position.x, platform.position.y);
        return true;
      }
    }

    for (const solidBlock of gameState.solidBlocks) {
      if (checkPlatformCollision(solidBlock)) {
        this.createSplash(drop.position.x, solidBlock.position.y);
        return true;
      }
    }

    for (const diagonalPlatform of gameState.diagonalPlatforms) {
      if (checkDiagonalPlatformCollision(diagonalPlatform)) {
        const relativeX = drop.position.x - diagonalPlatform.position.x;
        const normalizedX = relativeX / diagonalPlatform.size.x;
        const expectedY = diagonalPlatform.position.y + normalizedX * diagonalPlatform.size.y;
        this.createSplash(drop.position.x, expectedY);
        return true;
      }
    }

    return false;
  }

  private createSplash(x: number, y: number): void {
    const splash = this.getPooledSplash();
    if (!splash) return;

    splash.position.x = x;
    splash.position.y = y;

    const particleCount = 3 + Math.random() * 4;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.PI + Math.random() * Math.PI;
      const speed = 50 + Math.random() * 100;
      const maxLife = 0.2 + Math.random() * 0.3;

      splash.particles.push({
        position: new Vector2(x, y),
        velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        size: 1 + Math.random() * 2,
        life: 0,
        maxLife: maxLife,
      });
    }

    this.splashes.push(splash);
  }

  update(deltaTime: number, gameState: GameState): void {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnRate && this.rainDrops.length < this.maxRainDrops) {
      this.spawnRainDrop(gameState);
      this.spawnTimer = 0;
    }

    for (let i = this.rainDrops.length - 1; i >= 0; i--) {
      const drop = this.rainDrops[i];

      drop.position.x += drop.velocity.x * deltaTime;
      drop.position.y += drop.velocity.y * deltaTime;
      drop.velocity.y += this.gravity * deltaTime;

      if (this.checkCollision(drop, gameState)) {
        drop.active = false;
        this.rainDrops.splice(i, 1);
        continue;
      }

      if (drop.position.y > gameState.camera.position.y + 700) {
        drop.active = false;
        this.rainDrops.splice(i, 1);
      }
    }

    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const splash = this.splashes[i];
      let allParticlesDead = true;

      for (const particle of splash.particles) {
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        particle.velocity.y += this.gravity * deltaTime * 0.5;
        particle.life += deltaTime;

        if (particle.life < particle.maxLife) {
          allParticlesDead = false;
        }
      }

      if (allParticlesDead) {
        splash.active = false;
        this.splashes.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const drop of this.rainDrops) {
      ctx.globalAlpha = drop.alpha;
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(drop.position.x - 1, drop.position.y, 2, drop.size * 3);
    }

    for (const splash of this.splashes) {
      for (const particle of splash.particles) {
        if (particle.life >= particle.maxLife) continue;

        const lifeRatio = particle.life / particle.maxLife;
        const alpha = 1 - lifeRatio;

        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = "#B0E0E6";
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  setIntensity(intensity: number): void {
    this.spawnRate = Math.max(0.01, 0.05 - intensity * 0.04);
    this.maxRainDrops = Math.floor(100 + intensity * 100);
  }

  setWindForce(force: number): void {
    this.windForce = force;
  }

  getActiveDropCount(): number {
    return this.rainDrops.length;
  }

  clear(): void {
    this.rainDrops.forEach((drop) => {
      drop.active = false;
    });
    this.splashes.forEach((splash) => {
      splash.active = false;
    });
    this.rainDrops = [];
    this.splashes = [];
  }

  // Adds initial raindrops so the effect is visible as soon as the game starts.
  seedInitialRain(gameState: GameState, fillRatio: number = 0.7): void {
    // Ensure ratio is clamped between 0 and 1
    const ratio = Math.max(0, Math.min(1, fillRatio));
    const initialCount = Math.floor(this.maxRainDrops * ratio);

    for (let i = 0; i < initialCount; i++) {
      // Spawn drops using the existing spawn helper so all normal rules apply
      this.spawnRainDrop(gameState);
    }
  }
}

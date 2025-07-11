import { Vector2 } from "../../engine/Vector2.js";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private particleTimer: number = 0;
  private position: Vector2;
  private size: Vector2;

  constructor(position: Vector2, size: Vector2) {
    this.position = position;
    this.size = size;
  }

  update(deltaTime: number): void {
    this.updateParticles(deltaTime);
    this.updateParticleSpawning(deltaTime);
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.life += deltaTime;

      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateParticleSpawning(deltaTime: number): void {
    this.particleTimer += deltaTime;
    if (this.particleTimer > 0.3) {
      this.spawnAmbientParticle();
      this.particleTimer = 0;
    }
  }

  private spawnAmbientParticle(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 10;
    const speed = 10 + Math.random() * 20;

    this.particles.push({
      position: vec2(
        this.position.x + this.size.x / 2 + Math.cos(angle) * radius,
        this.position.y + this.size.y / 2 + Math.sin(angle) * radius,
      ),
      velocity: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 30),
      life: 0,
      maxLife: 1.5 + Math.random() * 0.5,
      size: 1 + Math.random() * 2,
    });
  }

  spawnBreakParticles(count: number = 3): void {
    for (let i = 0; i < count; i++) {
      this.spawnBreakParticle();
    }
  }

  private spawnBreakParticle(): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 40;

    this.particles.push({
      position: vec2(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2),
      velocity: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 50),
      life: 0,
      maxLife: 0.8 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
    });
  }

  render(ctx: CanvasRenderingContext2D, glowColor: string): void {
    ctx.fillStyle = glowColor;

    this.particles.forEach((particle) => {
      const lifeRatio = particle.life / particle.maxLife;
      const alpha = 1 - lifeRatio;

      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.ellipse(
        particle.position.x,
        particle.position.y,
        particle.size * (1 - lifeRatio * 0.5),
        particle.size * (1 - lifeRatio * 0.5),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  updatePosition(position: Vector2): void {
    this.position = position;
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }
}
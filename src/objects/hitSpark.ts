import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";
import { Vector2 } from "../engine/Vector2";

export class HitSpark extends GameObject {
  lifeTime: number;
  maxLifeTime: number;
  flashRadius: number;
  flashDuration: number;
  particles: Array<{
    position: Vector2;
    velocity: Vector2;
    size: number;
    color: string;
    lifeTime: number;
  }>;

  constructor(x: number, y: number) {
    // Use a small invisible GameObject as the container
    super({ x, y, width: 1, height: 1 });

    this.maxLifeTime = 0.6; // Effect lasts longer for more impact
    this.lifeTime = this.maxLifeTime;

    // Flash effect properties - increased for more dramatic impact
    this.flashRadius = 30;
    this.flashDuration = 0.15; // Flash lasts longer

    // Create spark particles
    this.particles = [];
    this.generateParticles();
  }

  generateParticles(): void {
    // Generate more particles for a more impressive effect
    const numParticles = Math.floor(Math.random() * 10) + 12;

    // Brighter, more impactful colors
    const colors = ["#FFFFFF", "#FFFF00", "#FFA500", "#FF6600", "#FFAAAA", "#AAFFFF"];

    for (let i = 0; i < numParticles; i++) {
      // Random angle for the particle - slightly favor horizontal direction for a more dynamic effect
      const horizontalBias = Math.random() > 0.5 ? 0 : Math.PI / 4;
      const angle = Math.random() * Math.PI * 1.5 + horizontalBias;

      // Faster particles for more energetic effect
      const speed = Math.random() * 150 + 120;

      // Add slight variation to starting position
      const offsetX = (Math.random() - 0.5) * 6;
      const offsetY = (Math.random() - 0.5) * 6;

      // Create particle
      this.particles.push({
        position: new Vector2(this.position.x + offsetX, this.position.y + offsetY),
        velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        size: Math.random() * 6 + 3, // Larger particles for more visibility
        color: colors[Math.floor(Math.random() * colors.length)],
        lifeTime: this.maxLifeTime * (0.3 + Math.random() * 0.7), // Varied lifetimes
      });
    }
  }

  update(deltaTime: number, _gameState: GameState): void {
    // Update lifetime
    this.lifeTime -= deltaTime;
    if (this.lifeTime <= 0) {
      this.active = false;
      return;
    }

    // Update particles
    for (const particle of this.particles) {
      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;

      // Slow down velocity over time for a more natural effect
      particle.velocity.x *= 0.95;
      particle.velocity.y *= 0.95;

      // Update lifetime and size
      particle.lifeTime -= deltaTime;
      if (particle.lifeTime <= 0) {
        particle.size = 0;
      } else {
        // Shrink particles as they age
        particle.size *= 0.95;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Get render position with shake offset
    const renderPos = this.getRenderPosition();

    // Draw multi-layered flash circle at the beginning of the effect for more impact
    if (this.lifeTime > this.maxLifeTime - this.flashDuration) {
      // Calculate flash opacity based on remaining time
      const flashOpacity =
        (this.lifeTime - (this.maxLifeTime - this.flashDuration)) / this.flashDuration;

      // Outer bright flash
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(
        renderPos.x,
        renderPos.y,
        this.flashRadius * (1 - flashOpacity + 0.8), // Larger outer flash
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Middle flash layer
      ctx.fillStyle = `rgba(255, 255, 0, ${flashOpacity * 0.9})`;
      ctx.beginPath();
      ctx.arc(
        renderPos.x,
        renderPos.y,
        this.flashRadius * (1 - flashOpacity + 0.6),
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Inner core flash
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.beginPath();
      ctx.arc(
        renderPos.x,
        renderPos.y,
        this.flashRadius * (1 - flashOpacity + 0.3),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Draw each particle
    for (const particle of this.particles) {
      if (particle.lifeTime <= 0) continue;

      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class PoofEffect extends GameObject {
  lifeTime: number;
  maxLifeTime: number;
  particles: Array<{
    position: Vector2;
    velocity: Vector2;
    size: number;
    color: string;
    lifeTime: number;
    alpha: number;
  }>;

  constructor(x: number, y: number) {
    super({ x, y, width: 1, height: 1 });
    this.maxLifeTime = 0.6;
    this.lifeTime = this.maxLifeTime;
    this.particles = [];
    this.generateParticles();
  }

  generateParticles(): void {
    const numParticles = Math.floor(Math.random() * 6) + 10;
    const colors = [
      "rgba(255,255,255,0.7)",
      "rgba(220,220,220,0.5)",
      "rgba(180,180,180,0.4)",
      "rgba(200,200,200,0.6)",
      "rgba(240,240,240,0.8)",
    ];
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 40 + 20;
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 8;
      this.particles.push({
        position: new Vector2(this.position.x + offsetX, this.position.y + offsetY),
        velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        size: Math.random() * 12 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        lifeTime: this.maxLifeTime * (0.5 + Math.random() * 0.5),
        alpha: 1.0,
      });
    }
  }

  update(deltaTime: number, _gameState: GameState): void {
    this.lifeTime -= deltaTime;
    if (this.lifeTime <= 0) {
      this.active = false;
      return;
    }
    for (const particle of this.particles) {
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.velocity.x *= 0.92;
      particle.velocity.y *= 0.92;
      particle.lifeTime -= deltaTime;
      if (particle.lifeTime <= 0) {
        particle.alpha = 0;
      } else {
        particle.alpha = Math.max(0, particle.lifeTime / this.maxLifeTime);
        particle.size *= 1.01; // Expand slightly
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const particle of this.particles) {
      if (particle.alpha <= 0) continue;
      ctx.globalAlpha = particle.alpha * 0.7;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
}

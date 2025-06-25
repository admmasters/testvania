import { GameObject } from "../engine/GameObject";
import { GameState } from "../engine/GameState";
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
    super(x, y, 1, 1);

    this.maxLifeTime = 0.5; // Effect lasts for 0.5 seconds
    this.lifeTime = this.maxLifeTime;

    // Flash effect properties
    this.flashRadius = 20;
    this.flashDuration = 0.1; // Flash lasts for 0.1 seconds

    // Create spark particles
    this.particles = [];
    this.generateParticles();
  }

  generateParticles(): void {
    // Generate between 6-12 particles for a more impressive effect
    const numParticles = Math.floor(Math.random() * 7) + 6;

    // Castlevania-inspired colors: white, orange, yellow, red, light blue
    const colors = ["#FFFFFF", "#FFA500", "#FFFF00", "#FF0000", "#ADD8E6"];

    for (let i = 0; i < numParticles; i++) {
      // Random angle for the particle - slightly favor horizontal direction for a more dynamic effect
      const horizontalBias = Math.random() > 0.5 ? 0 : Math.PI / 4;
      const angle = Math.random() * Math.PI * 1.5 + horizontalBias;

      // Random speed between 80-200 for more energetic particles
      const speed = Math.random() * 120 + 80;

      // Add slight variation to starting position
      const offsetX = (Math.random() - 0.5) * 6;
      const offsetY = (Math.random() - 0.5) * 6;

      // Create particle
      this.particles.push({
        position: new Vector2(this.position.x + offsetX, this.position.y + offsetY),
        velocity: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        size: Math.random() * 5 + 2, // Random size between 2-7
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
    for (let particle of this.particles) {
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

    // Draw flash circle at the beginning of the effect
    if (this.lifeTime > this.maxLifeTime - this.flashDuration) {
      // Calculate flash opacity based on remaining time
      const flashOpacity =
        (this.lifeTime - (this.maxLifeTime - this.flashDuration)) / this.flashDuration;

      // Draw the flash circle
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.beginPath();
      ctx.arc(
        this.position.x,
        this.position.y,
        this.flashRadius * (1 - flashOpacity + 0.5), // Grow and then shrink
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Draw each particle
    for (let particle of this.particles) {
      if (particle.lifeTime <= 0) continue;

      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

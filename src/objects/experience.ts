import { Vector2 } from "../engine/Vector2.js";

const vec2 = (x: number, y: number): Vector2 => new Vector2(x, y);

export class Experience {
  position: Vector2;
  size: Vector2;
  velocity: Vector2;
  isActive: boolean;
  active: boolean;
  lifeTimer: number;
  maxLifeTime: number;
  value: number;

  // Visual effects
  floatTimer: number;
  pulseTimer: number;
  sparkles: Array<{
    position: Vector2;
    velocity: Vector2;
    life: number;
    maxLife: number;
    size: number;
  }>;

  constructor(x: number, y: number, value: number = 5) {
    this.position = vec2(x, y);
    this.size = vec2(8, 8);
    this.velocity = vec2(0, -20);
    this.isActive = true;
    this.active = true;
    this.lifeTimer = 0;
    this.maxLifeTime = 10; // 10 seconds before disappearing
    this.value = value;

    // Visual effects
    this.floatTimer = 0;
    this.pulseTimer = Math.random() * Math.PI * 2;
    this.sparkles = [];

    // Initial upward velocity
    this.velocity.y = -30 - Math.random() * 20;
    this.velocity.x = (Math.random() - 0.5) * 40;
  }

  update(deltaTime: number, _gameState: unknown): void {
    if (!this.isActive) return;

    this.lifeTimer += deltaTime;
    this.floatTimer += deltaTime;
    this.pulseTimer += deltaTime;

    // Gravity and physics
    this.velocity.y += 200 * deltaTime; // Gravity
    this.velocity.x *= 0.95; // Air resistance

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Gentle floating motion after settling
    if (this.velocity.y > -10 && this.velocity.y < 10) {
      this.position.y += Math.sin(this.floatTimer * 3) * 0.5;
    }

    // Generate sparkles
    if (Math.random() < 0.3) {
      this.spawnSparkle();
    }

    // Update sparkles
    this.updateSparkles(deltaTime);

    // Check if expired
    if (this.lifeTimer >= this.maxLifeTime) {
      this.isActive = false;
      this.active = false;
    }
  }

  private spawnSparkle(): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 15;

    this.sparkles.push({
      position: vec2(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2),
      velocity: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      life: 0,
      maxLife: 0.5 + Math.random() * 0.5,
      size: 1 + Math.random() * 2,
    });
  }

  private updateSparkles(deltaTime: number): void {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sparkle = this.sparkles[i];
      sparkle.position.x += sparkle.velocity.x * deltaTime;
      sparkle.position.y += sparkle.velocity.y * deltaTime;
      sparkle.life += deltaTime;

      if (sparkle.life >= sparkle.maxLife) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  collect(): number {
    if (!this.isActive) return 0;

    this.isActive = false;
    this.active = false;

    // Create collection effect
    for (let i = 0; i < 8; i++) {
      this.spawnSparkle();
    }

    return this.value;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    const pulseIntensity = 0.7 + Math.sin(this.pulseTimer * 6) * 0.3;
    const fadeRatio = Math.min(1, (this.maxLifeTime - this.lifeTimer) / 2);

    ctx.save();

    // Render glow
    ctx.globalAlpha = pulseIntensity * 0.6 * fadeRatio;
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.ellipse(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2,
      this.size.x / 2 + 2,
      this.size.y / 2 + 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.shadowBlur = 0;

    // Render orb
    ctx.globalAlpha = fadeRatio;
    ctx.fillStyle = "#FFD700";

    ctx.beginPath();
    ctx.ellipse(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2,
      this.size.x / 2,
      this.size.y / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Render inner highlight
    ctx.fillStyle = "#FFFF00";
    ctx.globalAlpha = pulseIntensity * 0.8 * fadeRatio;

    ctx.beginPath();
    ctx.ellipse(
      this.position.x + this.size.x / 2 - 1,
      this.position.y + this.size.y / 2 - 1,
      2,
      2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Render sparkles
    this.renderSparkles(ctx, fadeRatio);

    // Render value text
    if (this.value > 5) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.globalAlpha = fadeRatio * 0.8;

      ctx.fillText(`+${this.value}`, this.position.x + this.size.x / 2, this.position.y - 2);

      ctx.textAlign = "left";
    }

    ctx.restore();
  }

  private renderSparkles(ctx: CanvasRenderingContext2D, fadeRatio: number): void {
    ctx.fillStyle = "#FFFF00";

    this.sparkles.forEach((sparkle) => {
      const lifeRatio = sparkle.life / sparkle.maxLife;
      const alpha = (1 - lifeRatio) * fadeRatio;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(
        sparkle.position.x,
        sparkle.position.y,
        sparkle.size * (1 - lifeRatio * 0.5),
        sparkle.size * (1 - lifeRatio * 0.5),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
  }

  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.position.x,
      right: this.position.x + this.size.x,
      top: this.position.y,
      bottom: this.position.y + this.size.y,
    };
  }
}

import { Player } from '../objects/player';
import { Enemy } from '../objects/enemy';
import { Platform } from '../objects/platform';
import { HitSpark } from '../objects/hitSpark';
import { Input } from './Input';
import { Camera } from './Camera';

export class GameState {
    player: Player;
    enemies: Enemy[];
    platforms: Platform[];
    hitSparks: HitSpark[];
    input: Input;
    camera: Camera;
    hitPauseTimer: number;
    hitPauseDuration: number;
    spawnTimer: number;
    spawnInterval: number;

    constructor() {
        this.platforms = []; // Initialize platforms first
        this.createPlatforms();
        
        // Initialize player on a platform
        this.player = new Player(100, 330); // Position player on the left platform
        
        this.enemies = [];
        this.hitSparks = [];
        this.input = new Input();
        this.camera = new Camera();
        this.hitPauseTimer = 0;
        this.hitPauseDuration = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 3;
        
        this.spawnInitialEnemies();
    }
    
    createPlatforms(): void {
        // Create the ground (acts as a platform too)
        this.platforms.push(new Platform(0, 450, 800, 150, '#654321'));
        
        // Create floating platforms - create an interesting level layout
        // Left side platforms
        this.platforms.push(new Platform(50, 350, 100, 20, '#654321'));
        this.platforms.push(new Platform(180, 280, 120, 20, '#654321'));
        this.platforms.push(new Platform(80, 200, 90, 20, '#654321'));
        
        // Middle platforms
        this.platforms.push(new Platform(350, 320, 100, 20, '#654321'));
        this.platforms.push(new Platform(320, 230, 80, 20, '#654321'));
        this.platforms.push(new Platform(300, 140, 70, 20, '#765432'));
        
        // Right side platforms
        this.platforms.push(new Platform(500, 370, 110, 20, '#654321'));
        this.platforms.push(new Platform(580, 290, 100, 20, '#654321'));
        this.platforms.push(new Platform(650, 200, 90, 20, '#654321'));
        
        // Special higher platforms
        this.platforms.push(new Platform(450, 100, 60, 15, '#8B4513'));
        this.platforms.push(new Platform(200, 100, 60, 15, '#8B4513'));
    }
    
    spawnInitialEnemies(): void {
        // Spawn enemies on different platforms
        if (this.platforms.length > 0) {
            // Skip the ground platform (index 0)
            const platformIndices = [2, 5, 8]; // Spawn on different heights
            
            for (let i = 0; i < platformIndices.length; i++) {
                if (this.platforms[platformIndices[i]]) {
                    const platform = this.platforms[platformIndices[i]];
                    const x = platform.position.x + platform.size.x / 2 - 12; // Center on platform
                    const y = platform.position.y - 32; // On top of platform
                    this.enemies.push(new Enemy(x, y));
                }
            }
        } else {
            // Fallback if no platforms defined
            for (let i = 0; i < 3; i++) {
                const x = 200 + i * 200;
                this.enemies.push(new Enemy(x, 300));
            }
        }
    }
    
    update(deltaTime: number): void {
        // Handle hit pause
        if (this.hitPauseTimer > 0) {
            this.hitPauseTimer -= deltaTime;
            return; // Skip all updates during hit pause
        }
        
        this.player.update(deltaTime, this);
        
        for (let enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(deltaTime, this);
            }
        }
        
        // Update hit sparks
        for (let spark of this.hitSparks) {
            if (spark.active) {
                spark.update(deltaTime, this);
            }
        }
        
        // Remove inactive enemies and hit sparks
        this.enemies = this.enemies.filter(enemy => enemy.active);
        this.hitSparks = this.hitSparks.filter(spark => spark.active);
        
        // Spawn new enemies
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.enemies.length < 5) {
            this.spawnTimer = 0;
            
            // Pick a random elevated platform (skip ground platform)
            const platformOptions = this.platforms.filter((p) => 
                p.position.y < 400 && p.position.y > 150);
            
            if (platformOptions.length > 0) {
                // Choose random platform
                const platform = platformOptions[Math.floor(Math.random() * platformOptions.length)];
                
                // Position on platform
                const x = platform.position.x + Math.random() * (platform.size.x - 24);
                const y = platform.position.y - 32;
                
                this.enemies.push(new Enemy(x, y));
            } else {
                // Fallback if no appropriate platforms
                const side = Math.random() > 0.5 ? 0 : 800;
                this.enemies.push(new Enemy(side, 300));
            }
        }
        
        this.camera.update(deltaTime);
        this.input.update();
    }
    
    hitPause(duration: number): void {
        this.hitPauseTimer = duration;
        this.hitPauseDuration = duration;
    }
    
    createHitSpark(x: number, y: number): void {
        this.hitSparks.push(new HitSpark(x, y));
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        // Clear screen
        ctx.fillStyle = '#2C1810';
        ctx.fillRect(0, 0, 800, 600);
        
        // Apply camera effects
        this.camera.apply(ctx);
        
        // Draw background elements
        this.drawBackground(ctx);
        
        // Draw platforms
        for (let platform of this.platforms) {
            platform.render(ctx);
        }
        
        // Draw game objects
        this.player.render(ctx);
        
        for (let enemy of this.enemies) {
            if (enemy.active) {
                enemy.render(ctx);
            }
        }
        
        // Draw hit sparks (on top of other game objects)
        for (let spark of this.hitSparks) {
            if (spark.active) {
                spark.render(ctx);
            }
        }
        
        // Reset camera
        this.camera.reset(ctx);
        
        // Draw UI
        this.drawUI(ctx);
    }
    
    drawBackground(ctx: CanvasRenderingContext2D): void {
        // Simple castle-like background
        ctx.fillStyle = '#1A0F0A';
        
        // Castle walls
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(i * 160, 450, 160, 150);
        }
        
        // Castle towers
        ctx.fillStyle = '#0F0A07';
        ctx.fillRect(0, 400, 40, 50);
        ctx.fillRect(760, 400, 40, 50);
        ctx.fillRect(380, 350, 40, 100);
        
        // Moon
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(700, 80, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawUI(ctx: CanvasRenderingContext2D): void {
        // Score/status could go here
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px monospace';
        ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 50);
    }
}

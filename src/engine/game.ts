import { GameState } from './GameState';

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gameState: GameState;
    lastTime: number;
    running: boolean;
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.gameState = new GameState();
        this.lastTime = 0;
        this.running = true;
        
        this.start();
    }
    
    start(): void {
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    gameLoop(currentTime: number): void {
        if (!this.running) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 0.016);
        
        this.gameState.update(cappedDeltaTime);
        this.gameState.render(this.ctx);
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}
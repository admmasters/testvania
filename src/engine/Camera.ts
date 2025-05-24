import { Vector2 } from './Vector2';

export class Camera {
    position: Vector2;
    shakeTimer: number;
    shakeDuration: number;
    shakeIntensity: number;
    shakeOffset: Vector2;
    
    constructor() {
        this.position = new Vector2(0, 0);
        this.shakeTimer = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
        this.shakeOffset = new Vector2(0, 0);
    }
    
    update(deltaTime: number): void {
        this.updateShake(deltaTime);
    }
    
    updateShake(deltaTime: number): void {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= deltaTime;
            
            const intensity = (this.shakeTimer / this.shakeDuration) * this.shakeIntensity;
            this.shakeOffset.x = (Math.random() - 0.5) * intensity * 2;
            this.shakeOffset.y = (Math.random() - 0.5) * intensity * 2;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
    }
    
    shake(duration: number, intensity: number): void {
        this.shakeTimer = duration;
        this.shakeDuration = duration;
        this.shakeIntensity = intensity;
    }
    
    apply(ctx: CanvasRenderingContext2D): void {
        ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
    }
    
    reset(ctx: CanvasRenderingContext2D): void {
        ctx.translate(-this.shakeOffset.x, -this.shakeOffset.y);
    }
}

// filepath: /Users/matthew.revell/Developer/repos/testavania/src/objects/item.ts
import { GameObject } from '../engine/GameObject';
import { GameState } from '../engine/GameState';
import { Player } from './player';

// Enum to define the different types of power-ups
export enum PowerUpType {
    SPEED_BOOST = 'SPEED_BOOST',
    JUMP_BOOST = 'JUMP_BOOST',
    HEALTH_BOOST = 'HEALTH_BOOST',
    DAMAGE_BOOST = 'DAMAGE_BOOST',
    SHIELD = 'SHIELD'
}

export class Item extends GameObject {
    type: PowerUpType;
    duration: number; // Duration in seconds, -1 for permanent effects
    effectAmount: number; // How strong the effect is
    bobAmount: number; // For floating animation
    bobSpeed: number;
    timer: number;
    collected: boolean;

    constructor(x: number, y: number, type: PowerUpType) {
        // Items are smaller than the player
        super(x, y, 24, 24);
        this.type = type;
        this.active = true;
        this.collected = false;
        this.bobAmount = 8; // Adjusted to multiple of 8
        this.bobSpeed = 2;
        this.timer = 0;
        
        // Set properties based on power-up type
        switch (type) {
            case PowerUpType.SPEED_BOOST:
                this.duration = 10; // 10 seconds
                this.effectAmount = 1.5; // 50% speed boost
                break;
            case PowerUpType.JUMP_BOOST:
                this.duration = 8; // 8 seconds
                this.effectAmount = 1.4; // 40% jump boost
                break;
            case PowerUpType.HEALTH_BOOST:
                this.duration = -1; // Permanent
                this.effectAmount = 4; // +4 health
                break;
            case PowerUpType.DAMAGE_BOOST:
                this.duration = 15; // 15 seconds
                this.effectAmount = 2; // Double damage
                break;
            case PowerUpType.SHIELD:
                this.duration = 5; // 5 seconds shield
                this.effectAmount = 1; // 1 = on
                break;
            default:
                this.duration = 5;
                this.effectAmount = 1;
        }
    }

    update(deltaTime: number, gameState: GameState): void {
        if (!this.active) return;
        
        // Simple bobbing animation
        this.timer += deltaTime;
        const originalY = this.position.y;
        this.position.y = originalY + Math.sin(this.timer * this.bobSpeed) * this.bobAmount;
        
        // Check for collision with player
        if (this.checkCollision(gameState.player)) {
            this.applyEffect(gameState.player);
            this.collected = true;
            this.active = false;
            
            // Create a visual effect on collection
            gameState.createHitSpark(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2);
            
            // Add the power-up to the active power-ups
            gameState.addActivePowerUp(this);
        }
    }

    applyEffect(player: Player): void {
        switch (this.type) {
            case PowerUpType.SPEED_BOOST:
                player.speed *= this.effectAmount;
                break;
            case PowerUpType.JUMP_BOOST:
                player.jumpPower *= this.effectAmount;
                break;
            case PowerUpType.HEALTH_BOOST:
                player.health = Math.min(player.health + this.effectAmount, player.maxHealth);
                break;
            case PowerUpType.DAMAGE_BOOST:
                // This will be handled during combat
                break;
            case PowerUpType.SHIELD:
                player.invulnerable = true;
                player.invulnerabilityDuration = this.duration;
                player.invulnerabilityTimer = this.duration;
                break;
        }
    }

    removeEffect(player: Player): void {
        // Only need to undo temporary effects when they expire
        switch (this.type) {
            case PowerUpType.SPEED_BOOST:
                player.speed /= this.effectAmount;
                break;
            case PowerUpType.JUMP_BOOST:
                player.jumpPower /= this.effectAmount;
                break;
            case PowerUpType.HEALTH_BOOST:
                // Health boost is permanent, no need to remove
                break;
            case PowerUpType.DAMAGE_BOOST:
                // This will be handled during combat
                break;
            case PowerUpType.SHIELD:
                player.invulnerable = false;
                break;
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;
        
        // Draw the power-up with a different color for each type
        switch (this.type) {
            case PowerUpType.SPEED_BOOST:
                ctx.fillStyle = '#00FFFF'; // Cyan
                break;
            case PowerUpType.JUMP_BOOST:
                ctx.fillStyle = '#00FF00'; // Green
                break;
            case PowerUpType.HEALTH_BOOST:
                ctx.fillStyle = '#FF0000'; // Red
                break;
            case PowerUpType.DAMAGE_BOOST:
                ctx.fillStyle = '#FF00FF'; // Magenta
                break;
            case PowerUpType.SHIELD:
                ctx.fillStyle = '#FFFF00'; // Yellow
                break;
            default:
                ctx.fillStyle = '#FFFFFF'; // White
        }
        
        // Draw the power-up as a diamond shape
        ctx.beginPath();
        ctx.moveTo(this.position.x + this.size.x / 2, this.position.y);
        ctx.lineTo(this.position.x + this.size.x, this.position.y + this.size.y / 2);
        ctx.lineTo(this.position.x + this.size.x / 2, this.position.y + this.size.y);
        ctx.lineTo(this.position.x, this.position.y + this.size.y / 2);
        ctx.closePath();
        ctx.fill();
        
        // Draw a glowing effect
        ctx.globalAlpha = 0.5 + Math.sin(this.timer * 5) * 0.3;
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2,
            this.size.x * 0.7,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Draw an icon in the middle based on power-up type
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '';
        switch (this.type) {
            case PowerUpType.SPEED_BOOST:
                icon = '⚡';
                break;
            case PowerUpType.JUMP_BOOST:
                icon = '↑';
                break;
            case PowerUpType.HEALTH_BOOST:
                icon = '♥';
                break;
            case PowerUpType.DAMAGE_BOOST:
                icon = '⚔';
                break;
            case PowerUpType.SHIELD:
                icon = '☆';
                break;
        }
        
        ctx.fillText(
            icon, 
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2
        );
    }
}
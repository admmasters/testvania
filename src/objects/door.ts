import { GameObject } from "../engine/GameObject";
import type { GameState } from "../engine/GameState";

export class Door extends GameObject {
  isOpen: boolean;
  openProgress: number; // 0 = closed, 1 = fully open
  openSpeed: number;
  nextLevelId: string;
  isPlayerNear: boolean;
  interactionDistance: number;
  doorColor: string;
  metalColor: string;
  hingeColor: string;

  constructor(x: number, y: number, nextLevelId: string) {
    super(x, y, 48, 64); // Smaller castle door size (was 64x96)
    this.isOpen = false;
    this.openProgress = 0;
    this.openSpeed = 2.0; // Speed of door opening animation
    this.nextLevelId = nextLevelId;
    this.isPlayerNear = false;
    this.interactionDistance = 40; // Reduced interaction distance
    this.doorColor = "#3D2817"; // Dark brown wood
    this.metalColor = "#4A4A4A"; // Metal fittings
    this.hingeColor = "#2A2A2A"; // Darker metal for hinges
  }

  update(deltaTime: number, gameState: GameState): void {
    // Check if player is near the door
    const player = gameState.player;
    const distance = Math.sqrt(
      Math.pow(player.position.x + player.size.x / 2 - (this.position.x + this.size.x / 2), 2) +
      Math.pow(player.position.y + player.size.y / 2 - (this.position.y + this.size.y / 2), 2)
    );

    this.isPlayerNear = distance < this.interactionDistance;

    // Auto-open door when player is near
    if (this.isPlayerNear && !this.isOpen) {
      this.isOpen = true;
    }

    // Animate door opening
    if (this.isOpen && this.openProgress < 1) {
      this.openProgress += this.openSpeed * deltaTime;
      if (this.openProgress >= 1) {
        this.openProgress = 1;
      }
    }

    // Check if player walks through the open door
    if (this.isOpen && this.openProgress >= 0.8 && this.checkPlayerCollision(player)) {
      this.transitionToNextLevel(gameState);
    }
  }

  private checkPlayerCollision(player: any): boolean {
    return (
      player.position.x < this.position.x + this.size.x &&
      player.position.x + player.size.x > this.position.x &&
      player.position.y < this.position.y + this.size.y &&
      player.position.y + player.size.y > this.position.y
    );
  }

  private transitionToNextLevel(gameState: GameState): void {
    // Load the next level
    gameState.loadLevel(this.nextLevelId);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Get render position with shake offset
    const renderPos = this.getRenderPosition();

    // Door frame (stone archway) - smaller proportions - ALWAYS VISIBLE
    ctx.fillStyle = "#5A5A5A";
    ctx.fillRect(renderPos.x - 6, renderPos.y - 6, this.size.x + 12, this.size.y + 12);
    
    // Inner frame shadow - ALWAYS VISIBLE
    ctx.fillStyle = "#3A3A3A";
    ctx.fillRect(renderPos.x - 3, renderPos.y - 3, this.size.x + 6, this.size.y + 6);

    // Calculate door opening effects
    const openAngle = this.openProgress * Math.PI / 2; // 0 to 90 degrees
    const doorWidth = this.size.x * Math.cos(openAngle); // Perspective width effect
    const doorOpacity = 1 - (this.openProgress * 0.7); // Fade as it opens
    const hingeOffset = 3; // Offset from left edge where hinge is

    // Only render door if it's not fully open or still visible
    if (doorWidth > 1) {
      ctx.globalAlpha = doorOpacity;

      // Main door body with perspective
      ctx.fillStyle = this.doorColor;
      ctx.fillRect(renderPos.x + hingeOffset, renderPos.y, doorWidth, this.size.y);

      // Door panels (decorative) - adjusted for perspective
      ctx.fillStyle = "#2A1F15";
      // Upper panel
      const panelWidth = doorWidth - 12;
      if (panelWidth > 0) {
        ctx.fillRect(renderPos.x + 6 + hingeOffset, renderPos.y + 6, panelWidth, this.size.y / 2 - 9);
        // Lower panel
        ctx.fillRect(renderPos.x + 6 + hingeOffset, renderPos.y + this.size.y / 2 + 3, panelWidth, this.size.y / 2 - 9);
      }

      // Metal fittings and hinges - adjusted for perspective
      ctx.fillStyle = this.metalColor;
      // Left hinge (top) - stays at hinge point
      ctx.fillRect(renderPos.x + hingeOffset, renderPos.y + 8, 6, 8);
      // Left hinge (bottom) - stays at hinge point
      ctx.fillRect(renderPos.x + hingeOffset, renderPos.y + this.size.y - 16, 6, 8);
      
      // Door handle - moves with door perspective
      if (doorWidth > 15) {
        ctx.fillStyle = this.hingeColor;
        ctx.fillRect(renderPos.x + hingeOffset + doorWidth - 9, renderPos.y + this.size.y / 2 - 3, 4, 6);
      }

      // Metal studs - fewer and smaller, adjusted for perspective
      ctx.fillStyle = this.metalColor;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const studX = renderPos.x + 12 + (i * 12 * doorWidth / this.size.x) + hingeOffset;
          const studY = renderPos.y + 14 + (j * 20);
          if (studX < renderPos.x + hingeOffset + doorWidth - 2) {
            ctx.fillRect(studX, studY, 2, 2);
          }
        }
      }

      ctx.globalAlpha = 1; // Reset alpha
    }

    // Draw darkness/shadow behind the open door
    if (this.openProgress > 0.1) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * this.openProgress})`;
      ctx.fillRect(renderPos.x, renderPos.y, this.size.x, this.size.y);
    }

    // Draw interaction prompt when player is near - adjusted position
    if (this.isPlayerNear && !this.isOpen) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(renderPos.x - 15, renderPos.y - 25, 78, 16);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Door Opening...", renderPos.x + this.size.x / 2, renderPos.y - 14);
    }

    // Draw glowing effect when door is opening - smaller glow
    if (this.isOpen && this.openProgress < 1) {
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(renderPos.x - 3, renderPos.y - 3, this.size.x + 6, this.size.y + 6);
    }

    ctx.restore();
  }
} 
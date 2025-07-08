import type { GameState } from "@/engine/GameState";

export interface TutorialMessage {
  id: string;
  text: string;
  triggerPosition: number; // X position to trigger the message
  shown: boolean;
  priority: number;
  style: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    fontSize: number;
  };
  requiredKey: string; // The key code required to advance this step
}

export class TutorialSystem {
  private messages: TutorialMessage[] = [];
  private currentMessage: TutorialMessage | null = null;
  private isShowingModal: boolean = false;
  private modalAlpha: number = 0;
  private targetModalAlpha: number = 0;
  private fadeSpeed: number = 4.0;

  constructor() {
    this.setupTutorialMessages();
  }

  private setupTutorialMessages(): void {
    this.messages = [
      // Welcome message
      {
        id: "welcome",
        text: "🎓 Quick Training\n\nUse ← → to move, SPACE to jump\n\nPress X to continue...",
        triggerPosition: 50,
        shown: false,
        priority: 10,
        style: {
          backgroundColor: "rgba(40, 60, 100, 0.95)",
          textColor: "#FFD700",
          borderColor: "#D4AF37",
          fontSize: 20,
        },
        requiredKey: "KeyX",
      },
      // Movement message
      {
        id: "movement",
        text: "🏃 Movement\n\nJump on platforms to practice!\nHold SPACE longer for higher jumps\n\nPress SPACE to continue...",
        triggerPosition: 250,
        shown: false,
        priority: 9,
        style: {
          backgroundColor: "rgba(40, 60, 100, 0.95)",
          textColor: "#FFD700",
          borderColor: "#D4AF37",
          fontSize: 20,
        },
        requiredKey: "Space",
      },
      // Crystal message
      {
        id: "crystals",
        text: "💎 Crystals\n\nHit crystals with X to smash them!\nCollect EXP from each one you break\n\nPress X to continue...",
        triggerPosition: 400,
        shown: false,
        priority: 8,
        style: {
          backgroundColor: "rgba(40, 60, 100, 0.95)",
          textColor: "#FFD700",
          borderColor: "#D4AF37",
          fontSize: 20,
        },
        requiredKey: "KeyX",
      },
      // Combat section
      {
        id: "combat",
        text: "⚔️ Combat Training\n\nDefeat the enemy ahead!\nPress X to attack with your sword\nHold X to charge power for energy blast\n\nPress X to continue...",
        triggerPosition: 650,
        shown: false,
        priority: 9,
        style: {
          backgroundColor: "rgba(40, 60, 100, 0.95)",
          textColor: "#FFD700",
          borderColor: "#D4AF37",
          fontSize: 20,
        },
        requiredKey: "KeyX",
      },
      // Victory message
      {
        id: "victory",
        text: "🎉 Training Complete!\n\nYou've learned the basics:\n• Movement and jumping\n• Crystal collection\n• Combat and power system\n\nYou're ready for adventure!\n\nPress X to continue...",
        triggerPosition: 1050,
        shown: false,
        priority: 10,
        style: {
          backgroundColor: "rgba(40, 60, 100, 0.95)",
          textColor: "#FFD700",
          borderColor: "#D4AF37",
          fontSize: 20,
        },
        requiredKey: "KeyX",
      },
    ];
  }

  update(deltaTime: number, gameState: GameState): void {
    // Update modal fade animation
    if (this.modalAlpha !== this.targetModalAlpha) {
      const direction = this.targetModalAlpha > this.modalAlpha ? 1 : -1;
      this.modalAlpha += direction * this.fadeSpeed * deltaTime;

      if (direction > 0 && this.modalAlpha >= this.targetModalAlpha) {
        this.modalAlpha = this.targetModalAlpha;
      } else if (direction < 0 && this.modalAlpha <= this.targetModalAlpha) {
        this.modalAlpha = this.targetModalAlpha;
        if (this.modalAlpha <= 0) {
          this.isShowingModal = false;
          this.currentMessage = null;
        }
      }
    }

    // Don't check for new messages if we're currently showing one
    if (this.isShowingModal) {
      // Check for the required key press to dismiss current message
      if (
        this.currentMessage &&
        (gameState.input.isKeyPressed(this.currentMessage.requiredKey) ||
          gameState.input.isKeyDown(this.currentMessage.requiredKey))
      ) {
        this.dismissCurrentMessage();
      }
      return;
    }

    // Check for new messages to show based on player position
    const playerX = gameState.player.position.x;
    for (const message of this.messages) {
      if (!message.shown && playerX >= message.triggerPosition) {
        this.showMessage(message);
        break; // Only show one message at a time
      }
    }
  }

  private showMessage(message: TutorialMessage): void {
    this.currentMessage = message;
    message.shown = true;
    this.isShowingModal = true;
    this.targetModalAlpha = 1.0;
  }

  private dismissCurrentMessage(): void {
    this.targetModalAlpha = 0;
  }

  // Method to check if the game should be paused
  isGamePaused(): boolean {
    return this.isShowingModal && this.modalAlpha > 0.5;
  }

  // Method to get the fade amount for the game world
  getWorldFadeAlpha(): number {
    return Math.min(0.7, this.modalAlpha * 0.7); // Max 70% fade
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.currentMessage || this.modalAlpha <= 0) return;

    ctx.save();

    // Draw dark overlay to fade the game world
    ctx.fillStyle = `rgba(0, 0, 0, ${this.getWorldFadeAlpha()})`;
    ctx.fillRect(0, 0, 800, 600);

    // Only draw the modal if it's visible enough
    if (this.modalAlpha > 0.1) {
      this.drawModal(ctx);
    }

    ctx.restore();
  }

  // Helper to wrap text to fit modal width
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + (currentLine ? " " : "") + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private drawModal(ctx: CanvasRenderingContext2D): void {
    if (!this.currentMessage) return;

    const message = this.currentMessage;
    const modalWidth = 500;
    const paddingY = 40;
    const paddingX = 32;
    const maxTextWidth = modalWidth - paddingX * 2;
    ctx.save();
    ctx.globalAlpha = this.modalAlpha;

    // Prepare font for measuring
    ctx.font = `${message.style.fontSize}px 'Orbitron', monospace`;
    ctx.textAlign = "center";

    // Split text into lines, then wrap each line
    const rawLines = message.text.split("\n");
    let lines: string[] = [];
    for (const rawLine of rawLines) {
      if (rawLine.trim() === "") {
        lines.push("");
      } else {
        // Special case: don't wrap "Press X to continue..."
        if (rawLine.includes("Press X to continue")) {
          lines.push(rawLine);
        } else {
          lines = lines.concat(this.wrapText(ctx, rawLine, maxTextWidth));
        }
      }
    }

    const lineHeight = message.style.fontSize + 8;
    const modalHeight = lines.length * lineHeight + paddingY * 2;
    const modalX = (800 - modalWidth) / 2;
    const modalY = (600 - modalHeight) / 2;

    // Draw modal background with border
    ctx.fillStyle = message.style.backgroundColor;
    ctx.strokeStyle = message.style.borderColor;
    ctx.lineWidth = 3;
    this.drawRoundedRect(ctx, modalX, modalY, modalWidth, modalHeight, 12);
    ctx.fill();
    ctx.stroke();

    // Draw inner border for extra style
    ctx.strokeStyle = message.style.borderColor;
    ctx.lineWidth = 1;
    this.drawRoundedRect(ctx, modalX + 10, modalY + 10, modalWidth - 20, modalHeight - 20, 8);
    ctx.stroke();

    // Draw message text
    ctx.fillStyle = message.style.textColor;
    ctx.font = `${message.style.fontSize}px 'Orbitron', monospace`;
    ctx.textAlign = "center";

    const startY = modalY + paddingY + message.style.fontSize;
    let y = startY;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Special styling for the "Press X to continue..." line
      if (line.includes("Press X to continue")) {
        ctx.save();
        ctx.font = `bold ${message.style.fontSize - 2}px 'Orbitron', monospace`;
        ctx.fillStyle = message.style.textColor;
        ctx.shadowColor = message.style.borderColor;
        ctx.shadowBlur = 5;
        // Add a pulsing effect
        const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
        ctx.globalAlpha = this.modalAlpha * pulse;
        ctx.fillText(line, modalX + modalWidth / 2, y);
        ctx.restore();
      } else {
        ctx.fillText(line, modalX + modalWidth / 2, y);
      }
      y += lineHeight;
    }
    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Method to check if tutorial is complete
  isComplete(): boolean {
    return this.messages.every((message) => message.shown);
  }
}

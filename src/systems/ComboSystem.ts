import { Vector2 } from "@/engine/Vector2";

/**
 * ComboSystem tracks sequential hits performed by the player inside a short time window
 * and renders an eye-catching "HIT COMBO" counter to encourage stylish play.
 */
export class ComboSystem {
  /** Current combo hit count */
  private count = 0;
  /** Remaining time (in seconds) before the combo expires */
  private timer = 0;
  /** Allowed delay between hits (in seconds) to keep the combo alive */
  private readonly window = 1.2; // faster expiry for snappier feel

  /** Scale applied to the text for the pop animation */
  private scale = 1;
  /** How quickly the scale eases back to 1 (units per second) */
  private readonly scaleDecay = 6; // faster ease

  /** Screen position for the combo counter (UI space, not affected by camera) */
  // Position in UI space: just a few pixels right of the HUD panel (panelX + panelWidth + margin)
  private readonly position = new Vector2(132, 40); // aligned with HUD

  /** Used to control the flash effect as the combo expires */
  private flashTimer = 0;
  private readonly flashFrequency = 12; // flashes per second

  /** Adds a new hit to the combo, refreshing the timer and triggering a pop animation. */
  addHit(): void {
    this.count += 1;
    this.timer = this.window;

    // Pop animation: base 1.8x + small extra for big combos
    const extra = Math.min(this.count / 10, 1.2); // subtler cap
    this.scale = 1.8 + extra;
  }

  /** Updates timers and animations. */
  update(deltaTime: number): void {
    if (this.count === 0) return;

    this.timer -= deltaTime;
    if (this.timer <= 0) {
      // Combo expired
      this.count = 0;
      this.scale = 1;
      this.flashTimer = 0;
      return;
    }

    // If in the last 0.5s, start flashing
    if (this.timer < 0.5) {
      this.flashTimer += deltaTime * this.flashFrequency;
    } else {
      this.flashTimer = 0;
    }

    // Ease the scale back to 1 over time
    if (this.scale > 1) {
      this.scale = Math.max(1, this.scale - this.scaleDecay * deltaTime);
    }
  }

  /** Renders the combo counter. Should be called after the camera has been reset (UI layer). */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.count < 2) return; // Only show for combos of 2 or more hits

    // Flashing effect as it disappears
    let visible = true;
    if (this.timer < 0.5) {
      visible = Math.floor(this.flashTimer) % 2 === 0;
    }
    if (!visible) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(this.scale, this.scale);
    ctx.textAlign = "left";

    // Draw the number in larger font
    ctx.font = "bold 36px 'Orbitron', monospace";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8B4513"; // dark accent
    ctx.fillStyle = "#FFD700"; // gold fill
    ctx.shadowColor = "rgba(255, 215, 0, 0.7)";
    ctx.shadowBlur = 8;

    const numberText = `${this.count}`;
    ctx.strokeText(numberText, 0, 0);
    ctx.fillText(numberText, 0, 0);

    // Get width of number to position the text
    const numberWidth = ctx.measureText(numberText).width;

    // Draw "CHAIN REACTION" in even smaller font
    ctx.font = "bold 16px 'Orbitron', monospace";
    const labelText = " CHAIN REACTION";
    ctx.strokeText(labelText, numberWidth, 0);
    ctx.fillText(labelText, numberWidth, 0);

    ctx.restore();
  }
}

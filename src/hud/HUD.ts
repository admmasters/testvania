import type { Player } from "@/objects/player";
import { drawCastlevaniaUI } from "./CastlevaniaUI";

export class HUD {
  constructor() {}

  render(ctx: CanvasRenderingContext2D, player: Player): void {
    // Save the current context state
    ctx.save();

    // Draw clean Castlevania-style UI
    drawCastlevaniaUI(ctx, player);

    // Restore the context state
    ctx.restore();
  }
}

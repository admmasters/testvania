export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  camera?: { x: number; y: number };
}

export class RenderingUtils {
  /**
   * Save canvas state and apply common rendering setup
   */
  static saveAndSetup(ctx: CanvasRenderingContext2D, alpha?: number): void {
    ctx.save();
    if (alpha !== undefined) {
      ctx.globalAlpha = alpha;
    }
  }

  /**
   * Restore canvas state
   */
  static restore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Render with automatic save/restore and optional alpha
   */
  static withAlpha(
    ctx: CanvasRenderingContext2D,
    alpha: number,
    renderCallback: (ctx: CanvasRenderingContext2D) => void
  ): void {
    RenderingUtils.saveAndSetup(ctx, alpha);
    renderCallback(ctx);
    RenderingUtils.restore(ctx);
  }

  /**
   * Render with shake effect
   */
  static withShake(
    ctx: CanvasRenderingContext2D,
    shakeX: number,
    shakeY: number,
    renderCallback: (ctx: CanvasRenderingContext2D) => void
  ): void {
    ctx.save();
    ctx.translate(shakeX, shakeY);
    renderCallback(ctx);
    ctx.restore();
  }

  /**
   * Render a filled rectangle with optional stroke
   */
  static fillRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    strokeColor?: string,
    strokeWidth?: number
  ): void {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
    
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth || 1;
      ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * Render text with optional outline
   */
  static fillText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options: {
      font?: string;
      fillColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      shadow?: {
        color: string;
        blur: number;
        offsetX?: number;
        offsetY?: number;
      };
    } = {}
  ): void {
    ctx.save();
    
    if (options.font) ctx.font = options.font;
    if (options.align) ctx.textAlign = options.align;
    if (options.baseline) ctx.textBaseline = options.baseline;
    
    if (options.shadow) {
      ctx.shadowColor = options.shadow.color;
      ctx.shadowBlur = options.shadow.blur;
      ctx.shadowOffsetX = options.shadow.offsetX || 0;
      ctx.shadowOffsetY = options.shadow.offsetY || 0;
    }
    
    if (options.strokeColor && options.strokeWidth) {
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth;
      ctx.strokeText(text, x, y);
    }
    
    if (options.fillColor) {
      ctx.fillStyle = options.fillColor;
      ctx.fillText(text, x, y);
    }
    
    ctx.restore();
  }

  /**
   * Render a sprite or image with optional effects
   */
  static renderSprite(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLCanvasElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    options: {
      alpha?: number;
      flipX?: boolean;
      flipY?: boolean;
      rotation?: number;
      tint?: string;
    } = {}
  ): void {
    ctx.save();
    
    // Apply transformations
    if (options.flipX || options.flipY || options.rotation) {
      const centerX = dx + dw / 2;
      const centerY = dy + dh / 2;
      
      ctx.translate(centerX, centerY);
      
      if (options.rotation) {
        ctx.rotate(options.rotation);
      }
      
      if (options.flipX || options.flipY) {
        ctx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
      }
      
      dx = -dw / 2;
      dy = -dh / 2;
    }
    
    if (options.alpha !== undefined) {
      ctx.globalAlpha = options.alpha;
    }
    
    if (options.tint) {
      ctx.fillStyle = options.tint;
      ctx.globalCompositeOperation = 'multiply';
    }
    
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    
    ctx.restore();
  }

  /**
   * Render a health bar
   */
  static renderHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    currentHealth: number,
    maxHealth: number,
    colors: {
      background: string;
      border: string;
      health: string;
      damaged?: string;
    }
  ): void {
    const healthRatio = currentHealth / maxHealth;
    
    // Background
    RenderingUtils.fillRect(ctx, x, y, width, height, colors.background, colors.border);
    
    // Health bar
    const healthWidth = width * healthRatio;
    if (healthWidth > 0) {
      RenderingUtils.fillRect(ctx, x, y, healthWidth, height, colors.health);
    }
    
    // Damaged portion (if specified)
    if (colors.damaged && healthRatio < 1) {
      const damagedWidth = width * (1 - healthRatio);
      RenderingUtils.fillRect(ctx, x + healthWidth, y, damagedWidth, height, colors.damaged);
    }
  }

  /**
   * Render particles or effects
   */
  static renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      alpha: number;
    }>
  ): void {
    particles.forEach(particle => {
      RenderingUtils.withAlpha(ctx, particle.alpha, (ctx) => {
        RenderingUtils.fillRect(ctx, particle.x, particle.y, particle.size, particle.size, particle.color);
      });
    });
  }

  /**
   * Check if an object is visible within the camera bounds
   */
  static isVisibleInCamera(
    objectX: number,
    objectY: number,
    objectWidth: number,
    objectHeight: number,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    margin: number = 50
  ): boolean {
    return (
      objectX + objectWidth >= cameraX - margin &&
      objectX <= cameraX + viewportWidth + margin &&
      objectY + objectHeight >= cameraY - margin &&
      objectY <= cameraY + viewportHeight + margin
    );
  }

  /**
   * Apply camera transformation
   */
  static applyCameraTransform(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    ctx.translate(-cameraX, -cameraY);
  }

  /**
   * Reset camera transformation
   */
  static resetCameraTransform(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    ctx.translate(cameraX, cameraY);
  }

  /**
   * Create a gradient
   */
  static createGradient(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    colorStops: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    return gradient;
  }

  /**
   * Create a radial gradient
   */
  static createRadialGradient(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number,
    colorStops: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    return gradient;
  }
}
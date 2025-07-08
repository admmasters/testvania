import type { Camera } from "./Camera";

export interface BackgroundLayer {
  draw: (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => void;
  parallaxX: number; // 0 = no movement, 1 = moves with camera
  parallaxY: number;
  repeatX?: boolean; // Whether to repeat the layer horizontally
  repeatY?: boolean; // Whether to repeat the layer vertically
}

export class ParallaxBackground {
  private layers: BackgroundLayer[] = [];

  constructor() {
    this.setupDefaultLayers();
  }

  private setupDefaultLayers(): void {
    // Sky layer (furthest back, no parallax)
    this.addLayer({
      draw: (ctx, _offsetX, _offsetY) => {
        // Dark sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(0.3, "#16213e");
        gradient.addColorStop(1, "#2C1810");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
      },
      parallaxX: 0,
      parallaxY: 0,
    });

    // Moon layer (very slow parallax to keep it mostly stationary)
    this.addLayer({
      draw: (ctx, offsetX, offsetY) => {
        // Moon
        ctx.fillStyle = "#FFFACD";
        ctx.beginPath();
        ctx.arc(704 - offsetX, 80 - offsetY, 32, 0, Math.PI * 2);
        ctx.fill();

        // Moon glow
        ctx.fillStyle = "rgba(255, 250, 205, 0.2)";
        ctx.beginPath();
        ctx.arc(704 - offsetX, 80 - offsetY, 48, 0, Math.PI * 2);
        ctx.fill();
      },
      parallaxX: 0.1, // Very slow movement
      parallaxY: 0.05,
    });

    // Distant mountains layer
    this.addLayer({
      draw: (ctx, offsetX, offsetY) => {
        ctx.fillStyle = "#0f0a0a";
        // Mountain silhouettes
        ctx.beginPath();
        ctx.moveTo(-offsetX, 400 - offsetY);
        ctx.lineTo(200 - offsetX, 300 - offsetY);
        ctx.lineTo(400 - offsetX, 350 - offsetY);
        ctx.lineTo(600 - offsetX, 280 - offsetY);
        ctx.lineTo(800 - offsetX, 320 - offsetY);
        ctx.lineTo(1000 - offsetX, 380 - offsetY);
        ctx.lineTo(1200 - offsetX, 400 - offsetY);
        ctx.lineTo(1200 - offsetX, 600 - offsetY);
        ctx.lineTo(-offsetX, 600 - offsetY);
        ctx.closePath();
        ctx.fill();
      },
      parallaxX: 0.2,
      parallaxY: 0.1,
      repeatX: true,
    });

    // Castle towers layer (medium parallax)
    this.addLayer({
      draw: (ctx, offsetX, offsetY) => {
        ctx.fillStyle = "#0F0A07";
        // Left tower
        ctx.fillRect(0 - offsetX, 400 - offsetY, 40, 200);
        // Right tower
        ctx.fillRect(760 - offsetX, 400 - offsetY, 40, 200);
        // Middle tower
        ctx.fillRect(384 - offsetX, 352 - offsetY, 40, 248);

        // Tower details
        ctx.fillStyle = "#1A0F0A";
        // Tower windows
        ctx.fillRect(15 - offsetX, 420 - offsetY, 10, 15);
        ctx.fillRect(775 - offsetX, 420 - offsetY, 10, 15);
        ctx.fillRect(399 - offsetX, 372 - offsetY, 10, 15);
      },
      parallaxX: 0.3,
      parallaxY: 0.15,
      repeatX: true,
    });

    // Foreground mist layer (fastest parallax)
    this.addLayer({
      draw: (ctx, offsetX, offsetY) => {
        ctx.fillStyle = "rgba(44, 24, 16, 0.1)";
        // Wispy mist shapes
        for (let i = 0; i < 5; i++) {
          const x = i * 200 - offsetX;
          const y = 500 - offsetY + Math.sin(Date.now() * 0.001 + i) * 10;
          ctx.beginPath();
          ctx.ellipse(x, y, 80, 20, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      parallaxX: 0.8,
      parallaxY: 0.4,
      repeatX: true,
    });
  }

  addLayer(layer: BackgroundLayer): void {
    this.layers.push(layer);
  }

  clearLayers(): void {
    this.layers = [];
  }

  // Method to customize the moon position and appearance
  setMoonPosition(x: number, y: number, radius: number = 32): void {
    // Find and update the moon layer
    const moonLayerIndex = this.layers.findIndex(
      (layer) => layer.parallaxX === 0.1 && layer.parallaxY === 0.05,
    );
    if (moonLayerIndex !== -1) {
      this.layers[moonLayerIndex] = {
        draw: (ctx, offsetX, offsetY) => {
          // Moon
          ctx.fillStyle = "#FFFACD";
          ctx.beginPath();
          ctx.arc(x - offsetX, y - offsetY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Moon glow
          ctx.fillStyle = "rgba(255, 250, 205, 0.2)";
          ctx.beginPath();
          ctx.arc(x - offsetX, y - offsetY, radius + 16, 0, Math.PI * 2);
          ctx.fill();
        },
        parallaxX: 0.1,
        parallaxY: 0.05,
      };
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // Save the current context state
    ctx.save();

    // Draw each layer with its parallax offset
    for (const layer of this.layers) {
      const offsetX = camera.position.x * layer.parallaxX;
      const offsetY = camera.position.y * layer.parallaxY;

      if (layer.repeatX || layer.repeatY) {
        // Handle repeating layers
        this.renderRepeatingLayer(ctx, layer, offsetX, offsetY);
      } else {
        // Single layer
        layer.draw(ctx, offsetX, offsetY);
      }
    }

    // Restore the context state
    ctx.restore();
  }

  private renderRepeatingLayer(
    ctx: CanvasRenderingContext2D,
    layer: BackgroundLayer,
    offsetX: number,
    offsetY: number,
  ): void {
    const canvasWidth = 800;
    const canvasHeight = 600;

    if (layer.repeatX) {
      // Calculate how many times to repeat horizontally
      const startX = Math.floor(offsetX / canvasWidth) * canvasWidth;
      for (let x = startX - canvasWidth; x < offsetX + canvasWidth * 2; x += canvasWidth) {
        layer.draw(ctx, x, offsetY);
      }
    } else if (layer.repeatY) {
      // Calculate how many times to repeat vertically
      const startY = Math.floor(offsetY / canvasHeight) * canvasHeight;
      for (let y = startY - canvasHeight; y < offsetY + canvasHeight * 2; y += canvasHeight) {
        layer.draw(ctx, offsetX, y);
      }
    } else {
      layer.draw(ctx, offsetX, offsetY);
    }
  }
}

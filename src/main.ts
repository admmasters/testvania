import { Game } from "./engine/game";

// Configuration
const CANVAS_ID = "gameCanvas";

// Initialize the game on page load
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("Initializing Testavania...");
    
    // Instantiate the game - let it handle its own validation
    const game = new Game(CANVAS_ID);
    console.log("Testavania game initialized successfully!", game ? "✓" : "✗");
  } catch (error) {
    console.error("Failed to initialize game:", error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #ff4444; color: white; padding: 20px; border-radius: 8px;
      font-family: Arial, sans-serif; text-align: center; z-index: 9999;
    `;
    errorDiv.innerHTML = `
      <h3>Game Failed to Load</h3>
      <p>Please refresh the page or check the console for details.</p>
    `;
    document.body.appendChild(errorDiv);
  }
});

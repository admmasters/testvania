import { Game } from './engine/game';

// Initialize the game on page load
document.addEventListener('DOMContentLoaded', () => {
    // Instantiate the game
    new Game();
    console.log('Testavania game initialized!');
});

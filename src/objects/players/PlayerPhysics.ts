// Handles player collision and physics helpers
import type { SolidBlock } from "../solidBlock";
import type { Platform } from "../platform";

export const PlayerPhysics = {
  wouldCollideHorizontally(
    nextX: number,
    currentY: number,
    sizeX: number,
    sizeY: number,
    obstacle: Platform | SolidBlock,
  ): boolean {
    const playerLeft = nextX;
    const playerRight = nextX + sizeX;
    const playerTop = currentY;
    const playerBottom = currentY + sizeY;
    const obstacleLeft = obstacle.position.x;
    const obstacleRight = obstacle.position.x + obstacle.size.x;
    const obstacleTop = obstacle.position.y;
    const obstacleBottom = obstacle.position.y + obstacle.size.y;
    const horizontalOverlap = playerRight > obstacleLeft && playerLeft < obstacleRight;
    const verticalOverlap = playerBottom > obstacleTop && playerTop < obstacleBottom;
    return horizontalOverlap && verticalOverlap;
  },

  findCeilingPosition(
    playerX: number,
    playerSizeX: number,
    playerY: number,
    solidBlocks: SolidBlock[],
  ): number {
    let lowestCeiling = 0;
    for (const solidBlock of solidBlocks) {
      const solidBlockBottom = solidBlock.position.y + solidBlock.size.y;
      if (
        playerX + playerSizeX > solidBlock.position.x &&
        playerX < solidBlock.position.x + solidBlock.size.x
      ) {
        if (solidBlockBottom > lowestCeiling && solidBlockBottom < playerY) {
          lowestCeiling = solidBlockBottom;
        }
      }
    }
    return lowestCeiling;
  },
};

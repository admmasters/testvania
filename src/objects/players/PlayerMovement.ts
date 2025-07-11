// Handles complex vertical movement and collision detection
import type { Platform } from "../platform";
import type { SolidBlock } from "../solidBlock";
import type { DiagonalPlatform } from "../diagonalPlatform";
import type { Player } from "./player";

export const PlayerMovement = {
  // Apply vertical movement with collisions
  handleVerticalMovement(
    player: Player,
    nextY: number,
    gameState: {
      platforms: Platform[];
      solidBlocks: SolidBlock[];
      diagonalPlatforms: DiagonalPlatform[];
      levelManager: { getLevelData(id: string): { width?: number; height?: number } | undefined };
      currentLevelId?: string;
    },
  ): void {
    // Reset grounded state
    player.grounded = false;

    // Detect collisions and landing surfaces
    const collisionResult = this.detectVerticalCollisions(player, nextY, gameState);

    // Apply vertical movement based on collision results
    this.applyVerticalMovement(player, nextY, collisionResult);

    // Apply level boundaries
    this.applyLevelBoundaries(player, gameState);
  },

  detectVerticalCollisions(
    player: Player,
    nextY: number,
    gameState: {
      platforms: Platform[];
      solidBlocks: SolidBlock[];
      diagonalPlatforms: DiagonalPlatform[];
    },
  ) {
    let highestPlatform: Platform | SolidBlock | null = null;
    let highestPlatformY = Number.MAX_VALUE;
    let diagonalLandingY: number | null = null;
    let hitCeiling = false;

    // Check platforms
    this.checkPlatforms(player, nextY, gameState.platforms, (platform, platformY) => {
      highestPlatform = platform;
      highestPlatformY = platformY;
      diagonalLandingY = null; // Clear diagonal landing if regular platform is higher
    });

    // Check diagonal platforms
    this.checkDiagonalPlatforms(player, nextY, gameState.diagonalPlatforms, (landingY) => {
      if (landingY < highestPlatformY) {
        highestPlatform = null; // Clear regular platform
        highestPlatformY = landingY;
        diagonalLandingY = landingY;
      }
    });

    // Check solid blocks for landing and ceiling
    this.checkSolidBlocks(
      player,
      nextY,
      gameState.solidBlocks,
      (solidBlock) => {
        if (solidBlock.position.y < highestPlatformY) {
          highestPlatform = solidBlock;
          highestPlatformY = solidBlock.position.y;
        }
      },
      () => {
        hitCeiling = true;
      },
    );

    return {
      highestPlatform,
      diagonalLandingY,
      hitCeiling,
    };
  },

  checkPlatforms(
    player: Player,
    nextY: number,
    platforms: Platform[],
    onLanding: (platform: Platform, platformY: number) => void,
  ): void {
    // Only check for landing on platforms, not ceiling collisions
    if (player.velocity.y <= 0) return;

    const playerBottom = player.position.y + player.size.y;
    const nextPlayerBottom = nextY + player.size.y;

    for (const platform of platforms) {
      if (playerBottom <= platform.position.y && nextPlayerBottom >= platform.position.y) {
        // Check horizontal overlap
        if (
          player.position.x + player.size.x > platform.position.x &&
          player.position.x < platform.position.x + platform.size.x
        ) {
          onLanding(platform, platform.position.y);
        }
      }
    }
  },

  checkDiagonalPlatforms(
    player: Player,
    nextY: number,
    diagonalPlatforms: DiagonalPlatform[],
    onLanding: (landingY: number) => void,
  ): void {
    // Only check for landing on diagonal platforms, not ceiling collisions
    if (player.velocity.y <= 0) return;

    const playerBottom = player.position.y + player.size.y;
    const nextPlayerBottom = nextY + player.size.y;
    const playerLeft = player.position.x;
    const playerRight = player.position.x + player.size.x;

    for (const diagonalPlatform of diagonalPlatforms) {
      // Use the platform's landing detection method
      const landingCheck = diagonalPlatform.checkPlayerLanding(
        playerLeft,
        playerRight,
        playerBottom,
        nextPlayerBottom,
      );

      if (landingCheck.canLand) {
        onLanding(landingCheck.landingY);
      }
    }
  },

  checkSolidBlocks(
    player: Player,
    nextY: number,
    solidBlocks: SolidBlock[],
    onLanding: (solidBlock: SolidBlock) => void,
    onHitCeiling: () => void,
  ): void {
    for (const solidBlock of solidBlocks) {
      // Check landing on top of solid block (falling)
      if (player.velocity.y > 0) {
        const playerBottom = player.position.y + player.size.y;
        const nextPlayerBottom = nextY + player.size.y;

        if (playerBottom <= solidBlock.position.y && nextPlayerBottom >= solidBlock.position.y) {
          // Check horizontal overlap
          if (
            player.position.x + player.size.x > solidBlock.position.x &&
            player.position.x < solidBlock.position.x + solidBlock.size.x
          ) {
            onLanding(solidBlock);
          }
        }
      }
      // Check hitting ceiling (moving upward)
      else if (player.velocity.y < 0) {
        const playerTop = player.position.y;
        const nextPlayerTop = nextY;
        const solidBlockBottom = solidBlock.position.y + solidBlock.size.y;

        if (playerTop >= solidBlockBottom && nextPlayerTop <= solidBlockBottom) {
          // Check horizontal overlap
          if (
            player.position.x + player.size.x > solidBlock.position.x &&
            player.position.x < solidBlock.position.x + solidBlock.size.x
          ) {
            onHitCeiling();
            break; // Exit loop on ceiling hit
          }
        }
      }
    }
  },

  applyVerticalMovement(
    player: Player,
    nextY: number,
    collisionResult: {
      highestPlatform: Platform | SolidBlock | null;
      diagonalLandingY: number | null;
      hitCeiling: boolean;
    },
  ): void {
    const { highestPlatform, diagonalLandingY, hitCeiling } = collisionResult;

    if (highestPlatform) {
      // Land on regular platform or solid block
      player.position.y = highestPlatform.position.y - player.size.y;
      player.velocity.y = 0;
      player.grounded = true;
    } else if (diagonalLandingY !== null) {
      // Land on diagonal platform
      player.position.y = diagonalLandingY - player.size.y;
      player.velocity.y = 0;
      player.grounded = true;
    } else if (hitCeiling) {
      // Hit ceiling - get exact position from physics helper
      player.velocity.y = 0;
    } else {
      // No collision, apply normal movement
      player.position.y = nextY;
    }
  },

  applyLevelBoundaries(
    player: Player,
    gameState: {
      levelManager: { getLevelData(id: string): { width?: number; height?: number } | undefined };
      currentLevelId?: string;
    },
  ): void {
    const levelData = gameState.levelManager.getLevelData(gameState.currentLevelId ?? "");
    const levelWidth = levelData?.width || 800;
    const levelHeight = levelData?.height || 600;

    // Apply horizontal boundaries
    if (player.position.x < 0) player.position.x = 0;
    if (player.position.x + player.size.x > levelWidth)
      player.position.x = levelWidth - player.size.x;

    // Apply vertical boundary at the bottom of the level
    if (player.position.y + player.size.y > levelHeight) {
      player.position.y = levelHeight - player.size.y;
      player.velocity.y = 0;
      player.grounded = true;
    }
  },
};

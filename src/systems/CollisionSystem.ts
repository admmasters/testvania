import type { DiagonalPlatform } from "@/objects/diagonalPlatform";
import type { Enemy } from "@/objects/enemy";
import type { Platform } from "@/objects/platform";
import type { Player } from "@/objects/player";
import type { SolidBlock } from "@/objects/solidBlock";
import {
  checkCollision,
  checkDiagonalPlatformCollision,
  normalizeBounds,
  resolveCollision,
  wouldCollideHorizontally,
} from "@/utils/CollisionUtils";
import type { GameState } from "../engine/GameState";
import type { ISystem } from "../interfaces/GameInterfaces";

export class CollisionSystem implements ISystem {
  priority = 10;

  update(_deltaTime: number, gameState: GameState): void {
    // Check memory crystal collisions with player attacks
    this.checkMemoryCrystalCollisions(gameState);

    // Check experience collisions with player
    this.checkExperienceCollisions(gameState);

    // Check enemy collisions with player
    this.checkEnemyPlayerCollisions(gameState);

    // Check platform collisions for player
    this.checkPlayerPlatformCollisions(gameState);

    // Check enemy platform collisions
    this.checkEnemyPlatformCollisions(gameState);
  }

  private checkMemoryCrystalCollisions(gameState: GameState): void {
    if (!gameState.player.attacking) return;

    const attackBounds = gameState.player.getAttackBounds();
    if (!attackBounds) return;

    for (const crystal of gameState.memoryCrystals) {
      if (crystal.isActive && !crystal.isBreaking) {
        const crystalBounds = crystal.getBounds();

        const crystalLeft = crystalBounds.left;
        const crystalRight = crystalBounds.right;
        const crystalTop = crystalBounds.top;
        const crystalBottom = crystalBounds.bottom;

        const isColliding =
          attackBounds.left < crystalRight &&
          attackBounds.right > crystalLeft &&
          attackBounds.top < crystalBottom &&
          attackBounds.bottom > crystalTop;

        if (isColliding) {
          const drops = crystal.break();

          drops.experience.forEach((exp) => {
            gameState.experiences.push(exp);
          });

          this.createHitSpark(
            gameState,
            crystal.position.x + crystal.size.x / 2,
            crystal.position.y,
          );
        }
      }
    }
  }

  private checkExperienceCollisions(gameState: GameState): void {
    const playerBounds = gameState.player.getBounds();

    for (const experience of gameState.experiences) {
      if (experience.isActive) {
        const expBounds = experience.getBounds();

        if (
          checkCollision(
            {
              getBounds: () => playerBounds,
              position: gameState.player.position,
              size: gameState.player.size,
            },
            { getBounds: () => expBounds, position: experience.position, size: experience.size },
          )
        ) {
          const expValue = experience.collect();
          if (expValue > 0) {
            gameState.player.gainExp(expValue);
          }
        }
      }
    }
  }

  private checkEnemyPlayerCollisions(gameState: GameState): void {
    if (gameState.player.invulnerable) return;

    const playerBounds = gameState.player.getBounds();

    for (const enemy of gameState.enemies) {
      if (!enemy.active || enemy.isDying) continue;

      const enemyBounds = enemy.getBounds();

      if (
        checkCollision(
          {
            getBounds: () => playerBounds,
            position: gameState.player.position,
            size: gameState.player.size,
          },
          { getBounds: () => enemyBounds, position: enemy.position, size: enemy.size },
        )
      ) {
        // Player takes damage
        this.damagePlayer(gameState, enemy);
      }

      // Check if player is attacking enemy
      if (gameState.player.attacking) {
        const attackBounds = gameState.player.getAttackBounds();
        if (attackBounds) {
          const normalizedEnemyBounds = normalizeBounds(enemyBounds);
          const isAttackColliding =
            attackBounds.left < normalizedEnemyBounds.right &&
            attackBounds.right > normalizedEnemyBounds.left &&
            attackBounds.top < normalizedEnemyBounds.bottom &&
            attackBounds.bottom > normalizedEnemyBounds.top;

          if (isAttackColliding) {
            this.damageEnemy(gameState, enemy);
          }
        }
      }
    }
  }

  private checkPlayerPlatformCollisions(gameState: GameState): void {
    const player = gameState.player;
    const platforms = gameState.platforms;
    const solidBlocks = gameState.solidBlocks;
    const diagonalPlatforms = gameState.diagonalPlatforms;

    // Check regular platform collisions
    for (const platform of platforms) {
      this.handlePlayerPlatformCollision(player, platform);
    }

    // Check solid block collisions
    for (const solidBlock of solidBlocks) {
      this.handlePlayerSolidBlockCollision(player, solidBlock);
    }

    // Check diagonal platform collisions
    for (const diagonalPlatform of diagonalPlatforms) {
      this.handlePlayerDiagonalPlatformCollision(player, diagonalPlatform);
    }
  }

  private checkEnemyPlatformCollisions(gameState: GameState): void {
    for (const enemy of gameState.enemies) {
      if (!enemy.active) continue;

      // Check solid block collisions for enemies
      for (const solidBlock of gameState.solidBlocks) {
        if (this.wouldEnemyCollideHorizontally(enemy, solidBlock)) {
          // Enemy should reverse direction
          if (enemy.direction) {
            enemy.direction *= -1;
          }
        }
      }
    }
  }

  private handlePlayerPlatformCollision(player: Player, platform: Platform): void {
    const playerBounds = player.getBounds();
    const platformBounds = platform.getBounds();

    if (
      checkCollision(
        { getBounds: () => playerBounds, position: player.position, size: player.size },
        { getBounds: () => platformBounds, position: platform.position, size: platform.size },
      )
    ) {
      // Player is on top of platform
      const snapThreshold = 8; // pixels
      const playerBottom = player.position.y + player.size.y;
      if (
        player.velocity.y >= 0 &&
        player.position.y < platformBounds.top &&
        Math.abs(playerBottom - platformBounds.top) <= snapThreshold
      ) {
        player.position.y = platformBounds.top - player.size.y;
        player.velocity.y = 0;
        player.grounded = true;
      }
    }
  }

  private handlePlayerSolidBlockCollision(player: Player, solidBlock: SolidBlock): void {
    const playerBounds = player.getBounds();
    const solidBlockBounds = solidBlock.getBounds();

    if (
      checkCollision(
        { getBounds: () => playerBounds, position: player.position, size: player.size },
        { getBounds: () => solidBlockBounds, position: solidBlock.position, size: solidBlock.size },
      )
    ) {
      // Resolve collision by pushing player out
      resolveCollision(player, {
        getBounds: () => solidBlockBounds,
        position: solidBlock.position,
        size: solidBlock.size,
      });
    }
  }

  private handlePlayerDiagonalPlatformCollision(
    player: Player,
    diagonalPlatform: DiagonalPlatform,
  ): void {
    const collision = checkDiagonalPlatformCollision(
      player.position.x,
      player.position.y,
      player.size.x,
      player.size.y,
      diagonalPlatform,
    );

    if (collision.colliding && collision.surfaceY !== undefined) {
      // Player is on the diagonal surface
      if (player.velocity.y >= 0 && player.position.y + player.size.y >= collision.surfaceY) {
        player.position.y = collision.surfaceY - player.size.y;
        player.velocity.y = 0;
        player.grounded = true;
      }
    }
  }

  private wouldEnemyCollideHorizontally(enemy: Enemy, solidBlock: SolidBlock): boolean {
    if (!enemy.direction || !enemy.speed) return false;

    const nextX = enemy.position.x + enemy.direction * enemy.speed * 0.016; // Approximate deltaTime
    return wouldCollideHorizontally(
      nextX,
      enemy.position.y,
      enemy.size.x,
      enemy.size.y,
      solidBlock,
    );
  }

  private damagePlayer(gameState: GameState, source: Enemy): void {
    if (gameState.player.invulnerable) return;

    const damage = source.damage || 1;
    gameState.player.takeDamage(damage);

    // Create hit effect
    this.createHitSpark(
      gameState,
      gameState.player.position.x + gameState.player.size.x / 2,
      gameState.player.position.y,
    );

    // Apply knockback
    this.applyKnockback(gameState.player, source);
  }

  private damageEnemy(gameState: GameState, enemy: Enemy): void {
    if (enemy.isHit || enemy.isDying) return;

    const damage = gameState.player.strength || 1;
    enemy.takeDamage(damage);

    // Create hit effect
    this.createHitSpark(gameState, enemy.position.x + enemy.size.x / 2, enemy.position.y);

    // Apply hit pause effect
    gameState.hitPause(0.1, [enemy]);

    // Award experience if enemy dies
    if (enemy.health <= 0) {
      gameState.awardExp(
        enemy.expValue || 10,
        enemy.position.x + enemy.size.x / 2,
        enemy.position.y,
      );
    }
  }

  private applyKnockback(target: Player, source: Enemy): void {
    const knockbackForce = 200;
    const direction = target.position.x < source.position.x ? -1 : 1;

    if (target.velocity) {
      target.velocity.x = direction * knockbackForce;
    }
  }

  private createHitSpark(gameState: GameState, x: number, y: number): void {
    gameState.createHitSpark(x, y);
  }
}

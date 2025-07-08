import type { GameState } from "@/engine/GameState";
import { Vector2 } from "@/engine/Vector2";
import { MemoryCrystal } from "@/objects/memoryCrystal";
import { DiagonalPlatform } from "@/objects/diagonalPlatform";
import { Ghost } from "@/objects/Ghost";
import { LandGhost } from "@/objects/LandGhost";
import { Platform } from "@/objects/platform";
import { SolidBlock } from "@/objects/solidBlock";
import type { EditorDiagonalPlatform, EditorObject, EditorPlatform } from "./EditorTypes";
import type { EditorUtils } from "./EditorUtils";

export class EditorObjectManager {
  private gameState: GameState;
  private utils: EditorUtils;

  constructor(gameState: GameState, utils: EditorUtils) {
    this.gameState = gameState;
    this.utils = utils;
  }

  selectObjectAt(pos: Vector2): EditorObject {
    // Prioritize: enemy > memory crystal > platform > solid block > player

    // Check enemies first
    for (const enemy of this.gameState.enemies) {
      if (this.isPointInObject(pos, enemy)) {
        return enemy;
      }
    }

    // Check memory crystals
    for (const crystal of this.gameState.memoryCrystals) {
      if (this.isPointInObject(pos, crystal)) {
        return crystal;
      }
    }

    // Check platforms
    for (const platform of this.gameState.platforms) {
      if (this.isPointInObject(pos, platform)) {
        return platform;
      }
    }

    // Check diagonal platforms
    for (const diagonalPlatform of this.gameState.diagonalPlatforms) {
      if (this.isPointInDiagonalPlatform(pos, diagonalPlatform)) {
        return diagonalPlatform;
      }
    }

    // Check solid blocks
    for (const solidBlock of this.gameState.solidBlocks) {
      if (this.isPointInObject(pos, solidBlock)) {
        return solidBlock;
      }
    }

    // Check player
    const player = this.gameState.player;
    if (this.isPointInObject(pos, player)) {
      return player;
    }

    return null;
  }

  startPlatformCreation(pos: Vector2, color: string): EditorPlatform {
    const snapped = this.utils.snapVec2(pos);
    return {
      position: snapped,
      size: new Vector2(0, 0),
      color: color,
    };
  }

  startSolidBlockCreation(pos: Vector2): EditorPlatform {
    const snapped = this.utils.snapVec2(pos);
    return {
      position: snapped,
      size: new Vector2(0, 0),
      color: "#4A4A4A", // Default solid block color
    };
  }

  updatePlatformSize(currentPlatform: EditorPlatform, pos: Vector2): void {
    const snapped = this.utils.snapVec2(pos);
    currentPlatform.size.x = snapped.x - currentPlatform.position.x;
    currentPlatform.size.y = snapped.y - currentPlatform.position.y;

    if (currentPlatform.size.x < 0) {
      currentPlatform.position.x = snapped.x;
      currentPlatform.size.x = Math.abs(currentPlatform.size.x);
    }
    if (currentPlatform.size.y < 0) {
      currentPlatform.position.y = snapped.y;
      currentPlatform.size.y = Math.abs(currentPlatform.size.y);
    }
  }

  finishPlatform(currentPlatform: EditorPlatform | null, pos: Vector2): void {
    if (!currentPlatform) return;

    // Update size one last time
    this.updatePlatformSize(currentPlatform, pos);

    // Prevent 0x0 platforms
    if (currentPlatform.size.x === 0 || currentPlatform.size.y === 0) {
      return;
    }

    // Add platform to game state
    this.gameState.platforms.push(
      new Platform({
        x: currentPlatform.position.x,
        y: currentPlatform.position.y,
        width: currentPlatform.size.x,
        height: currentPlatform.size.y,
        color: currentPlatform.color,
      }),
    );
  }

  startDiagonalPlatformCreation(pos: Vector2, color: string): EditorDiagonalPlatform {
    const snapped = this.utils.snapVec2(pos);
    return {
      startPoint: snapped,
      endPoint: snapped,
      thickness: 16,
      color: color,
    };
  }

  updateDiagonalPlatformSize(currentPlatform: EditorDiagonalPlatform, pos: Vector2): void {
    const snapped = this.utils.snapVec2(pos);
    currentPlatform.endPoint = snapped;
  }

  finishDiagonalPlatform(currentPlatform: EditorDiagonalPlatform | null, pos: Vector2): void {
    if (!currentPlatform) return;

    // Update end point one last time
    this.updateDiagonalPlatformSize(currentPlatform, pos);

    // Prevent zero-length diagonal platforms
    const dx = currentPlatform.endPoint.x - currentPlatform.startPoint.x;
    const dy = currentPlatform.endPoint.y - currentPlatform.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 10) {
      return;
    }

    // Add diagonal platform to game state
    this.gameState.diagonalPlatforms.push(
      new DiagonalPlatform({
        startPoint: currentPlatform.startPoint,
        endPoint: currentPlatform.endPoint,
        thickness: currentPlatform.thickness,
        color: currentPlatform.color,
      }),
    );
  }

  finishSolidBlock(currentPlatform: EditorPlatform | null, pos: Vector2): void {
    if (!currentPlatform) return;

    const snappedPos = this.utils.snapVec2(pos);
    const width = Math.abs(snappedPos.x - currentPlatform.position.x);
    const height = Math.abs(snappedPos.y - currentPlatform.position.y);

    // Prevent 0x0 solid blocks
    if (width === 0 || height === 0) {
      return;
    }

    if (width > 0 && height > 0) {
      const minX = Math.min(currentPlatform.position.x, snappedPos.x);
      const minY = Math.min(currentPlatform.position.y, snappedPos.y);

      this.gameState.solidBlocks.push(
        new SolidBlock({
          x: minX,
          y: minY,
          width: width,
          height: height,
          color: currentPlatform.color,
        }),
      );
    }
  }

  placeMemoryCrystal(pos: Vector2, type: string = 'azure'): void {
    const snapped = this.utils.snapVec2(pos);
    // Create new memory crystal at position (bottom center at snapped position)
    this.gameState.memoryCrystals.push(new MemoryCrystal(snapped.x - 10, snapped.y - 24, type as any));
  }

  placeGhost(pos: Vector2): void {
    const snapped = this.utils.snapVec2(pos);
    // Create new ghost at position
    // Ghosts float, so position them slightly above the snap point
    const ghostX = snapped.x - 12; // Center the 24px wide ghost
    const ghostY = snapped.y - 16; // Position the 32px tall ghost

    // Create the ghost with default direction (right)
    const newGhost = new Ghost(ghostX, ghostY, 1);
    this.gameState.enemies.push(newGhost);
  }

  placeLandGhost(pos: Vector2): void {
    const snapped = this.utils.snapVec2(pos);
    // Create new land ghost at position
    // Make sure to position the enemy on the ground by aligning to the 16-pixel grid
    const enemyX = snapped.x - 12; // Center the 24px wide enemy
    const enemyY = snapped.y - 16; // Position the 32px tall enemy

    // Create the enemy with default direction (right)
    const newEnemy = new LandGhost(enemyX, enemyY, 1);

    // When creating an enemy through the editor, initialize with zero vertical velocity
    // to prevent immediate falling
    newEnemy.velocity.y = 0;

    this.gameState.enemies.push(newEnemy);
  }

  placePlayer(pos: Vector2): void {
    const snapped = this.utils.snapVec2(pos);
    // Update player position
    this.gameState.player.position.x = snapped.x - 16;
    this.gameState.player.position.y = snapped.y - 20;
  }

  deleteObjectAt(pos: Vector2): void {
    // Check platforms
    for (let i = 0; i < this.gameState.platforms.length; i++) {
      const platform = this.gameState.platforms[i];
      if (this.isPointInObject(pos, platform)) {
        this.gameState.platforms.splice(i, 1);
        return;
      }
    }

    // Check solid blocks
    for (let i = 0; i < this.gameState.solidBlocks.length; i++) {
      const solidBlock = this.gameState.solidBlocks[i];
      if (this.isPointInObject(pos, solidBlock)) {
        this.gameState.solidBlocks.splice(i, 1);
        return;
      }
    }

    // Check diagonal platforms
    for (let i = 0; i < this.gameState.diagonalPlatforms.length; i++) {
      const diagonalPlatform = this.gameState.diagonalPlatforms[i];
      if (this.isPointInDiagonalPlatform(pos, diagonalPlatform)) {
        this.gameState.diagonalPlatforms.splice(i, 1);
        return;
      }
    }

    // Check memory crystals
    for (let i = 0; i < this.gameState.memoryCrystals.length; i++) {
      const crystal = this.gameState.memoryCrystals[i];
      if (this.isPointInObject(pos, crystal)) {
        this.gameState.memoryCrystals.splice(i, 1);
        return;
      }
    }

    // Check enemies
    for (let i = 0; i < this.gameState.enemies.length; i++) {
      const enemy = this.gameState.enemies[i];
      if (this.isPointInObject(pos, enemy)) {
        this.gameState.enemies.splice(i, 1);
        return;
      }
    }
  }

  isPlatform(obj: EditorObject): boolean {
    return obj instanceof Platform;
  }

  private isPointInObject(pos: Vector2, obj: EditorObject | null): boolean {
    if (!obj) return false;
    // Check if obj has position and size properties
    if (typeof obj === "object" && "position" in obj && "size" in obj && obj.position && obj.size) {
      return (
        pos.x >= obj.position.x &&
        pos.x <= obj.position.x + obj.size.x &&
        pos.y >= obj.position.y &&
        pos.y <= obj.position.y + obj.size.y
      );
    }
    return false;
  }

  private isPointInDiagonalPlatform(pos: Vector2, diagonalPlatform: DiagonalPlatform): boolean {
    // Use the diagonal platform's own surface detection method
    const surfaceCheck = diagonalPlatform.isPointOnSurface(pos.x, pos.y);
    return surfaceCheck.isOn;
  }
}

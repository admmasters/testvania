import type { Platform } from "../objects/platform";
import type { SolidBlock } from "../objects/solidBlock";
import type { DiagonalPlatform } from "../objects/diagonalPlatform";

export interface CollidableObject {
  position: { x: number; y: number };
  size: { x: number; y: number };
  getBounds(): { left: number; right: number; top: number; bottom: number } | { x: number; y: number; width: number; height: number };
}

export class CollisionUtils {
  /**
   * Normalize bounds to standard format
   */
  static normalizeBounds(bounds: { left: number; right: number; top: number; bottom: number } | { x: number; y: number; width: number; height: number }): { left: number; right: number; top: number; bottom: number } {
    if ('left' in bounds) {
      return bounds;
    } else {
      return {
        left: bounds.x,
        right: bounds.x + bounds.width,
        top: bounds.y,
        bottom: bounds.y + bounds.height
      };
    }
  }

  /**
   * Check if an object would collide horizontally with solid blocks at a given x position
   */
  static wouldCollideHorizontally(
    targetX: number,
    currentY: number,
    objectWidth: number,
    objectHeight: number,
    solidBlock: SolidBlock
  ): boolean {
    const bounds = CollisionUtils.normalizeBounds(solidBlock.getBounds());
    
    const left = targetX;
    const right = targetX + objectWidth;
    const top = currentY;
    const bottom = currentY + objectHeight;
    
    return (
      left < bounds.right &&
      right > bounds.left &&
      top < bounds.bottom &&
      bottom > bounds.top
    );
  }

  /**
   * Check if an object would collide vertically with platforms at a given y position
   */
  static wouldCollideVertically(
    currentX: number,
    targetY: number,
    objectWidth: number,
    objectHeight: number,
    platform: Platform
  ): boolean {
    const bounds = CollisionUtils.normalizeBounds(platform.getBounds());
    
    const left = currentX;
    const right = currentX + objectWidth;
    const top = targetY;
    const bottom = targetY + objectHeight;
    
    return (
      left < bounds.right &&
      right > bounds.left &&
      top < bounds.bottom &&
      bottom > bounds.top
    );
  }

  /**
   * Check collision between two game objects
   */
  static checkCollision(obj1: CollidableObject, obj2: CollidableObject): boolean {
    const bounds1 = CollisionUtils.normalizeBounds(obj1.getBounds());
    const bounds2 = CollisionUtils.normalizeBounds(obj2.getBounds());
    
    return (
      bounds1.left < bounds2.right &&
      bounds1.right > bounds2.left &&
      bounds1.top < bounds2.bottom &&
      bounds1.bottom > bounds2.top
    );
  }

  /**
   * Check if an object is within level boundaries
   */
  static isWithinLevelBounds(
    position: { x: number; y: number },
    size: { x: number; y: number },
    levelWidth: number,
    levelHeight: number
  ): boolean {
    return (
      position.x >= 0 &&
      position.x + size.x <= levelWidth &&
      position.y >= 0 &&
      position.y + size.y <= levelHeight
    );
  }

  /**
   * Check diagonal platform collision with slope consideration
   */
  static checkDiagonalPlatformCollision(
    objectX: number,
    objectY: number,
    objectWidth: number,
    objectHeight: number,
    diagonalPlatform: DiagonalPlatform
  ): { colliding: boolean; surfaceY?: number } {
    const bounds = CollisionUtils.normalizeBounds(diagonalPlatform.getBounds());
    
    // Check if object is within the platform's horizontal bounds
    if (objectX + objectWidth <= bounds.left || objectX >= bounds.right) {
      return { colliding: false };
    }
    
    // Calculate the surface Y position based on the slope
    const relativeX = objectX + objectWidth / 2 - bounds.left;
    const progress = relativeX / (bounds.right - bounds.left);
    
    // Assume slope goes from top-left to bottom-right (can be made configurable)
    const surfaceY = bounds.top + progress * (bounds.bottom - bounds.top);
    
    // Check if object is touching or below the diagonal surface
    const objectBottom = objectY + objectHeight;
    const colliding = objectBottom >= surfaceY && objectY <= bounds.bottom;
    
    return { colliding, surfaceY };
  }

  /**
   * Get the closest edge distance for knockback calculations
   */
  static getClosestEdgeDistance(
    obj: CollidableObject,
    target: CollidableObject
  ): { direction: 'left' | 'right' | 'up' | 'down'; distance: number } {
    const bounds1 = CollisionUtils.normalizeBounds(obj.getBounds());
    const bounds2 = CollisionUtils.normalizeBounds(target.getBounds());
    
    const center1X = (bounds1.left + bounds1.right) / 2;
    const center1Y = (bounds1.top + bounds1.bottom) / 2;
    const center2X = (bounds2.left + bounds2.right) / 2;
    const center2Y = (bounds2.top + bounds2.bottom) / 2;
    
    const dx = center2X - center1X;
    const dy = center2Y - center1Y;
    
    // Determine which edge is closest
    const width1 = bounds1.right - bounds1.left;
    const height1 = bounds1.bottom - bounds1.top;
    const width2 = bounds2.right - bounds2.left;
    const height2 = bounds2.bottom - bounds2.top;
    
    const overlapX = (width1 + width2) / 2 - Math.abs(dx);
    const overlapY = (height1 + height2) / 2 - Math.abs(dy);
    
    if (overlapX < overlapY) {
      return {
        direction: dx > 0 ? 'right' : 'left',
        distance: overlapX
      };
    } else {
      return {
        direction: dy > 0 ? 'down' : 'up',
        distance: overlapY
      };
    }
  }

  /**
   * Resolve collision by separating objects
   */
  static resolveCollision(
    movingObject: CollidableObject & { position: { x: number; y: number } },
    staticObject: CollidableObject,
    preventDirection?: 'horizontal' | 'vertical'
  ): void {
    const edge = CollisionUtils.getClosestEdgeDistance(movingObject, staticObject);
    
    if (preventDirection === 'horizontal' && (edge.direction === 'left' || edge.direction === 'right')) {
      return;
    }
    
    if (preventDirection === 'vertical' && (edge.direction === 'up' || edge.direction === 'down')) {
      return;
    }
    
    switch (edge.direction) {
      case 'left':
        movingObject.position.x -= edge.distance;
        break;
      case 'right':
        movingObject.position.x += edge.distance;
        break;
      case 'up':
        movingObject.position.y -= edge.distance;
        break;
      case 'down':
        movingObject.position.y += edge.distance;
        break;
    }
  }
}
import type { Vector2 } from "../../engine/Vector2.js";

export interface ChainReactionTarget {
  position: Vector2;
  isActive: boolean;
  isBreaking: boolean;
  triggerChainReaction(delay: number): void;
}

export class ChainReactionManager {
  private chainReactionDelay: number;
  private triggeredByChain: boolean = false;

  constructor(delay: number = 0.2) {
    this.chainReactionDelay = delay;
  }

  canTriggerChainReaction(_source: Vector2, target: ChainReactionTarget): boolean {
    if (!target.isActive || target.isBreaking) {
      return false;
    }

    // We're now using cross-shaped area instead of radius
    // This is handled by the MemoryCrystal.canTriggerChainReaction method
    // This method is kept for backward compatibility
    return true;
  }

  triggerChainReaction(target: ChainReactionTarget, delay: number = 0): void {
    if (target.isBreaking || !target.isActive) return;

    this.triggeredByChain = true;

    if (delay > 0) {
      setTimeout(() => {
        if (target.isActive && !target.isBreaking) {
          target.triggerChainReaction(0);
        }
      }, delay * 1000);
    } else {
      target.triggerChainReaction(0);
    }
  }

  processChainReaction(sourcePosition: Vector2, targets: ChainReactionTarget[]): void {
    targets.forEach((target) => {
      if (this.canTriggerChainReaction(sourcePosition, target)) {
        this.triggerChainReaction(target, this.chainReactionDelay);
      }
    });
  }

  wasTriggeredByChain(): boolean {
    return this.triggeredByChain;
  }

  setTriggeredByChain(value: boolean): void {
    this.triggeredByChain = value;
  }

  getDelay(): number {
    return this.chainReactionDelay;
  }

  setDelay(delay: number): void {
    this.chainReactionDelay = delay;
  }
}

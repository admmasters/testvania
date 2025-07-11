import { Vector2 } from "../../engine/Vector2.js";

export interface ChainReactionTarget {
  position: Vector2;
  isActive: boolean;
  isBreaking: boolean;
  triggerChainReaction(delay: number): void;
}

export class ChainReactionManager {
  private chainReactionRadius: number;
  private chainReactionDelay: number;
  private triggeredByChain: boolean = false;

  constructor(radius: number = 60, delay: number = 0.2) {
    this.chainReactionRadius = radius;
    this.chainReactionDelay = delay;
  }

  canTriggerChainReaction(source: Vector2, target: ChainReactionTarget): boolean {
    if (!target.isActive || target.isBreaking) {
      return false;
    }

    const distance = Vector2.distance(source, target.position);
    return distance <= this.chainReactionRadius;
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
    targets.forEach(target => {
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

  getRadius(): number {
    return this.chainReactionRadius;
  }

  getDelay(): number {
    return this.chainReactionDelay;
  }

  setRadius(radius: number): void {
    this.chainReactionRadius = radius;
  }

  setDelay(delay: number): void {
    this.chainReactionDelay = delay;
  }
}
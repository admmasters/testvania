import type { ICollidable, IEventEmitter } from "../interfaces/GameInterfaces";
import type { Enemy } from "../objects/enemy";
import type { Player } from "../objects/player";

export type EventCallback = (...args: unknown[]) => void;

export class EventSystem implements IEventEmitter {
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private static instance: EventSystem;

  constructor() {
    if (!EventSystem.instance) {
      EventSystem.instance = this;
    }
  }

  static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem();
    }
    return EventSystem.instance;
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.push(callback);
    }
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }

      // Clean up empty listener arrays
      if (listeners.length === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Subscribe to an event only once
   */
  once(event: string, callback: EventCallback): void {
    const onceWrapper = (...args: unknown[]) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      // Create a copy of the listeners array to avoid issues if listeners are modified during emission
      const listenersCopy = [...listeners];
      for (const listener of listenersCopy) {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for event '${event}':`, error);
        }
      }
    }
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    const listeners = this.eventListeners.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Array.from(this.eventListeners.keys());
  }

  /**
   * Check if an event has listeners
   */
  hasListeners(event: string): boolean {
    const listeners = this.eventListeners.get(event);
    return this.eventListeners.has(event) && !!listeners && listeners.length > 0;
  }
}

// Global event system instance
export const gameEvents = EventSystem.getInstance();

// Common game events
export const GAME_EVENTS = {
  // Player events
  PLAYER_SPAWN: "player:spawn",
  PLAYER_DEATH: "player:death",
  PLAYER_LEVEL_UP: "player:levelUp",
  PLAYER_TAKE_DAMAGE: "player:takeDamage",
  PLAYER_HEAL: "player:heal",
  PLAYER_ATTACK: "player:attack",
  PLAYER_JUMP: "player:jump",
  PLAYER_LAND: "player:land",

  // Enemy events
  ENEMY_SPAWN: "enemy:spawn",
  ENEMY_DEATH: "enemy:death",
  ENEMY_TAKE_DAMAGE: "enemy:takeDamage",
  ENEMY_ATTACK: "enemy:attack",

  // Item events
  ITEM_SPAWN: "item:spawn",
  ITEM_COLLECT: "item:collect",
  CANDLE_BREAK: "candle:break",

  // Level events
  LEVEL_LOAD: "level:load",
  LEVEL_COMPLETE: "level:complete",
  LEVEL_TRANSITION: "level:transition",

  // Game state events
  GAME_START: "game:start",
  GAME_PAUSE: "game:pause",
  GAME_RESUME: "game:resume",
  GAME_OVER: "game:over",

  // UI events
  UI_SHOW: "ui:show",
  UI_HIDE: "ui:hide",
  UI_UPDATE: "ui:update",

  // System events
  COLLISION_DETECTED: "collision:detected",
  AUDIO_PLAY: "audio:play",
  AUDIO_STOP: "audio:stop",

  // Effects events
  EFFECT_SPAWN: "effect:spawn",
  SCREEN_SHAKE: "screen:shake",
  HIT_PAUSE: "hit:pause",
} as const;

// Event data types

export interface PlayerEventData {
  player: Player;
  position: { x: number; y: number };
  health?: number;
  level?: number;
  exp?: number;
}

export interface EnemyEventData {
  enemy: Enemy;
  position: { x: number; y: number };
  health?: number;
  damage?: number;
}

// If you have a specific Item class, import and use it here. Otherwise, use unknown or a more specific type if available.
export interface ItemEventData {
  item: unknown;
  position: { x: number; y: number };
  type: string;
  value?: number;
}

export interface LevelEventData {
  levelId: string;
  playerPosition?: { x: number; y: number };
}

export interface CollisionEventData {
  objectA: ICollidable;
  objectB: ICollidable;
  collisionType: string;
  position: { x: number; y: number };
}

export interface EffectEventData {
  type: string;
  position: { x: number; y: number };
  intensity?: number;
  duration?: number;
}

// Event dispatcher utility
export class EventDispatcher {
  /**
   * Dispatch a player event
   */
  static dispatchPlayerEvent(eventName: string, data: PlayerEventData): void {
    gameEvents.emit(eventName, data);
  }

  /**
   * Dispatch an enemy event
   */
  static dispatchEnemyEvent(eventName: string, data: EnemyEventData): void {
    gameEvents.emit(eventName, data);
  }

  /**
   * Dispatch an item event
   */
  static dispatchItemEvent(eventName: string, data: ItemEventData): void {
    gameEvents.emit(eventName, data);
  }

  /**
   * Dispatch a level event
   */
  static dispatchLevelEvent(eventName: string, data: LevelEventData): void {
    gameEvents.emit(eventName, data);
  }

  /**
   * Dispatch a collision event
   */
  static dispatchCollisionEvent(eventName: string, data: CollisionEventData): void {
    gameEvents.emit(eventName, data);
  }

  /**
   * Dispatch an effect event
   */
  static dispatchEffectEvent(eventName: string, data: EffectEventData): void {
    gameEvents.emit(eventName, data);
  }
}

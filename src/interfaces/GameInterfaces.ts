import type { GameState } from "../engine/GameState";

/**
 * Interface for objects that can be rendered
 */
export interface IRenderable {
  render(ctx: CanvasRenderingContext2D): void;
  isVisible?: boolean;
  renderOrder?: number;
}

/**
 * Interface for objects that can be updated each frame
 */
export interface IUpdateable {
  update(deltaTime: number, gameState: GameState): void;
  active?: boolean;
}

/**
 * Interface for objects that can participate in collision detection
 */
export interface ICollidable {
  getBounds(): { left: number; right: number; top: number; bottom: number } | { x: number; y: number; width: number; height: number };
  position: { x: number; y: number };
  size: { x: number; y: number };
  onCollision?(other: ICollidable, collisionType: CollisionType): void;
}

/**
 * Interface for objects that can take damage
 */
export interface IDamageable {
  health: number;
  maxHealth: number;
  takeDamage(amount: number, source?: ICollidable): void;
  isInvulnerable?: boolean;
}

/**
 * Interface for objects that can attack
 */
export interface IAttacker {
  damage: number;
  canAttack(target: IDamageable): boolean;
  attack(target: IDamageable): void;
}

/**
 * Interface for game systems
 */
export interface ISystem {
  initialize?(gameState: GameState): void;
  update(deltaTime: number, gameState: GameState): void;
  cleanup?(): void;
  priority?: number;
}

/**
 * Interface for game components (for ECS architecture)
 */
export interface IComponent {
  type: string;
  entityId: string;
  active: boolean;
}

/**
 * Interface for entities (for ECS architecture)
 */
export interface IEntity {
  id: string;
  components: Map<string, IComponent>;
  addComponent(component: IComponent): void;
  removeComponent(componentType: string): void;
  getComponent<T extends IComponent>(componentType: string): T | undefined;
  hasComponent(componentType: string): boolean;
}

/**
 * Interface for input handling
 */
export interface IInputHandler {
  handleInput(input: IInputState, deltaTime: number, gameState: GameState): void;
}

/**
 * Input state interface
 */
export interface IInputState {
  isKeyDown(key: string): boolean;
  isKeyPressed(key: string): boolean;
  isKeyReleased(key: string): boolean;
  mousePosition: { x: number; y: number };
  isMouseButtonDown(button: number): boolean;
  isMouseButtonPressed(button: number): boolean;
}

/**
 * Interface for physics objects
 */
export interface IPhysicsObject {
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  mass?: number;
  friction?: number;
  gravity?: number;
  applyForce(force: { x: number; y: number }): void;
  applyImpulse(impulse: { x: number; y: number }): void;
}

/**
 * Interface for objects that can be serialized
 */
export interface ISerializable {
  serialize(): any;
  deserialize(data: any): void;
}

/**
 * Interface for event emitters
 */
export interface IEventEmitter {
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

/**
 * Interface for level data
 */
export interface ILevelData {
  width: number;
  height: number;
  playerSpawn: { x: number; y: number };
  platforms: Array<{ x: number; y: number; width: number; height: number }>;
  enemies: Array<{ x: number; y: number; type: string; direction?: number }>;
  items: Array<{ x: number; y: number; type: string }>;
  background?: string;
}

/**
 * Interface for game object factories
 */
export interface IGameObjectFactory {
  createPlayer(x: number, y: number): IUpdateable & IRenderable & ICollidable;
  createEnemy(x: number, y: number, type: string): IUpdateable & IRenderable & ICollidable;
  createPlatform(x: number, y: number, width: number, height: number): ICollidable & IRenderable;
  createItem(x: number, y: number, type: string): IUpdateable & IRenderable & ICollidable;
}

/**
 * Interface for animation systems
 */
export interface IAnimatable {
  currentAnimation: string;
  animations: Map<string, IAnimation>;
  playAnimation(name: string, loop?: boolean): void;
  updateAnimation(deltaTime: number): void;
}

/**
 * Interface for animation data
 */
export interface IAnimation {
  frames: Array<{ x: number; y: number; width: number; height: number }>;
  frameDuration: number;
  loop: boolean;
  currentFrame: number;
  timer: number;
}

/**
 * Interface for sound management
 */
export interface ISoundManager {
  playSound(name: string, volume?: number): void;
  playMusic(name: string, volume?: number, loop?: boolean): void;
  stopSound(name: string): void;
  stopMusic(): void;
  setMasterVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  setMusicVolume(volume: number): void;
}

/**
 * Interface for particle systems
 */
export interface IParticleSystem {
  particles: Array<IParticle>;
  emit(config: IParticleConfig): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

/**
 * Interface for individual particles
 */
export interface IParticle {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  age: number;
}

/**
 * Interface for particle configuration
 */
export interface IParticleConfig {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  size: number;
  color: string;
  lifetime: number;
  count: number;
  spread?: number;
}

/**
 * Collision types
 */
export enum CollisionType {
  PLAYER_ENEMY = "player_enemy",
  PLAYER_PLATFORM = "player_platform",
  PLAYER_ITEM = "player_item",
  ENEMY_PLATFORM = "enemy_platform",
  PROJECTILE_ENEMY = "projectile_enemy",
  PROJECTILE_PLATFORM = "projectile_platform"
}

/**
 * Game object states
 */
export enum GameObjectState {
  IDLE = "idle",
  MOVING = "moving",
  ATTACKING = "attacking",
  HURT = "hurt",
  DYING = "dying",
  DEAD = "dead"
}

/**
 * Game events
 */
export enum GameEvent {
  PLAYER_DEATH = "player_death",
  ENEMY_DEATH = "enemy_death",
  LEVEL_COMPLETE = "level_complete",
  ITEM_COLLECTED = "item_collected",
  PLAYER_LEVEL_UP = "player_level_up",
  GAME_PAUSE = "game_pause",
  GAME_RESUME = "game_resume"
}
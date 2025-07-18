# Design Document

## Overview

The MP Chain Reaction System transforms the current static MP display into a dynamic, gameplay-integrated resource system that rewards strategic crystal chain reactions and provides meaningful combat abilities. The system consists of four main components: MP earning through chain reactions, MP-based abilities, enhanced HUD integration, and persistent progression mechanics.

The current system simply displays `player.level * 5` as MP with no gameplay function. The enhanced system will make MP a core resource that players actively earn, manage, and spend strategically.

## Architecture

### Core Components

1. **MPManager**: Central system managing MP earning, spending, and ability activation
2. **ChainReactionTracker**: Monitors crystal chain reactions and calculates MP rewards
3. **MPAbilitySystem**: Handles MP-based abilities and their effects
4. **EnhancedHUD**: Updated HUD with dynamic MP display and ability indicators
5. **MPPersistence**: Manages MP storage between levels and sessions

### System Integration Points

- **ComboSystem**: Enhanced to track chain reaction lengths and trigger MP rewards
- **MemoryCrystal**: Modified to report chain reaction events to MPManager
- **HitFeedbackManager**: Extended to handle MP ability visual effects
- **EventSystem**: Used for MP-related event communication
- **Player**: Extended with MP ability input handling and state management

## Components and Interfaces

### MPManager Interface

```typescript
interface MPManager {
  currentMP: number;
  maxMP: number;
  
  // Core MP operations
  awardMP(amount: number, source: 'chain' | 'crystal' | 'bonus'): void;
  spendMP(amount: number, ability: string): boolean;
  canAffordAbility(ability: string): boolean;
  
  // Chain reaction rewards
  calculateChainReward(chainLength: number): number;
  processChainReaction(chainLength: number, position: Vector2): void;
  
  // Ability management
  getAvailableAbilities(): MPAbility[];
  activateAbility(abilityId: string, player: Player, gameState: GameState): boolean;
  
  // Persistence
  saveMP(): void;
  loadMP(): void;
}
```

### ChainReactionTracker Interface

```typescript
interface ChainReactionTracker {
  activeChains: Map<string, ChainReactionData>;
  
  startChainTracking(crystalId: string): string;
  addToChain(chainId: string, crystalId: string): void;
  completeChain(chainId: string): ChainReactionResult;
  
  calculateReward(chainLength: number): number;
  getChainMultiplier(chainLength: number): number;
}

interface ChainReactionData {
  id: string;
  crystals: string[];
  startTime: number;
  lastAddTime: number;
  isComplete: boolean;
}

interface ChainReactionResult {
  chainLength: number;
  mpReward: number;
  bonusMultiplier: number;
  specialEffects: string[];
}
```

### MPAbility System

```typescript
interface MPAbility {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number;
  unlockLevel: number;
  
  canActivate(player: Player, gameState: GameState): boolean;
  activate(player: Player, gameState: GameState): void;
  getEffectDuration(): number;
}

interface MPAbilitySystem {
  abilities: Map<string, MPAbility>;
  activeCooldowns: Map<string, number>;
  
  registerAbility(ability: MPAbility): void;
  getAbility(id: string): MPAbility | null;
  isOnCooldown(abilityId: string): boolean;
  updateCooldowns(deltaTime: number): void;
}
```

### Enhanced HUD Components

```typescript
interface MPDisplay {
  currentMP: number;
  maxMP: number;
  recentGains: MPGainIndicator[];
  
  render(ctx: CanvasRenderingContext2D): void;
  showMPGain(amount: number, source: string, position: Vector2): void;
  updateMPValue(newMP: number, animated: boolean): void;
}

interface MPGainIndicator {
  amount: number;
  source: 'chain' | 'crystal' | 'bonus';
  position: Vector2;
  alpha: number;
  scale: number;
  lifetime: number;
}

interface AbilityIndicator {
  ability: MPAbility;
  available: boolean;
  cooldownRemaining: number;
  
  render(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  showActivation(): void;
}
```

## Data Models

### MP Reward Structure

```typescript
interface MPRewardTable {
  singleCrystal: 1;
  chainRewards: {
    2: 2;    // 2-chain: 2 MP
    3: 4;    // 3-chain: 4 MP  
    4: 8;    // 4-chain: 8 MP
    5: 16;   // 5-chain: 16 MP
    6: 32;   // 6-chain: 32 MP
    7: 50;   // 7+ chain: 50 MP + bonus effects
  };
  bonusMultipliers: {
    perfectTiming: 1.5;    // Chain completed within optimal time window
    allCrystalTypes: 2.0;  // Chain includes multiple crystal types
    screenClear: 3.0;      // Chain clears all crystals on screen
  };
}
```

### MP Abilities Configuration

```typescript
interface AbilityConfig {
  powerSurge: {
    mpCost: 20;
    duration: 10; // seconds
    effects: {
      attackPowerMultiplier: 1.5;
      speedMultiplier: 1.3;
      visualEffect: 'golden_aura';
    };
  };
  
  chainCatalyst: {
    mpCost: 35;
    duration: 15;
    effects: {
      chainRangeMultiplier: 1.8;
      extraChainTriggers: 2;
      visualEffect: 'crystal_resonance';
    };
  };
  
  crystalResonance: {
    mpCost: 50;
    duration: 8;
    effects: {
      allCrystalsPulse: true;
      chainProbabilityBonus: 0.4;
      visualEffect: 'screen_pulse';
    };
  };
  
  mpBurst: {
    mpCost: 75;
    duration: 0; // Instant
    effects: {
      areaAttackRadius: 150;
      crystalBreakForce: true;
      visualEffect: 'energy_explosion';
    };
  };
}
```

## Error Handling

### MP System Error Recovery

```typescript
interface MPErrorHandler {
  handleInsufficientMP(abilityId: string, required: number, available: number): void;
  handleAbilityFailure(abilityId: string, error: Error): void;
  handleChainTrackingError(chainId: string, error: Error): void;
  handlePersistenceError(operation: string, error: Error): void;
}
```

**Error Scenarios:**
- Insufficient MP for ability activation → Show clear feedback, suggest alternatives
- Chain tracking corruption → Reset chain state, award minimum MP
- Persistence failures → Use local fallback, warn user
- Ability activation failures → Refund MP cost, show error message

## Testing Strategy

### Unit Tests
- **MPManager**: MP earning calculations, spending validation, ability cost checks
- **ChainReactionTracker**: Chain length calculation, reward computation, timing validation
- **MPAbilitySystem**: Ability activation logic, cooldown management, effect application
- **MPDisplay**: HUD rendering, animation states, indicator positioning

### Integration Tests
- **Crystal → MP Flow**: Crystal breaking triggers correct MP rewards
- **Chain Reaction → MP**: Multi-crystal chains award escalating MP correctly
- **MP → Ability**: MP spending activates abilities with proper effects
- **HUD Integration**: MP changes reflect immediately in HUD display

### Performance Tests
- **Chain Reaction Processing**: Large chain reactions don't cause frame drops
- **MP Effect Rendering**: Multiple active abilities maintain 60fps
- **HUD Update Frequency**: MP display updates don't impact game performance
- **Persistence Operations**: MP save/load operations complete within acceptable time

### Visual Tests
- **MP Gain Indicators**: Floating MP numbers appear with correct colors and animations
- **Chain Reaction Effects**: Visual escalation matches chain length
- **Ability Visual Effects**: Each ability has distinctive, satisfying visual feedback
- **HUD Responsiveness**: MP bar and ability indicators update smoothly

## Implementation Phases

### Phase 1: Core MP System
- Implement MPManager with basic earning/spending
- Integrate with existing crystal breaking system
- Add simple MP display to HUD

### Phase 2: Chain Reaction Integration  
- Implement ChainReactionTracker
- Modify MemoryCrystal to report chain events
- Add escalating MP rewards for chain length

### Phase 3: MP Abilities
- Implement MPAbilitySystem with four core abilities
- Add ability input handling to Player
- Create ability visual effects

### Phase 4: Enhanced HUD & Polish
- Implement floating MP gain indicators
- Add ability availability indicators
- Polish visual effects and animations

### Phase 5: Persistence & Balance
- Implement MP persistence between levels
- Add MP capacity progression system
- Balance ability costs and effects based on testing
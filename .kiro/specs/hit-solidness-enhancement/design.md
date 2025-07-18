# Design Document

## Overview

The hit solidness enhancement system will improve the tactile feedback and visual impact of combat by implementing a multi-layered feedback system. The design builds upon the existing hit mechanics (hit sparks, screen shake, hit pause) and enhances them with variable intensity, improved timing, and additional feedback layers.

The system will maintain the current architecture while adding new components for enhanced feedback management, ensuring backward compatibility and performance optimization.

## Architecture

### Core Components

1. **HitFeedbackManager** - Central coordinator for all hit feedback effects
2. **Enhanced HitSpark System** - Improved particle effects with variable intensity
3. **Dynamic Screen Shake** - Variable shake intensity based on hit context
4. **Hit Impact Calculator** - Determines feedback intensity based on hit properties
5. **Feedback Timing Controller** - Manages timing and prevents effect stacking

### System Integration

The enhanced system integrates with existing components:
- **CollisionSystem** - Triggers feedback through HitFeedbackManager
- **GameState** - Coordinates timing and manages effect lifecycle
- **Camera** - Enhanced shake system with multiple shake types
- **Player/Enemy classes** - Provide hit context for feedback calculation

## Components and Interfaces

### HitFeedbackManager

```typescript
interface HitFeedbackConfig {
  intensity: number;
  duration: number;
  hitType: 'normal' | 'charged' | 'critical' | 'combo';
  targetType: 'enemy' | 'crystal' | 'environment';
  comboMultiplier?: number;
}

class HitFeedbackManager {
  calculateFeedbackIntensity(config: HitFeedbackConfig): FeedbackIntensity;
  triggerHitFeedback(config: HitFeedbackConfig, position: Vector2): void;
  preventFeedbackStacking(): boolean;
}
```

### Enhanced HitSpark System

```typescript
interface ParticleConfig {
  count: number;
  speed: number;
  size: number;
  colors: string[];
  lifetime: number;
  spread: number;
}

class EnhancedHitSpark extends HitSpark {
  generateVariableParticles(intensity: number): void;
  createImpactRing(intensity: number): void;
  addScreenDistortion(intensity: number): void;
}
```

### Dynamic Screen Shake

```typescript
interface ShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
  dampening: number;
  shakeType: 'impact' | 'rumble' | 'directional';
}

class EnhancedCamera extends Camera {
  applyVariableShake(config: ShakeConfig): void;
  combineShakeEffects(effects: ShakeConfig[]): void;
  maintainUIStability(): void;
}
```

### Hit Impact Calculator

```typescript
interface HitContext {
  attackType: string;
  attackerLevel: number;
  targetType: string;
  targetHealth: number;
  comboCount: number;
  chargeLevel: number;
}

class HitImpactCalculator {
  calculateBaseIntensity(context: HitContext): number;
  applyComboMultiplier(baseIntensity: number, comboCount: number): number;
  adjustForTargetType(intensity: number, targetType: string): number;
}
```

## Data Models

### FeedbackIntensity

```typescript
interface FeedbackIntensity {
  visual: number;        // 0.0 - 2.0 multiplier for visual effects
  shake: number;         // 0.0 - 2.0 multiplier for screen shake
  pause: number;         // 0.0 - 2.0 multiplier for hit pause duration
  particles: number;     // 0.0 - 2.0 multiplier for particle count/size
  sound: number;         // 0.0 - 2.0 multiplier for audio feedback
}
```

### HitFeedbackState

```typescript
interface HitFeedbackState {
  activeFeedbacks: Map<string, FeedbackInstance>;
  lastHitTime: number;
  stackingPrevention: boolean;
  performanceMode: 'full' | 'reduced' | 'minimal';
}
```

## Error Handling

### Performance Degradation
- Monitor frame rate and automatically reduce effect intensity
- Implement effect pooling to prevent memory allocation spikes
- Provide fallback to basic effects if enhanced system fails

### Effect Stacking Prevention
- Track active feedback instances to prevent overwhelming effects
- Implement cooldown periods for similar effect types
- Merge overlapping effects rather than stacking them

### Timing Synchronization
- Ensure all feedback elements start and end together
- Handle edge cases where hit pause is interrupted
- Maintain consistent timing across different frame rates

## Testing Strategy

### Unit Tests
- **HitImpactCalculator** - Test intensity calculations with various hit contexts
- **FeedbackIntensity** - Verify multiplier calculations and bounds checking
- **Effect Timing** - Test synchronization of multiple feedback elements

### Integration Tests
- **Collision to Feedback Flow** - Test complete pipeline from hit detection to feedback
- **Performance Impact** - Measure frame rate impact of enhanced effects
- **Effect Stacking** - Verify prevention of overwhelming feedback combinations

### Visual Tests
- **Effect Visibility** - Test readability against various backgrounds
- **Timing Feel** - Validate that enhanced feedback feels more impactful
- **Combo Progression** - Test escalating feedback intensity with combo system

### Performance Tests
- **Memory Usage** - Monitor particle system memory allocation
- **Frame Rate Impact** - Measure performance cost of enhanced effects
- **Scalability** - Test with multiple simultaneous hits and effects

## Implementation Phases

### Phase 1: Core Infrastructure
- Implement HitFeedbackManager and basic intensity calculation
- Enhance existing HitSpark with variable particle generation
- Add dynamic shake intensity to Camera system

### Phase 2: Advanced Effects
- Implement impact rings and screen distortion effects
- Add combo-based feedback escalation
- Integrate with existing combo system

### Phase 3: Polish and Optimization
- Add performance monitoring and automatic adjustment
- Implement effect pooling and memory optimization
- Fine-tune timing and intensity curves based on testing

### Phase 4: Accessibility and Customization
- Add reduced motion options for accessibility
- Implement performance-based automatic adjustment
- Add subtle effect variations to prevent repetition

## Technical Considerations

### Performance Optimization
- Use object pooling for particle effects to reduce garbage collection
- Implement LOD (Level of Detail) system for effects based on distance
- Cache intensity calculations to avoid repeated computation

### Backward Compatibility
- Maintain existing API for hit effects while adding enhanced options
- Ensure existing hit feedback continues to work without modification
- Provide migration path for custom hit effects

### Extensibility
- Design system to easily add new feedback types
- Allow for weapon-specific or enemy-specific feedback customization
- Support for future audio integration without system redesign
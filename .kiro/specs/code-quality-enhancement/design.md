# Design Document

## Overview

This design addresses code quality improvements by systematically resolving linting violations across the codebase. The approach focuses on three main areas: eliminating `any` types through proper TypeScript typing, converting static-only classes to utility functions, and implementing modern JavaScript patterns like optional chaining.

## Architecture

### Type Safety Enhancement
The current codebase has several instances where `any` types are used as type assertions, particularly in:
- `EditorObjectManager.ts` - MemoryCrystal constructor type casting
- `EditorStateManager.ts` - Crystal type restoration from saved state

These will be resolved by:
1. Creating proper type guards for CrystalType validation
2. Implementing safe type conversion utilities
3. Ensuring the MemoryCrystal constructor accepts proper typed parameters

### Static Class Refactoring
Three utility classes contain only static methods and should be converted to functional utilities:
- `CrystalTypeConfig` - Crystal configuration and validation utilities
- `EventDispatcher` - Event dispatching utilities  
- `RenderingUtils` - Canvas rendering utilities

The conversion will maintain the same API surface while providing better tree-shaking and functional programming benefits.

### Optional Chaining Implementation
Current code uses explicit null checks that can be simplified:
- `gameState && gameState.comboSystem` → `gameState?.comboSystem`
- `gameState.mpAbilitySystem && gameState.mpAbilitySystem.isOnCooldown()` → `gameState.mpAbilitySystem?.isOnCooldown()`

## Components and Interfaces

### Type Safety Components

#### CrystalType Validation
```typescript
// Type guard function
function isValidCrystalType(type: string): type is CrystalType

// Safe conversion utility
function toCrystalType(type: string): CrystalType
```

#### MemoryCrystal Constructor Enhancement
The constructor will be updated to accept properly typed parameters without requiring `any` casting.

### Utility Function Conversion

#### Crystal Configuration Utilities
```typescript
// Replace CrystalTypeConfig class with:
export const getCrystalColors = (type: CrystalType): CrystalColors => { ... }
export const getCrystalExperienceValue = (type: CrystalType): number => { ... }
export const getCrystalTypeData = (type: CrystalType): CrystalTypeData => { ... }
export const getAllCrystalTypes = (): CrystalType[] => { ... }
export const isValidCrystalType = (type: string): type is CrystalType => { ... }
```

#### Event Dispatching Utilities
```typescript
// Replace EventDispatcher class with:
export const dispatchPlayerEvent = (eventName: string, data: PlayerEventData): void => { ... }
export const dispatchEnemyEvent = (eventName: string, data: EnemyEventData): void => { ... }
// ... other dispatch functions
```

#### Rendering Utilities
```typescript
// Replace RenderingUtils class with:
export const saveAndSetup = (ctx: CanvasRenderingContext2D, alpha?: number): void => { ... }
export const restore = (ctx: CanvasRenderingContext2D): void => { ... }
// ... other rendering functions
```

## Data Models

### Crystal Type System
The existing `CrystalType` union type and related interfaces will remain unchanged:
```typescript
export type CrystalType = "azure" | "amethyst" | "emerald" | "golden";
export interface CrystalColors { ... }
export interface CrystalTypeData { ... }
```

### Configuration Data
The crystal configuration data structure will be preserved but accessed through utility functions instead of static class methods.

## Error Handling

### Type Validation
- Invalid crystal types will fall back to default "azure" type
- Type conversion utilities will provide safe defaults
- Runtime type checking will prevent invalid states

### Backward Compatibility
- All existing function calls will continue to work
- Import statements will be updated to use new utility functions
- No breaking changes to public APIs

## Testing Strategy

### Unit Testing Approach
1. **Type Safety Tests**: Verify type guards and conversion utilities work correctly
2. **Functional Equivalence Tests**: Ensure converted utilities produce identical results to original static methods
3. **Integration Tests**: Verify all imports and function calls work after refactoring
4. **Linting Validation**: Confirm all linting errors are resolved

### Test Coverage Areas
- Crystal type validation and conversion
- Utility function behavior equivalence
- Optional chaining functionality
- Import/export correctness

### Regression Testing
- Existing game functionality must remain unchanged
- Level editor operations must work identically
- Memory crystal creation and management must be unaffected
- Event system and rendering must function normally

## Implementation Considerations

### Migration Strategy
1. Create new utility functions alongside existing classes
2. Update import statements throughout codebase
3. Remove old static classes after all references are updated
4. Verify linting passes and functionality is preserved

### Performance Impact
- Utility functions may provide better tree-shaking
- Optional chaining has minimal performance impact
- Type safety improvements have no runtime cost

### Maintainability Benefits
- Functional utilities are easier to test and reason about
- Proper typing reduces runtime errors
- Modern JavaScript patterns improve code readability
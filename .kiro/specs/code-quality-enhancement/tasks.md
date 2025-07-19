# Implementation Plan

- [x] 1. Create type safety utilities for crystal types
  - Create type guard function `isValidCrystalType` to safely validate crystal type strings
  - Create safe conversion utility `toCrystalType` that provides fallback to default type
  - Write unit tests for type validation functions
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Convert CrystalTypeConfig static class to utility functions
  - Create individual utility functions to replace static methods: `getCrystalColors`, `getCrystalExperienceValue`, `getCrystalTypeData`, `getAllCrystalTypes`
  - Export the new utility functions from the same module
  - Preserve the existing configuration data structure and behavior
  - _Requirements: 2.1, 2.4_

- [x] 3. Update MemoryCrystal constructor to use proper typing
  - Modify MemoryCrystal constructor to accept properly typed CrystalType parameter
  - Remove `as any` type assertions in EditorObjectManager and EditorStateManager
  - Use the new type safety utilities for crystal type validation
  - _Requirements: 1.1, 1.2_

- [x] 4. Convert EventDispatcher static class to utility functions
  - Create individual utility functions to replace static dispatch methods
  - Export dispatch functions: `dispatchPlayerEvent`, `dispatchEnemyEvent`, `dispatchItemEvent`, `dispatchLevelEvent`, `dispatchCollisionEvent`, `dispatchEffectEvent`
  - Maintain the same function signatures and behavior
  - _Requirements: 2.1, 2.4_

- [x] 5. Convert RenderingUtils static class to utility functions
  - Create individual utility functions to replace all static rendering methods
  - Export functions: `saveAndSetup`, `restore`, `withAlpha`, `withShake`, `fillRect`, `fillText`, `renderSprite`, `renderHealthBar`, `renderParticles`, `isVisibleInCamera`, `applyCameraTransform`, `resetCameraTransform`, `createGradient`, `createRadialGradient`
  - Preserve all existing functionality and method signatures
  - _Requirements: 2.1, 2.4_

- [ ] 6. Update import statements throughout codebase
  - Update all files that import from CrystalTypeConfig to use new utility functions
  - Update all files that import from EventDispatcher to use new utility functions  
  - Update all files that import from RenderingUtils to use new utility functions
  - Ensure all function calls use the new utility function names
  - _Requirements: 2.4_

- [x] 7. Implement optional chaining improvements
  - Replace `gameState && gameState.comboSystem` with `gameState?.comboSystem` in Ghost.ts
  - Replace `gameState.mpAbilitySystem && gameState.mpAbilitySystem.isOnCooldown()` with `gameState.mpAbilitySystem?.isOnCooldown()` in MPAbilitySystem.ts
  - Review codebase for other optional chaining opportunities
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8. Remove original static classes
  - Delete the static class definitions from CrystalTypeConfig, EventDispatcher, and RenderingUtils
  - Ensure only the utility functions remain exported
  - Verify no remaining references to the old class-based APIs
  - _Requirements: 2.1, 2.4_

- [ ] 9. Run comprehensive testing and linting validation
  - Execute linting to verify all `lint/suspicious/noExplicitAny` violations are resolved
  - Execute linting to verify all `lint/complexity/noStaticOnlyClass` violations are resolved
  - Execute linting to verify all `lint/complexity/useOptionalChain` violations are resolved
  - Test game functionality to ensure no regressions were introduced
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
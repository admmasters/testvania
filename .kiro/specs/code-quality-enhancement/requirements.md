# Requirements Document

## Introduction

This feature focuses on improving code quality by addressing linting violations and enhancing type safety throughout the codebase. The goal is to eliminate `any` types, convert static-only classes to utility functions, and implement modern JavaScript patterns like optional chaining to create more maintainable and robust code.

## Requirements

### Requirement 1

**User Story:** As a developer, I want proper TypeScript typing instead of `any` types, so that I can catch type-related errors at compile time and have better IDE support.

#### Acceptance Criteria

1. WHEN the MemoryCrystal constructor is called THEN the system SHALL accept properly typed crystal type parameters without using `any`
2. WHEN crystal types are restored from saved state THEN the system SHALL maintain type safety without casting to `any`
3. WHEN type validation occurs THEN the system SHALL use proper TypeScript type guards and interfaces

### Requirement 2

**User Story:** As a developer, I want utility classes converted to simple functions, so that the code is more functional and easier to test and maintain.

#### Acceptance Criteria

1. WHEN CrystalTypeConfig methods are called THEN the system SHALL provide the same functionality through exported utility functions
2. WHEN EventDispatcher methods are used THEN the system SHALL provide the same functionality through exported utility functions  
3. WHEN RenderingUtils methods are called THEN the system SHALL provide the same functionality through exported utility functions
4. WHEN refactoring is complete THEN all existing functionality SHALL remain unchanged

### Requirement 3

**User Story:** As a developer, I want modern JavaScript patterns like optional chaining, so that the code is more concise and less prone to null reference errors.

#### Acceptance Criteria

1. WHEN checking nested object properties THEN the system SHALL use optional chaining instead of explicit null checks
2. WHEN accessing gameState.comboSystem THEN the system SHALL use `gameState?.comboSystem` pattern
3. WHEN accessing gameState.mpAbilitySystem THEN the system SHALL use `gameState.mpAbilitySystem?.isOnCooldown()` pattern

### Requirement 4

**User Story:** As a developer, I want all linting violations resolved, so that the codebase maintains consistent quality standards and passes automated checks.

#### Acceptance Criteria

1. WHEN the linting process runs THEN the system SHALL pass all `lint/suspicious/noExplicitAny` checks
2. WHEN the linting process runs THEN the system SHALL pass all `lint/complexity/noStaticOnlyClass` checks  
3. WHEN the linting process runs THEN the system SHALL pass all `lint/complexity/useOptionalChain` checks
4. WHEN code changes are made THEN existing functionality SHALL remain unaffected
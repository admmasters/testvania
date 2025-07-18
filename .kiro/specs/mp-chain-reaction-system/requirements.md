# Requirements Document

## Introduction

This feature aims to transform the current basic MP (Magic Points) system into a dynamic chain reaction reward system that incentivizes players to create longer crystal chain reactions. Currently, MP is simply calculated as `player.level * 5` and displayed in the HUD, but it serves no gameplay purpose. The enhanced system will make MP a valuable resource that grows through chain reactions, can be spent on powerful abilities, and provides meaningful progression incentives with clear HUD feedback.

## Requirements

### Requirement 1

**User Story:** As a player, I want to earn MP by creating chain reactions, so that I'm rewarded for strategic crystal breaking and encouraged to set up longer chains.

#### Acceptance Criteria

1. WHEN a player breaks a crystal that triggers no chain reaction THEN the system SHALL award 1 base MP
2. WHEN a crystal chain reaction occurs THEN the system SHALL award escalating MP based on chain length (2 MP for 2-chain, 4 MP for 3-chain, 8 MP for 4-chain, etc.)
3. WHEN a chain reaction reaches 5+ crystals THEN the system SHALL provide bonus MP multipliers and special effects
4. WHEN MP is earned through chains THEN the system SHALL display floating MP gain numbers with chain-specific colors and effects

### Requirement 2

**User Story:** As a player, I want to spend MP on powerful abilities, so that accumulated MP has meaningful gameplay value and strategic decision-making.

#### Acceptance Criteria

1. WHEN a player has sufficient MP THEN the system SHALL allow activation of MP-based abilities through input combinations
2. WHEN MP abilities are used THEN the system SHALL consume the appropriate MP cost and provide enhanced combat effects
3. WHEN MP is insufficient for an ability THEN the system SHALL prevent activation and provide clear feedback
4. WHEN MP abilities are activated THEN the system SHALL provide distinctive visual and audio feedback different from normal attacks

### Requirement 3

**User Story:** As a player, I want clear HUD feedback about my MP status and chain progress, so that I can make informed strategic decisions about when to use abilities.

#### Acceptance Criteria

1. WHEN MP changes THEN the HUD SHALL display current MP value with smooth number transitions and color coding
2. WHEN chain reactions occur THEN the HUD SHALL show chain multiplier progress with visual escalation effects
3. WHEN MP abilities are available THEN the HUD SHALL indicate available abilities with appropriate visual cues
4. WHEN MP is being spent THEN the HUD SHALL show MP consumption with clear visual feedback and remaining amounts

### Requirement 4

**User Story:** As a player, I want MP abilities that enhance my combat effectiveness, so that strategic MP management becomes a core part of gameplay progression.

#### Acceptance Criteria

1. WHEN using a "Power Surge" ability (20 MP) THEN the system SHALL temporarily increase attack power and speed for 10 seconds
2. WHEN using a "Chain Catalyst" ability (35 MP) THEN the system SHALL increase chain reaction range and add extra chain triggers for 15 seconds
3. WHEN using a "Crystal Resonance" ability (50 MP) THEN the system SHALL cause all crystals on screen to pulse and become more likely to chain react
4. WHEN using an "MP Burst" ability (75 MP) THEN the system SHALL create a powerful area attack that breaks multiple crystals simultaneously

### Requirement 5

**User Story:** As a player, I want MP to persist between levels and provide long-term progression, so that chain reaction mastery contributes to overall character development.

#### Acceptance Criteria

1. WHEN completing a level THEN the system SHALL preserve current MP for the next level
2. WHEN MP reaches certain thresholds THEN the system SHALL unlock new abilities or enhance existing ones
3. WHEN the player's maximum MP capacity is reached THEN the system SHALL provide options to increase capacity through level progression
4. WHEN starting a new game session THEN the system SHALL restore the player's previously earned MP total

### Requirement 6

**User Story:** As a player, I want visual and audio feedback that makes chain reactions feel rewarding and MP gains satisfying, so that the system feels engaging and motivating.

#### Acceptance Criteria

1. WHEN earning MP from chains THEN the system SHALL play escalating audio cues that build excitement with longer chains
2. WHEN MP thresholds are reached THEN the system SHALL provide celebratory visual effects and ability unlock notifications
3. WHEN using MP abilities THEN the system SHALL create distinctive particle effects and screen effects that feel powerful
4. WHEN chain multipliers increase THEN the system SHALL enhance visual feedback with more intense colors, particles, and screen effects
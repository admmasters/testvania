# Implementation Plan

- [x] 1. Create core MP management system
  - Implement MPManager class with MP earning, spending, and validation methods
  - Create interfaces for MPManager, ChainReactionData, and MPRewardTable
  - Add basic MP persistence methods (save/load to localStorage)
  - Write unit tests for MP calculations and validation logic
  - _Requirements: 1.1, 2.2, 2.3, 5.1, 5.3_

- [x] 2. Implement chain reaction tracking system
  - Create ChainReactionTracker class to monitor crystal chain sequences
  - Implement chain length calculation and MP reward computation with exponential scaling
  - Add chain timing validation and bonus multiplier calculations
  - Create methods to start, track, and complete chain reactions
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 3. Integrate MP system with existing crystal breaking
  - Modify MemoryCrystal class to report breaking events to MPManager
  - Update crystal chain reaction logic to use ChainReactionTracker
  - Ensure single crystal breaks award base MP (1 point)
  - Test that chain reactions award escalating MP correctly (2, 4, 8, 16, 32, 50+)
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 4. Replace static MP display with dynamic system
  - Remove hardcoded `player.level * 5` MP calculation from HUD
  - Integrate MPManager with Player class for current MP tracking
  - Update HUD to display actual MP from MPManager instead of calculated value
  - Add smooth MP value transitions and color coding in HUD
  - _Requirements: 3.1, 3.2, 5.1_

- [x] 5. Create MP ability system foundation
  - Implement MPAbilitySystem class with ability registration and management
  - Create MPAbility interface and base ability class structure
  - Add ability cooldown tracking and validation methods
  - Implement ability activation flow with MP cost validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Implement Power Surge ability (20 MP)
  - Create PowerSurgeAbility class with 1.5x attack power and 1.3x speed boost
  - Add 10-second duration timer and effect application to player stats
  - Implement golden aura visual effect around player during ability
  - Add input handling for ability activation (e.g., Z key + X key combination)
  - _Requirements: 4.1, 6.3_

- [ ] 7. Implement Chain Catalyst ability (35 MP)
  - Create ChainCatalystAbility class with enhanced chain reaction mechanics
  - Increase chain reaction range by 1.8x and add 2 extra chain triggers
  - Add 15-second duration with crystal resonance visual effects
  - Modify crystal chain detection to use enhanced range when ability is active
  - _Requirements: 4.2, 6.3_

- [ ] 8. Implement Crystal Resonance ability (50 MP)
  - Create CrystalResonanceAbility class that affects all crystals on screen
  - Add pulsing visual effect to all active crystals during 8-second duration
  - Increase chain reaction probability by 40% while ability is active
  - Implement screen-wide pulse visual effect when ability activates
  - _Requirements: 4.3, 6.3_

- [ ] 9. Implement MP Burst ability (75 MP)
  - Create MPBurstAbility class as instant area-of-effect attack
  - Implement 150-pixel radius area attack that breaks crystals and damages enemies
  - Add explosive visual effect with energy particles and screen shake
  - Create crystal breaking force that triggers immediate chain reactions
  - _Requirements: 4.4, 6.3_

- [ ] 10. Add floating MP gain indicators to HUD
  - Create MPGainIndicator class for floating MP reward numbers
  - Implement different colors and effects for different MP sources (chain vs single crystal)
  - Add escalating visual effects for higher chain rewards (larger text, more particles)
  - Position indicators near crystal break locations with upward float animation
  - _Requirements: 1.4, 3.4, 6.2_

- [ ] 11. Create ability availability indicators in HUD
  - Add ability icons to HUD showing available MP abilities
  - Implement visual states: available (bright), insufficient MP (dimmed), cooldown (timer)
  - Show MP cost and keybind for each ability
  - Add activation flash effect when abilities are used
  - _Requirements: 3.3, 3.4_

- [ ] 12. Enhance chain reaction visual feedback
  - Modify ComboSystem to show "CHAIN REACTION" instead of generic combo text
  - Add escalating visual effects for longer chains (screen flash, particle intensity)
  - Implement chain-specific audio cues that build excitement with length
  - Create special effects for 5+ chain reactions (screen-wide pulse, enhanced particles)
  - _Requirements: 6.1, 6.4_

- [ ] 13. Add MP ability input handling to Player
  - Extend Player input handling to detect ability activation key combinations
  - Implement ability activation validation (MP cost, cooldown, availability)
  - Add ability effect application to player stats and state
  - Create ability effect cleanup when durations expire
  - _Requirements: 2.1, 2.4_

- [ ] 14. Implement MP persistence and progression
  - Add MP saving/loading to player save data between levels
  - Implement maximum MP capacity increases based on player level
  - Add MP capacity upgrade notifications when leveling up
  - Create MP restoration mechanics (partial MP restore on level completion)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 15. Create comprehensive test suite for MP system
  - Write unit tests for MPManager MP calculations and ability cost validation
  - Create integration tests for crystal breaking → MP earning flow
  - Add tests for chain reaction tracking and reward calculation
  - Implement visual tests for HUD MP display and ability indicators
  - _Requirements: 1.1, 1.2, 2.2, 3.1_

- [ ] 16. Integrate MP system explanation into tutorial
  - Add new tutorial message after crystal explanation: "💫 Magic Points (MP)\n\nBreaking crystals earns MP!\nSingle crystal = 1 MP\nChain reactions = MORE MP!\n\nWatch your MP meter in the HUD\n\nPress X to continue..."
  - Insert chain reaction tutorial: "⚡ Chain Reactions\n\nBreak crystals near each other for chains!\n2-chain = 2 MP, 3-chain = 4 MP, 4-chain = 8 MP!\nLonger chains = exponential rewards!\n\nTry creating a chain reaction!\n\nPress X to continue..."
  - Add MP ability introduction: "🔮 MP Abilities\n\nSpend MP on powerful abilities!\nPower Surge (20 MP): Enhanced attacks\nChain Catalyst (35 MP): Better chains\nCrystal Resonance (50 MP): All crystals pulse\nMP Burst (75 MP): Area explosion\n\nPress Z+X to use abilities when available!\n\nPress X to continue..."
  - Position tutorial messages at appropriate crystal cluster locations in tutorial level
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 17. Balance and polish MP system
  - Adjust MP reward values based on gameplay testing
  - Fine-tune ability costs, durations, and effects for balanced gameplay
  - Polish visual effects timing and intensity for satisfying feedback
  - Optimize performance for multiple simultaneous chain reactions and abilities
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
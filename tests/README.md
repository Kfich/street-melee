# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Street Melee game implementation, testing all major systems, entities, and gameplay mechanics.

## Test Structure

```
tests/
├── setup.ts                    # Test setup and mocks
├── entities/                   # Entity tests
│   ├── Player.test.ts
│   ├── weapons/
│   │   └── Weapon.test.ts
│   └── items/
│       └── Item.test.ts
├── systems/                    # System tests
│   ├── combat/
│   │   ├── ComboSystem.test.ts
│   │   ├── CombatSystem.test.ts
│   │   ├── GrabSystem.test.ts
│   │   └── SpecialMoveSystem.test.ts
│   └── input/
│       ├── InputManager.test.ts
│       └── DashDetector.test.ts
├── managers/                    # Manager tests
│   └── EntityManager.test.ts
├── config/                     # Configuration tests
│   └── GameConfig.test.ts
└── integration/                # Integration tests
    └── GameplayFlow.test.ts
```

## Test Coverage

### Entity Tests

#### Player Tests
- ✅ Initialization with character type
- ✅ Health system (damage, healing, limits)
- ✅ Weapon system integration
- ✅ State management

#### Weapon Tests
- ✅ Weapon creation and types
- ✅ Pickup mechanics
- ✅ Drop mechanics
- ✅ Throw mechanics
- ✅ Durability system (3 throws)
- ✅ Attack hitbox creation

#### Item Tests
- ✅ Item creation and types
- ✅ Collection mechanics
- ✅ Health restoration
- ✅ Point/item effects
- ✅ Life gain effects

### System Tests

#### Combat System
- ✅ Hitbox registration
- ✅ Damage application
- ✅ Knockback mechanics
- ✅ Knockdown handling
- ✅ Hit prevention (no double hits)

#### Combo System
- ✅ Combo initialization for all characters
- ✅ Combo progression
- ✅ Time window enforcement
- ✅ Combo completion
- ✅ Damage scaling
- ✅ Knockdown on final hit

#### Special Move System
- ✅ Forward special moves
- ✅ Neutral special moves
- ✅ Character-specific moves
- ✅ Damage values
- ✅ Hitbox creation

#### Grab System
- ✅ Grab attempt and range
- ✅ Throw mechanics (all directions)
- ✅ Slam throws with screen shake
- ✅ Vault mechanics
- ✅ Grab state management

#### Input System
- ✅ Input retrieval for multiple players
- ✅ Key state checking
- ✅ Dash detection

### Manager Tests

#### Entity Manager
- ✅ Entity addition
- ✅ Entity updates
- ✅ Entity removal
- ✅ Entity clearing
- ✅ Entity retrieval

### Integration Tests

#### Gameplay Flow
- ✅ Combo flow integration
- ✅ Combat flow integration
- ✅ System interactions

### Configuration Tests

#### Game Config
- ✅ Valid display dimensions
- ✅ Valid physics values
- ✅ Valid player stats
- ✅ Valid timing values

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- tests/entities/Player.test.ts
```

## Test Framework

- **Framework**: Vitest
- **Assertions**: Vitest expect API
- **Mocks**: Vitest vi utilities
- **Coverage**: V8 provider

## Mocking Strategy

### Phaser Mocks
- All Phaser classes are mocked in `setup.ts`
- Scene methods return mock objects
- Physics bodies are mocked
- Input systems are mocked

### Entity Mocks
- Entities are mocked with minimal required methods
- Methods return sensible defaults
- Spies track method calls

## Test Cases Covered

### Core Gameplay
- ✅ Character movement
- ✅ Attack system
- ✅ Combo system
- ✅ Special moves
- ✅ Grab and throw
- ✅ Weapon usage
- ✅ Item collection

### Systems Integration
- ✅ Input → Character → Combat
- ✅ Combo → Attack → Hitbox
- ✅ Grab → Throw → Damage
- ✅ Weapon → Attack → Combat

### Edge Cases
- ✅ Health limits (0, max)
- ✅ Combo time windows
- ✅ Weapon durability
- ✅ Grab range limits
- ✅ Dash timing

## Future Test Additions

### Planned Tests
- Enemy AI behavior
- Level system spawning
- Multiplayer synchronization
- Audio system
- Visual effects
- Scene transitions
- Settings persistence

### Performance Tests
- Entity update performance
- Collision detection performance
- Large number of entities

### E2E Tests
- Full gameplay flow
- Menu navigation
- Multiplayer connection

## Writing New Tests

### Test Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ComponentName', () => {
  let component: Component;
  let mockScene: any;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    component = new Component(mockScene);
  });

  describe('Feature', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Best Practices
1. Use descriptive test names
2. Test one thing per test
3. Use beforeEach for setup
4. Mock external dependencies
5. Test both success and failure cases
6. Test edge cases


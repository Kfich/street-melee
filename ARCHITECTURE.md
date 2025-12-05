# Street Melee - Architecture Documentation

## Overview

This document describes the architecture and organization of the Street Melee codebase. The project follows a modular, scalable architecture designed for easy extension and maintenance.

## Directory Structure

```
src/
├── config/              # Game configuration and constants
│   ├── GameConfig.ts   # Core game constants (physics, display, etc.)
│   ├── InputConfig.ts  # Input key mappings
│   └── index.ts        # Barrel export
│
├── types/               # TypeScript type definitions
│   ├── GameTypes.ts    # Core game types (PlayerState, PlayerInput, etc.)
│   └── index.ts        # Barrel export
│
├── entities/           # Game entities (characters, enemies, items)
│   ├── base/           # Base entity classes
│   │   └── BaseEntity.ts
│   └── characters/     # Character entities
│       ├── BaseCharacter.ts
│       └── Player.ts
│
├── systems/            # Game systems
│   └── input/          # Input system
│       ├── InputManager.ts
│       └── DashDetector.ts
│
├── managers/           # Game managers
│   └── EntityManager.ts
│
├── utils/              # Utility functions
│   ├── PhysicsUtils.ts
│   └── index.ts
│
├── game/               # Game-specific code
│   ├── scenes/        # Phaser scenes
│   │   ├── MenuScene.ts
│   │   ├── CharacterSelectScene.ts
│   │   └── GameScene.ts
│   └── types/         # Game-specific types
│       └── CharacterType.ts
│
├── multiplayer/        # Multiplayer client code (to be implemented)
│
├── server/             # Multiplayer server
│   └── index.ts
│
└── main.ts             # Application entry point
```

## Architecture Patterns

### 1. Entity-Component-System (ECS) Inspired

While not a pure ECS, the codebase uses similar principles:

- **Entities**: Game objects (characters, enemies, items)
- **Base Classes**: Shared functionality through inheritance
- **Systems**: Reusable game systems (input, combat, etc.)
- **Managers**: Centralized management of entities and resources

### 2. Configuration-Driven Design

Game constants and settings are centralized in the `config/` directory:

- `GameConfig.ts`: Physics, display, timing constants
- `InputConfig.ts`: Key mappings for players

This makes it easy to adjust game balance and settings without digging through code.

### 3. Type Safety

Strong TypeScript typing throughout:

- `GameTypes.ts`: Core game types
- `CharacterType.ts`: Character-specific types
- Interfaces for all major systems

### 4. Separation of Concerns

Clear separation between:

- **Entities**: Game objects and their behavior
- **Systems**: Reusable game systems
- **Managers**: Resource and entity management
- **Scenes**: Phaser scene logic
- **Config**: Configuration and constants

## Core Components

### Entities

#### BaseEntity
Base class for all game entities with:
- Sprite management
- Physics setup
- State management
- Health system
- Common utility methods

#### BaseCharacter
Extends `BaseEntity` for playable characters:
- Character stats integration
- Input handling
- Movement logic
- Attack/special move framework

#### Player
Currently a thin wrapper around `BaseCharacter`, ready for character-specific implementations.

### Systems

#### InputManager
Centralized input handling:
- Manages keyboard input for all players
- Provides clean API for getting player input
- Supports multiple players with different key mappings
- Handles key state checking

#### DashDetector
Utility for detecting double-tap (dash) inputs:
- Tracks timing and direction
- Configurable time window

### Managers

#### EntityManager
Centralized entity management:
- Add/remove entities
- Update all entities
- Cleanup and destruction

### Configuration

#### GameConfig
All game constants in one place:
- Display settings
- Physics constants
- Timing values
- Multiplayer settings

#### InputConfig
Key mappings for players:
- Player 1: Arrow keys + Space/X/Z
- Player 2: WASD + W/B/A
- Easy to modify or extend

## Design Principles

### 1. Scalability
- Modular structure allows easy addition of new features
- Base classes provide extension points
- Systems can be added without modifying existing code

### 2. Maintainability
- Clear separation of concerns
- Configuration-driven design
- Type safety prevents many bugs
- Consistent naming conventions

### 3. Extensibility
- Base classes designed for inheritance
- Systems can be extended or replaced
- Easy to add new character types
- Easy to add new game systems

### 4. Testability
- Systems are isolated and testable
- Configuration can be mocked
- Entities can be tested independently

## Data Flow

### Input Flow
```
Keyboard Input → InputManager → Player.handleInput() → Character Movement/Combat
```

### Update Flow
```
GameScene.update() → EntityManager.update() → All Entities.update()
```

### Entity Lifecycle
```
Create → Add to EntityManager → Update Loop → Remove from EntityManager → Destroy
```

## Future Extensions

### Planned Additions

1. **Combat System**
   - `systems/combat/CombatSystem.ts`
   - Hit detection
   - Damage calculation
   - Combo system

2. **Animation System**
   - `systems/animation/AnimationSystem.ts`
   - Sprite animation management
   - State-based animations

3. **Enemy System**
   - `entities/enemies/` directory
   - Enemy AI
   - Enemy types

4. **Weapon System**
   - `entities/weapons/` directory
   - Weapon pickup/use
   - Weapon throwing

5. **Item System**
   - `entities/items/` directory
   - Item spawning
   - Item effects

6. **Level System**
   - `systems/level/LevelManager.ts`
   - Level loading
   - Background scrolling
   - Enemy spawning

7. **Multiplayer Client**
   - `multiplayer/Client.ts`
   - WebSocket client
   - State synchronization

## Best Practices

### Adding New Features

1. **New Entity Type**
   - Extend `BaseEntity` or `BaseCharacter`
   - Add to appropriate directory
   - Register with `EntityManager`

2. **New System**
   - Create in `systems/` directory
   - Initialize in scene `create()` method
   - Update in scene `update()` method

3. **New Configuration**
   - Add to appropriate config file
   - Use constants, not magic numbers
   - Document in config file

4. **New Type**
   - Add to `types/` directory
   - Export through `index.ts`
   - Use throughout codebase

## Code Style

- **Naming**: PascalCase for classes, camelCase for methods/variables
- **Files**: One class per file, named after the class
- **Exports**: Use barrel exports (`index.ts`) for clean imports
- **Comments**: JSDoc for public methods, inline comments for complex logic
- **Types**: Explicit types, avoid `any`

## Dependencies

- **Phaser.js**: Game engine
- **TypeScript**: Type safety
- **Socket.io**: Multiplayer networking
- **Vite**: Build tool
- **Electron**: Desktop packaging

## Performance Considerations

- Entity pooling (future optimization)
- Efficient collision detection
- Sprite batching
- State management to avoid unnecessary updates


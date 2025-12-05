# Street Melee - Implementation Guide

This document outlines the detailed implementation plan for building the Streets of Rage clone.

## Game Overview

Based on the documentation analysis, Streets of Rage is a side-scrolling beat 'em up game with:
- 4 playable characters with unique stats and movesets
- 2-player local and online multiplayer
- Combat system with strikes, grabs, throws, and combos
- Weapon system
- Item collection
- Enemy AI
- Level progression

## Character System

### Character Stats (from docs)
Each character has 5 stats rated 1-3:
- **Power**: Attack strength
- **Technique**: Combo ability
- **Speed**: Movement speed
- **Jump**: Jump height/distance
- **Stamina**: Health/defense

### Characters

1. **Axel** (Power: 2, Technique: 3, Speed: 2, Jump: 1, Stamina: 2)
   - Focus: Attack speed, strong blows
   - Special: Dragon Smash (→ + A), Senpūkyaku/Tornado Kick (A)
   - Signature: Grand Upper (→ → + B)
   - Combos: Jab → Jab → Straight → Mid-Kick → High Kick

2. **Blaze** (Power: 2, Technique: 2, Speed: 2, Jump: 2, Stamina: 2)
   - Focus: Balanced
   - Special: Hadōgeki/Wave Motion (→ + A), Fūshageri/Windmill Kick (A)
   - Signature: Er qi jiaq (→ → + B)
   - Combos: Palm → Palm → Roundhouse Elbow → Sokushūtai

3. **Max** (Power: 3, Technique: 2, Speed: 1, Jump: 1, Stamina: 3)
   - Focus: Power, close combat
   - Special: Shoulder Tackle (→ + A), Double Lariat (A)
   - Signature: Various throws (Suplex, Backbreaker, Table Flip, Piledriver)
   - Combos: Right Chop → Left Hook → Two-Hand Assault

4. **Sammy** (Power: 1, Technique: 2, Speed: 3, Jump: 3, Stamina: 1)
   - Focus: Speed, dodging
   - Special: Corkscrew Kick (Jump + A), Double Spin Kick (A)
   - Signature: Dash Punch (→ → + B), Dynamite Headbutt
   - Combos: Punch → Punch → Knee Kick → Roller Kick

## Controls

### Basic Moves (All Characters)
- **Stop**: No input (idle animation)
- **Walk**: Directional input (D-Pad/Arrow Keys/WASD)
- **Jump**: C button (Space key)
  - Diagonal jump if direction pressed simultaneously
  - Fixed trajectory (not affected by hold duration)
- **Vault**: C while grabbing enemy
  - Vault A (Axel, Blaze, Sammy): Switch between front/back grab
  - Vault B (Max): Jump while holding (for Atomic Drop)

### Combat System

#### Attacks
- **B Button** (X/B keys): Basic attack
  - Normal damage
  - Knockdown damage (stronger attacks)
- **A Button** (Z/A keys): Special move
- **→ → + B**: Signature move (dash attack)
- **B + C**: Back attack
- **Jump + B**: Jump attack (varies by character)

#### Combos
- **Mash B after hitting**: Character-specific combo chain
- **Mash B while holding enemy**: Grab combo

#### Throws
- **Front-hold + Direction + B**: Body throw
- **Full nelson + Direction + B**: German Suplex (varies)
- **Slam**: Special throw that causes screen shake

#### Damage Types
- Normal damage: Reduces health
- Knockdown damage: Reduces health + knocks down

## Weapon System

- **Pickup**: Walk over weapon
- **Attack**: B button (weapon techniques have priority)
- **Drop/Throw**: Double-tap direction + B
  - Thrown weapons damage enemies
- **Durability**: Throwing weapons disappear after 3 throws/drops
- **Loss**: Weapon dropped when taking damage

## Item System

- **$ Bag**: Money/points
- **Gold Bar**: High value item
- **1 UP**: Extra life
- **Apple/Chicken**: Health restoration
- **GO Mark**: Checkpoint marker

## Enemy System

### Enemy Types
- **Small Fry**: Common enemies (Galsia, Donovan, etc.)
- **Bosses**: End-of-level enemies

### Enemy Behaviors
- Patrol
- Pursue player
- Attack
- Grab player

## Level System

- Side-scrolling levels
- Background layers (static + scrolling)
- Enemy spawn points
- Item spawn points
- Checkpoints

## Multiplayer

### Local Multiplayer
- Split-screen or shared screen
- 2 players on same device

### Online Multiplayer
- WebSocket-based server
- Room/matchmaking system
- State synchronization
- Input lag compensation

## Technical Implementation

### Phaser.js Structure
```
GameScene
├── Player entities
├── Enemy entities
├── Weapon entities
├── Item entities
├── Background layers
├── UI/HUD
└── Physics world
```

### Key Systems to Implement

1. **Input System**
   - Keyboard input handling
   - Input buffering for combos
   - Dash detection (double-tap)

2. **Combat System**
   - Hit detection (collision boxes)
   - Damage calculation
   - Knockdown mechanics
   - Combo system
   - Grab/throw system

3. **Animation System**
   - Character sprites
   - Animation states (idle, walk, jump, attack, etc.)
   - Frame-based animations

4. **Physics System**
   - Arcade physics (Phaser default)
   - Collision detection
   - Gravity and jumping

5. **State Management**
   - Character states (idle, walking, jumping, attacking, grabbed, etc.)
   - Game states (menu, playing, paused, game over)

6. **Multiplayer Sync**
   - Position synchronization
   - State synchronization
   - Input prediction
   - Lag compensation

## Asset Requirements

### Sprites
- Character sprites (idle, walk, jump, attack animations for each)
- Enemy sprites
- Weapon sprites
- Item sprites
- Background tiles
- UI elements

### Audio
- Background music
- Sound effects (punch, kick, jump, hit, special move, etc.)

## Development Phases

### Phase 1: Core Foundation ✅
- [x] Project setup
- [x] Basic game engine
- [x] Scene management
- [x] Character system foundation

### Phase 2: Basic Gameplay
- [ ] Character movement (idle, walk, jump)
- [ ] Basic combat (punch, kick)
- [ ] Enemy AI (basic)
- [ ] Health system
- [ ] Ground collision

### Phase 3: Advanced Combat
- [ ] Combos
- [ ] Special moves
- [ ] Throws
- [ ] Grab mechanics
- [ ] Weapon system

### Phase 4: Content
- [ ] Multiple enemies
- [ ] Level design
- [ ] Items
- [ ] Boss battles

### Phase 5: Multiplayer
- [ ] Local multiplayer
- [ ] Online multiplayer server
- [ ] State synchronization
- [ ] Matchmaking

### Phase 6: Polish
- [ ] Visual effects
- [ ] Audio
- [ ] UI/UX improvements
- [ ] Balancing
- [ ] Desktop packaging

## Next Steps

1. Implement basic character movement and animations
2. Add combat system with hit detection
3. Create enemy AI
4. Implement weapon and item systems
5. Build multiplayer infrastructure
6. Add visual and audio polish


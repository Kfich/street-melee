# Menu System Documentation

## Overview

The game now has a comprehensive menu system that integrates all game features and provides easy navigation.

## Menu Structure

```
Main Menu
├── Single Player → Character Select → Game
├── Multiplayer → Multiplayer Menu → Character Select → Game
├── Settings → Audio Controls
├── Controls → Control Reference
└── Quit
```

## Menu Scenes

### 1. MainMenuScene
**Purpose**: Main entry point to the game

**Features**:
- Title screen
- Navigation to all game modes
- Keyboard navigation (Arrow keys + Enter)
- Mouse/touch support

**Options**:
- **Single Player**: Start local 2-player game
- **Multiplayer**: Access online multiplayer
- **Settings**: Adjust audio and game settings
- **Controls**: View control reference
- **Quit**: Exit game

### 2. CharacterSelectScene
**Purpose**: Select characters for players

**Features**:
- Character selection for Player 1 and Player 2
- Supports both single player and multiplayer modes
- Visual character boxes
- Keyboard and mouse selection

**Characters**: Axel, Blaze, Max, Sammy

### 3. MultiplayerMenuScene
**Purpose**: Create or join multiplayer rooms

**Features**:
- Create new room (generates room ID)
- Join existing room (enter room ID)
- Connection status display
- Room ID display
- Start game button (appears when in room)

**Flow**:
1. Connect to server
2. Create room OR join room
3. Wait for other players
4. Start game

### 4. SettingsScene
**Purpose**: Adjust game settings

**Features**:
- **Music Volume**: Slider control (0-100%)
- **SFX Volume**: Slider control (0-100%)
- **Music Toggle**: Enable/disable background music
- **SFX Toggle**: Enable/disable sound effects
- Settings persist to localStorage
- Settings apply immediately to game

**Navigation**:
- Back button returns to previous scene
- ESC key to go back
- Can be accessed from Main Menu or Pause Menu

### 5. ControlsScene
**Purpose**: Display control reference

**Features**:
- Complete control reference for Player 1
- Complete control reference for Player 2
- Tips and tricks
- Back button to return

**Controls Shown**:
- Movement
- Attacks
- Special moves
- Combos
- Grabs and throws
- Weapon usage

### 6. PauseScene
**Purpose**: Pause menu during gameplay

**Features**:
- Semi-transparent overlay
- Resume game
- Open settings
- Return to main menu
- Accessible via P key during gameplay

**Options**:
- **Resume**: Continue playing
- **Settings**: Adjust settings (returns to pause menu)
- **Main Menu**: Exit to main menu

### 7. GameOverScene
**Purpose**: End game screen

**Features**:
- Victory or Game Over display
- Final score display
- Play again option
- Return to main menu

**Triggers**:
- All players dead → Game Over
- Level completed → Victory (to be implemented)

## Menu Flow

### Single Player Flow
```
Main Menu → Single Player → Character Select → Game → (Pause) → Game Over → Main Menu
```

### Multiplayer Flow
```
Main Menu → Multiplayer → Multiplayer Menu → (Create/Join Room) → Character Select → Game → Game Over → Main Menu
```

### Settings Flow
```
Main Menu → Settings → (Adjust Settings) → Back → Main Menu
OR
Game → Pause → Settings → (Adjust Settings) → Back → Pause → Resume
```

## Integration Points

### Settings Integration
- Settings are saved to localStorage
- Settings apply to AudioManager in real-time
- Settings persist across sessions

### Multiplayer Integration
- Multiplayer menu connects to server
- Room creation/joining handled by MultiplayerClient
- Room ID passed to Character Select and Game scenes

### Audio Integration
- Audio settings control AudioManager
- Volume changes apply immediately
- Music/SFX toggles work in real-time

### Game Integration
- Pause menu accessible during gameplay (P key)
- Game Over screen shows on player death
- Settings accessible from pause menu

## Keyboard Shortcuts

- **Main Menu**: Arrow keys to navigate, Enter to select
- **Character Select**: Click or Enter to select
- **Settings**: Click sliders/toggles to adjust
- **Pause**: P key during gameplay
- **Pause Menu**: ESC to resume, Enter to select
- **Game Over**: Enter to play again, ESC to main menu

## Future Enhancements

- Save/Load game state
- High score leaderboard
- Character stats display in character select
- Multiplayer lobby with player list
- Custom key bindings
- Graphics settings
- Language selection


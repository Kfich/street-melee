# Audio System Documentation

## Overview

The audio system is a robust, scalable solution for managing all game audio (sound effects and music). It's designed to be easy to extend and integrates seamlessly with the game's settings system.

## Architecture

### Components

1. **AudioConfig.ts** - Configuration file mapping sound names to file paths
2. **AudioManager.ts** - Core audio management class
3. **Scene Integration** - Audio integrated into all game scenes

### Key Features

- ✅ **Centralized Configuration**: All audio files mapped in one place
- ✅ **Volume Control**: Separate controls for music and SFX
- ✅ **Enable/Disable**: Toggle music and SFX independently
- ✅ **Fade In/Out**: Smooth transitions for music
- ✅ **Sound Overlap**: Option to play multiple instances of same sound
- ✅ **Settings Integration**: Works with game settings system
- ✅ **Auto-cleanup**: Properly stops music when scenes change

## Usage

### Adding New Sounds

1. Add audio file to `/assets/sounds/` or `/assets/music/`
2. Add entry to `AudioConfig.ts`:

```typescript
// In SOUND_EFFECTS
newSound: {
  key: 'newSound',
  path: 'assets/sounds/new-sound.mp3',
  volume: 0.7  // Optional default volume
}

// In MUSIC_TRACKS
newTrack: {
  key: 'newTrack',
  path: 'assets/music/new-track.mp3',
  volume: 0.5
}
```

3. The sound is automatically loaded in PreloadScene
4. Use it in code: `audioManager.playSound('newSound')`

### Playing Sounds

```typescript
// Basic sound
audioManager.playSound('punch');

// With volume multiplier
audioManager.playSound('jump', 0.5);

// Allow overlapping (multiple instances)
audioManager.playSound('impact', 1.0, true);
```

### Playing Music

```typescript
// Basic music (loops by default)
audioManager.playMusic('menu');

// No loop
audioManager.playMusic('gameOver', false);

// With fade in
audioManager.playMusic('level1', true, true, 2000);

// Stop music
audioManager.stopMusic();

// Stop with fade out
audioManager.stopMusic(true, 1000);
```

### Volume Control

```typescript
// Set volumes (0-1)
audioManager.setMusicVolume(0.6);
audioManager.setSFXVolume(0.8);

// Enable/disable
audioManager.setMusicEnabled(false);
audioManager.setSFXEnabled(false);
```

## Available Sounds

### Sound Effects

- **Combat**: `punch`, `kick`, `hit`, `enemyHit`, `knockdown`
- **Movement**: `jump`
- **Special**: `special`, `fireball`, `fireballExplode`
- **Actions**: `throw`, `grab`, `weaponHit`
- **Items**: `itemPickup`, `levelUp`, `levelAdvance`
- **UI**: `menuSelect`, `gameOver`, `gameOverScreen`, `continue`
- **Environmental**: `policeSiren`, `prisonSiren`

### Music Tracks

- `menu` - Main menu music
- `level1` - First level music
- `level2` - Second level music
- `boss` - Boss fight music (8-bit)
- `bossFight` - Boss fight music (full)
- `dialogue` - Dialogue/cutscene music

## Scene Integration

### MainMenuScene
- Plays menu music on create
- Menu selection sounds
- Stops music on shutdown

### GameScene
- Plays level music on start
- Sound effects for all combat actions
- Listens to settings changes
- Stops music on shutdown

### GameOverScene
- Plays game over sound
- Plays dialogue music for defeat
- Menu selection sounds

## Settings Integration

The audio system automatically:
- Loads settings from localStorage
- Responds to settings changes via events
- Saves settings when changed

Settings events:
- `musicVolumeChanged` - Updates music volume
- `sfxVolumeChanged` - Updates SFX volume
- `musicEnabledChanged` - Enables/disables music
- `sfxEnabledChanged` - Enables/disables SFX

## Event-Based Audio

The GameScene automatically plays sounds for these events:
- `attackPerformed` → `punch`
- `specialMovePerformed` → `special`
- `jumpPerformed` → `jump`
- `grabPerformed` → `grab`
- `throwPerformed` → `throw`
- `weaponHit` → `weaponHit`
- `itemCollected` → `itemPickup`
- `knockdown` → `knockdown`
- `entityHit` → `enemyHit`
- `jumpAttackPerformed` → `special`
- `backAttackPerformed` → `special`
- `levelAdvance` → `levelAdvance`
- `levelUp` → `levelUp`

## Best Practices

1. **Use descriptive keys**: Make sound keys self-documenting
2. **Set appropriate volumes**: Use the volume property in config for balance
3. **Avoid overlapping**: Only use `allowOverlap: true` when necessary
4. **Clean up**: Always stop music in scene `shutdown()` methods
5. **Test audio**: Ensure sounds work on different browsers/devices

## Future Enhancements

Potential improvements:
- [ ] Sound pooling for frequently played sounds
- [ ] 3D audio positioning
- [ ] Dynamic music (intensity-based)
- [ ] Audio compression/optimization
- [ ] Web Audio API for advanced effects
- [ ] Audio visualization

## Troubleshooting

### Sounds not playing
- Check browser autoplay policies (user interaction required)
- Verify files are loaded in PreloadScene
- Check console for errors
- Ensure audio is enabled in settings

### Music not looping
- Check `loop` parameter is `true`
- Verify music file format supports looping

### Volume issues
- Check settings are loaded correctly
- Verify volume values are 0-1
- Check if audio is enabled


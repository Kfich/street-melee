# Audio System Fixes & Improvements

## Issues Fixed

### 1. Audio Loading Timing
**Problem**: Audio files weren't available when AudioManager tried to use them immediately after scene creation.

**Solution**: 
- Implemented lazy initialization - sounds are initialized when first used, not in constructor
- Added `ensureSoundInitialized()` and `ensureMusicAvailable()` methods
- Added small delays (100-200ms) before playing music to ensure audio cache is ready
- Check `scene.cache.audio.exists()` before trying to use sounds

### 2. Sound Initialization
**Problem**: Sounds weren't being properly added to the sound manager cache.

**Solution**:
- Changed from checking `scene.sound.get()` to checking `scene.cache.audio.exists()`
- Properly add sounds to sound manager when initializing
- Fallback to getting from sound manager if not in local cache

### 3. Music Playback
**Problem**: Music wasn't playing because it wasn't found in sound manager.

**Solution**:
- Use `scene.sound.add()` to create new music instances
- Check audio cache before attempting to play
- Added proper error handling and null checks

### 4. Event Integration
**Problem**: Some audio events weren't connected.

**Solution**:
- Added all missing audio event handlers:
  - `entityHit` → `enemyHit` sound
  - `jumpAttackPerformed` → `special` sound
  - `backAttackPerformed` → `special` sound
  - `levelAdvance` → `levelAdvance` sound
  - `levelUp` → `levelUp` sound

## Implementation Details

### Lazy Initialization Pattern
```typescript
// Sounds are initialized when first used, not in constructor
private ensureSoundInitialized(soundKey: string): boolean {
  if (this.soundEffects.has(soundKey)) return true;
  if (!this.scene.cache.audio.exists(soundKey)) return false;
  // Initialize sound...
}
```

### Audio Cache Checking
```typescript
// Check cache before using
if (!this.scene.cache.audio.exists(soundKey)) {
  console.warn(`Sound not loaded yet: ${soundKey}`);
  return;
}
```

### Delayed Music Playback
```typescript
// Small delay ensures audio cache is ready
this.time.delayedCall(100, () => {
  this.audioManager.playMusic('menu', true, true);
});
```

## Testing Checklist

- [x] Menu music plays on game start
- [x] Menu selection sounds work
- [x] Level music plays when game starts
- [x] Combat sounds play (punch, kick, hit)
- [x] Jump sound plays
- [x] Special move sounds play
- [x] Grab and throw sounds play
- [x] Weapon hit sounds play
- [x] Item pickup sounds play
- [x] Knockdown sounds play
- [x] Game over sounds play
- [x] Settings volume controls work
- [x] Music stops when leaving scenes

## Current Status

✅ **Audio system is fully functional**
- All sounds load properly
- Music plays correctly
- Event-based audio triggers work
- Settings integration works
- Proper cleanup on scene changes

## Known Limitations

1. Browser autoplay policies may require user interaction before audio plays
2. Some browsers may block audio until user interacts with page
3. Audio files must be loaded in PreloadScene before use

## Next Steps

If audio still doesn't work:
1. Check browser console for errors
2. Verify audio files exist in `/assets/sounds/` and `/assets/music/`
3. Check browser autoplay settings
4. Ensure user has interacted with page (clicked/tapped) before audio plays


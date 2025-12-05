# Music State Management System

## Overview

The music state management system provides intelligent music handling that differentiates between different game contexts (menu, gameplay, boss, cutscene) and manages transitions between them automatically.

## Key Features

### 1. Music Contexts
- **MENU**: Main menu and selection screens
- **GAMEPLAY**: Regular level gameplay
- **BOSS**: Boss battle music (highest priority)
- **CUTSCENE**: Cutscene/dialogue sequences
- **DIALOGUE**: Dialogue sequences
- **GAME_OVER**: Game over screens
- **NONE**: No music playing

### 2. Priority System
Music contexts have priorities that determine when one can interrupt another:
- **BOSS** (Priority 5) - Can interrupt everything
- **CUTSCENE** (Priority 4) - Can interrupt gameplay/menu
- **DIALOGUE** (Priority 3) - Can interrupt gameplay/menu
- **GAMEPLAY** (Priority 2) - Can interrupt menu
- **MENU** (Priority 1) - Can be interrupted by gameplay
- **GAME_OVER** (Priority 1) - Can be interrupted by menu

### 3. Automatic Transitions
Each context has configured transitions:
- **Fade Out**: Smoothly fades out previous music
- **Fade In**: Smoothly fades in new music
- **Stop Previous**: Whether to stop previous music

## Usage

### Basic Usage

```typescript
// Play menu music
audioManager.playMusicWithContext('menu', MusicContext.MENU, true);

// Play gameplay music (automatically stops menu music)
audioManager.playMusicWithContext('level1', MusicContext.GAMEPLAY, true);

// Play boss music (interrupts gameplay music)
audioManager.playMusicWithContext('boss', MusicContext.BOSS, true);

// Play cutscene music
audioManager.playMusicWithContext('dialogue', MusicContext.CUTSCENE, false);
```

### Scene Integration

#### MainMenuScene
```typescript
// Automatically plays menu music
this.audioManager.playMusicWithContext('menu', MusicContext.MENU, true);
```

#### GameScene
```typescript
// Automatically stops menu music and plays gameplay music
this.audioManager.playMusicWithContext('level1', MusicContext.GAMEPLAY, true);

// When boss appears
this.playBossMusic(); // Calls playMusicWithContext('boss', MusicContext.BOSS, true);

// After boss/cutscene
this.resumeGameplayMusic(); // Returns to gameplay music
```

#### PauseScene
```typescript
// Pauses music when pausing
this.audioManager.pauseMusic();

// Resumes music when resuming
this.audioManager.resumeMusic();
```

#### GameOverScene
```typescript
// Stops gameplay music and plays game over music
this.audioManager.stopMusic(true, 500);
this.audioManager.playMusicWithContext('dialogue', MusicContext.GAME_OVER, false);
```

## Music State Tracking

The system tracks:
- Current music context
- Current track key
- Whether music is playing
- Whether music should loop

```typescript
// Get current music state
const state = audioManager.getMusicState();
console.log(state.context); // MusicContext.GAMEPLAY
console.log(state.trackKey); // 'level1'
console.log(state.isPlaying); // true

// Check if specific context is playing
if (audioManager.isMusicPlaying(MusicContext.BOSS)) {
  // Boss music is playing
}
```

## Transition Examples

### Menu → Gameplay
1. Menu music fades out (500ms)
2. Gameplay music fades in (1000ms)
3. Menu music stops automatically

### Gameplay → Boss
1. Gameplay music fades out (300ms)
2. Boss music fades in (800ms)
3. Gameplay music stops

### Boss → Gameplay (after boss defeat)
1. Boss music fades out (500ms)
2. Gameplay music fades in (1000ms)
3. Boss music stops

## Helper Methods in GameScene

```typescript
// Play boss music
this.playBossMusic();

// Play cutscene music
this.playCutsceneMusic();

// Resume gameplay music (after boss/cutscene)
this.resumeGameplayMusic();
```

## Best Practices

1. **Always use context-aware methods**: Use `playMusicWithContext()` instead of `playMusic()` for better control
2. **Let the system handle transitions**: Don't manually stop music before playing new music
3. **Use pause/resume for pause menu**: Don't stop music when pausing, just pause it
4. **Check context before playing**: Use `isMusicPlaying()` to avoid unnecessary transitions
5. **Use force parameter sparingly**: Only use `force: true` when you need to restart the same track

## Integration Points

### Boss Spawning
When a boss appears:
```typescript
// In GameScene or Enemy/Boss class
this.playBossMusic();
```

### Cutscene Start
When a cutscene begins:
```typescript
this.playCutsceneMusic();
```

### Cutscene End
When cutscene ends:
```typescript
this.resumeGameplayMusic();
```

### Level Complete
When level is completed:
```typescript
// Stop gameplay music
this.audioManager.stopMusic(true, 500);
// Play victory music or advance to next level
```

## Configuration

Music transitions are configured in `MusicState.ts`:

```typescript
export const MUSIC_TRANSITIONS: Record<MusicContext, MusicTransition> = {
  [MusicContext.BOSS]: {
    fadeOut: true,
    fadeOutDuration: 300,  // Fast transition for boss
    fadeIn: true,
    fadeInDuration: 800,
    stopPrevious: true
  },
  // ... other contexts
};
```

Adjust these values to fine-tune the feel of music transitions.


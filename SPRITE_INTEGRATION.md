# Sprite Integration Guide

## Overview

The game now uses real sprite images instead of placeholder rectangles. All character sprites are loaded in a preload scene before the game starts.

## Character Sprite Mapping

The following character types are mapped to sprite folders:

- **Axel** → `dario` (most complete animation set)
- **Blaze** → `zara` (good animations)
- **Max** → `rex` (good animations)
- **Sammy** → `angela` (good animations)

## Sprite Structure

### Dario (Axel)
- **Idle**: `PL.gif` (left), `PR.gif` (right)
- **Walking**: `Lw1-4.gif` (left), `Rw1-4.gif` (right) - 4 frame animation
- **Jump**: `J1.gif` (left), `J2.gif` (right)
- **Attack**: `PDL1-4.gif` (left), `PDR1-4.gif` (right) - 4 frame animation
- **Jump Attack**: `PDLJump.gif` (left), `PDRJump.gif` (right)

### Zara (Blaze)
- **Idle**: `Zara-idle-left.png`, `Zara-idle-right.png`
- **Walking**: `Zara-walk-left-1.png`, `Zara-walk-left-2.png`, `Zara-walk-right-1.png`, `Zara-walk-right-2.png` - 2 frame animation
- **Attack**: `Zara-attack-left.png`, `Zara-attack-right.png`

### Rex (Max)
- **Idle**: `rex-idle-left.png`, `rex-idle-right.png`
- **Walking**: `rex-walk-left-1.png`, `rex-walk-left-2.png`, `rex-walk-right-1.png`, `rex-walk-right-2.png` - 2 frame animation
- **Attack**: `rex-attack-left.png`, `rex-attack-right.png`

### Angela (Sammy)
- **Idle**: `AL1.gif` (left), `AR1.gif` (right)
- **Walking**: `AL2-3.gif` (left), `AR2-3.gif` (right) - 2 frame animation
- **Attack**: `AL3.gif` (left), `AR3.gif` (right) - uses walk frame 3

## How It Works

1. **PreloadScene**: Loads all sprite images before the game starts
2. **Animation Creation**: Creates Phaser animations from loaded sprites
3. **AnimationSystem**: Plays appropriate animations based on character state
4. **BaseCharacter**: Uses sprite textures instead of placeholders

## Animation States

Each character supports the following animation states:
- `idle` - Standing still
- `walking` - Moving left/right
- `jumping` - In the air
- `attacking` - Performing an attack
- `grabbed`/`grabbing` - Grabbing or being grabbed (uses idle)
- `throwing` - Throwing an enemy (uses idle)
- `knockedDown` - Knocked down (uses idle)

## Adding New Characters

To add a new character:

1. Add sprite files to `assets/sprites/imgs/[character-folder]/`
2. Update `CHARACTER_SPRITE_MAP` in `SpriteLoader.ts`
3. Add loading logic in `PreloadScene.ts`
4. Add animation creation logic in `PreloadScene.ts`

## Troubleshooting

### Sprites Not Loading
- Check that sprite files exist in the correct paths
- Verify file names match exactly (case-sensitive)
- Check browser console for loading errors

### Animations Not Playing
- Ensure animations are created in `PreloadScene`
- Check that animation keys match between creation and playback
- Verify character type is passed to `playAnimation`

### Fallback to Placeholders
- If sprites fail to load, the game will use colored rectangle placeholders
- Check console for warnings about missing textures

## Future Improvements

- Add more animation states (special moves, throws, etc.)
- Add enemy sprite animations
- Add weapon/item sprites
- Add particle effects sprites
- Optimize sprite loading (atlas/spritesheet support)


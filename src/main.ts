import Phaser from 'phaser';
import { PreloadScene } from './game/scenes/PreloadScene';
import { GameScene } from './game/scenes/GameScene';
import { MainMenuScene } from './game/scenes/MainMenuScene';
import { CharacterSelectScene } from './game/scenes/CharacterSelectScene';
import { SettingsScene } from './game/scenes/SettingsScene';
import { MultiplayerMenuScene } from './game/scenes/MultiplayerMenuScene';
import { ControlsScene } from './game/scenes/ControlsScene';
import { PauseScene } from './game/scenes/PauseScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { ContinueScene } from './game/scenes/ContinueScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-container',
  backgroundColor: '#000000', // This will be covered by the background image
  transparent: false,
  pixelArt: true, // Enable pixel-perfect rendering
  antialias: false, // Disable antialiasing for crisp pixel art
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false
    }
  },
  scene: [
    PreloadScene,
    MainMenuScene,
    CharacterSelectScene,
    GameScene,
    SettingsScene,
    MultiplayerMenuScene,
    ControlsScene,
    PauseScene,
    GameOverScene,
    ContinueScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);


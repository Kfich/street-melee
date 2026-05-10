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
import { HighScoreScene } from './game/scenes/HighScoreScene';
import { MobileControlsScene } from './ui/mobile/MobileControlsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-container',
  backgroundColor: '#000000',
  transparent: false,
  pixelArt: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false
    }
  },
  input: {
    // Enable multi-touch (up to 10 simultaneous pointers for mobile controls)
    activePointers: 4,
  },
  scene: [
    PreloadScene,
    MainMenuScene,
    CharacterSelectScene,
    GameScene,
    MobileControlsScene,
    SettingsScene,
    MultiplayerMenuScene,
    ControlsScene,
    PauseScene,
    GameOverScene,
    ContinueScene,
    HighScoreScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Minimum playable size on small phones
    min: {
      width: 320,
      height: 180,
    },
    // Cap at 4K so we don't waste memory on very large displays
    max: {
      width: 3840,
      height: 2160,
    },
  },
};

new Phaser.Game(config);


import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { VictoryScene } from '../scenes/VictoryScene';
import { MobileOrientationScene } from '../scenes/MobileOrientationScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,
  backgroundColor: '#0f0f1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480, // Halved from 960 to make everything appear 2x bigger
    height: 270, // Halved from 540 to make everything appear 2x bigger
    parent: 'game',
    fullscreenTarget: 'game',
  },
  input: {
    activePointers: 3, // Enable multi-touch (3 simultaneous touches)
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1600, x: 0 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, GameScene, UIScene, VictoryScene, MobileOrientationScene],
};

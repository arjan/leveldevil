import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Set loading path for assets
    this.load.setPath('assets');
  }

  create(): void {
    // Move to preload scene
    this.scene.start('PreloadScene');
  }
}


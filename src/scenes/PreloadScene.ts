import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    // Loading progress
    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load tilemap and tileset
    this.load.image('terrain-tileset', 'assets/tiles/terrain.png');
    this.load.tilemapTiledJSON('level1', 'assets/maps/level1.json');

    // Load background
    this.load.image('background', 'assets/Background/Purple.png');

    // Load UI
    this.load.spritesheet('heart', 'assets/Items/Fruits/Strawberry.png', {
      frameWidth: 32,
      frameHeight: 32,
    }); // Animated strawberry heart

    // Load player sprites
    this.load.spritesheet('player-idle', 'assets/sprites/player-idle.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-run', 'assets/sprites/player-run.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-jump', 'assets/sprites/player-jump.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-fall', 'assets/sprites/player-fall.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create(): void {
    // Start the game scene
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}


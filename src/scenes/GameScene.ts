import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Placeholder: will be implemented in later phases
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Level Devil\nGame Scene Ready',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center',
      }
    );
    text.setOrigin(0.5, 0.5);
  }

  update(): void {
    // Game loop
  }
}


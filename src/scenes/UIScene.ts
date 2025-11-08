import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private deathCount: number = 0;
  private deathText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Death counter (top-right)
    this.deathText = this.add.text(16, 16, 'Deaths: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 },
    });
    this.deathText.setScrollFactor(0);
    this.deathText.setDepth(1000);

    // Listen for death events from GameScene
    this.game.events.on('playerDeath', this.onPlayerDeath, this);
  }

  onPlayerDeath(): void {
    this.deathCount++;
    this.deathText.setText(`Deaths: ${this.deathCount}`);
  }

  shutdown(): void {
    this.game.events.off('playerDeath', this.onPlayerDeath, this);
  }
}

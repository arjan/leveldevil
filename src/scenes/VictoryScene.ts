import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);

    // Victory text
    const victoryText = this.add.text(width / 2, height / 2 - 60, '🎉 VICTORY! 🎉', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    victoryText.setOrigin(0.5);

    // Congratulations
    const congratsText = this.add.text(width / 2, height / 2, 'You completed all 10 levels!', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    });
    congratsText.setOrigin(0.5);

    // Stats
    const deathCount = this.registry.get('totalDeaths') || 0;
    const statsText = this.add.text(width / 2, height / 2 + 40, `Total Deaths: ${deathCount}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffff00',
    });
    statsText.setOrigin(0.5);

    // Restart button
    const restartText = this.add.text(width / 2, height / 2 + 90, 'Press SPACE to play again', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#00ff00',
    });
    restartText.setOrigin(0.5);

    // Tween for victory text
    this.tweens.add({
      targets: victoryText,
      scale: { from: 1, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Input
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.registry.set('currentLevel', 1);
      this.registry.set('totalDeaths', 0);
      this.registry.set('maxHealth', 3);

      // Clear localStorage
      localStorage.setItem('leveldevil_currentLevel', '1');
      localStorage.setItem('leveldevil_totalDeaths', '0');
      localStorage.setItem('leveldevil_maxHealth', '3');

      this.scene.start('GameScene');
    });
  }
}

import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private deathCount: number = 0;
  private deathText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  
  // Mobile controls
  private leftButton!: Phaser.GameObjects.Graphics;
  private rightButton!: Phaser.GameObjects.Graphics;
  private jumpButton!: Phaser.GameObjects.Graphics;
  private isMobile: boolean = false;

  // Virtual input states (accessible by GameScene if needed)
  public virtualLeft: boolean = false;
  public virtualRight: boolean = false;
  public virtualJump: boolean = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Create heart animation
    if (!this.anims.exists('heart-beat')) {
      this.anims.create({
        key: 'heart-beat',
        frames: this.anims.generateFrameNumbers('heart', { start: 0, end: 16 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Hearts display (top-left)
    for (let i = 0; i < 3; i++) {
      const heart = this.add.sprite(20 + i * 20, 25, 'heart');
      heart.setScrollFactor(0);
      heart.setDepth(1000);
      heart.setScale(1);
      heart.play('heart-beat');
      // Randomize starting frame so they don't all animate in sync
      heart.anims.setProgress(Math.random());
      this.hearts.push(heart);
    }

    // Death counter (top-right)
    this.deathText = this.add.text(this.cameras.main.width - 16, 16, 'Deaths: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 },
    });
    this.deathText.setOrigin(1, 0);
    this.deathText.setScrollFactor(0);
    this.deathText.setDepth(1000);

    // Level display (top-center)
    this.levelText = this.add.text(this.cameras.main.width / 2, 16, 'Level 1', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.levelText.setOrigin(0.5, 0);
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(1000);

    // Detect if mobile/touch device
    this.isMobile = this.sys.game.device.input.touch;

    // Setup mobile controls if on touch device
    if (this.isMobile || this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
      this.setupMobileControls();
    }

    // Listen for death events from GameScene
    this.game.events.on('playerDeath', this.onPlayerDeath, this);
    this.game.events.on('healthChanged', this.onHealthChanged, this);
    this.game.events.on('levelChanged', this.onLevelChanged, this);
  }

  private setupMobileControls(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const buttonSize = 60;
    const buttonAlpha = 0.4;

    // Left button
    this.leftButton = this.add.graphics();
    this.leftButton.fillStyle(0x444444, buttonAlpha);
    this.leftButton.fillRoundedRect(20, height - buttonSize - 20, buttonSize, buttonSize, 10);
    this.leftButton.fillStyle(0xffffff, 0.8);
    this.leftButton.fillTriangle(35, height - 50, 55, height - 40, 55, height - 60);
    this.leftButton.setScrollFactor(0);
    this.leftButton.setDepth(1000);
    this.leftButton.setInteractive(
      new Phaser.Geom.Rectangle(20, height - buttonSize - 20, buttonSize, buttonSize),
      Phaser.Geom.Rectangle.Contains
    );

    // Right button
    this.rightButton = this.add.graphics();
    this.rightButton.fillStyle(0x444444, buttonAlpha);
    this.rightButton.fillRoundedRect(100, height - buttonSize - 20, buttonSize, buttonSize, 10);
    this.rightButton.fillStyle(0xffffff, 0.8);
    this.rightButton.fillTriangle(145, height - 50, 125, height - 40, 125, height - 60);
    this.rightButton.setScrollFactor(0);
    this.rightButton.setDepth(1000);
    this.rightButton.setInteractive(
      new Phaser.Geom.Rectangle(100, height - buttonSize - 20, buttonSize, buttonSize),
      Phaser.Geom.Rectangle.Contains
    );

    // Jump button (right side)
    this.jumpButton = this.add.graphics();
    this.jumpButton.fillStyle(0x444444, buttonAlpha);
    this.jumpButton.fillRoundedRect(
      width - buttonSize - 20,
      height - buttonSize - 20,
      buttonSize,
      buttonSize,
      10
    );
    this.jumpButton.fillStyle(0xffffff, 0.8);
    this.jumpButton.fillCircle(width - buttonSize / 2 - 20, height - buttonSize / 2 - 20, 15);
    this.jumpButton.setScrollFactor(0);
    this.jumpButton.setDepth(1000);
    this.jumpButton.setInteractive(
      new Phaser.Geom.Rectangle(
        width - buttonSize - 20,
        height - buttonSize - 20,
        buttonSize,
        buttonSize
      ),
      Phaser.Geom.Rectangle.Contains
    );

    // Setup touch events
    this.leftButton.on('pointerdown', () => {
      this.virtualLeft = true;
      this.leftButton.clear();
      this.leftButton.fillStyle(0x666666, buttonAlpha + 0.2);
      this.leftButton.fillRoundedRect(20, height - buttonSize - 20, buttonSize, buttonSize, 10);
      this.leftButton.fillStyle(0xffffff, 0.8);
      this.leftButton.fillTriangle(35, height - 50, 55, height - 40, 55, height - 60);
    });

    this.leftButton.on('pointerup', () => {
      this.virtualLeft = false;
      this.leftButton.clear();
      this.leftButton.fillStyle(0x444444, buttonAlpha);
      this.leftButton.fillRoundedRect(20, height - buttonSize - 20, buttonSize, buttonSize, 10);
      this.leftButton.fillStyle(0xffffff, 0.8);
      this.leftButton.fillTriangle(35, height - 50, 55, height - 40, 55, height - 60);
    });

    this.rightButton.on('pointerdown', () => {
      this.virtualRight = true;
      this.rightButton.clear();
      this.rightButton.fillStyle(0x666666, buttonAlpha + 0.2);
      this.rightButton.fillRoundedRect(100, height - buttonSize - 20, buttonSize, buttonSize, 10);
      this.rightButton.fillStyle(0xffffff, 0.8);
      this.rightButton.fillTriangle(145, height - 50, 125, height - 40, 125, height - 60);
    });

    this.rightButton.on('pointerup', () => {
      this.virtualRight = false;
      this.rightButton.clear();
      this.rightButton.fillStyle(0x444444, buttonAlpha);
      this.rightButton.fillRoundedRect(100, height - buttonSize - 20, buttonSize, buttonSize, 10);
      this.rightButton.fillStyle(0xffffff, 0.8);
      this.rightButton.fillTriangle(145, height - 50, 125, height - 40, 125, height - 60);
    });

    this.jumpButton.on('pointerdown', () => {
      this.virtualJump = true;
      this.jumpButton.clear();
      this.jumpButton.fillStyle(0x666666, buttonAlpha + 0.2);
      this.jumpButton.fillRoundedRect(
        width - buttonSize - 20,
        height - buttonSize - 20,
        buttonSize,
        buttonSize,
        10
      );
      this.jumpButton.fillStyle(0xffffff, 0.8);
      this.jumpButton.fillCircle(width - buttonSize / 2 - 20, height - buttonSize / 2 - 20, 15);
    });

    this.jumpButton.on('pointerup', () => {
      this.virtualJump = false;
      this.jumpButton.clear();
      this.jumpButton.fillStyle(0x444444, buttonAlpha);
      this.jumpButton.fillRoundedRect(
        width - buttonSize - 20,
        height - buttonSize - 20,
        buttonSize,
        buttonSize,
        10
      );
      this.jumpButton.fillStyle(0xffffff, 0.8);
      this.jumpButton.fillCircle(width - buttonSize / 2 - 20, height - buttonSize / 2 - 20, 15);
    });
  }

  onPlayerDeath(): void {
    this.deathCount++;
    this.deathText.setText(`Deaths: ${this.deathCount}`);
  }

  onHealthChanged(health: number): void {
    // Update heart display
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setVisible(i < health);
    }
  }

  onLevelChanged(level: number): void {
    this.levelText.setText(`Level ${level}`);
  }

  shutdown(): void {
    this.game.events.off('playerDeath', this.onPlayerDeath, this);
    this.game.events.off('healthChanged', this.onHealthChanged, this);
    this.game.events.off('levelChanged', this.onLevelChanged, this);
  }
}

import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private levelText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private maxHearts: number = 10;

  // Mobile controls
  private leftButton!: Phaser.GameObjects.Graphics;
  private rightButton!: Phaser.GameObjects.Graphics;
  private jumpButton!: Phaser.GameObjects.Graphics;
  private isMobile: boolean = false;

  // Virtual input states (accessible by GameScene if needed)
  public virtualLeft: boolean = false;
  public virtualRight: boolean = false;
  public virtualJump: boolean = false;

  // Track active pointers for multi-touch
  private leftButtonPointer: number = -1;
  private rightButtonPointer: number = -1;
  private jumpButtonPointer: number = -1;

  // Store button positions for sliding detection
  private leftButtonBounds!: Phaser.Geom.Rectangle;
  private rightButtonBounds!: Phaser.Geom.Rectangle;
  private jumpButtonBounds!: Phaser.Geom.Rectangle;

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

    // Hearts display (top-left) - create max 10 hearts
    for (let i = 0; i < this.maxHearts; i++) {
      const heart = this.add.sprite(20 + i * 20, 25, 'heart');
      heart.setScrollFactor(0);
      heart.setDepth(1000);
      heart.setScale(1);
      heart.play('heart-beat');
      // Randomize starting frame so they don't all animate in sync
      heart.anims.setProgress(Math.random());
      heart.setVisible(i < 3); // Start with 3 visible
      this.hearts.push(heart);
    }

    // Level display (top-center)
    const currentLevel = this.registry.get('currentLevel') || 1;
    this.levelText = this.add.text(this.cameras.main.width / 2, 16, `Level ${currentLevel}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.levelText.setOrigin(0.5, 0);
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(1000);

    // Debug indicator (bottom-left, hidden by default)
    this.debugText = this.add.text(16, this.cameras.main.height - 16, '⚡ INVINCIBLE', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#00FF00',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 },
    });
    this.debugText.setOrigin(0, 1);
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(1000);
    this.debugText.setVisible(false);

    // Detect if mobile/touch device
    this.isMobile = this.sys.game.device.input.touch;

    // Setup mobile controls if on touch device
    if (this.isMobile || this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
      this.setupMobileControls();
    }

    // Listen for events from GameScene
    this.game.events.on('healthChanged', this.onHealthChanged, this);
    this.game.events.on('levelChanged', this.onLevelChanged, this);
    this.game.events.on('debugInvincibilityChanged', this.onDebugInvincibilityChanged, this);
  }

  private setupMobileControls(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const buttonSize = 50;
    const buttonAlpha = 0.3;
    const margin = 10;

    // Left button (bottom-left corner)
    const leftX = margin;
    const leftY = height - buttonSize - margin;
    this.leftButtonBounds = new Phaser.Geom.Rectangle(leftX, leftY, buttonSize, buttonSize);
    
    this.leftButton = this.add.graphics();
    this.leftButton.fillStyle(0x444444, buttonAlpha);
    this.leftButton.fillRoundedRect(leftX, leftY, buttonSize, buttonSize, 8);
    this.leftButton.fillStyle(0xffffff, 0.7);
    this.leftButton.fillTriangle(
      leftX + 12,
      leftY + buttonSize / 2,
      leftX + buttonSize - 15,
      leftY + buttonSize / 2 - 10,
      leftX + buttonSize - 15,
      leftY + buttonSize / 2 + 10
    );
    this.leftButton.setScrollFactor(0);
    this.leftButton.setDepth(1000);
    this.leftButton.setInteractive(this.leftButtonBounds, Phaser.Geom.Rectangle.Contains);

    // Right button (next to left button)
    const rightX = leftX + buttonSize + margin;
    const rightY = height - buttonSize - margin;
    this.rightButtonBounds = new Phaser.Geom.Rectangle(rightX, rightY, buttonSize, buttonSize);
    
    this.rightButton = this.add.graphics();
    this.rightButton.fillStyle(0x444444, buttonAlpha);
    this.rightButton.fillRoundedRect(rightX, rightY, buttonSize, buttonSize, 8);
    this.rightButton.fillStyle(0xffffff, 0.7);
    this.rightButton.fillTriangle(
      rightX + buttonSize - 12,
      rightY + buttonSize / 2,
      rightX + 15,
      rightY + buttonSize / 2 - 10,
      rightX + 15,
      rightY + buttonSize / 2 + 10
    );
    this.rightButton.setScrollFactor(0);
    this.rightButton.setDepth(1000);
    this.rightButton.setInteractive(this.rightButtonBounds, Phaser.Geom.Rectangle.Contains);

    // Jump button (bottom-right corner)
    const jumpX = width - buttonSize - margin;
    const jumpY = height - buttonSize - margin;
    this.jumpButtonBounds = new Phaser.Geom.Rectangle(jumpX, jumpY, buttonSize, buttonSize);
    
    this.jumpButton = this.add.graphics();
    this.jumpButton.fillStyle(0x444444, buttonAlpha);
    this.jumpButton.fillRoundedRect(jumpX, jumpY, buttonSize, buttonSize, 8);
    this.jumpButton.fillStyle(0xffffff, 0.7);
    this.jumpButton.fillCircle(jumpX + buttonSize / 2, jumpY + buttonSize / 2, 12);
    this.jumpButton.setScrollFactor(0);
    this.jumpButton.setDepth(1000);
    this.jumpButton.setInteractive(this.jumpButtonBounds, Phaser.Geom.Rectangle.Contains);

    // Setup touch events with sliding support for left/right buttons
    // Use global pointer tracking to detect sliding between buttons
    const directionPointer = { id: -1 };

    // Helper function to update button visuals and state based on pointer position
    const updateDirectionButtons = (pointer: Phaser.Input.Pointer) => {
      const inLeft = this.leftButtonBounds.contains(pointer.x, pointer.y);
      const inRight = this.rightButtonBounds.contains(pointer.x, pointer.y);

      // Update left button state
      if (inLeft) {
        if (!this.virtualLeft) {
          this.virtualLeft = true;
          this.leftButton.clear();
          this.leftButton.fillStyle(0x666666, buttonAlpha + 0.2);
          this.leftButton.fillRoundedRect(leftX, leftY, buttonSize, buttonSize, 8);
          this.leftButton.fillStyle(0xffffff, 0.9);
          this.leftButton.fillTriangle(
            leftX + 12,
            leftY + buttonSize / 2,
            leftX + buttonSize - 15,
            leftY + buttonSize / 2 - 10,
            leftX + buttonSize - 15,
            leftY + buttonSize / 2 + 10
          );
        }
      } else {
        if (this.virtualLeft) {
          this.virtualLeft = false;
          this.leftButton.clear();
          this.leftButton.fillStyle(0x444444, buttonAlpha);
          this.leftButton.fillRoundedRect(leftX, leftY, buttonSize, buttonSize, 8);
          this.leftButton.fillStyle(0xffffff, 0.7);
          this.leftButton.fillTriangle(
            leftX + 12,
            leftY + buttonSize / 2,
            leftX + buttonSize - 15,
            leftY + buttonSize / 2 - 10,
            leftX + buttonSize - 15,
            leftY + buttonSize / 2 + 10
          );
        }
      }

      // Update right button state
      if (inRight) {
        if (!this.virtualRight) {
          this.virtualRight = true;
          this.rightButton.clear();
          this.rightButton.fillStyle(0x666666, buttonAlpha + 0.2);
          this.rightButton.fillRoundedRect(rightX, rightY, buttonSize, buttonSize, 8);
          this.rightButton.fillStyle(0xffffff, 0.9);
          this.rightButton.fillTriangle(
            rightX + buttonSize - 12,
            rightY + buttonSize / 2,
            rightX + 15,
            rightY + buttonSize / 2 - 10,
            rightX + 15,
            rightY + buttonSize / 2 + 10
          );
        }
      } else {
        if (this.virtualRight) {
          this.virtualRight = false;
          this.rightButton.clear();
          this.rightButton.fillStyle(0x444444, buttonAlpha);
          this.rightButton.fillRoundedRect(rightX, rightY, buttonSize, buttonSize, 8);
          this.rightButton.fillStyle(0xffffff, 0.7);
          this.rightButton.fillTriangle(
            rightX + buttonSize - 12,
            rightY + buttonSize / 2,
            rightX + 15,
            rightY + buttonSize / 2 - 10,
            rightX + 15,
            rightY + buttonSize / 2 + 10
          );
        }
      }
    };

    // LEFT/RIGHT BUTTON GROUP - Handle as one sliding area
    this.leftButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (directionPointer.id === -1) {
        directionPointer.id = pointer.id;
        updateDirectionButtons(pointer);
      }
    });

    this.rightButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (directionPointer.id === -1) {
        directionPointer.id = pointer.id;
        updateDirectionButtons(pointer);
      }
    });

    // Track pointer movement globally to detect sliding
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === directionPointer.id) {
        updateDirectionButtons(pointer);
      }
    });

    // Release direction buttons when pointer is lifted
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === directionPointer.id) {
        directionPointer.id = -1;
        // Reset both buttons
        this.virtualLeft = false;
        this.virtualRight = false;
        
        this.leftButton.clear();
        this.leftButton.fillStyle(0x444444, buttonAlpha);
        this.leftButton.fillRoundedRect(leftX, leftY, buttonSize, buttonSize, 8);
        this.leftButton.fillStyle(0xffffff, 0.7);
        this.leftButton.fillTriangle(
          leftX + 12,
          leftY + buttonSize / 2,
          leftX + buttonSize - 15,
          leftY + buttonSize / 2 - 10,
          leftX + buttonSize - 15,
          leftY + buttonSize / 2 + 10
        );

        this.rightButton.clear();
        this.rightButton.fillStyle(0x444444, buttonAlpha);
        this.rightButton.fillRoundedRect(rightX, rightY, buttonSize, buttonSize, 8);
        this.rightButton.fillStyle(0xffffff, 0.7);
        this.rightButton.fillTriangle(
          rightX + buttonSize - 12,
          rightY + buttonSize / 2,
          rightX + 15,
          rightY + buttonSize / 2 - 10,
          rightX + 15,
          rightY + buttonSize / 2 + 10
        );
      }
    });

    // JUMP BUTTON
    this.jumpButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.jumpButtonPointer === -1) {
        this.jumpButtonPointer = pointer.id;
        this.virtualJump = true;
        this.jumpButton.clear();
        this.jumpButton.fillStyle(0x666666, buttonAlpha + 0.2);
        this.jumpButton.fillRoundedRect(jumpX, jumpY, buttonSize, buttonSize, 8);
        this.jumpButton.fillStyle(0xffffff, 0.9);
        this.jumpButton.fillCircle(jumpX + buttonSize / 2, jumpY + buttonSize / 2, 12);
      }
    });

    this.jumpButton.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.jumpButtonPointer) {
        this.jumpButtonPointer = -1;
        this.virtualJump = false;
        this.jumpButton.clear();
        this.jumpButton.fillStyle(0x444444, buttonAlpha);
        this.jumpButton.fillRoundedRect(jumpX, jumpY, buttonSize, buttonSize, 8);
        this.jumpButton.fillStyle(0xffffff, 0.7);
        this.jumpButton.fillCircle(jumpX + buttonSize / 2, jumpY + buttonSize / 2, 12);
      }
    });

    this.jumpButton.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.jumpButtonPointer) {
        this.jumpButtonPointer = -1;
        this.virtualJump = false;
        this.jumpButton.clear();
        this.jumpButton.fillStyle(0x444444, buttonAlpha);
        this.jumpButton.fillRoundedRect(jumpX, jumpY, buttonSize, buttonSize, 8);
        this.jumpButton.fillStyle(0xffffff, 0.7);
        this.jumpButton.fillCircle(jumpX + buttonSize / 2, jumpY + buttonSize / 2, 12);
      }
    });
  }

  onHealthChanged(health: number, maxHealth: number): void {
    // Update heart display based on current and max health
    for (let i = 0; i < this.hearts.length; i++) {
      if (i < maxHealth) {
        // This heart slot should exist
        this.hearts[i].setVisible(i < health);
        this.hearts[i].setAlpha(1); // Full hearts are bright
      } else {
        // This heart slot shouldn't exist yet
        this.hearts[i].setVisible(false);
      }
    }
  }

  onLevelChanged(level: number): void {
    this.levelText.setText(`Level ${level}`);
  }

  onDebugInvincibilityChanged(enabled: boolean): void {
    this.debugText.setVisible(enabled);
    if (enabled) {
      this.tweens.add({
        targets: this.debugText,
        alpha: { from: 0.5, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.tweens.killTweensOf(this.debugText);
      this.debugText.setAlpha(1);
    }
  }

  shutdown(): void {
    this.game.events.off('healthChanged', this.onHealthChanged, this);
    this.game.events.off('levelChanged', this.onLevelChanged, this);
    this.game.events.off('debugInvincibilityChanged', this.onDebugInvincibilityChanged, this);
  }
}

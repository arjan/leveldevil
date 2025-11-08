import Phaser from 'phaser';

export class MobileOrientationScene extends Phaser.Scene {
  private orientationWarning!: Phaser.GameObjects.Container;
  private fullscreenButton!: Phaser.GameObjects.Container;
  private checkInterval?: number;

  constructor() {
    super({ key: 'MobileOrientationScene', active: true });
  }

  create(): void {
    // Only show on mobile devices
    const isMobile =
      this.sys.game.device.input.touch ||
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS;

    if (!isMobile) return;

    // Create orientation warning (hidden by default)
    this.createOrientationWarning();

    // Create fullscreen button
    this.createFullscreenButton();

    // Check orientation periodically
    this.checkOrientation();
    this.checkInterval = window.setInterval(() => this.checkOrientation(), 500);

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.checkOrientation(), 100);
    });

    // Listen for resize
    this.scale.on('resize', () => {
      this.updatePositions();
      this.checkOrientation();
    });
  }

  private createOrientationWarning(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.orientationWarning = this.add.container(width / 2, height / 2);
    this.orientationWarning.setDepth(10000);
    this.orientationWarning.setScrollFactor(0);

    // Semi-transparent background
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.9);

    // Rotating phone icon (simple representation)
    const phoneIcon = this.add.graphics();
    phoneIcon.lineStyle(4, 0xffffff);
    phoneIcon.strokeRect(-30, -50, 60, 100);
    phoneIcon.fillStyle(0xffffff);
    phoneIcon.fillCircle(0, -35, 5);
    phoneIcon.fillRect(-10, 40, 20, 5);

    // Rotation arrow
    const arrow = this.add.graphics();
    arrow.lineStyle(3, 0xffaa00);
    arrow.beginPath();
    arrow.arc(0, 0, 80, -Math.PI / 4, Math.PI / 4, false);
    arrow.strokePath();
    arrow.fillStyle(0xffaa00);
    arrow.fillTriangle(65, 30, 75, 40, 55, 40);

    // Text
    const text = this.add.text(0, 80, 'Please rotate your device\nto landscape mode', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    });
    text.setOrigin(0.5);

    this.orientationWarning.add([bg, phoneIcon, arrow, text]);
    this.orientationWarning.setVisible(false);
  }

  private createFullscreenButton(): void {
    const width = this.cameras.main.width;

    this.fullscreenButton = this.add.container(width - 50, 50);
    this.fullscreenButton.setDepth(9999);
    this.fullscreenButton.setScrollFactor(0);

    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x333333, 0.7);
    buttonBg.fillRoundedRect(-20, -20, 40, 40, 8);

    // Fullscreen icon
    const icon = this.add.graphics();
    icon.lineStyle(2, 0xffffff);
    icon.strokeRect(-10, -10, 20, 20);
    icon.lineStyle(3, 0xffffff);
    icon.lineBetween(-10, -10, -5, -10);
    icon.lineBetween(-10, -10, -10, -5);
    icon.lineBetween(10, -10, 5, -10);
    icon.lineBetween(10, -10, 10, -5);
    icon.lineBetween(-10, 10, -5, 10);
    icon.lineBetween(-10, 10, -10, 5);
    icon.lineBetween(10, 10, 5, 10);
    icon.lineBetween(10, 10, 10, 5);

    this.fullscreenButton.add([buttonBg, icon]);

    // Make interactive
    buttonBg.setInteractive(
      new Phaser.Geom.Rectangle(-20, -20, 40, 40),
      Phaser.Geom.Rectangle.Contains
    );

    buttonBg.on('pointerdown', () => {
      this.toggleFullscreen();
    });

    // Hide button if already in fullscreen
    if (this.scale.isFullscreen) {
      this.fullscreenButton.setVisible(false);
    }
  }

  private checkOrientation(): void {
    if (!this.orientationWarning) return;

    const isLandscape = window.innerWidth > window.innerHeight;
    this.orientationWarning.setVisible(!isLandscape);

    // Pause game if in portrait mode
    if (!isLandscape) {
      this.scene.pause('GameScene');
    } else {
      this.scene.resume('GameScene');
    }
  }

  private toggleFullscreen(): void {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      this.fullscreenButton.setVisible(true);
    } else {
      this.scale.startFullscreen();
      // Request screen orientation lock to landscape
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          // Orientation lock not supported or denied
        });
      }
      this.fullscreenButton.setVisible(false);
    }
  }

  private updatePositions(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (this.orientationWarning) {
      this.orientationWarning.setPosition(width / 2, height / 2);
    }

    if (this.fullscreenButton) {
      this.fullscreenButton.setPosition(width - 50, 50);
    }
  }

  shutdown(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}


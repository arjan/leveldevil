import Phaser from 'phaser';

export class MobileOrientationScene extends Phaser.Scene {
  private orientationWarning!: Phaser.GameObjects.Container;
  private fullscreenButton!: Phaser.GameObjects.Container;
  private playButton!: Phaser.GameObjects.Container;
  private checkInterval?: number;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'MobileOrientationScene', active: true });
  }

  create(): void {
    // Only show on mobile devices
    this.isMobile =
      this.sys.game.device.input.touch ||
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS;

    if (!this.isMobile) return;

    // Create orientation warning (hidden by default)
    this.createOrientationWarning();

    // Create big play button (shown when not fullscreen)
    this.createPlayButton();

    // Create small fullscreen button (backup, hidden by default)
    this.createFullscreenButton();

    // Check orientation and fullscreen state periodically
    this.checkOrientation();
    this.checkFullscreenState();
    this.checkInterval = window.setInterval(() => {
      this.checkOrientation();
      this.checkFullscreenState();
    }, 500);

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.checkOrientation(), 100);
    });

    // Listen for resize
    this.scale.on('resize', () => {
      this.updatePositions();
      this.checkOrientation();
    });

    // Listen for fullscreen changes
    this.scale.on('enterfullscreen', () => {
      this.onEnterFullscreen();
    });

    this.scale.on('leavefullscreen', () => {
      this.onLeaveFullscreen();
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

  private createPlayButton(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.playButton = this.add.container(width / 2, height / 2);
    this.playButton.setDepth(9998);
    this.playButton.setScrollFactor(0);

    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);

    // Large button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x44aa44, 1);
    buttonBg.fillRoundedRect(-100, -50, 200, 100, 16);
    buttonBg.lineStyle(4, 0x66cc66);
    buttonBg.strokeRoundedRect(-100, -50, 200, 100, 16);

    // Play icon (triangle)
    const playIcon = this.add.graphics();
    playIcon.fillStyle(0xffffff, 1);
    playIcon.fillTriangle(-20, -30, -20, 30, 25, 0);

    // Text
    const text = this.add.text(0, 70, 'Tap to Play', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
    });
    text.setOrigin(0.5);

    this.playButton.add([overlay, buttonBg, playIcon, text]);

    // Make interactive
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    overlay.on('pointerdown', () => {
      this.enterFullscreenAndPlay();
    });

    // Pulse animation
    this.tweens.add({
      targets: buttonBg,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Initially show if not in fullscreen
    this.playButton.setVisible(!this.scale.isFullscreen);
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

    // Always hidden - we use the play button instead
    this.fullscreenButton.setVisible(false);
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

  private enterFullscreenAndPlay(): void {
    if (!this.scale.isFullscreen) {
      this.scale.startFullscreen();
      // Request screen orientation lock to landscape
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          // Orientation lock not supported or denied
        });
      }
    }
  }

  private toggleFullscreen(): void {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
    } else {
      this.enterFullscreenAndPlay();
    }
  }

  private checkFullscreenState(): void {
    if (!this.playButton || !this.isMobile) return;
    
    const isFullscreen = this.scale.isFullscreen;
    this.playButton.setVisible(!isFullscreen);
    
    // Pause game when not in fullscreen
    if (!isFullscreen) {
      this.scene.pause('GameScene');
    } else {
      this.scene.resume('GameScene');
    }
  }

  private onEnterFullscreen(): void {
    if (this.playButton) {
      this.playButton.setVisible(false);
    }
    this.scene.resume('GameScene');
  }

  private onLeaveFullscreen(): void {
    if (this.playButton) {
      this.playButton.setVisible(true);
    }
    this.scene.pause('GameScene');
  }

  private updatePositions(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (this.orientationWarning) {
      this.orientationWarning.setPosition(width / 2, height / 2);
    }

    if (this.playButton) {
      this.playButton.setPosition(width / 2, height / 2);
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


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
    
    // Load all 11 levels (10 regular + 1 boss level)
    for (let i = 1; i <= 11; i++) {
      this.load.tilemapTiledJSON(`level${i}`, `assets/maps/level${i}.json`);
    }

    // Load all background images
    this.load.image('background-Blue', 'assets/Background/Blue.png');
    this.load.image('background-Brown', 'assets/Background/Brown.png');
    this.load.image('background-Gray', 'assets/Background/Gray.png');
    this.load.image('background-Green', 'assets/Background/Green.png');
    this.load.image('background-Pink', 'assets/Background/Pink.png');
    this.load.image('background-Purple', 'assets/Background/Purple.png');
    this.load.image('background-Yellow', 'assets/Background/Yellow.png');

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

    // Load enemy sprites
    this.load.spritesheet('slime-idle', 'assets/enemies/slime/Idle-Run.png', {
      frameWidth: 44,
      frameHeight: 30,
    });
    this.load.spritesheet('slime-hit', 'assets/enemies/slime/Hit.png', {
      frameWidth: 44,
      frameHeight: 30,
    });

    this.load.spritesheet('mushroom-idle', 'assets/enemies/mushroom/Idle.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('mushroom-run', 'assets/enemies/mushroom/Run.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('mushroom-hit', 'assets/enemies/mushroom/Hit.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet('trunk-idle', 'assets/enemies/trunk/Idle.png', {
      frameWidth: 64,
      frameHeight: 32,
    });
    this.load.spritesheet('trunk-attack', 'assets/enemies/trunk/Attack.png', {
      frameWidth: 64,
      frameHeight: 32,
    });
    this.load.spritesheet('trunk-hit', 'assets/enemies/trunk/Hit.png', {
      frameWidth: 64,
      frameHeight: 32,
    });
    this.load.image('trunk-bullet', 'assets/enemies/trunk/Bullet.png');

    // Load spike spritesheet
    this.load.spritesheet('spike', 'assets/traps/spikes/Idle.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create(): void {
    // Initialize game registry
    // Try to load from localStorage first
    const savedLevel = localStorage.getItem('leveldevil_currentLevel');
    const savedDeaths = localStorage.getItem('leveldevil_totalDeaths');
    const savedMaxHealth = localStorage.getItem('leveldevil_maxHealth');

    if (savedLevel && !isNaN(parseInt(savedLevel))) {
      this.registry.set('currentLevel', parseInt(savedLevel));
    } else if (!this.registry.has('currentLevel')) {
      this.registry.set('currentLevel', 1);
    }

    if (savedDeaths && !isNaN(parseInt(savedDeaths))) {
      this.registry.set('totalDeaths', parseInt(savedDeaths));
    } else if (!this.registry.has('totalDeaths')) {
      this.registry.set('totalDeaths', 0);
    }

    if (savedMaxHealth && !isNaN(parseInt(savedMaxHealth))) {
      this.registry.set('maxHealth', parseInt(savedMaxHealth));
    } else if (!this.registry.has('maxHealth')) {
      this.registry.set('maxHealth', 3);
    }

    // Start the game scene
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}


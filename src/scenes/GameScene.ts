import Phaser from 'phaser';
import { Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private hiddenLayer!: Phaser.Tilemaps.TilemapLayer;
  private spikesLayer!: Phaser.Tilemaps.TilemapLayer;
  private player!: Player;
  private spawnPoint!: { x: number; y: number };
  private isDead: boolean = false;
  private health: number = 3;
  private isInvulnerable: boolean = false;
  private currentLevel: number = 1;
  private debugInvincible: boolean = false;
  private levelCompleted: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Get current level from registry
    this.currentLevel = this.registry.get('currentLevel') || 1;
    
    // Add background - fill the entire map area
    const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    bg.setScrollFactor(0);

    // Create tilemap for current level
    this.map = this.make.tilemap({ key: `level${this.currentLevel}` });
    const tileset = this.map.addTilesetImage('tileset', 'terrain-tileset');

    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }

    // Create layers
    this.groundLayer = this.map.createLayer('Ground', tileset)!;
    const groundTiles = new Set<number>();
    this.groundLayer.forEachTile((tile) => {
      if (tile.index > 0) {
        groundTiles.add(tile.index);
      }
    });
    if (groundTiles.size > 0) {
      this.groundLayer.setCollision(Array.from(groundTiles));
    }

    this.hiddenLayer = this.map.createLayer('Hidden', tileset)!;
    this.hiddenLayer.setVisible(false);
    // Don't enable collision yet - will be enabled when revealed

    this.spikesLayer = this.map.createLayer('Spikes', tileset)!;
    const spikeTiles = new Set<number>();
    this.spikesLayer.forEachTile((tile) => {
      if (tile.index > 0) {
        spikeTiles.add(tile.index);
      }
    });
    if (spikeTiles.size > 0) {
      this.spikesLayer.setCollision(Array.from(spikeTiles));
    }
    // Don't tint - let the spike tiles show naturally

    // Set world bounds to match map size
    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;

    // Get player spawn point from object layer
    const spawns = this.map.getObjectLayer('Spawns');
    const spawnObj = spawns?.objects.find(obj => obj.name === 'PlayerSpawn');
    
    if (spawnObj) {
      // Spawn at the center of the spawn object
      this.spawnPoint = { 
        x: spawnObj.x! + (spawnObj.width! / 2), 
        y: spawnObj.y! + (spawnObj.height! / 2) 
      };
    } else {
      // Fallback spawn
      this.spawnPoint = { x: 100, y: 200 };
    }

    // Create player
    this.player = new Player({
      scene: this,
      x: this.spawnPoint.x,
      y: this.spawnPoint.y,
    });

    // Setup collisions
    this.physics.add.collider(this.player, this.groundLayer);
    this.physics.add.collider(this.player, this.hiddenLayer);
    
    // Spike collision with death callback
    this.physics.add.overlap(
      this.player,
      this.spikesLayer,
      (player, tile) => {
        const spikeTile = tile as Phaser.Tilemaps.Tile;
        if (!this.isInvulnerable && spikeTile.index > 0) {
          this.takeDamage();
        }
      },
      undefined,
      this
    );

    // Setup trigger zones for revealing hidden walls
    this.setupTriggers();

    // Setup goal zone
    this.setupGoal();

    // Camera setup
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    // Center camera on player (no deadzone)
    
    // Emit level change
    this.game.events.emit('levelChanged', this.currentLevel);
    
    // Setup debug controls
    this.input.keyboard!.on('keydown-I', () => {
      this.debugInvincible = !this.debugInvincible;
      this.game.events.emit('debugInvincibilityChanged', this.debugInvincible);
    });
  }

  private setupTriggers(): void {
    const triggersLayer = this.map.getObjectLayer('Triggers');
    if (!triggersLayer) return;

    triggersLayer.objects.forEach(triggerObj => {
      if (triggerObj.type === 'reveal') {
        // Create a zone for the trigger area
        const zone = this.add.zone(
          triggerObj.x! + triggerObj.width! / 2,
          triggerObj.y! + triggerObj.height! / 2,
          triggerObj.width!,
          triggerObj.height!
        );
        
        this.physics.add.existing(zone, false);

        // Add overlap detection
        this.physics.add.overlap(
          this.player,
          zone as Phaser.Types.Physics.Arcade.GameObjectWithBody,
          () => {
            // Reveal hidden layer
            this.hiddenLayer.setVisible(true);
            
            // Enable collision on hidden layer
            this.hiddenLayer.forEachTile((tile) => {
              if (tile.index > 0) {
                this.hiddenLayer.setCollision(tile.index);
              }
            });
            
            // Destroy the zone so it only triggers once
            zone.destroy();
          },
          undefined,
          this
        );
      }
    });
  }

  private setupGoal(): void {
    const goalLayer = this.map.getObjectLayer('Goal');
    if (!goalLayer) return;

    goalLayer.objects.forEach(goalObj => {
      if (goalObj.type === 'goal' || goalObj.name === 'LevelGoal') {
        // Make the zone taller to ensure we catch the player
        const goalHeight = (goalObj.height || 64) * 2;
        const goalWidth = goalObj.width || 64;
        const goalX = goalObj.x || 0;
        const goalY = (goalObj.y || 0) - goalHeight / 2;
        
        // Create a zone for the goal area
        const zone = this.add.zone(
          goalX + goalWidth / 2,
          goalY + goalHeight / 2,
          goalWidth,
          goalHeight
        );
        
        this.physics.add.existing(zone, false);
        const zoneBody = zone.body as Phaser.Physics.Arcade.Body;
        zoneBody.setAllowGravity(false);

        // Add overlap detection
        this.physics.add.overlap(
          this.player,
          zone as Phaser.Types.Physics.Arcade.GameObjectWithBody,
          () => {
            if (!this.levelCompleted) {
              this.levelCompleted = true;
              this.nextLevel();
            }
          },
          undefined,
          this
        );
        
        // Visual indicator for goal - make it more visible
        const goalGraphics = this.add.graphics();
        goalGraphics.lineStyle(4, 0xFFD700);
        goalGraphics.fillStyle(0xFFFF00, 0.5);
        goalGraphics.fillRect(goalX, goalY, goalWidth, goalHeight);
        goalGraphics.strokeRect(goalX, goalY, goalWidth, goalHeight);
        
        // Add vertical stripes for extra visibility
        goalGraphics.lineStyle(2, 0xFFD700, 0.7);
        for (let i = 0; i < goalWidth; i += 8) {
          goalGraphics.lineBetween(goalX + i, goalY, goalX + i, goalY + goalHeight);
        }
      }
    });
  }

  nextLevel(): void {
    if (this.currentLevel >= 10) {
      // Victory!
      this.scene.stop('UIScene');
      this.scene.start('VictoryScene');
    } else {
      // Next level
      this.currentLevel++;
      this.registry.set('currentLevel', this.currentLevel);
      
      // Save to localStorage
      localStorage.setItem('leveldevil_currentLevel', this.currentLevel.toString());
      
      this.scene.restart();
    }
  }

  update(time: number, delta: number): void {
    // Update player
    if (this.player && !this.isDead) {
      this.player.update(time, delta);
    }
  }

  takeDamage(): void {
    if (this.isInvulnerable || this.debugInvincible) return;

    this.health--;
    this.game.events.emit('healthChanged', this.health);

    if (this.health <= 0) {
      this.onDeath();
    } else {
      // Make invulnerable temporarily
      this.isInvulnerable = true;
      
      // Flash player
      this.tweens.add({
        targets: this.player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          this.player.setAlpha(1);
          this.isInvulnerable = false;
        }
      });
    }
  }

  onDeath(): void {
    // Prevent multiple death triggers
    this.isDead = true;
    
    // Track total deaths
    const totalDeaths = this.registry.get('totalDeaths') || 0;
    this.registry.set('totalDeaths', totalDeaths + 1);
    
    // Save to localStorage
    localStorage.setItem('leveldevil_totalDeaths', (totalDeaths + 1).toString());
    
    // Emit death event for UI
    this.game.events.emit('playerDeath');
    
    // Respawn player
    this.time.delayedCall(1000, () => {
      if (this.player) {
        this.health = 3;
        this.game.events.emit('healthChanged', this.health);
        this.player.respawn(this.spawnPoint.x, this.spawnPoint.y);
        this.isDead = false;
        this.isInvulnerable = false;
        this.player.setAlpha(1);
      }
    });
  }
}


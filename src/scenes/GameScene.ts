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

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Create tilemap
    this.map = this.make.tilemap({ key: 'level1' });
    const tileset = this.map.addTilesetImage('tileset', 'terrain-tileset');

    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }

    // Create layers
    this.groundLayer = this.map.createLayer('Ground', tileset)!;
    // Set collision on all tiles in the Ground layer (tiles 1-72)
    const groundTiles = new Set<number>();
    this.groundLayer.forEachTile((tile) => {
      if (tile.index > 0) {
        groundTiles.add(tile.index);
      }
    });
    if (groundTiles.size > 0) {
      this.groundLayer.setCollision(Array.from(groundTiles));
      console.log('Ground collision tiles:', Array.from(groundTiles));
    }

    this.hiddenLayer = this.map.createLayer('Hidden', tileset)!;
    this.hiddenLayer.setVisible(false);
    // Don't enable collision yet - will be enabled when revealed

    this.spikesLayer = this.map.createLayer('Spikes', tileset)!;
    // Set collision on spike tiles
    const spikeTiles = new Set<number>();
    this.spikesLayer.forEachTile((tile) => {
      if (tile.index > 0) {
        spikeTiles.add(tile.index);
      }
    });
    if (spikeTiles.size > 0) {
      this.spikesLayer.setCollision(Array.from(spikeTiles));
      console.log('Spike collision tiles:', Array.from(spikeTiles));
    }
    this.spikesLayer.setTint(0xff4444); // Red tint to make spikes visible

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
      () => {
        if (!this.isDead) {
          this.onDeath();
        }
      },
      undefined,
      this
    );

    // Setup trigger zones for revealing hidden walls
    this.setupTriggers();

    // Camera setup
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(200, 100);
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

  update(time: number, delta: number): void {
    // Update player
    if (this.player) {
      this.player.update(time, delta);
    }
  }

  onDeath(): void {
    // Prevent multiple death triggers
    this.isDead = true;
    
    // Emit death event for UI
    this.game.events.emit('playerDeath');
    
    // Respawn player
    this.time.delayedCall(500, () => {
      if (this.player) {
        this.player.respawn(this.spawnPoint.x, this.spawnPoint.y);
        this.isDead = false;
      }
    });
  }
}


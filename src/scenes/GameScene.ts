import Phaser from 'phaser';
import { Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private hiddenLayer!: Phaser.Tilemaps.TilemapLayer;
  private spikesLayer!: Phaser.Tilemaps.TilemapLayer;
  private player!: Player;
  private spawnPoint!: { x: number; y: number };

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
    this.groundLayer.setCollisionByProperty({ collides: true });

    this.hiddenLayer = this.map.createLayer('Hidden', tileset)!;
    this.hiddenLayer.setVisible(false);
    this.hiddenLayer.setCollisionByProperty({ collides: true });

    this.spikesLayer = this.map.createLayer('Spikes', tileset)!;
    this.spikesLayer.setCollisionByProperty({ deadly: true });

    // Set world bounds to match map size
    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;

    // Get player spawn point from object layer
    const spawns = this.map.getObjectLayer('Spawns');
    const spawnObj = spawns?.objects.find(obj => obj.name === 'PlayerSpawn');
    
    if (spawnObj) {
      this.spawnPoint = { x: spawnObj.x!, y: spawnObj.y! };
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

    // Camera setup
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(200, 100);
  }

  update(time: number, delta: number): void {
    // Update player
    if (this.player) {
      this.player.update(time, delta);
    }
  }

  onDeath(): void {
    // Emit death event for UI
    this.game.events.emit('playerDeath');
    
    // Respawn player
    this.time.delayedCall(500, () => {
      if (this.player) {
        this.player.respawn(this.spawnPoint.x, this.spawnPoint.y);
      }
    });
  }
}


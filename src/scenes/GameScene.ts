import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private hiddenLayer!: Phaser.Tilemaps.TilemapLayer;
  private spikesLayer!: Phaser.Tilemaps.TilemapLayer;

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

    // Camera setup (basic for now, will be improved with player)
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  update(): void {
    // Game loop
  }
}


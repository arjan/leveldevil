import Phaser from 'phaser';

export class Slime extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 30;
  private direction: number = 1; // 1 for right, -1 for left

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'slime-idle');

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup physics
    this.setCollideWorldBounds(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setSize(32, 24);
    body.setOffset(6, 6);

    // Create animations if they don't exist
    this.createAnimations();

    // Start animation
    this.play('slime-move');
  }

  private createAnimations(): void {
    // Move animation
    if (!this.scene.anims.exists('slime-move')) {
      this.scene.anims.create({
        key: 'slime-move',
        frames: this.scene.anims.generateFrameNumbers('slime-idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Hit animation
    if (!this.scene.anims.exists('slime-hit')) {
      this.scene.anims.create({
        key: 'slime-hit',
        frames: this.scene.anims.generateFrameNumbers('slime-hit', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Move in current direction
    body.setVelocityX(this.speed * this.direction);

    // Flip sprite based on direction
    this.setFlipX(this.direction === -1);

    // Check if we hit a wall or edge
    if (body.blocked.right || body.blocked.left) {
      this.direction *= -1;
    }
  }

  hit(): void {
    // Play hit animation and destroy
    this.play('slime-hit');
    this.setVelocity(0, -200);
    
    this.once('animationcomplete', () => {
      this.destroy();
    });
  }
}


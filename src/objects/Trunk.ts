import Phaser from 'phaser';

export class TrunkBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'trunk-bullet');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(16, 16);
  }

  fire(x: number, y: number, direction: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    const speed = 200;
    this.setVelocityX(speed * direction);

    // Auto-destroy after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.destroy();
    });
  }
}

export class Trunk extends Phaser.Physics.Arcade.Sprite {
  private direction: number = -1; // -1 for left, 1 for right
  private shootTimer: number = 0;
  private shootCooldown: number = 2000; // ms between shots
  private detectionRange: number = 300;
  private playerRef: Phaser.Physics.Arcade.Sprite | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: number = -1
  ) {
    super(scene, x, y, 'trunk-idle');

    this.direction = direction;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup physics
    this.setCollideWorldBounds(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setSize(48, 28);
    body.setOffset(8, 4);
    body.setImmovable(true);

    // Create animations if they don't exist
    this.createAnimations();

    // Start idle animation
    this.play('trunk-idle');
    this.setFlipX(direction === 1);
  }

  private createAnimations(): void {
    // Idle animation
    if (!this.scene.anims.exists('trunk-idle')) {
      this.scene.anims.create({
        key: 'trunk-idle',
        frames: this.scene.anims.generateFrameNumbers('trunk-idle', {
          start: 0,
          end: 17,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Attack animation
    if (!this.scene.anims.exists('trunk-attack')) {
      this.scene.anims.create({
        key: 'trunk-attack',
        frames: this.scene.anims.generateFrameNumbers('trunk-attack', {
          start: 0,
          end: 7,
        }),
        frameRate: 15,
        repeat: 0,
      });
    }

    // Hit animation
    if (!this.scene.anims.exists('trunk-hit')) {
      this.scene.anims.create({
        key: 'trunk-hit',
        frames: this.scene.anims.generateFrameNumbers('trunk-hit', {
          start: 0,
          end: 4,
        }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }

  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.playerRef = player;
  }

  update(time: number, delta: number, bullets: Phaser.GameObjects.Group): void {
    if (!this.playerRef || !this.active) return;

    // Update shoot timer
    this.shootTimer += delta;

    // Check if player is in range and in front of trunk
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.playerRef.x,
      this.playerRef.y
    );

    const playerInFront =
      (this.direction === -1 && this.playerRef.x < this.x) ||
      (this.direction === 1 && this.playerRef.x > this.x);

    // Shoot if player is in range and cooldown is ready
    if (
      distance < this.detectionRange &&
      playerInFront &&
      this.shootTimer >= this.shootCooldown
    ) {
      this.shoot(bullets);
      this.shootTimer = 0;
    }
  }

  private shoot(bullets: Phaser.GameObjects.Group): void {
    // Play attack animation
    this.play('trunk-attack');

    // Create bullet after a small delay (animation timing)
    this.scene.time.delayedCall(300, () => {
      const bullet = bullets.get() as TrunkBullet;
      if (bullet) {
        const offsetX = this.direction === -1 ? -30 : 30;
        bullet.fire(this.x + offsetX, this.y, this.direction);
      }

      // Return to idle
      this.once('animationcomplete', () => {
        this.play('trunk-idle');
      });
    });
  }

  hit(): void {
    // Play hit animation and destroy
    this.play('trunk-hit');
    this.setVelocity(0, -200);

    this.once('animationcomplete', () => {
      this.destroy();
    });
  }
}


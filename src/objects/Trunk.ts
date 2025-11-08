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
  private speed: number = 40;
  private direction: number = -1; // -1 for left, 1 for right
  private shootTimer: number = 0;
  private shootCooldown: number = 2000; // ms between shots
  private detectionRange: number = 300;
  private playerRef: Phaser.Physics.Arcade.Sprite | null = null;
  private groundLayer: Phaser.Tilemaps.TilemapLayer;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    direction: number = -1
  ) {
    super(scene, x, y, 'trunk-idle');

    this.direction = direction;
    this.groundLayer = groundLayer;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup physics
    this.setCollideWorldBounds(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setSize(48, 28);
    body.setOffset(8, 4);

    // Create animations if they don't exist
    this.createAnimations();

    // Start idle animation
    this.play('trunk-idle');
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

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Only move if on ground
    if (!body.blocked.down) {
      return;
    }

    // Patrol movement
    body.setVelocityX(this.speed * this.direction);

    // Check for walls
    if (body.blocked.right && this.direction === 1) {
      this.direction = -1;
    } else if (body.blocked.left && this.direction === -1) {
      this.direction = 1;
    }

    // Check for edges (raycast down in front of trunk) - check further ahead for trunk
    const checkDistance = 40; // Check further ahead since trunk is wider
    const checkX = this.direction === 1 ? this.x + checkDistance : this.x - checkDistance;
    const checkY = this.y + 20; // Check below the trunk

    const tile = this.groundLayer.getTileAtWorldXY(checkX, checkY);
    
    // If no tile ahead (edge detected), turn around immediately
    if (!tile || tile.index <= 0) {
      this.direction *= -1;
      // Stop current velocity to prevent falling off
      body.setVelocityX(0);
    }

    // Always face the player
    if (this.playerRef.x < this.x) {
      this.setFlipX(false); // Face left
    } else {
      this.setFlipX(true); // Face right
    }

    // Update shoot timer
    this.shootTimer += delta;

    // Check if player is in range
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.playerRef.x,
      this.playerRef.y
    );

    // Determine which direction to shoot based on player position
    const shootDirection = this.playerRef.x < this.x ? -1 : 1;

    // Shoot if player is in range and cooldown is ready
    if (distance < this.detectionRange && this.shootTimer >= this.shootCooldown) {
      this.shoot(bullets, shootDirection);
      this.shootTimer = 0;
    }
  }

  private shoot(bullets: Phaser.GameObjects.Group, shootDirection: number): void {
    // Play attack animation
    this.play('trunk-attack');

    // Create bullet after a small delay (animation timing)
    this.scene.time.delayedCall(300, () => {
      if (!this.active) return; // Check if trunk still exists
      
      const bullet = bullets.get() as TrunkBullet;
      if (bullet) {
        const offsetX = shootDirection === -1 ? -30 : 30;
        bullet.fire(this.x + offsetX, this.y, shootDirection);
      }

      // Return to idle
      this.once('animationcomplete', () => {
        if (this.active) { // Check if trunk still exists before playing animation
          this.play('trunk-idle');
        }
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


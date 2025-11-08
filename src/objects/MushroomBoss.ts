import Phaser from 'phaser';

export class MushroomBoss extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 60;
  private direction: number = 1; // 1 for right, -1 for left
  private groundLayer: Phaser.Tilemaps.TilemapLayer;
  private health: number = 10; // Boss has 10 health
  private isAttacking: boolean = false;
  private attackTimer: number = 0;
  private attackCooldown: number = 2000; // 2 seconds between attacks
  private jumpTimer: number = 0;
  private jumpCooldown: number = 5000; // Jump every 5 seconds
  private canJump: boolean = true;
  private lastDirectionChangeTime: number = 0;
  private directionChangeCooldown: number = 500; // Wait 500ms before changing direction again
  private playerRef: Phaser.Physics.Arcade.Sprite | null = null;
  private bulletsGroup: Phaser.GameObjects.Group | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    groundLayer: Phaser.Tilemaps.TilemapLayer
  ) {
    super(scene, x, y, 'mushroom-idle');

    this.groundLayer = groundLayer;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup physics - 4x larger than normal enemies
    this.setScale(4);
    this.setCollideWorldBounds(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setSize(24, 24);
    body.setOffset(4, 8);

    // Create animations if they don't exist
    this.createAnimations();

    // Start idle animation
    this.play('mushroom-idle');
  }

  private createAnimations(): void {
    // Idle animation
    if (!this.scene.anims.exists('mushroom-idle')) {
      this.scene.anims.create({
        key: 'mushroom-idle',
        frames: this.scene.anims.generateFrameNumbers('mushroom-idle', {
          start: 0,
          end: 13,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Run animation
    if (!this.scene.anims.exists('mushroom-run')) {
      this.scene.anims.create({
        key: 'mushroom-run',
        frames: this.scene.anims.generateFrameNumbers('mushroom-run', {
          start: 0,
          end: 15,
        }),
        frameRate: 15,
        repeat: -1,
      });
    }

    // Hit animation
    if (!this.scene.anims.exists('mushroom-hit')) {
      this.scene.anims.create({
        key: 'mushroom-hit',
        frames: this.scene.anims.generateFrameNumbers('mushroom-hit', {
          start: 0,
          end: 4,
        }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }

  update(time: number, delta: number): void {
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Only move if on ground
    if (!body.blocked.down) {
      // If falling, stop horizontal movement
      body.setVelocityX(0);
      return;
    }

    // Update timers
    this.attackTimer += delta;
    this.jumpTimer += delta;
    this.lastDirectionChangeTime += delta;

    // Check for edges BEFORE moving (raycast down in front) - boss is 4x larger, needs more distance
    const checkDistance = 80; // Much further ahead for large boss
    const checkX = this.direction === 1 ? this.x + checkDistance : this.x - checkDistance;
    const checkY = this.y + 60; // Check well below the large boss

    const tile = this.groundLayer.getTileAtWorldXY(checkX, checkY);

    // If no tile ahead (edge detected), turn around - with cooldown to prevent flickering
    if ((!tile || tile.index <= 0) && this.lastDirectionChangeTime > this.directionChangeCooldown) {
      this.direction *= -1;
      this.lastDirectionChangeTime = 0;
    }

    // Check for walls - with cooldown
    if (this.lastDirectionChangeTime > this.directionChangeCooldown) {
      if (body.blocked.right && this.direction === 1) {
        this.direction = -1;
        this.lastDirectionChangeTime = 0;
      } else if (body.blocked.left && this.direction === -1) {
        this.direction = 1;
        this.lastDirectionChangeTime = 0;
      }
    }

    // Patrol movement (faster when attacking)
    const currentSpeed = this.isAttacking ? this.speed * 2 : this.speed;
    body.setVelocityX(currentSpeed * this.direction);

    // Flip sprite based on direction
    this.setFlipX(this.direction === 1);

    // Play appropriate animation
    if (Math.abs(body.velocity.x) > 0 && body.blocked.down) {
      if (this.anims.currentAnim?.key !== 'mushroom-run' && !this.isAttacking) {
        this.play('mushroom-run');
      }
    } else if (!this.isAttacking) {
      if (this.anims.currentAnim?.key !== 'mushroom-idle') {
        this.play('mushroom-idle');
      }
    }

    // Special attack: Shoot bullets every 2 seconds
    if (this.attackTimer >= this.attackCooldown) {
      this.shootBullet();
      this.attackTimer = 0;
    }

  private shootBullet(): void {
    if (!this.bulletsGroup) return;

    // Aim generally at player with some randomness
    let shootDirection = this.direction; // Default to facing direction
    
    if (this.playerRef && this.playerRef.active) {
      // Calculate angle to player
      const dx = this.playerRef.x - this.x;
      const randomOffset = (Math.random() - 0.5) * 60; // Random offset to make it less accurate
      
      if (dx + randomOffset > 0) {
        shootDirection = 1;
      } else {
        shootDirection = -1;
      }
    }

    // Create bullet sprite
    const bullet = this.scene.add.sprite(
      this.x + (shootDirection === 1 ? 40 : -40),
      this.y,
      'spike' // Reuse spike sprite as bullet
    );
    bullet.setScale(0.8);
    
    // Add physics
    this.scene.physics.add.existing(bullet);
    const bulletBody = bullet.body as Phaser.Physics.Arcade.Body;
    bulletBody.setAllowGravity(false);
    bulletBody.setVelocityX(200 * shootDirection);
    
    // Add to group
    this.bulletsGroup.add(bullet);
    
    // Auto-destroy after 5 seconds
    this.scene.time.delayedCall(5000, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }

  takeDamage(): void {
    if (!this.active) return;

    this.health--;

    // Flash effect
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    // Emit event for UI
    this.scene.events.emit('bossHealthChanged', this.health, 10);

    if (this.health <= 0) {
      this.defeat();
    }
  }

  private defeat(): void {
    // Play hit animation and destroy
    this.play('mushroom-hit');
    this.setVelocity(0, -300);

    // Emit boss defeated event
    this.scene.events.emit('bossDefeated');

    this.once('animationcomplete', () => {
      this.destroy();
    });
  }

  getHealth(): number {
    return this.health;
  }
}


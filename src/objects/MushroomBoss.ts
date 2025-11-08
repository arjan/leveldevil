import Phaser from 'phaser';

export class MushroomBoss extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 60;
  private direction: number = 1; // 1 for right, -1 for left
  private groundLayer: Phaser.Tilemaps.TilemapLayer;
  private health: number = 10; // Boss has 10 health
  private isAttacking: boolean = false;
  private attackTimer: number = 0;
  private attackCooldown: number = 3000; // 3 seconds between attacks
  private jumpTimer: number = 0;
  private jumpCooldown: number = 5000; // Jump every 5 seconds
  private canJump: boolean = true;

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

    // Check for edges BEFORE moving (raycast down in front) - boss is 4x larger, needs more distance
    const checkDistance = 80; // Much further ahead for large boss
    const checkX = this.direction === 1 ? this.x + checkDistance : this.x - checkDistance;
    const checkY = this.y + 60; // Check well below the large boss

    const tile = this.groundLayer.getTileAtWorldXY(checkX, checkY);

    // If no tile ahead (edge detected), turn around and don't move
    if (!tile || tile.index <= 0) {
      this.direction *= -1;
      body.setVelocityX(0);
      return; // Don't move this frame
    }

    // Check for walls
    if (body.blocked.right && this.direction === 1) {
      this.direction = -1;
      body.setVelocityX(0);
      return;
    } else if (body.blocked.left && this.direction === -1) {
      this.direction = 1;
      body.setVelocityX(0);
      return;
    }

    // Safe to move - patrol movement (faster when attacking)
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

    // Special attack: Speed boost every 3 seconds
    if (this.attackTimer >= this.attackCooldown) {
      this.isAttacking = true;
      this.attackTimer = 0;
      
      // Speed boost for 1 second
      this.scene.time.delayedCall(1000, () => {
        this.isAttacking = false;
      });
    }

    // Special ability: Jump every 5 seconds
    if (this.jumpTimer >= this.jumpCooldown && this.canJump && body.blocked.down) {
      body.setVelocityY(-400); // Jump
      this.jumpTimer = 0;
      this.canJump = false;
      
      // Can jump again after landing
      this.scene.time.delayedCall(1000, () => {
        this.canJump = true;
      });
    }
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


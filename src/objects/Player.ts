import Phaser from 'phaser';

interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  // Movement constants
  private readonly SPEED = 200;
  private readonly JUMP_VELOCITY = -500; // Increased from -450
  private readonly COYOTE_TIME = 80; // ms
  private readonly JUMP_BUFFER_TIME = 100; // ms

  // State tracking
  private coyoteTimeCounter = 0;
  private jumpBufferCounter = 0;
  private isJumping = false;
  private jumpPressTime = 0;
  private readonly MIN_JUMP_TIME = 100; // Minimum time for short hop
  private readonly MAX_JUMP_TIME = 300; // Maximum time for full jump

  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, 'player-idle');

    // Add to scene
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    // Setup physics body
    this.body!.setSize(20, 28);
    this.body!.setOffset(6, 4);
    this.setCollideWorldBounds(true);

    // Setup input
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Create animations
    this.createAnimations();
  }

  private createAnimations(): void {
    // Idle animation
    if (!this.scene.anims.exists('player-idle-anim')) {
      this.scene.anims.create({
        key: 'player-idle-anim',
        frames: this.scene.anims.generateFrameNumbers('player-idle', { start: 0, end: 10 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Run animation
    if (!this.scene.anims.exists('player-run-anim')) {
      this.scene.anims.create({
        key: 'player-run-anim',
        frames: this.scene.anims.generateFrameNumbers('player-run', { start: 0, end: 11 }),
        frameRate: 15,
        repeat: -1,
      });
    }

    // Jump animation
    if (!this.scene.anims.exists('player-jump-anim')) {
      this.scene.anims.create({
        key: 'player-jump-anim',
        frames: this.scene.anims.generateFrameNumbers('player-jump', { start: 0, end: 0 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    // Fall animation
    if (!this.scene.anims.exists('player-fall-anim')) {
      this.scene.anims.create({
        key: 'player-fall-anim',
        frames: this.scene.anims.generateFrameNumbers('player-fall', { start: 0, end: 0 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    // Start with idle
    this.play('player-idle-anim');
  }

  update(time: number, delta: number): void {
    if (!this.body) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    // Get virtual controls from UIScene if available
    const uiScene = this.scene.scene.get('UIScene') as any;
    const virtualLeft = uiScene?.virtualLeft || false;
    const virtualRight = uiScene?.virtualRight || false;
    const virtualJump = uiScene?.virtualJump || false;

    // Update coyote time
    if (onGround) {
      this.coyoteTimeCounter = this.COYOTE_TIME;
    } else {
      this.coyoteTimeCounter -= delta;
    }

    // Update jump buffer (keyboard or virtual controls)
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      (virtualJump && this.jumpBufferCounter <= 0); // Virtual jump triggers buffer

    if (jumpPressed) {
      this.jumpBufferCounter = this.JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferCounter -= delta;
    }

    // Handle horizontal movement (keyboard or virtual controls)
    const left = this.cursors.left?.isDown || this.wasd.left.isDown || virtualLeft;
    const right = this.cursors.right?.isDown || this.wasd.right.isDown || virtualRight;

    if (left) {
      body.setVelocityX(-this.SPEED);
      this.setFlipX(true);
    } else if (right) {
      body.setVelocityX(this.SPEED);
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // Handle jump with coyote time and jump buffer
    const canJump = this.coyoteTimeCounter > 0;
    const wantsToJump = this.jumpBufferCounter > 0;

    if (canJump && wantsToJump && !this.isJumping) {
      body.setVelocityY(this.JUMP_VELOCITY);
      this.isJumping = true;
      this.jumpPressTime = time;
      this.jumpBufferCounter = 0;
      this.coyoteTimeCounter = 0;
    }

    // Variable jump height (keyboard or virtual controls)
    const jumpHeld =
      this.cursors.up?.isDown ||
      this.cursors.space?.isDown ||
      this.wasd.up.isDown ||
      virtualJump;

    if (this.isJumping) {
      const jumpDuration = time - this.jumpPressTime;

      // If player releases jump early or exceeds min time, reduce upward velocity
      if (!jumpHeld && jumpDuration > this.MIN_JUMP_TIME) {
        if (body.velocity.y < 0) {
          body.setVelocityY(body.velocity.y * 0.5);
        }
        this.isJumping = false;
      }

      // End jump after max time
      if (jumpDuration > this.MAX_JUMP_TIME) {
        this.isJumping = false;
      }
    }

    // Reset jump when landing
    if (onGround) {
      this.isJumping = false;
    }

    // Update animation
    this.updateAnimation(body, onGround);
  }

  private updateAnimation(body: Phaser.Physics.Arcade.Body, onGround: boolean): void {
    if (!onGround) {
      if (body.velocity.y < 0) {
        this.play('player-jump-anim', true);
      } else {
        this.play('player-fall-anim', true);
      }
    } else if (Math.abs(body.velocity.x) > 0) {
      this.play('player-run-anim', true);
    } else {
      this.play('player-idle-anim', true);
    }
  }

  getSpawnPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.isJumping = false;
    this.coyoteTimeCounter = 0;
    this.jumpBufferCounter = 0;
  }
}


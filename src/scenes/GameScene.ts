import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Slime } from '../objects/Slime';
import { Trunk, TrunkBullet } from '../objects/Trunk';

export class GameScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private hiddenLayer!: Phaser.Tilemaps.TilemapLayer;
  private spikesLayer!: Phaser.Tilemaps.TilemapLayer;
  private player!: Player;
  private spawnPoint!: { x: number; y: number };
  private isDead: boolean = false;
  private health: number = 3;
  private maxHealth: number = 3;
  private isInvulnerable: boolean = false;
  private currentLevel: number = 1;
  private debugInvincible: boolean = false;
  private levelCompleted: boolean = false;
  private slimes: Phaser.GameObjects.Group;
  private trunks: Phaser.GameObjects.Group;
  private bullets: Phaser.GameObjects.Group;
  private spikes: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Get current level from registry
    this.currentLevel = this.registry.get('currentLevel') || 1;

    // Reset level completion flag
    this.levelCompleted = false;

    // Get max health from registry (increases with level completion)
    this.maxHealth = this.registry.get('maxHealth') || 3;
    this.health = this.maxHealth; // Start each level with full health

    // Create tilemap for current level
    this.map = this.make.tilemap({ key: `level${this.currentLevel}` });
    const tileset = this.map.addTilesetImage('tileset', 'terrain-tileset');

    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }

    // Get background name from map properties
    let backgroundName = 'Blue'; // Default
    if (this.map.properties) {
      const bgProp = this.map.properties.find((p: any) => p.name === 'background');
      if (bgProp) {
        backgroundName = bgProp.value;
      }
    }

    // Add tiled background that repeats
    const bgKey = `background-${backgroundName}`;
    const bgWidth = this.cameras.main.width * 3;
    const bgHeight = this.cameras.main.height * 3;
    const bg = this.add.tileSprite(0, 0, bgWidth, bgHeight, bgKey);
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0.3); // Parallax effect
    bg.setDepth(-1);

    // Create layers
    this.groundLayer = this.map.createLayer('Ground', tileset)!;
    const groundTiles = new Set<number>();
    this.groundLayer.forEachTile(tile => {
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
    this.spikesLayer.setVisible(false); // Hide the tile layer, we'll use sprites instead

    // Create spike sprites group
    this.spikes = this.add.group();

    // Convert spike tiles to sprites
    this.spikesLayer.forEachTile(tile => {
      if (tile.index > 0) {
        // Create spike sprite at tile position
        const spike = this.add.sprite(tile.x * 16 + 8, tile.y * 16 + 8, 'spike', 0);
        spike.setOrigin(0.5, 0.5);
        this.physics.add.existing(spike, true); // Static body
        this.spikes.add(spike);
      }
    });

    // Set world bounds to match map size
    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;

    // Get player spawn point from object layer
    const spawns = this.map.getObjectLayer('Spawns');
    const spawnObj = spawns?.objects.find(obj => obj.name === 'PlayerSpawn');

    if (spawnObj) {
      // Spawn at the center of the spawn object
      this.spawnPoint = {
        x: spawnObj.x! + spawnObj.width! / 2,
        y: spawnObj.y! + spawnObj.height! / 2,
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

    // Create slimes group
    this.slimes = this.add.group({
      classType: Slime,
      runChildUpdate: true,
    });

    // Create trunks group
    this.trunks = this.add.group({
      classType: Trunk,
      runChildUpdate: false, // We'll update manually
    });

    // Create bullets group
    this.bullets = this.add.group({
      classType: TrunkBullet,
      maxSize: 20,
      runChildUpdate: false,
    });

    // Spawn enemies from object layer
    this.spawnSlimes();
    this.spawnTrunks();

    // Setup collisions
    this.physics.add.collider(this.player, this.groundLayer);
    this.physics.add.collider(this.player, this.hiddenLayer);

    // Slime collisions
    this.physics.add.collider(this.slimes, this.groundLayer);
    this.physics.add.collider(this.slimes, this.hiddenLayer);

    // Player hits slime from above
    this.physics.add.overlap(
      this.player,
      this.slimes,
      (player, slime) => {
        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const slimeSprite = slime as Slime;

        // If player is falling and hits from above
        if (playerBody.velocity.y > 0 && player.y < slime.y) {
          // Bounce player
          playerBody.setVelocityY(-300);
          // Destroy slime
          slimeSprite.hit();
        } else {
          // Player gets hurt
          if (!this.isDead) {
            this.takeDamage();
          }
        }
      },
      undefined,
      this
    );

    // Trunk collisions
    this.physics.add.collider(this.trunks, this.groundLayer);
    this.physics.add.collider(this.trunks, this.hiddenLayer);

    // Player hits trunk from above
    this.physics.add.overlap(
      this.player,
      this.trunks,
      (player, trunk) => {
        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const trunkSprite = trunk as Trunk;

        // If player is falling and hits from above
        if (playerBody.velocity.y > 0 && player.y < trunk.y) {
          // Bounce player
          playerBody.setVelocityY(-300);
          // Destroy trunk
          trunkSprite.hit();
        } else {
          // Player gets hurt
          if (!this.isDead) {
            this.takeDamage();
          }
        }
      },
      undefined,
      this
    );

    // Bullet collisions
    this.physics.add.collider(this.bullets, this.groundLayer, bullet => {
      bullet.destroy();
    });

    this.physics.add.overlap(
      this.player,
      this.bullets,
      (player, bullet) => {
        bullet.destroy();
        if (!this.isDead) {
          this.takeDamage();
        }
      },
      undefined,
      this
    );

    // Spike collision with death callback
    this.physics.add.overlap(
      this.player,
      this.spikes,
      (player, spike) => {
        if (!this.isInvulnerable && !this.isDead) {
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

  private spawnSlimes(): void {
    const enemiesLayer = this.map.getObjectLayer('Enemies');
    if (!enemiesLayer) return;

    enemiesLayer.objects.forEach(enemyObj => {
      if (enemyObj.type === 'slime' || enemyObj.name === 'Slime') {
        const slime = new Slime(
          this,
          enemyObj.x! + (enemyObj.width || 0) / 2,
          enemyObj.y! + (enemyObj.height || 0) / 2,
          this.groundLayer
        );
        this.slimes.add(slime);
      }
    });
  }

  private spawnTrunks(): void {
    const enemiesLayer = this.map.getObjectLayer('Enemies');
    if (!enemiesLayer) return;

    enemiesLayer.objects.forEach(enemyObj => {
      if (enemyObj.type === 'trunk' || enemyObj.name === 'Trunk') {
        // Direction from custom property or default to left (-1)
        const direction = (enemyObj.properties as any)?.direction || -1;

        const trunk = new Trunk(
          this,
          enemyObj.x! + (enemyObj.width || 0) / 2,
          enemyObj.y! + (enemyObj.height || 0) / 2,
          this.groundLayer,
          direction
        );
        trunk.setPlayer(this.player);
        this.trunks.add(trunk);
      }
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
            this.hiddenLayer.forEachTile(tile => {
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
        goalGraphics.lineStyle(4, 0xffd700);
        goalGraphics.fillStyle(0xffff00, 0.5);
        goalGraphics.fillRect(goalX, goalY, goalWidth, goalHeight);
        goalGraphics.strokeRect(goalX, goalY, goalWidth, goalHeight);

        // Add vertical stripes for extra visibility
        goalGraphics.lineStyle(2, 0xffd700, 0.7);
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
      // Increase max health (up to 10)
      if (this.maxHealth < 10) {
        this.maxHealth++;
        this.registry.set('maxHealth', this.maxHealth);

        // Save to localStorage
        localStorage.setItem('leveldevil_maxHealth', this.maxHealth.toString());

        // Show notification
        console.log(`Max health increased to ${this.maxHealth}!`);
      }

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

    // Update trunks manually
    this.trunks.children.each(trunk => {
      const trunkSprite = trunk as Trunk;
      if (trunkSprite.active) {
        trunkSprite.update(time, delta, this.bullets);
      }
      return true;
    });
  }

  takeDamage(): void {
    if (this.isInvulnerable || this.debugInvincible) return;

    this.health--;
    this.game.events.emit('healthChanged', this.health, this.maxHealth);

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
        },
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

    // Respawn player
    this.time.delayedCall(1000, () => {
      if (this.player) {
        this.health = this.maxHealth; // Reset to max health
        this.game.events.emit('healthChanged', this.health, this.maxHealth);
        this.player.respawn(this.spawnPoint.x, this.spawnPoint.y);
        this.isDead = false;
        this.isInvulnerable = false;
        this.player.setAlpha(1);
      }
    });
  }
}

import 'phaser';
import { Body } from 'matter-js';
import { MultiKey } from '../../utils/multi-key.class';
import { playerConfig } from './player.const';

export class PlayerObject {

    /** @description
     * the plyer sprite object.
     */
    public sprite: Phaser.Physics.Matter.Sprite;

    /** @description
     * 'sensors' / MatterJS.Body serounding the sprite object to trace collisions.
     */
    public sensors: { bottom: Body, left: Body, right: Body, top: Body };

    /** @description
     * flags for player body touching the serounding,
     * communication between collisions events listening to updating the sprite.
     */
    private isTouching = { left: false, right: false, ground: false };

    // ...
    private isDestroyed = false;

    /** @description
     * keys using to control the player sprite.
     */
    private keys: { leftInput: MultiKey; rightInput: MultiKey; jumpInput: MultiKey; runInput: MultiKey };

    /** @description
     * 'canJump' flag is the sprite can jump.
     */
    private canJump: boolean;

    /** @description
     * 'jumpCooldownTimer' event object, set the 'canJump' flag to true after 
     * a delay from the last jump action.
     */
    private jumpCooldownTimer: Phaser.Time.TimerEvent;

    constructor(private scene: Phaser.Scene, options: PlayerObjectOptions) {
        const { spriteKey, x, y, depth } = options;

        // Create the physics-based sprite that we will move around and animate
        this.setupSprite(spriteKey, x, y);
        this.setSpriteAnims(this.scene, spriteKey);

        depth ? this.sprite.setDepth(depth) : undefined;
        this.initKeysInput();

        this.canJump = true;
        this.listenToCollisionEvents();
        this.scene.events.on("update", this.update, this);
        this.scene.events.once("shutdown", this.destroy, this);
        this.scene.events.once("destroy", this.destroy, this);
    }

    // #region - Basic Public Player Methods -

    public update() {
        if (this.isDestroyed) {
            return;
        }
        const sprite = this.sprite;
        const velocity = sprite.body['velocity'];
        const isPlayerOnGround = this.isTouching.ground;
        const isRunning = this.keys.runInput.isDown();

        const moveForce =
            (isRunning && isPlayerOnGround) ? (playerConfig.BASIC_MOVE_FORCE) * 2 : // whan runnig make moving ligther
                (!isPlayerOnGround ? playerConfig.BASIC_MOVE_FORCE * 0.2 : // on the air make moving heavier
                    playerConfig.BASIC_MOVE_FORCE); // on the ground & not running move normal

        if (this.keys.leftInput.isDown()) {
            const animsKey = isPlayerOnGround ? 'move-left' : 'pose-left'
            sprite.anims.play(animsKey, true);
            sprite.setFlipX(true);

            sprite.applyForce({ x: -moveForce, y: 0 } as Phaser.Math.Vector2);

        } else if (this.keys.rightInput.isDown()) {
            const animsKey = isPlayerOnGround ? 'move-right' : 'pose-right'
            sprite.anims.play(animsKey, true);
            sprite.setFlipX(true);

            sprite.applyForce({ x: moveForce, y: 0 } as Phaser.Math.Vector2);

        } else if (isPlayerOnGround) { // if doing noting on the ground
            sprite.setVelocityX(0);
            sprite.anims.play('turn', true);
        }

        if (this.keys.jumpInput.isDown() && isPlayerOnGround && this.canJump) {
            sprite.setVelocityY(-playerConfig.JUMP_VERTICAL_VELOCITY);
            this.canJump = false;
            this.jumpCooldownTimer = this.scene.time.addEvent({
                delay: playerConfig.DELAY_MS_BETWEEN_JUMPS,
                callback: () => (this.canJump = true)
            });
        }

        // limit horizontal speed
        if (velocity.x > playerConfig.THRESHOLD_HORIZONTAL_VELOCITY) {
            sprite.setVelocityX(playerConfig.THRESHOLD_HORIZONTAL_VELOCITY);
        }
        else if (velocity.x < -playerConfig.THRESHOLD_HORIZONTAL_VELOCITY) {
            sprite.setVelocityX(-playerConfig.THRESHOLD_HORIZONTAL_VELOCITY);
        }
    }

    public destroy() {
        if (this.scene.matter.world) {
            this.scene.matter.world.off("beforeupdate", this.resetTuching, this, false);
            // this.scene.matter.world.off("collisionstart", this.handlePlayerCollision, this, false);
            // this.scene.matter.world.off("collisionactive", this.handlePlayerCollision, this, false);
        }

        if (this.jumpCooldownTimer) {
            this.jumpCooldownTimer.destroy()
        };

        this.scene.events.off("update", this.update, this, false);
        this.scene.events.off("shutdown", this.destroy, this, false);
        this.scene.events.off("destroy", this.destroy, this, false);

        this.isDestroyed = true;
        this.sprite.destroy();
    }

    public freeze() {
        this.sprite.setStatic(true);
    }

    public isSensor(body) {
        return body === this.sensors.top
            || body === this.sensors.bottom
            || body === this.sensors.left
            || body === this.sensors.right;
    }

    // #endregion


    private initKeysInput() {
        const { LEFT, RIGHT, UP, A, D, W, SHIFT } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = {
            leftInput: new MultiKey(this.scene, [LEFT, A]),
            rightInput: new MultiKey(this.scene, [RIGHT, D]),
            jumpInput: new MultiKey(this.scene, [UP, W]),
            runInput: new MultiKey(this.scene, [SHIFT])
        }
    }

    private setupSprite(spriteKey: string, x: number, y: number) {
        this.sprite = this.scene.matter.add.sprite(0, 0, spriteKey, 0);

        const { width, height } = this.sprite;
        const compoundBody = this.createSpriteBody(width, height);
        this.sprite.setExistingBody(compoundBody);
        this.sprite.setFixedRotation(); // Sets inertia to infinity so the player can't rotate
        this.sprite.setPosition(x, y);
        // this.sprite.setBounce(0.2);
    }

    private createSpriteBody(width: number, height: number): MatterJS.Body {
        // Native Matter modules, Matter.Body Matter.Bodies fail type checking 
        const { Bodies, Body } = Phaser.Physics.Matter['Matter'];
        const mainBody = Bodies.rectangle(0, 0, width * 0.7, height * 0.9, { chamfer: { radius: 10 } });
        this.sensors = {
            bottom: Bodies.rectangle(0, height * 0.45, width * 0.25, 2, { isSensor: true }),
            top: Bodies.rectangle(0, -height * 0.45, width * 0.5, 2, { isSensor: true }),
            left: Bodies.rectangle(-width * 0.35, 0, 2, height * 0.75, { isSensor: true }),
            right: Bodies.rectangle(width * 0.35, 0, 2, height * 0.75, { isSensor: true }),
        };


        const compoundBody: MatterJS.Body = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.top, this.sensors.right],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.2
        });
        return compoundBody;

    }

    private setSpriteAnims(scene: Phaser.Scene, spriteKey: string) {
        scene.anims.create({
            key: 'move-right',
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'pose-right',
            frames: [{ key: spriteKey, frame: 1 }],
            frameRate: 10
        });

        scene.anims.create({
            key: 'turn',
            frames: [{ key: spriteKey, frame: 4 }],
            frameRate: 10
        });

        scene.anims.create({
            key: 'move-left',
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        scene.anims.create({
            key: 'pose-left',
            frames: [{ key: spriteKey, frame: 6 }],
            frameRate: 10
        });
    }


    private listenToCollisionEvents() {
        // reset this isTouching flags before any collision event.
        this.scene.matter.world.on("beforeupdate", this.resetTuching, this);
        this.scene.matter.world.on("collisionstart", this.handlePlayerCollision, this);
        this.scene.matter.world.on("collisionactive", this.handlePlayerCollision, this);

    }

    private resetTuching() {
        this.isTouching.ground = false;
        this.isTouching.left = false;
        this.isTouching.right = false;
    }

    private handlePlayerCollision(event) {

        const isBodyMatterTileBody = (body) => {
            return body.gameObject &&
                body.gameObject instanceof Phaser.Physics.Matter.TileBody;
        }

        const isBodySensor = (body) => {
            return body === this.sensors.bottom ||
                body === this.sensors.left ||
                body === this.sensors.right;
        }

        const orderBodies: (bodyA: Body, bodyB: Body) => { playerBody: Body, otherBody: Body } = (bodyA, bodyB) => {
            return isBodySensor(bodyA) ? { playerBody: bodyA, otherBody: bodyB } :
                (isBodySensor(bodyB) ? { playerBody: bodyB, otherBody: bodyA } : undefined)

        }

        const traceGroundTouch = (playerBody, otherBody, pair) => {
            const playerLegs = playerBody == this.sensors.bottom;
            const isTouchGround = isBodyMatterTileBody(otherBody);

            if (playerLegs && isTouchGround) {
                this.isTouching.ground = true;
            }
        }

        const traceSidesTouch = (playerBody, otherBody, pair) => {
            if (playerBody == this.sensors.left && isBodyMatterTileBody(otherBody)) {
                this.isTouching.left = true;
                if (pair.separation > 0.5) {
                    this.sprite.x += pair.separation - 0.5;
                }
            } else if (playerBody == this.sensors.right && isBodyMatterTileBody(otherBody)) {
                this.isTouching.right = true;
                if (pair.separation > 0.5) {
                    this.sprite.x -= pair.separation - 0.5;
                }
            }
        }

        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            const bodies = orderBodies(bodyA, bodyB);
            if (!bodies) {
                return;
            }

            const { playerBody, otherBody } = bodies;
            traceGroundTouch(playerBody, otherBody, pair);
            traceSidesTouch(playerBody, otherBody, pair);
        });
    }

}

interface PlayerObjectOptions {
    spriteKey: string, 
    x: number, 
    y: number,
    depth?: number
}
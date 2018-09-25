
import {diamondConfig} from './diamond.const';
const { Bodies, Body } = Phaser.Physics.Matter['Matter'];

export class DiamondObject {
    
    public sprite: Phaser.Physics.Matter.Sprite
    // private coinValue: number;
    private isCollected: boolean;
    
    constructor(private scene: Phaser.Scene, x: number, y: number) {

        this.setupSprite(x, y);
        this.sprite.setData('gameObjectNameId', diamondConfig.GAME_OBJECT_NAME_ID);

        this.setSpriteAnims(this.scene);
        this.sprite.anims.play(diamondConfig.ANIMS_KEY);
        this.isCollected = false;


        this.scene.events.on("shutdown", this.destroy, this);
        this.scene.events.on("destroy", this.destroy, this);
        
    }


    public setupSprite(x, y) {
        this.sprite = this.scene.matter.add.sprite(0, 0, diamondConfig.SPRITE_KEY, 0);
        const mainBody = Bodies.circle(0,0, diamondConfig.COINֹֹ_BODY_DIAMETER , {
            restitution: 0.001,
            friction: 0,
        });
        this.sprite.setExistingBody(mainBody);
        this.sprite.setPosition(x, y);
        this.sprite.setStatic(true);
        this.sprite.setIgnoreGravity(true);
    }

    public destroy() {
        this.scene.events.off("shutdown", this.destroy, this, false);
        this.scene.events.off("destroy", this.destroy, this, false);
        this.sprite.destroy();
    }


    public collectDiamon(){
        if(!this.isCollected) {
            this.isCollected = true;
            // this.sprite.setVisible(false);
            this.sprite.destroy();
        }
    }

    private setSpriteAnims(scene: Phaser.Scene) {
        const spriteKey = diamondConfig.SPRITE_KEY;
        
        scene.anims.create({
            key: diamondConfig.ANIMS_KEY,
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 11 }),
            frameRate: 15,
            repeat: -1,
            repeatDelay: 1500
        });
    }

}
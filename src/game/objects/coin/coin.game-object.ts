
import {coinConfig} from './coin.const';
const { Bodies, Body } = Phaser.Physics.Matter['Matter'];

export class CoinObject {
    
    public sprite: Phaser.Physics.Matter.Sprite
    private coinValue: number;
    private isCollected: boolean;
    
    constructor(private scene: Phaser.Scene, x: number, y: number) {

        this.setupSprite(x, y);
        this.sprite.setData('gameObjectNameId', coinConfig.GAME_OBJECT_NAME_ID);

        this.setSpriteAnims(this.scene);
        this.sprite.anims.play(coinConfig.ANIMS_KEY);
        this.isCollected = false;
        this.coinValue = coinConfig.DEFAULT_COIN_VALUE;

        this.scene.events.on("shutdown", this.destroy, this);
        this.scene.events.on("destroy", this.destroy, this);
        
    }


    public setupSprite(x, y) {
        this.sprite = this.scene.matter.add.sprite(0, 0, coinConfig.SPRITE_KEY, 0);
        const mainBody = Bodies.circle(0,0, coinConfig.COINֹֹ_BODY_DIAMETER , {
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


    public collectCoin(){
        if(!this.isCollected) {
            this.isCollected = true;
            // this.sprite.setVisible(false);
            this.sprite.destroy();
        }
    }

    public getCoinValue() {
        return this.coinValue;
    }

    private setSpriteAnims(scene: Phaser.Scene) {
        const spriteKey = coinConfig.SPRITE_KEY;
        
        scene.anims.create({
            key: coinConfig.ANIMS_KEY,
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 7 }),
            frameRate: 15,
            repeat: -1
        });
    }

}
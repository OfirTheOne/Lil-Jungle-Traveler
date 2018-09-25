import 'phaser';
import { LevelConfig, TileLayerData, sceneConfig } from './main.const';
import { LoadingProgressBar } from './../utils/loading-progress-bar.class';
import { HotArea } from './../utils/hot-area.class';
import { PlayerObject } from './../objects/player/player.game-object';
import { CoinObject } from './../objects/coin/coin.game-object';
import { DiamondObject } from './../objects/diamond/diamond.game-object';

const MAIN_PLAYER_DEPTH = 1;

export class MainScene extends Phaser.Scene {

    private canRestartScene: boolean;
    private restartSceneTimer: Phaser.Time.TimerEvent;

    private gameLevel: number;
    private levelConfig: LevelConfig;

    private player: PlayerObject;
    private coins: CoinObject[] = [];
    private diamonds: DiamondObject[] = [];
    private score: { text: Phaser.GameObjects.Text, coinValue: number, diamondCount: number, }
    private finishPointArea: HotArea;

    private tileMap: Phaser.Tilemaps.Tilemap;

    private inFinishPointArea: boolean;
    private finishPointAreaSubscribtion: Function;

    constructor() {
        super({ key: "MainScene" });
        this.gameLevel = 1;
    }

    // #region - init ~ destroy -
    public init(data) {
        this.canRestartScene = false;
        this.restartSceneTimer = this.time.addEvent({
            delay: 1500,
            callback: () => {
                console.log('restartSceneTimer')
                this.canRestartScene = true;
            },
            callbackScope: this
        });

        this.inFinishPointArea = false;
        console.log('init', data)
        if (data && data.level) {
            this.gameLevel = data.level;
        }
        this.levelConfig = sceneConfig.LEVELS_CONFIG[this.gameLevel];

        this.events.off("shutdown", this.destroy, this, false);
        this.events.off("destroy", this.destroy, this, false);
    }

    private destroy() {
        if (this.restartSceneTimer) {
            this.restartSceneTimer.destroy();
            this.events.off("shutdown", this.destroy, this, false);
            this.events.off("destroy", this.destroy, this, false);
        }

        if (this.matter && this.matter.world) {
            this.matter.world.off('collisionstart', this.handlePlayerCollision, this, false);
            this.matter.world.off('collisionactive', this.handlePlayerCollision, this, false);
        }

        if(this.finishPointAreaSubscribtion) {
            this.finishPointAreaSubscribtion();
        }
    }
    // #endregion


    // #region - preload ~ create ~ update -

    public preload(): void {
        const levelConfig = this.levelConfig;
        new LoadingProgressBar(this, { barWidth: 320, barHeight: 50 }).init();
        this.load.image('tiles', 'assets/tilesets/Jungle_terrain.png');
        this.load.tilemapTiledJSON(levelConfig.TILED_MAP_LOAD_KEY, `assets/tilemaps/${levelConfig.TILED_MAP_JSON_FILE_NAME}.json`);
        this.load.spritesheet('dude', 'assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('coin', 'assets/sprites/coin.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('diamond', 'assets/sprites/diamond.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('stick-skull', 'assets/sprites/stick-skull.png', { frameWidth: 40, frameHeight: 63 });
    }

    public create(): void {
        const levelConfig = this.levelConfig;

        this.tileMap = this.make.tilemap({ key: levelConfig.TILED_MAP_LOAD_KEY });
        const tileset = this.tileMap.addTilesetImage('Jungle_terrain', 'tiles');
        this.handleTileLayers(tileset, levelConfig.TILED_TILES_LAYERS);

        this.setupGameObject();

        const insertPoint = this.tileMap.findObject(
            levelConfig.TILED_OBJECTS_LAYERS.OBJECTS.name,
            obj => (obj.name === levelConfig.TILED_OBJECTS_LAYERS.OBJECTS.objects.PLAYER_INSERTION_POINT.name)
        );
        this.player = new PlayerObject(this, {
            spriteKey: 'dude', x: insertPoint['x'], y: insertPoint['y'], depth: MAIN_PLAYER_DEPTH
        });

        const finishPoint = this.tileMap.findObject(
            levelConfig.TILED_OBJECTS_LAYERS.OBJECTS.name,
            obj => (obj.name === levelConfig.TILED_OBJECTS_LAYERS.OBJECTS.objects.LEVEL_FINISH_POINT.name)
        );

        this.setFinishPoint({ x: finishPoint['x'], y: finishPoint['y'] });
        this.scoreTextSetup({ initCoin: 0, initDiamond: 0 });
        this.cameraSetup(0, 0, this.tileMap.widthInPixels, this.tileMap.heightInPixels, this.player.sprite);
        this.matter.world.setBounds(0, 0, this.tileMap.widthInPixels, this.tileMap.heightInPixels);

        this.matter.world.on('collisionstart', this.handlePlayerCollision, this);
        this.matter.world.on('collisionactive', this.handlePlayerCollision, this);
        this.listenFinishPointAreaCollision();

        // this.matter.world.createDebugGraphic();
        // this.finishPointArea.setDebugGraphicArea();
    }

    public update(): void { }

    // #endregion


    // #region - gotoLevel ~ restartLevel ~ upLevel -
    private gotoLevel(level: number, data?: Object) {
        if (this.canRestartScene) {
            const sceneData = Object.assign(data || {}, { level });
            this.player.freeze();
            const cam = this.cameras.main;
            cam.fade(250, 0, 0, 0);
            cam.once("camerafadeoutcomplete", () => this.scene.restart(sceneData));
            this.canRestartScene = false;
        }
    }

    private restartLevel(data?: Object) {
        this.gotoLevel(this.gameLevel, data);
    }

    private upLevel(data?: Object) {
        this.gotoLevel(this.gameLevel + 1, data);
    }
    // #endregion


    // #region - score handling methods 
    private scoreTextSetup(initScoreValue: { initCoin: number, initDiamond: number }) {
        const scoreText = this.add.text(16, 16,
            `Coins: ${initScoreValue.initCoin} \n\nDiamonds: ${initScoreValue.initDiamond}`, {
                font: "18px monospace",
                fill: "#ffffff",
                padding: { x: 20, y: 10 },
                backgroundColor: "#000000"
            })
            .setScrollFactor(0);
        this.score = {
            text: scoreText,
            coinValue: initScoreValue.initCoin,
            diamondCount: initScoreValue.initDiamond,
        };
    }

    private incCoinScore(incValue) {
        const newCoinValue = this.score.coinValue + incValue;
        this.score.text.setText(`Coins: ${newCoinValue} \n\nDiamonds: ${this.score.diamondCount}`);
        this.score.coinValue = newCoinValue;
    }

    private incDiamondCount() {
        const newDiamondCount = this.score.diamondCount + 1;
        this.score.text.setText(`Coins: ${this.score.coinValue} \n\nDiamonds: ${newDiamondCount}`);
        this.score.diamondCount = newDiamondCount;
    }

    private resetScore() {
        this.score.text.setText(`Coins: 0} \n\nDiamonds: 0`);
        this.score.coinValue = 0;
        this.score.diamondCount = 0;
    }
    // #endregion


    private setupGameObject() {
        const levelConfig = this.levelConfig;
        const coinObjectLayer = this.tileMap.getObjectLayer(levelConfig.TILED_OBJECTS_LAYERS.COINS.name);
        coinObjectLayer.objects.forEach((coinObject) => {
            const coin = new CoinObject(this, coinObject['x'], coinObject['y']);
            this.coins.push(coin);
        });

        const diamondObjectLayer = this.tileMap.getObjectLayer(levelConfig.TILED_OBJECTS_LAYERS.DIAMONDS.name);
        diamondObjectLayer.objects.forEach((diamondObject) => {
            const diamond = new DiamondObject(this, diamondObject['x'], diamondObject['y']);
            this.diamonds.push(diamond);
        });
    }

    private setFinishPoint(point: { x: number, y: number }) {
        const { x, y } = point;
        const finishPointSprite = this.sys.add.sprite(x, y, 'stick-skull');
        const { width, height } = finishPointSprite;
        console.log(width, height);
        this.finishPointArea = new HotArea(this, point, { width, height });
    }


    private handleTileLayers(tileset: Phaser.Tilemaps.Tileset, layersData: TileLayerData[]) {
        layersData.forEach(layerData => {
            const layerName = layerData.name;
            const layerDepth = layerData.depth;
            const layerObj = this.tileMap.createStaticLayer(layerName, tileset, 0, 0);
            if (layerDepth) {
                layerObj.setDepth(layerDepth);
            }

            if (layerData.setCollision) {
                layerObj.setCollisionByProperty({ collides: true });
                this.matter.world.convertTilemapLayer(layerObj);
            }
        })

    }

    private cameraSetup(x: number, y: number, width: number, height: number, target: Phaser.GameObjects.GameObject) {
        const camera = this.cameras.main;
        camera.startFollow(target, false, 0.5, 0.5);
        camera.backgroundColor = new Phaser.Display.Color(153, 225, 255); // rgb(153, 225, 255) = sky color
        // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
        camera.setBounds(x, y, width, height);
    }

    private handlePlayerCollision(event) {

        const isBodyMatterTileBody = (body) => {
            return body.gameObject &&
                body.gameObject instanceof Phaser.Physics.Matter.TileBody;
        }

        const orderBodies: (bodyA: Matter.Body, bodyB: Matter.Body) =>
            { playerBody: Matter.Body, otherBody: Matter.Body } = (bodyA, bodyB) => {
                return this.player.isSensor(bodyA) ? { playerBody: bodyA, otherBody: bodyB } :
                    (this.player.isSensor(bodyB) ? { playerBody: bodyB, otherBody: bodyA } : undefined)
            }

        const traceLethalTouch = (playerBody, otherBody, pair) => {
            if (!isBodyMatterTileBody(otherBody)) {
                return;
            }
            const { tile } = otherBody.gameObject;
            if (tile.properties.isLethal) {
                this.restartLevel();
            }
        }
        const traceGameObjectTouch = (playerBody, otherBody, pair, gameObjectNameId) => {
            const gameObject = otherBody.gameObject;
            if (isBodyMatterTileBody(otherBody) || !gameObject) {
                return;
            }
            if (gameObject.getData('gameObjectNameId') == gameObjectNameId) {
                if (gameObjectNameId == 'coin') {
                    const coin = this.coins.find(coin => coin.sprite === gameObject);
                    coin.collectCoin();
                    this.incCoinScore(coin.getCoinValue());
                } else if (gameObjectNameId == 'diamond') {
                    const diamond = this.diamonds.find(diamond => diamond.sprite === gameObject);
                    diamond.collectDiamon();
                    this.incDiamondCount();
                }
            }
            // console.log(otherBody);
        }

        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            const bodies = orderBodies(bodyA, bodyB);
            if (!bodies) { return; }
            const { playerBody, otherBody } = bodies;

            if (this.inFinishPointArea) { return; }
            traceLethalTouch(playerBody, otherBody, pair);
            traceGameObjectTouch(playerBody, otherBody, pair, 'coin');
            traceGameObjectTouch(playerBody, otherBody, pair, 'diamond');
        });
    }

    private listenFinishPointAreaCollision() {
        this.finishPointAreaSubscribtion = this.finishPointArea.setCollisionOnAreaListiner(
            (bodyA, bodyB, event) => {
                if (this.player.isSensor(bodyA) || this.player.isSensor(bodyB)) {
                    this.inFinishPointArea = true;
                    this.resetScore();
                    this.upLevel(this.gameLevel + 1);
                }
            },this
        );
    }

}

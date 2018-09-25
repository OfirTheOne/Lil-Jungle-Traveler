
interface Point { x: number, y: number }
interface Segment { start: number; end: number; }

export class HotArea {
    /**
     * @public
     * @param scene: Phaser.Scene
     */

    public centerPoint: Point
    public width: number;
    public height: number;
    public xSegment: Segment;
    public ySegment: Segment;

    private listenerMap: Map<Function, {
        eventName: string,
        attachedContaxt: { proxyContaxt: any, innerCallback: Function, innerContaxt: any }
    }>;

    private debugAreaGraphics: Phaser.GameObjects.Graphics;

    constructor(private scene: Phaser.Scene, root: Point, { width, height }) {
        if (!this.validateParams(root, { width, height })) {
            throw 'invaide parameters for HotArea constructor';
        }
        this.centerPoint = root;
        this.width = width;
        this.height = height;
        this.xSegment = { start: (root.x - (width / 2)), end: (root.x + (width / 2)) };
        this.ySegment = { start: (root.y - (height / 2)), end: (root.y + (height / 2)) };

        this.init();
    }



    // #region - area calc methods - 
    public inArea(point: Point): boolean {
        return this.inXSegment(point.x) && this.inYSegment(point.y);
    }

    private inXSegment(x: number): boolean {
        return (this.xSegment.start <= x) && (x <= this.xSegment.end);
    }

    private inYSegment(y: number): boolean {
        return (this.ySegment.start <= y) && (y <= this.ySegment.end);
    }
    // #endregion


    // #region - validetion - 
    private validateParams(root: Point, { width, height }): boolean {
        return this.validatePositive(width)
            && this.validatePositive(height)
            && root != undefined && root !== null
            && this.validateNumber(root.x)
            && this.validateNumber(root.y);
    }
    private validateNumber(num: number): boolean {
        return num !== undefined && num !== null && typeof (num) == 'number';
    }
    private validatePositive(num: number): boolean {
        return this.validateNumber(num) && num > 0
    }
    // #endregion


    // #region - scene interaction methods - 

    private init() {
        this.scene.events.on('destroy', this.destroy, this);
        this.listenerMap = new Map();
    }

    private destroy() {
        if (this.debugAreaGraphics) {
            this.debugAreaGraphics.destroy();
        }
        this.unsubscribeAllCollisionListiner()
    }

    // #region - area collision methods - 
    public setCollisionOnAreaListiner(callback: Function, contaxt: any) {
        const matter = this.scene.matter;
        if (!matter || !matter.world) {
            console.log('no matther-js plugin');
            return;
        }
        const eventName = 'collisionstart';

        const proxyCallback = this.createProxyCallback();
        const attachedContaxt = { proxyContaxt: this, innerCallback: callback, innerContaxt: contaxt };
        this.listenerMap.set(proxyCallback, { eventName, attachedContaxt });

        const subscribtion = matter.world.on(eventName, proxyCallback, attachedContaxt);
        return (function () {
            subscribtion.off(eventName, proxyCallback, attachedContaxt, false);
            this.listinerMap.delete(proxyCallback);
        }).bind(this);
    }

    private createProxyCallback() {
        return function (event) {
            const collisionCallback = (this.innerCallback as Function)
            const { proxyContaxt, innerContaxt } = this;
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;

                if (bodyA && bodyA.position && proxyContaxt.inArea(bodyA.position)) {
                    collisionCallback.call(
                        innerContaxt,
                        [bodyA, bodyB, event]
                    )
                } else if (bodyB && bodyB.position && proxyContaxt.inArea(bodyB.position)) {
                    collisionCallback.call(
                        innerContaxt,
                        bodyA, bodyB, event
                    )
                }
            });
        }
    }

    private unsubscribeAllCollisionListiner() {
        if (this.scene.matter && this.scene.matter.world) {
            this.listenerMap.forEach((value, key, map) => {
                this.scene.matter.world.off(value.eventName, key, value.attachedContaxt, false);
            });
        }
    }

    // #endregion

    public setDebugGraphicArea() {
        this.debugAreaGraphics = this.scene.add.graphics();
        this.debugAreaGraphics
            .fillStyle(4, 0.5)
            .strokeRect(this.xSegment.start, this.ySegment.start, this.width, this.height);
    }

    // #endregion
}
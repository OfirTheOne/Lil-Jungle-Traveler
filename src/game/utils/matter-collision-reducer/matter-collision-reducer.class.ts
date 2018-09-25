import 'phaser';
import * as Matter from 'matter-js';
import { CollisionBody, isMatterBody, isMatterSprite, isMatterTileBody } from './type-guards';

const CollisionStart = 'collisionstart';
const CollisionActive = 'collisionactive';

export class MatterCollisionReducer {

    // events container
    private collisionEventHandler: Phaser.Events.EventEmitter;

    // used as uuid generator (events unique id generator)
    private dataGenerator: Phaser.Math.RandomDataGenerator;

    private map: Map<any[], {
        idCallback: Function,
        idContaxt: any,
        eventId: string,
        rootEvent: Phaser.Events.EventEmitter,
    }>

    constructor(private scene: Phaser.Scene) {
        this.collisionEventHandler = new Phaser.Events.EventEmitter();
        this.dataGenerator = new Phaser.Math.RandomDataGenerator();
        this.map = new Map();
    }


    public onCollisionStart(bodies: any[], callback: Function, contaxt: any) {
        return this.listenToCollision(CollisionStart, bodies, callback, contaxt);
    }

    public onCollisionActive(bodies: any[], callback: Function, contaxt: any) {
        return this.listenToCollision(CollisionActive, bodies, callback, contaxt);
    }


    private listenToCollision(collisionType: string, bodies: any[], callback: Function, contaxt: any) {

        if (!this.isCollisionEventExists(bodies)) {
           this.enrollNewCollisionListener(collisionType, bodies);
        }

        const entry = this.map.get(bodies)
        const { eventId } = entry;
        const subscription = this.collisionEventHandler.on(eventId, callback, contaxt);
        this.cleanEmptyEvents();

        return function () {
            subscription.off(eventId, callback, contaxt, false);
        }
    }

    private enrollNewCollisionListener(collisionType: string, bodies: any[]) {
        const eventId = this.createUniqueEventId();
        const idContaxt = {
            params: { bodies, eventId },
            trueContaxt: this
        }

        const idCallback: Function = function (event) {
            const mockContaxt: any = this;
            const { trueContaxt }: any = mockContaxt;
            const params: { bodies: any[], eventId: string } = mockContaxt.params;

            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;

                const orderedBodies: { firstBody: any, otherBody: any } =
                    identifyBody(bodyA, params.bodies) ? { firstBody: bodyA, otherBody: bodyB } :
                        (identifyBody(bodyB, params.bodies) ? { firstBody: bodyB, otherBody: bodyA } :
                            undefined);

                if (orderedBodies) {

                    const collisionEventHandler: Phaser.Events.EventEmitter = trueContaxt.collisionEventHandler;
                    collisionEventHandler.emit(eventId, {
                        firstBody: orderedBodies.firstBody,
                        otherBody: orderedBodies.otherBody,
                        pair,
                        event
                    });
                }

            });
        }

        const rootEvent = this.scene.matter.world.on(collisionType, idCallback, idContaxt);
        this.map.set(bodies, { idContaxt, idCallback, rootEvent, eventId });
    }


    private isCollisionEventExists(bodies: any[]) {
        return this.map.has(bodies);
    }

    private cleanEmptyEvents() {
        this.map.forEach((value, key, map) => {
            if (this.collisionEventHandler.listenerCount(value.eventId) == 0) {
                const { rootEvent, eventId, idCallback, idContaxt } = value;
                rootEvent.removeListener(eventId, idCallback, idContaxt, false);
                map.delete(key);
            }
        })
    }

    private createUniqueEventId(): string {
        return this.dataGenerator.uuid();
    }
}


/**
 * @description 
 *  if bodyA in targetBodies return     - { firstBody: bodyA, otherBody: bodyB }
 *  if bodyB in targetBodies return     - { firstBody: bodyB, otherBody: bodyB } 
 *  if none are in targetBodies return  - undefined
 * 
 * @param unknownBodies unknown / unidentify pair of bodies.
 * @param targetBodies array of bodies / search one of the unknown bodies in that array.
 */
function identifyBody(unknownBody: any, targetBodies: any[]): boolean {

    // let orderedBodies: { firstBody: Body, otherBody: Body };
    let isIdentify: boolean = false;
    for (let i = 0; i < targetBodies.length; i++) {
        const targetBody = targetBodies[i];
        if (isMatterSprite(targetBody)) {
            isIdentify = targetBody.body === unknownBody;
            console.log('isMatterSprite', targetBody, unknownBody, isIdentify);
            break;
        } else if (isMatterBody(targetBody)) {
            isIdentify = targetBody === unknownBody;
            break;
        } else if (isMatterTileBody(targetBody)) {
            isIdentify = targetBody === unknownBody.gameObject;
            break;
        }   
    }

    return isIdentify
}



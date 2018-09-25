

export type CollisionBody
= Matter.Body
| Phaser.Physics.Matter.Sprite
| Phaser.Physics.Matter.TileBody
| Phaser.Physics.Matter.Image;

// Type Guards 

/**
 * @description Phaser.Physics.Matter.Sprite - Type Guards
 */
export function isMatterSprite(body: CollisionBody): body is Phaser.Physics.Matter.Sprite {
    return body &&
        body instanceof Phaser.Physics.Matter.Sprite;
}

/**
 * @description Phaser.Physics.Matter.TileBody - Type Guards
 */
export function isMatterTileBody(body: CollisionBody): body is Phaser.Physics.Matter.TileBody {
    return body &&
        body instanceof Phaser.Physics.Matter.TileBody;
}

/**
 * @description Phaser.Physics.Matter.Image - Type Guards
 */
export function isMatterImage(body: CollisionBody): body is Phaser.Physics.Matter.Image {
    return body &&
        body instanceof Phaser.Physics.Matter.Image;
}

/**
 * @description Matter.Body - Type Guards
 */
export function isMatterBody(body: CollisionBody): body is Matter.Body {
    return body &&
        body.hasOwnProperty('frictionStatic') &&    // '....../matter-js/index.js' : 1047
        body.hasOwnProperty('velocity') &&          // '....../matter-js/index.js' : 999
        body.hasOwnProperty('timeScale') &&         // '....../matter-js/index.js' : 973
        body.hasOwnProperty('speed') &&             // '....../matter-js/index.js' : 965 
        body.hasOwnProperty('slop');                // '....../matter-js/index.js' : 956 

}

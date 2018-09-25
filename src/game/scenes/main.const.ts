

export const sceneConfig: SceneConfig = {
    LEVELS: [1, 2],
    LEVELS_CONFIG: {
        1: {
            MAIN_PLAYER_DEPTH: 1,
            TILED_MAP_LOAD_KEY: 'level-1-map',
            TILED_MAP_JSON_FILE_NAME: 'level-1',
            TILED_TILES_LAYERS: [
                { name: 'tree-head-back', setCollision: false, isStaticLayer: true, depth: undefined },
                { name: 'tree-head', setCollision: false, isStaticLayer: true, depth: undefined },
                { name: 'tree-log', setCollision: false, isStaticLayer: true, depth: undefined },
                { name: 'platform-cracks-fill', setCollision: false, isStaticLayer: true, depth: undefined },
                { name: 'platforms', setCollision: true, isStaticLayer: true, depth: undefined },
                { name: 'flout-platform', setCollision: true, isStaticLayer: true, depth: undefined },
                { name: 'water', setCollision: false, isStaticLayer: true, depth: undefined },
                { name: 'water-line-over-platform', setCollision: false, isStaticLayer: true, depth: undefined },
                { name: 'bridge-back', setCollision: true, isStaticLayer: true, depth: undefined },
                { name: 'bridge-front', setCollision: false, isStaticLayer: true, depth: 2 },
            ],
            TILED_OBJECTS_LAYERS: {
                OBJECTS: {
                    name: 'Objects',
                    objects: {
                        PLAYER_INSERTION_POINT: { name: 'player-insert-point' },
                        LEVEL_FINISH_POINT: { name: 'finish-point' }
                    }
                },
                COINS: { name: 'Coins', objects: undefined },
                DIAMONDS: { name: 'Diamonds', objects: undefined },
            }
        },
        2: {
            MAIN_PLAYER_DEPTH: 1,
            TILED_MAP_LOAD_KEY: 'level-2-map',
            TILED_MAP_JSON_FILE_NAME: 'level-2',
            TILED_TILES_LAYERS: [
                { name: 'platform-cracks-fill', setCollision: false, isStaticLayer: true, depth: undefined },
                { name: 'platforms', setCollision: true, isStaticLayer: true, depth: undefined },
                { name: 'water', setCollision: true, isStaticLayer: true, depth: undefined },

            ],
            TILED_OBJECTS_LAYERS: {
                OBJECTS: {
                    name: 'Objects',
                    objects: {
                        PLAYER_INSERTION_POINT: { name: 'player-insert-point' },
                        LEVEL_FINISH_POINT: { name: 'finish-point' }
                    }
                },
                COINS: { name: 'Coins', objects: undefined },
                DIAMONDS: { name: 'Diamonds', objects: undefined },

            }
        }
    }
}


export interface SceneConfig {
    LEVELS: [1, 2],
    LEVELS_CONFIG: {
        1: LevelConfig,
        2: LevelConfig
    }
}

export interface LevelConfig {
    MAIN_PLAYER_DEPTH: number,
    TILED_MAP_LOAD_KEY: string,
    TILED_MAP_JSON_FILE_NAME: string,
    TILED_TILES_LAYERS: TileLayerData[],
    TILED_OBJECTS_LAYERS: {
        OBJECTS: ObjectLayerData,
        COINS: ObjectLayerData,
        DIAMONDS: ObjectLayerData,
    }

} 

export interface TileLayerData {
    name: string,
    setCollision: boolean,
    isStaticLayer: boolean,
    depth: number
}
 
export interface ObjectLayerData {
    name: string,
    objects: {[key: string]: { name: string } },
}

import 'phaser';

import { config } from './config/game-config';

// game class
export class Game extends Phaser.Game {
    constructor(config: GameConfig) {
      super(config);
    }
  }
  
  // when the page is loaded, create our game instance
  window.onload = () => {
    var game = new Game(config);
  };
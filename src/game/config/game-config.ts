import 'phaser';
import { MainScene } from '../scenes/main.scene';

export const config: GameConfig = {
  width: 800,
  height: 480, // 15 * 32px
  type: Phaser.AUTO,
  parent: "game",
  scene: MainScene,
  physics : { default: "matter", matter: { gravity: { y: 1 } } },
};
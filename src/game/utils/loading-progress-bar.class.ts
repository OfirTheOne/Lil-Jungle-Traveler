const BOX_TO_LOAD_PADDING = 20;

export class LoadingProgressBar {

    private barBoxWidth: number; //= 320;
    private barBoxHeight: number; //= 50;

    private barLoadWidth: number; // = 300;
    private barLoadHeight: number; // = 30;

    private screenWidth: number;
    private screenHeight: number;

    private barGraphics: {
        progressBar: Phaser.GameObjects.Graphics
        progressBox: Phaser.GameObjects.Graphics,
    };

    constructor(private scene: Phaser.Scene, options: {barWidth: number, barHeight: number}) {

        this.barBoxWidth = options.barWidth;
        this.barBoxHeight = options.barHeight;
    
        this.barLoadWidth = options.barWidth - BOX_TO_LOAD_PADDING;
        this.barLoadHeight = options.barHeight - BOX_TO_LOAD_PADDING;

        this.screenWidth = this.scene.cameras.main.width;
        this.screenHeight = this.scene.cameras.main.height;
        
        // this.init();
    }

    public init() {
        this.scene.load.once('start',this.setupBarGraphics, this);
        this.scene.load.on('progress', this.onUpdateProgress, this);
        this.scene.load.once('complete', this.onComplete, this);
    }

    private setupBarGraphics() {
        // console.log('setupBarGraphics');
        const progressBar = this.scene.add.graphics();
        const progressBox = this.scene.add.graphics();

        const x = (this.screenWidth - this.barBoxWidth) / 2;
        const y = (this.screenHeight - this.barBoxHeight) / 2;

        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(x, y, this.barBoxWidth, this.barBoxHeight);

        this.barGraphics = {
            progressBar,
            progressBox
        }
    }

    private onUpdateProgress(value) {
        this.barGraphics.progressBar.clear();
        this.barGraphics.progressBar.fillStyle(0xffffff, 1);

        const x = (this.screenWidth - this.barLoadWidth) / 2;
        const y = (this.screenHeight - this.barLoadHeight) / 2;

        this.barGraphics.progressBar.fillRect(x, y, this.barLoadWidth * value, this.barLoadHeight);
    }

    private onComplete() {
        // console.log('onComplete');
        this.barGraphics.progressBar.destroy();
        this.barGraphics.progressBox.destroy();
        this.scene.load.off('start',this.setupBarGraphics, this, true);
        this.scene.load.off('progress',  this.onUpdateProgress, this, false);
        this.scene.load.off('fileprogress',  this.onComplete, this, true);
    }
}
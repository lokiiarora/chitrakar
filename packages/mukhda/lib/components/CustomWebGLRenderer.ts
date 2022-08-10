import { ACESFilmicToneMapping, Color, sRGBEncoding, WebGLRenderer } from 'three';


export class CustomWebGLRenderer extends WebGLRenderer {

    constructor() {
        super({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        })
        this.outputEncoding = sRGBEncoding;
        this.toneMapping = ACESFilmicToneMapping;
        this.physicallyCorrectLights = true;
        this.setClearColor(new Color(1, 1, 1), 0);
        // const { innerWidth: width, innerHeight: height } = window;
        // this.setSize(width * dpr, height * dpr);
    }

}
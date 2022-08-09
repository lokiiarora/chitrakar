import { ACESFilmicToneMapping, sRGBEncoding, WebGLRenderer } from 'three';


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
        // const { innerWidth: width, innerHeight: height } = window;
        // this.setSize(width * dpr, height * dpr);
    }

}
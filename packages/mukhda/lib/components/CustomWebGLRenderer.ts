import { ACESFilmicToneMapping, sRGBEncoding, WebGLRenderer } from 'three';


export class CustomWebGLRenderer extends WebGLRenderer {

    constructor() {
        super({
            antialias: true,
            alpha: true
        })
        this.outputEncoding = sRGBEncoding;
        this.toneMapping = ACESFilmicToneMapping;
        this.physicallyCorrectLights = true;
    }

}
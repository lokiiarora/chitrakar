import { EquirectangularReflectionMapping, Scene } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

const envMapLoader = new RGBELoader();

export class CustomScene extends Scene {
    public async loadEnvironmentMap(url: string, onProgress?: (event: ProgressEvent) => void) {
        const envMap = await envMapLoader.loadAsync(url, onProgress);
        envMap.mapping = EquirectangularReflectionMapping;
        this.environment = envMap;
    }
}
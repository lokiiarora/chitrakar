import { EquirectangularReflectionMapping, Scene } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { BVHInfoGenerate, MaterialReducer, PathTracingSceneGenerator } from 'three-gpu-pathtracer';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const envMapLoader = new RGBELoader();
const gltfLoader = new GLTFLoader();
const reducer = new MaterialReducer();

export class CustomScene extends Scene {

    private _pathTracingBVHGenerator: PathTracingSceneGenerator = new PathTracingSceneGenerator();

    private _sceneInfo: Nullable<BVHInfoGenerate> = null;

    public async loadEnvironmentMap(url: string, onProgress?: (event: ProgressEvent) => void) {
        const envMap = await envMapLoader.loadAsync(url, onProgress);
        envMap.mapping = EquirectangularReflectionMapping;
        this.environment = envMap;
        this.background = envMap;
    }

    public async addModel(url: string, onProgress?: (event: ProgressEvent) => void): Promise<BVHInfoGenerate> {
        const gltf = await gltfLoader.loadAsync(url, onProgress);
        reducer.process(gltf.scene);
        gltf.scene.updateMatrixWorld();
        const result = await this._pathTracingBVHGenerator.generate(gltf.scene, {
            verbose: true,
            setBoundingBox: true
        });
        this._sceneInfo = result;
        this.add(this._sceneInfo.scene);
        return result;
    }

}
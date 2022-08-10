import { EquirectangularReflectionMapping, Scene, Texture, Color } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { BVHInfoGenerate, MaterialReducer, PathTracingSceneGenerator, IESLoader, IESProfilesTexture } from 'three-gpu-pathtracer';
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const envMapLoader = new RGBELoader();
const gltfLoader = new GLTFLoader();
const reducer = new MaterialReducer();
const iesTextureLoader = new IESLoader();

export interface AddModelResult extends GLTF {
    bvhResult: BVHInfoGenerate;
}

export class CustomScene extends Scene {

    private _pathTracingBVHGenerator: PathTracingSceneGenerator = new PathTracingSceneGenerator();

    private _sceneInfo: Nullable<BVHInfoGenerate> = null;

    public iesTexture: Nullable<Texture> = null;

    public async loadEnvironmentMap(url: string, onProgress?: (event: ProgressEvent) => void) {
        const envMap = await envMapLoader.loadAsync(url, onProgress);
        envMap.mapping = EquirectangularReflectionMapping;
        this.environment = envMap;
    }

    public async loadIESTexture(url: string, onProgress?: (event: ProgressEvent) => void) {
        return await new Promise((r, reject) => {
            iesTextureLoader.load(url, (t) => {
                this.iesTexture = t;
                r(t);
            }, onProgress, reject)
        })
    }

    public async addModel(url: string, onProgress?: (event: ProgressEvent) => void): Promise<AddModelResult> {
        const gltf = await gltfLoader.loadAsync(url, onProgress);
        reducer.process(gltf.scene);
        gltf.scene.updateMatrixWorld();
        const result = await this._pathTracingBVHGenerator.generate(gltf.scene, {
            verbose: true,
            setBoundingBox: true
        });
        this._sceneInfo = result;
        this.add(this._sceneInfo.scene);
        return {
            bvhResult: result,
            ...gltf
        };
    }

}
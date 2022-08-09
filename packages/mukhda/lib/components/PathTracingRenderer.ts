import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import type { BufferAttribute, PerspectiveCamera, Texture, Vector2 } from 'three';
import { BVHInfoGenerate, PathTracingRenderer, PhysicalPathTracingMaterial } from 'three-gpu-pathtracer';
import type { CustomWebGLRenderer } from './CustomWebGLRenderer';


export enum TransparentTraversalsQuality {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 4
}

export class CustomPathTracingRenderer extends PathTracingRenderer {
    constructor(private renderer: CustomWebGLRenderer, camera: PerspectiveCamera, tileConfiguration: Vector2, transparentTraversals: TransparentTraversalsQuality = TransparentTraversalsQuality.HIGH, shouldEnableMultiSampleRendering: boolean = true) {
        super(renderer);
        this.camera = camera;
        this.alpha = true;
        this.material = new PhysicalPathTracingMaterial();
        this.material.backgroundAlpha = 0;
        this.tiles.set(tileConfiguration.x, tileConfiguration.y);
        if (shouldEnableMultiSampleRendering) {
            this.material.setDefine('FEATURE_MIS', 1);
        }
        this.material.setDefine("TRANSPARENT_TRAVERSALS", transparentTraversals);
    }

    async getScreenshot(): Promise<Blob> {
        return new Promise(r => {
            this.renderer.domElement.toBlob(b => r(b!), "image/png", 100);
        })
    }

    public updateBVHInfo(bvhInfo: BVHInfoGenerate, environmentMap: Nullable<Texture>, iesTexture: Nullable<Texture>) {
        const { textures, materials, lights } = bvhInfo;
        const { geometry } = bvhInfo.bvh;
        this.material.bvh.updateFrom(bvhInfo.bvh);
        this.material.normalAttribute.updateFrom(geometry.attributes.normal as BufferAttribute);
        this.material.tangentAttribute.updateFrom(geometry.attributes.tangent as BufferAttribute);
        this.material.uvAttribute.updateFrom(geometry.attributes.uv as BufferAttribute);
        this.material.materialIndexAttribute.updateFrom(geometry.attributes.materialIndex as BufferAttribute);
        this.material.textures.setTextures(this.renderer, 2048, 2048, textures);
        this.material.materials.updateFrom(materials, textures);
        if (environmentMap !== null) {
            this.material.envMapInfo.updateFrom(environmentMap);
        }
        this.material.lights.updateFrom(lights, iesTexture !== null ? [iesTexture] : []);
    }

    public setRenderResolution(resolution: Vector2) {
        this.setSize(resolution.x, resolution.y);
        this.renderer.setSize(resolution.x, resolution.y);
    }

    public updateRenderSettings(bounces: number, environmentIntensity: number, filterGlossyFactor: number) {
        this.material.filterGlossyFactor = filterGlossyFactor;
        this.material.bounces = bounces;
        this.material.environmentIntensity = environmentIntensity;
    }
}
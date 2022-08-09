import type { BufferAttribute, PerspectiveCamera, Texture, Vector2 } from 'three';
import { BVHInfoGenerate, PathTracingRenderer, PhysicalPathTracingMaterial } from 'three-gpu-pathtracer';
import type { CustomWebGLRenderer } from './CustomWebGLRenderer';


export enum TransparentTraversalsQuality {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 4
}

export class CustomPathTracingRenderer extends PathTracingRenderer {
    constructor(private renderer: CustomWebGLRenderer, camera: PerspectiveCamera, tileConfiguration: Vector2, transparentTraversals: TransparentTraversalsQuality = TransparentTraversalsQuality.MEDIUM, shouldEnableMultiSampleRendering: boolean = true) {
        super(renderer);
        this.camera = camera;
        this.alpha = true;
        this.material = new PhysicalPathTracingMaterial();
        this.tiles.set(tileConfiguration.x, tileConfiguration.y);
        if (shouldEnableMultiSampleRendering) {
            this.material.setDefine('FEATURE_MIS', 1);
        }
        this.material.setDefine("TRANSPARENT_TRAVERSALS", transparentTraversals);
    }

    async getScreenshot(): Promise<Blob> {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = this.target.width;
        tempCanvas.height = this.target.height;
        const pixelData = new Uint8Array(tempCanvas.width * tempCanvas.height * 4);
        const ctx = tempCanvas.getContext("2d")!;
        this._renderer.readRenderTargetPixels(this.target, 0, 0, tempCanvas.width, tempCanvas.height, pixelData);
        const ctxData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height, { colorSpace: "srgb" });
        for (let fy = 0; fy < tempCanvas.height; fy++) {
            for (let fx = 0; fx < tempCanvas.height; fx++) {
        
                // retrieve exact rendered pixel
        
                const color = [
                    pixelData[fy * tempCanvas.height * 4 + fx * 4 + 0],
                    pixelData[fy * tempCanvas.height * 4 + fx * 4 + 1],
                    pixelData[fy * tempCanvas.height * 4 + fx * 4 + 2],
                    pixelData[fy * tempCanvas.height * 4 + fx * 4 + 3]
                ];
        
                // put pixel to canvas image data (this whole thing might be done much faster)
        
                ctxData.data[(fy * tempCanvas.width * 4) + (fx * 4) + 0] = color[0];
                ctxData.data[(fy * tempCanvas.width * 4) + (fx * 4) + 1] = color[1];
                ctxData.data[(fy * tempCanvas.width * 4) + (fx * 4) + 2] = color[2];
                ctxData.data[(fy * tempCanvas.width * 4) + (fx * 4) + 3] = color[3];
                
            }
        }
        ctx.putImageData(ctxData, 0, 0);
        return new Promise(r => {
            tempCanvas.toBlob(b => r(b!), "image/png", 100);
        })
    }

    public updateBVHInfo(bvhInfo: BVHInfoGenerate, environmentMap: Texture) {
        const { textures, materials, geometry, lights } = bvhInfo;
        this.material.bvh.updateFrom(bvhInfo);
        this.material.normalAttribute.updateFrom(geometry.attributes.normal as BufferAttribute);
        this.material.tangentAttribute.updateFrom(geometry.attributes.tangent as BufferAttribute);
        this.material.uvAttribute.updateFrom(geometry.attributes.uv as BufferAttribute);
        this.material.materialIndexAttribute.updateFrom(geometry.attributes.materialIndex as BufferAttribute);
        this.material.textures.setTextures(this.renderer, 2048, 2048, textures);
        this.material.materials.updateFrom(materials, textures);
        this.material.envMapInfo.updateFrom(environmentMap);
        this.material.lights.updateFrom(lights, []);
    }
}
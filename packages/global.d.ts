import THREE from "three";

export type Nullable<T> = T | null;
declare module 'three-gpu-pathtracer' {

    interface BVHInfoPrepare {
        materials: THREE.Material[],
        scene: THREE.Scene,
        textures: THREE.Texture[],
        geometry: THREE.BufferGeometry,
        lights: THREE.Light[]
    }

    interface BVHInfoGenerate extends BVHInfoPrepare {
        bvh: import("three-mesh-bvh").MeshBVH
    }

    export class PathTracingSceneGenerator {
        prepScene(scene: THREE.Scene | THREE.Scene[]): BVHInfoPrepare
        generate(scene: THREE.Object3D | THREE.Object3D[], options?: import("three-mesh-bvh").MeshBVHOptions): BVHInfoGenerate
    }

    export class PathTracingRenderer {
        constructor(renderer: THREE.WebGLRenderer);
        public _renderer: THREE.WebGLRenderer;
        public material: PhysicalPathTracingMaterial;
        public alpha: Boolean;
        setSize(w: number | THREE.Vector2, h: number): void;
        dispose(): void;
        reset(): void;
        update(): void;
        public readonly samples: number;
        public readonly target: THREE.WebGLRenderTarget
        public camera: THREE.Camera | null;
        public tiles: THREE.Vector2
        public stableNoise: Boolean;
    }

    export class PhysicalCamera extends THREE.PerspectiveCamera {
        public focusDistance: number;
        public fStop: number;
        public bokehSize: number;
        public apertureBlades: number;
        public apertureRotation: number;
        public anamorphicRatio: number;
    }

    export class EquirectCamera extends THREE.Camera { }

    export class PhysicalSpotLight extends THREE.SpotLight {
        public radius: number;
        public iesTexture: THREE.Texture | null;
    }

    export class ShapedAreaLight extends THREE.RectAreaLight {
        public isCircular: Boolean;
    }

    export interface LightsInfoUniformStruct {
        updateFrom(lights: Array<THREE.Light>, iesTextures: Array<THREE.Texture>): void
    }

    export interface EquirectHdrInfoUniform {
        updateFrom(environmentMap: THREE.Texture): void
    }

    export interface PhysicalCameraUniform {
        updateFrom(camera: THREE.PerspectiveCamera | PhysicalCamera): void
    }

    export class MaterialReducer {
        constructor();
        public areEqual(a: THREE.Object3D, b: THREE.Object3D): boolean;
        public process(group: THREE.Group): void;
    }

    export class RenderTarget2DArray extends THREE.WebGLArrayRenderTarget {
        setTextures(
            renderer: THREE.WebGLRenderer,
            width: Number,
            height: Number,
            textures: Array<THREE.Texture>
        ): void
    }

    export class IESProfilesTexture extends THREE.WebGLArrayRenderTarget { }

    export class IESLoader extends THREE.TextureLoader {}
    export class MaterialsTexture extends THREE.DataTexture {
        threeCompatibilityTransforms: Boolean;
        setSide(index: Number, side: THREE.Side): void
        setMatte(index: Number, matte: Boolean): void
        setCastShadow(index: Number, enabled: Boolean): void
        updateFrom(materials: Array<THREE.Material>, textures: Array<THREE.Texture>): void
    }

    export interface UpdateableInterface<T> {
        updateFrom(t: T): void;
    }

    export class PhysicalPathTracingMaterial extends MaterialBase {
        // The number of ray bounces to test. Higher is better quality but slower performance.
        bounces: number;

        // The physical camera parameters to use
        physicalCamera: PhysicalCameraUniform;

        // Geometry and BVH information
        bvh: UpdateableInterface<import("three-mesh-bvh").MeshBVH>;
        normalAttribute: import("three-mesh-bvh").FloatVertexAttributeTexture;
        tangentAttribute: import("three-mesh-bvh").FloatVertexAttributeTexture;
        uvAttribute: import("three-mesh-bvh").FloatVertexAttributeTexture;
        materialIndexAttribute: import("three-mesh-bvh").UIntVertexAttributeTexture;
        materials: MaterialsTexture;
        textures: RenderTarget2DArray;

        // Light information
        // @ts-ignore
        lights: LightsInfoUniformStruct;
        iesProfiles: IESProfilesTexture;

        // Environment Map information
        envMapInfo: EquirectHdrInfoUniform;
        environmentRotation: THREE.Matrix3;
        environmentIntensity: number;

        // background blur
        backgroundBlur: number;

        // Factor for alleviating bright pixels from rays that hit diffuse surfaces then
        // specular surfaces. Setting this higher alleviates fireflies but will remove some
        // specular caustics.
        filterGlossyFactor: number;

        // The colors to use for the gradient background when enabled.
        bgGradientTop: THREE.Color;
        bgGradientBottom: THREE.Color;

        // The transparency to render the background with. Note that the "alpha" option
        // must be set to true on PathTracingRenderer for this field to work properly.
        backgroundAlpha: number;
    }

    export class MaterialBase extends THREE.ShaderMaterial {
        setDefine(name: string, value: undefined | any): void
    }

    export class BlurredEnvMapGenerator {
        constructor(renderer: THREE.WebGLRenderer)
        generate(texture: THREE.Texture, blur: number): THREE.DataTexture
        dispose(): void
    }
}


export interface StageRenderConfig {
    url: string;
    hdri: string;
    jobId: string;
    renderResolution: [number, number];
    samples: number;
    bounces: number;
    filterGlossyFactor: number;
    environmentIntensity: number;
    iesUri?: string;
    cameraNamespace?: string;
}
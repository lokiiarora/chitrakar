import {
    ACESFilmicToneMapping,
    NoToneMapping,
    LoadingManager,
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    MeshBasicMaterial,
    sRGBEncoding,
    CustomBlending,
    EquirectangularReflectionMapping,
    MathUtils,
    Vector3,
} from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {
    PathTracingSceneGenerator,
    PathTracingRenderer,
    PhysicalPathTracingMaterial,
    BVHInfoGenerate,
    MaterialReducer,
} from 'three-gpu-pathtracer';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DenoiseMaterial } from './components/DenoiseMaterial';

type Nullable<T> = T | null;

let loadingEl: Nullable<HTMLDivElement>, samplesEl: Nullable<HTMLDivElement>, containerEl: Nullable<HTMLDivElement>;
let stats: Stats, sceneInfo: Nullable<BVHInfoGenerate>;
let renderer: WebGLRenderer, camera: PerspectiveCamera;
let ptRenderer: Nullable<PathTracingRenderer>, fsQuad: Nullable<FullScreenQuad>, controls: OrbitControls, scene: Scene;
const loader = new GLTFLoader();

init();

async function init() {

    loadingEl = document.getElementById('loading') as Nullable<HTMLDivElement>;
    samplesEl = document.getElementById('samples') as Nullable<HTMLDivElement>;
    containerEl = document.getElementById('container') as Nullable<HTMLDivElement>;

    // init renderer
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.physicallyCorrectLights = true;
    containerEl?.appendChild(renderer.domElement);

    // init scene
    scene = new Scene();

    // init camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new PerspectiveCamera(60, aspect, 0.01, 500);
    camera.position.set(- 1, 0.25, 1);

    // init path tracer
    ptRenderer = new PathTracingRenderer(renderer);
    ptRenderer.camera = camera;
    ptRenderer.alpha = true;
    // ptRenderer.a
    ptRenderer.material = new PhysicalPathTracingMaterial();
    ptRenderer.tiles.set(10, 10);
    ptRenderer.material.setDefine('FEATURE_MIS', 1);
    ptRenderer.material.setDefine("TRANSPARENT_TRAVERSALS", 2);


    // init fsquad
    fsQuad = new FullScreenQuad(new DenoiseMaterial({
        // @ts-ignore
        map: ptRenderer.target.texture,
		blending: CustomBlending,
    }));

    // init controls
    controls = new OrbitControls(camera, containerEl!);
    controls.addEventListener('change', resetRenderer);

    stats = Stats()

    // init stats
    containerEl!.appendChild(stats.dom);
    // @ts-ignore
    // scene.add(fsQuad!._mesh)

    await addModel();
    loadingEl!.style.display = "none";
    animate()
}

async function addModel() {
    const gltf = await loader.loadAsync("./ToyCar.glb", (event: ProgressEvent) => {
        if (event.lengthComputable) {
            console.log("Loaded model", `${(event.loaded / event.total) * 100}%`)
        }
    });
    console.log(gltf, "gltf")
    // sceneInfo =
    // scene.add(...gltf.scenes);
    const reducer = new MaterialReducer();
    reducer.process(gltf.scene);
    gltf.scene.updateMatrixWorld();

    const generator = new PathTracingSceneGenerator();
    const result = await generator.generate(gltf.scene, {
        onProgress: (v: number) => {

            const percent = Math.floor(100 * v);
            // console.log(`Loading BVH: ${percent}&`)

        }
    });
    const envMap = await new RGBELoader().loadAsync("https://threejs.org/examples/textures/memorial.hdr")
    sceneInfo = result;
    scene.add(sceneInfo!.scene);

    const { bvh, textures, materials } = result;
    const geometry = bvh.geometry;
    const material = ptRenderer!.material;

    // @ts-ignore
    material.bvh.updateFrom(bvh);
    // @ts-ignore
    material.normalAttribute.updateFrom(geometry.attributes.normal);
    // @ts-ignore
    material.tangentAttribute.updateFrom(geometry.attributes.tangent);
    // @ts-ignore
    material.uvAttribute.updateFrom(geometry.attributes.uv);
    // @ts-ignore
    material.materialIndexAttribute.updateFrom(geometry.attributes.materialIndex);
    material.textures.setTextures(renderer, 2048, 2048, textures);
    material.materials.updateFrom(materials, textures);
    material.envMapInfo.updateFrom( envMap );

    // generator.dispose();

    envMap.mapping = EquirectangularReflectionMapping;
    scene.environment = envMap;
    // scene.background = envMap;

    const dpr = window.devicePixelRatio;
    const { innerWidth: width, innerHeight: height } = window;
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);
    ptRenderer!.setSize(width * dpr * 1, height * dpr * 1);
    camera.aspect = width / height;
    camera.fov = 75;
    
    controls.target = new Vector3(0,0,0)
    camera.updateProjectionMatrix();
    controls.update();
    camera.updateMatrixWorld();

    ptRenderer!.material.backgroundAlpha = 1;

    containerEl!.style.display = 'flex';
}

window.addEventListener("render-complete", function (event) {
    console.log("Render is complete", event);
})

let handle: number;

function animate() {

    handle = requestAnimationFrame(animate);

    if (ptRenderer!.samples >= 500) {
        // Trigger render complete
        return;

    }

    stats.update();

    if (ptRenderer!.samples < 1.0) {

        renderer.render(scene, camera);

    }

    const samples = Math.floor(ptRenderer?.samples ?? 0);
    samplesEl!.innerText = `samples: ${samples}`;

    ptRenderer!.material.materials.updateFrom(sceneInfo!.materials, sceneInfo!.textures);
    ptRenderer!.material.filterGlossyFactor = 0.5;
    ptRenderer!.material.bounces = 10;
    ptRenderer!.material.physicalCamera.updateFrom(camera);
    ptRenderer!.material.environmentIntensity = 2;

    camera.updateMatrixWorld();



    for (let i = 0, l = 3; i < l; i++) {

        ptRenderer?.update();

    }

    renderer.autoClear = false;
    // renderer.setRenderTarg);
    fsQuad?.render(renderer);
    renderer.autoClear = true;

    if (ptRenderer!.samples >= 500) {

        requestAnimationFrame(() => {
            cancelAnimationFrame(handle as number)
            window.dispatchEvent(new Event('render-complete'));

        });

    }

    samplesEl!.innerText = `Samples: ${Math.floor(ptRenderer?.samples ?? 0)}`;

}

function resetRenderer() {

    ptRenderer?.reset();

}
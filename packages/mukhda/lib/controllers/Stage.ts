import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { CustomScene } from '../components/CustomScene';
import { CustomWebGLRenderer } from '../components/CustomWebGLRenderer';
import { CustomControls } from '../components/OrbitControls';
import { CustomPathTracingRenderer } from '../components/PathTracingRenderer';
import { RenderableCameraSet } from './../components/RenderableCameraSet';
import { Logger, LogLevel } from '../components/Logger';
import { CustomBlending, PerspectiveCamera, Vector2 } from 'three';
import { DenoiseMaterial } from '../components/DenoiseMaterial';
import type { StageRenderConfig } from '../types/StageRenderConfig';
import { fitCameraToSelection } from '../utils/Camera';

export interface StageInitConfig {
    debug: boolean;
}

export class Stage {

    private _renderableCameraSet: RenderableCameraSet;

    private _ptRenderer: CustomPathTracingRenderer;

    private _glRenderer: CustomWebGLRenderer;

    private _orbitControls: CustomControls;

    private _scene: CustomScene;

    private _stats: Nullable<Stats> = null;

    private _fsQuad: FullScreenQuad;

    private _containerEl: HTMLDivElement;

    private _rafHandleId: Nullable<number> = null;

    private _currentJobConfig: Nullable<StageRenderConfig> = null;

    constructor(private _initConfig: StageInitConfig) {
        this._glRenderer = new CustomWebGLRenderer();
        this._containerEl = document.querySelector("#container") as HTMLDivElement;
        this._containerEl.appendChild(this._glRenderer.domElement);
        this._scene = new CustomScene();
        this._animate = this._animate.bind(this);
        this._handleRenderCompleteCallback = this._handleRenderCompleteCallback.bind(this);
        const resetCallback = () => {
            this._ptRenderer.reset();
        }
        this._renderableCameraSet = new RenderableCameraSet(resetCallback);
        this._orbitControls = new CustomControls(this._renderableCameraSet.currentCamera, this._glRenderer.domElement);
        this._ptRenderer = new CustomPathTracingRenderer(this._glRenderer, this._renderableCameraSet.currentCamera as PerspectiveCamera, new Vector2(10, 10));
        this._fsQuad = new FullScreenQuad(
            new DenoiseMaterial({
                // @ts-ignore
                map: this._ptRenderer.target.texture,
                blending: CustomBlending,
                sigma: 5,
                kSigma: 0.5,
                threshold: 0.3
            })
        )
        this._orbitControls.addEventListener("change", resetCallback);
        if (_initConfig.debug) {
            this._stats = Stats()
            this._containerEl.appendChild(this._stats.dom);
            Logger.LOG_LEVEL = LogLevel.VERBOSE;
        }
    }

    public async startRender(config: StageRenderConfig): Promise<void> {
        this._currentJobConfig = config;
        await this._scene.loadEnvironmentMap(config.hdri, (event: ProgressEvent) => {
            if (event.lengthComputable) {
                const percent =(event.loaded / event.total) * 100;
                Logger.debug(`${config.hdri} with Job id ${config.jobId} -> Percent loaded: ${percent}%`);
            }
        })
        const bvhInfo = await this._scene.addModel(config.url, (event: ProgressEvent) => {
            if (event.lengthComputable) {
                const percent =(event.loaded / event.total) * 100;
                Logger.debug(`${config.url} with Job id ${config.jobId} -> Percent loaded: ${percent}%`);
            }
        });
        this._ptRenderer.setRenderResolution(new Vector2().set(config.renderResolution[0], config.renderResolution[1]));
        this._ptRenderer.updateBVHInfo(bvhInfo, this._scene.environment!);
        this._ptRenderer.updateRenderSettings(config.bounces, config.environmentIntensity, config.filterGlossyFactor);
        fitCameraToSelection(this._renderableCameraSet.currentCamera as PerspectiveCamera, this._orbitControls, [bvhInfo.scene]);
        this._animate();
    }

    private _animate() {
        if (this._currentJobConfig === null) return;
        if (this._ptRenderer.samples >= this._currentJobConfig.samples) return;
        if (this._ptRenderer.samples < 1.0) {
            // Render first one if path tracing renderer just got reset to avoid flashing
            this._glRenderer.render(this._scene, this._renderableCameraSet.currentCamera);
        }

        this._stats?.update();
        const numberOfSamples = Math.floor(this._ptRenderer.samples);
        Logger.debug(`Number of samples rendered: ${numberOfSamples}`);
        this._ptRenderer.material.physicalCamera.updateFrom(this._renderableCameraSet.currentCamera as PerspectiveCamera);
        this._renderableCameraSet.currentCamera.updateMatrixWorld();
        for (let bounceIdx = 0; bounceIdx < this._currentJobConfig.bounces; bounceIdx++) {
            this._ptRenderer.update();
        };
        this._fsQuad.render(this._glRenderer);
        if (this._ptRenderer.samples >= this._currentJobConfig.samples) {
            if (this._rafHandleId) {
                cancelIdleCallback(this._rafHandleId);
            }
            requestAnimationFrame(this._handleRenderCompleteCallback)
        }
        this._rafHandleId = requestIdleCallback(this._animate);
    }

    private async _handleRenderCompleteCallback() {
        const screenshotBlob = await this._ptRenderer.getScreenshot();
        Logger.debug(`Screenshot for ${this._currentJobConfig?.jobId} is complete`);
        window.dispatchEvent(new CustomEvent('render-complete', { detail: {
            blobUri: URL.createObjectURL(screenshotBlob)
        } }));
        this._currentJobConfig = null;
    }

}
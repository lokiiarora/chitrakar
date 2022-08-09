import { Camera, PerspectiveCamera } from "three";

export class RenderableCameraSet {
    private _customCameraMap = new Map<string, Camera>();

    private defaultCamera: PerspectiveCamera;

    private _currentCamera: Camera;

    private _currentCameraNamespace: string | null = null;

    get currentCameraNamespace() {
        return this._currentCameraNamespace;
    }

    set currentCameraNamespace(s: string | null) {
        this._currentCameraNamespace = s;
        const prevCamera = this._currentCamera;
        if (s) {
            const camera = this._customCameraMap.get(s);
            if (camera !== undefined) {
                this._currentCamera = camera;
            } else {
                this._currentCamera = this.defaultCamera;
            }
        }
        if (prevCamera !== this._currentCamera) {
            this.resetCallback();
        }
    }

    get currentCamera(): Camera {
        if (this.currentCameraNamespace !== null) {
            const camera = this._customCameraMap.get(this.currentCameraNamespace);
            if (camera !== undefined) {
                return camera;
            }
            return this.defaultCamera;
        }
        return this.defaultCamera;
    }

    constructor(private resetCallback: () => void) {
        this.defaultCamera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 500);
        this.defaultCamera.position.set(0, 0.25, 1);
        this._currentCamera = this.defaultCamera;
        this.defaultCamera.updateMatrixWorld();
        this.defaultCamera.updateProjectionMatrix();
    }
}
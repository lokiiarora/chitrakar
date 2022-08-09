import { Box3, Object3D, PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const size = new Vector3();
const center = new Vector3();
const box = new Box3();

export function fitCameraToSelection(camera: PerspectiveCamera, controls: OrbitControls, selection: Object3D[], fitOffset = 1.2) {
    box.makeEmpty();
    for(const object of selection) {
      box.expandByObject(object);
    }
    
    box.getSize(size);
    box.getCenter(center );
    
    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);
    
    const direction = controls.target.clone()
      .sub(camera.position)
      .normalize()
      .multiplyScalar(distance);
  
    controls.maxDistance = distance * 10;
    controls.target.copy(center);
    
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
  
    camera.position.copy(controls.target).sub(direction);
    
    controls.update();
}
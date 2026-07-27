import * as THREE from 'three';

export function startCameraFadeIn(camera, controls) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = '#080808';
    overlay.style.zIndex = '99999';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 900ms ease';
    document.body.appendChild(overlay);

    const targetPosition = camera.position.clone();
    const targetTarget = controls.target.clone();

    const startPosition = targetPosition.clone().add(new THREE.Vector3(0, 0, 45));
    const startTarget = targetTarget.clone();

    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    controls.update();

    const startTime = performance.now();
    const duration = 500;

    function animate(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(startPosition, targetPosition, eased);
        controls.target.lerpVectors(startTarget, targetTarget, eased);
        controls.update();

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 900);
        }
    }

    requestAnimationFrame(animate);
}
import * as THREE from 'three';
import { models } from '../3DModels/models.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 593 / 700, 0.1, 1000);
camera.position.z = 5;
camera.position.x = 0;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(540, 500);
renderer.setClearColor(0x000000, 0);

document.getElementById('three-canvas').appendChild(renderer.domElement);

document.getElementById('three-canvas').addEventListener('click', () => {
    const link = models[currentModelIndex].link;
    if (link) {
        window.location.href = link; // or window.open(link, '_blank') for new tab
    }
});
// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// --- Model Management ---
const loader = new GLTFLoader();
let currentModelIndex = 0;
let currentModel = null;
let animating = false;

// --- Easing Function ---
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// --- Model Loading ---
function loadModel(index, direction = 0) {
    // Remove previous model
    if (currentModel) {
        scene.remove(currentModel);
        currentModel.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
        currentModel = null;
    }
    loader.load(models[index].file, function (gltf) {
        currentModel = gltf.scene;
        currentModel.scale.set(50, 60, 50);
        // Center the model
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        scene.add(currentModel);
        if (direction !== 0) {
            animateModelIn(currentModel, direction);
        }
    }, undefined, function (error) {
        console.error(error);
    });
}

// --- Animation Functions ---
function animateModelOut(direction, callback) {
    if (!currentModel) return callback();
    animating = true;
    let progress = 0;
    function step() {
        progress += 0.04; // Consistent speed
        let eased = easeOutCubic(Math.min(progress, 1));
        currentModel.position.x = direction * eased * 40;
        currentModel.traverse(child => {
            if (child.isMesh) {
                child.material.transparent = true;
                child.material.opacity = Math.max(1 - eased, 0);
            }
        });
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            animating = false;
            callback();
        }
    }
    step();
}

function animateModelIn(model, direction) {
    if (!model) return;
    animating = true;
    model.position.x = -direction * 20; // Start off-screen
    model.traverse(child => {
        if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = 0;
        }
    });
    let progress = 0;
    function step() {
        progress += 0.04;
        let eased = easeOutCubic(Math.min(progress, 1));
        model.position.x = -direction * (1 - eased) * 40;
        model.traverse(child => {
            if (child.isMesh) {
                child.material.opacity = eased;
            }
        });
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            model.position.x = 0;
            model.traverse(child => {
                if (child.isMesh) {
                    child.material.opacity = 1;
                }
            });
            animating = false;
        }
    }
    step();
}

// --- Post-Processing Setup ---
const VHSShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        varying vec2 vUv;
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // Scanlines
            float scanline = sin(vUv.y * 800.0 + time * 10.0) * 0.04;
            color.rgb -= scanline;

            // Color offset
            float offset = sin(time * 2.0 + vUv.y * 40.0) * 0.003;
            color.r = texture2D(tDiffuse, vUv + vec2(offset, 0.0)).r;
            color.g = texture2D(tDiffuse, vUv - vec2(offset, 0.0)).g;

            // Noise
            float noise = fract(sin(dot(vUv.xy + time, vec2(12.9898,78.233))) * 43758.5453);
            color.rgb += noise * 0.04;

            gl_FragColor = color;
        }
    `
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const vhsPass = new ShaderPass(VHSShader);
composer.addPass(vhsPass);

// --- Main Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    if (currentModel) {
        currentModel.rotation.y += 0.01;
    }
    vhsPass.uniforms.time.value = performance.now() * 0.001;
    composer.render();
}
animate();

// --- Button Event Listeners ---
document.querySelector('.right-button').addEventListener('click', () => {
    if (animating) return;
    animateModelOut(1, () => {
        currentModelIndex = (currentModelIndex + 1) % models.length;
        loadModel(currentModelIndex, 1);
    });
});
document.querySelector('.left-button').addEventListener('click', () => {
    if (animating) return;
    animateModelOut(-1, () => {
        currentModelIndex = (currentModelIndex - 1 + models.length) % models.length;
        loadModel(currentModelIndex, -1);
    });
});

// --- Initial Model Load ---
loadModel(currentModelIndex);


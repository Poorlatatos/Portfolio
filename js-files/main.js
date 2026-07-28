import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { startCameraFadeIn } from './camerafadein.js';

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const dragState = {
        isDragging: false,
        lastX: 0,
        lastY: 0,
        startX: 0,
        startY: 0,
        hasDragged: false,
        velocityX: 0,
        velocityY: 0,
    };
    const idleDelay = 3000;
    let lastInteractionTime = performance.now();

    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 200;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(100, 50, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 15, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    controls.enablePan = true;
    controls.maxDistance = 100;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.update();
    
    startCameraFadeIn(camera, controls);

    const scene = new THREE.Scene();	
    scene.fog = new THREE.Fog(0x87ceeb, 40, 160);
    //scene.background = new THREE.Color(0x87CEEB);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('imgs/Sky.png');
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;

    const ambientLight = new THREE.AmbientLight(0xfffcb0, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfffcb0, 0xddffb0, 1.5);
    scene.add(hemiLight);   

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 80, 60);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.bias = -0.0009;
    directionalLight.shadow.normalBias = 0.02;
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const raycaster = new THREE.Raycaster();
    const downDirection = new THREE.Vector3(0, -1, 0);

    let floorRoot = null;
    let grassTemplate = null;
    let grassPlaced = false;
    let treeRoot = null;
    let fruitTemplate = null;

    const siteSections = [
        {
            title: 'About Me',
            href: 'homepage.html',
            previewImage: 'imgs/previews/homepage.jpg',
            description: 'Intro, skills, and personal summary.',
        },
        {
            title: 'Portfolio',
            href: 'projects.html',
            previewImage: 'imgs/previews/projects.jpg',
            description: 'Selected projects and showreel.',
        },
    ];


    const mouse = new THREE.Vector2();
    let hoveredFruit = null;
    const bubble = document.querySelector('.fruit-bubble');
    const bubbleImage = document.querySelector('.fruit-bubble-image');
    const bubbleTitle = document.querySelector('.fruit-bubble-title');
    const bubbleText = document.querySelector('.fruit-bubble-text'); 


    canvas.addEventListener('pointerdown', (event) => {
        dragState.isDragging = true;
        dragState.lastX = event.clientX;
        dragState.lastY = event.clientY;
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        dragState.hasDragged = false;
        lastInteractionTime = performance.now();
    });

    canvas.addEventListener('pointermove', (event) => {
        if (!dragState.isDragging) {
            return;
        }

        const deltaX = event.clientX - dragState.lastX;
        const deltaY = event.clientY - dragState.lastY;

        dragState.velocityX = deltaX * 0.002;
        dragState.velocityY = deltaY * 0.002;

        if (Math.abs(event.clientX - dragState.startX) > 5 || Math.abs(event.clientY - dragState.startY) > 5) {
            dragState.hasDragged = true;
        }

        dragState.lastX = event.clientX;
        dragState.lastY = event.clientY;
        lastInteractionTime = performance.now();
    });

    canvas.addEventListener('pointerup', (event) => {
        if (!dragState.hasDragged) {
            openFruitLink(event);
        }

        dragState.isDragging = false;
        dragState.hasDragged = false;
        lastInteractionTime = performance.now();
    });

    canvas.addEventListener('pointerleave', () => {
        dragState.isDragging = false;
        dragState.hasDragged = false;
    });

    function cloneFruitInstance(template) {
        const clone = template.clone(true);
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
            }
        });
        return clone;
    }

    function getFruitFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(treeRoot ? treeRoot.children : [], true);
        return hits.find((hit) => hit.object.userData.isFruit) ?? null;
    }

    function openFruitLink(event) {
        const fruitHit = getFruitFromEvent(event);

        if (!fruitHit) {
            return;
        }

        window.location.href = fruitHit.object.userData.href;
    }

    function placeFruitsOnTree(treeObject, fruitObject) {
        if (!treeObject || !fruitObject) return;

        const treeMeshes = [];
        treeObject.traverse((child) => {
            if (child.isMesh) treeMeshes.push(child);
        });

        if (treeMeshes.length === 0) return;

        const sampler = new MeshSurfaceSampler(treeMeshes[0]).build();
        const tempPosition = new THREE.Vector3();
        const tempNormal = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        for (let i = 0; i < siteSections.length; i++) {
            const fruit = cloneFruitInstance(fruitObject);
            const section = siteSections[i];

            fruit.userData.isFruit = true;
            fruit.userData.href = section.href;
            fruit.userData.section = section;

            sampler.sample(tempPosition, tempNormal);

            fruit.position.copy(tempPosition);
            fruit.position.addScaledVector(tempNormal, 0.15);
            fruit.quaternion.setFromUnitVectors(up, tempNormal);
            fruit.rotation.y = Math.random() * Math.PI * 2;
            fruit.scale.setScalar(0.25 + Math.random() * 0.15);

            treeObject.add(fruit);
        }
    }

    fruitTemplate = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xff3a2e, roughness: 0.8 })
    );

    function onPointerMove(event) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(treeRoot ? treeRoot.children : [], true);
        const fruitHit = hits.find((hit) => hit.object.userData.isFruit);

        if (fruitHit) {
            const section = fruitHit.object.userData.section;

            if (hoveredFruit !== fruitHit.object) {
                hoveredFruit = fruitHit.object;
                bubble.classList.add('is-visible');
                bubbleTitle.textContent = section.title;
                bubbleText.textContent = section.description;
                bubbleImage.src = section.previewImage;
                bubbleImage.alt = section.title;
            }

            const screenPos = fruitHit.object.position.clone().project(camera);
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

            bubble.style.left = `${x}px`;
            bubble.style.top = `${y}px`;
        } else {
            hoveredFruit = null;
            bubble.classList.remove('is-visible');
        }
    }

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', () => {
        bubble.classList.remove('is-visible');
        hoveredFruit = null;
    });
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;

        if (needResize) {
            renderer.setSize(width, height, false);
        }

        return needResize;
    }

    function makeGrassMaterial(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        return new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
        });
    }

    function applyTextureToObject(root, material) {
        root.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    function cloneGrassInstance(template) {
        const clone = template.clone(true);
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
            }
        });
        return clone;
    }

    function placeGrassOnFloor(floorObject, grassObject) {
        if (!floorObject || !grassObject || grassPlaced) {
            return;
        }

        const floorMeshes = [];
        floorObject.traverse((child) => {
            if (child.isMesh) {
                floorMeshes.push(child);
            }
        });

        if (floorMeshes.length === 0) {
            return;
        }

        const floorBox = new THREE.Box3().setFromObject(floorObject);

        const grassCount = 200;

        for (let i = 0; i < grassCount; i++) {
            const x = THREE.MathUtils.lerp(floorBox.min.x, floorBox.max.x, Math.random());
            const z = THREE.MathUtils.lerp(floorBox.min.z, floorBox.max.z, Math.random());

            raycaster.set(new THREE.Vector3(x, floorBox.max.y + 5, z), downDirection);
            const hits = raycaster.intersectObjects(floorMeshes, true);

            if (hits.length === 0) {
                continue;
            }

            const hit = hits[0];
            const grass = cloneGrassInstance(grassObject);

            const scale = THREE.MathUtils.lerp(0.7, 1.4, Math.random());
            grass.position.copy(hit.point);
            grass.rotation.y = Math.random() * Math.PI * 2;
            grass.scale.setScalar(scale);

            const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
            normal.transformDirection(hit.object.matrixWorld);
            grass.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

            grass.position.addScaledVector(normal, 0.02);
            grass.rotateY(Math.random() * Math.PI * 2);

            scene.add(grass);
        }

        grassPlaced = true;
    }

    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('obj-files/AppleGarden.mtl', (mtl) => {
            mtl.preload();
            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }

            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('obj-files/AppleGarden.obj', (root) => {
                root.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                    }
                });
                treeRoot = root;
                scene.add(root);
            });
        });
    }

    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('obj-files/AppleGardenLeaves.mtl', (mtl) => {
            mtl.preload();
            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }

            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('obj-files/AppleGardenLeaves.obj', (root) => {
                root.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                    }
                });
                treeRoot = root;
                scene.add(root);

                if (fruitTemplate) {
                    placeFruitsOnTree(treeRoot, fruitTemplate);
                }
            });
        });
    }

    let npcFloorSampler = null;
    const npcFloorPoint = new THREE.Vector3();
    const npcFloorNormal = new THREE.Vector3();
    const npcHalfHeight = 0.5;
    const npcEpsilon = 0.02;
    const npcDownRay = new THREE.Raycaster();
    const npcDownDirection = new THREE.Vector3(0, -1, 0);
    const npcGroundHit = new THREE.Vector3();
    const npcGroundNormal = new THREE.Vector3();

    const npc = new THREE.Group();
    scene.add(npc);

    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('obj-files/Rabbit.mtl', (mtl) => {
            mtl.preload();

            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }

            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('obj-files/Rabbit.obj', (root) => {
                root.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                root.scale.setScalar(1.5);
                root.rotation.y = Math.PI / 2;

                const box = new THREE.Box3().setFromObject(root);
                const center = box.getCenter(new THREE.Vector3());
                root.position.sub(center);

                const baseBox = new THREE.Box3().setFromObject(root);
                root.position.y -= baseBox.min.y;

                npc.add(root);
            });
        });
    }

    const npcState = {
        target: new THREE.Vector3(),
        speed: 0.03,
        waitTime: 0,
        walkCycle: 0,
    };

    function setupNpcFloorSampler(floorObject) {
        if (!floorObject) return;

        const floorMeshes = [];
        floorObject.traverse((child) => {
            if (child.isMesh) {
                floorMeshes.push(child);
            }
        });

        if (floorMeshes.length === 0) return;

        npcFloorSampler = new MeshSurfaceSampler(floorMeshes[0]).build();
    }

    function pickNewNpcTarget() {
        if (!npcFloorSampler) return;

        do {
            npcFloorSampler.sample(npcFloorPoint, npcFloorNormal);
        } while (npcFloorNormal.y < 0.5);

        npcState.target.copy(npcFloorPoint).addScaledVector(
            npcFloorNormal,
            npcHalfHeight + npcEpsilon
        );

        npcState.walkCycle = 0;
        npcState.waitTime = THREE.MathUtils.randFloat(0.5, 2.0);
    }

    function getNpcGroundY(x, z) {
        npcDownRay.set(new THREE.Vector3(x, 100, z), npcDownDirection);

        const floorMeshes = [];
        floorRoot.traverse((child) => {
            if (child.isMesh) floorMeshes.push(child);
        });

        const hits = npcDownRay.intersectObjects(floorMeshes, true);
        if (hits.length === 0) return null;

        const hit = hits[0];
        if (hit.face) {
            const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
            if (normal.y < 0.5) return null;
        }

        return hit.point.y + npcHalfHeight + npcEpsilon;
    }

    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('obj-files/AppleGardenFloor.mtl', (mtl) => {
            mtl.preload();
            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }

            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('obj-files/AppleGardenFloor.obj', (root) => {
                root.traverse((child) => {
                    if (child.isMesh) {
                        child.receiveShadow = true;
                    }
                });

                floorRoot = root;
                scene.add(root);

                if (grassTemplate) {
                    placeGrassOnFloor(floorRoot, grassTemplate);
                }

                setupNpcFloorSampler(floorRoot);

                do {
                    npcFloorSampler.sample(npcFloorPoint, npcFloorNormal);
                } while (npcFloorNormal.y < 0.5);

                npc.position.copy(npcFloorPoint).addScaledVector(
                    npcFloorNormal,
                    npcHalfHeight + npcEpsilon
                );

                pickNewNpcTarget();
            });
        });
    }

    {
        const textureLoader = new THREE.TextureLoader();
        const grassTexture = textureLoader.load('obj-files/Grass.png');

        const grassMaterial = makeGrassMaterial(grassTexture);
        const objLoader = new OBJLoader();

        objLoader.load('obj-files/Grass.obj', (root) => {
            grassTemplate = root;
            applyTextureToObject(grassTemplate, grassMaterial);

            if (floorRoot) {
                placeGrassOnFloor(floorRoot, grassTemplate);
            }
        });
    }

    function render() {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        controls.update();
        const delta = 1 / 60;

        if (npcState.waitTime > 0) {
            npcState.waitTime -= delta;
        } else {
            const direction = new THREE.Vector3().subVectors(npcState.target, npc.position);
            const distance = direction.length();

            if (distance < 0.2) {
                pickNewNpcTarget();
            } else {
                direction.normalize();
                const nextX = npc.position.x + direction.x * npcState.speed;
                const nextZ = npc.position.z + direction.z * npcState.speed;
                const groundY = getNpcGroundY(nextX, nextZ);

                if (groundY !== null) {
                    npc.position.x = nextX;
                    npc.position.z = nextZ;
                    npcState.walkCycle += delta * 10;
                    const hopHeight = 0.35;
                    const hopOffset = Math.sin(npcState.walkCycle) * hopHeight;
                    npc.position.y = groundY + hopOffset;
                }
                
                npc.lookAt(npcState.target);
            }
        }

        if (!dragState.isDragging) {
            dragState.velocityX *= 0.95;
            dragState.velocityY *= 0.95;

            controls.target.x += dragState.velocityX;
            controls.target.y += dragState.velocityY;
        }

        controls.autoRotate = performance.now() - lastInteractionTime > idleDelay;

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
    pickNewNpcTarget();
}

main();
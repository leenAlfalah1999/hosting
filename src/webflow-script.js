// Three.js CDN imports
const THREE = window.THREE;
const OrbitControls = window.OrbitControls;
const RGBELoader = window.RGBELoader;
const GLTFLoader = window.GLTFLoader;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'webgl';
    document.body.appendChild(canvas);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    // Fog (black)
    const fogColor = new THREE.Color('#000000');
    scene.fog = new THREE.Fog(fogColor, 10, 15);

    // Environment map
    const rgbeLoader = new RGBELoader();
    rgbeLoader.setPath('https://www.tighterthreads.us/');
    rgbeLoader.load('aerodynamics_workshop_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.environmentIntensity = 1;
    });

    // Sizes
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    window.addEventListener('resize', () => {
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Camera
    const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100);
    camera.position.x = 6;
    camera.position.y = 3;
    camera.position.z = 10;
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(fogColor);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.normalBias = 0.02;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Material
    const material = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.0,
        metalness: 0.8,
        envMapIntensity: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        sheen: 0.5,
        sheenRoughness: 0.8,
        transmission: 0.1,
        thickness: 0.2,
        ior: 1.5,
        emissive: '#ffffff',
        emissiveIntensity: 0.5
    });

    // Load model
    const loader = new GLTFLoader();
    loader.load(
        'https://www.tighterthreads.us/models/logo.glb',
        (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });
            scene.add(model);
        },
        (progress) => {
            console.log('Loading model...', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading model:', error);
        }
    );

    // Update lighting
    directionalLight.intensity = 0.5;
    directionalLight.position.set(5, 5, 5);
    ambientLight.intensity = 0.2;
    scene.environmentIntensity = 2.0;

    // Animation
    const tick = () => {
        controls.update();
        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    };
    tick();
}); 
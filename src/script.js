import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { color, fog, pass, rangeFogFactor, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { concrete } from 'tsl-textures';

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color('#000000')

// Fog (black)
const fogColor = uniform(color('#000000'))
scene.fogNode = fog(fogColor, rangeFogFactor(10, 15))

// Environment map
new RGBELoader()
    .setPath('/')
    .load('aerodynamics_workshop_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.environment = texture
        scene.environmentIntensity = 1
    })

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 6
camera.position.y = 3
camera.position.z = 10
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGPURenderer({
    canvas: canvas,
    antialias: true,
    forceWebGL: false
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(fogColor.value)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(5, 5, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 100
directionalLight.shadow.normalBias = 0.02
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

/**
 * Material
 */
const material = new THREE.MeshPhysicalNodeMaterial()

// Material parameters
const concreteParams = {
    scale: 3,
    density: 0.92,
    bump: 0.4,
    seed: 5026,
    color: '#ffffff',
    roughnessIntensity: 0.0,
    normalIntensity: 0.7,
    aoIntensity: 0.8,
    bumpScale: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    sheen: 0.5,
    sheenRoughness: 0.8,
    transmission: 0.1,
    thickness: 0.2,
    ior: 1.5
}

function updateMaterial() {
    const concreteTexture = concrete({
        scale: concreteParams.scale,
        density: concreteParams.density,
        bump: concreteParams.bump,
        seed: concreteParams.seed
    })

    material.roughness = concreteParams.roughnessIntensity
    material.metalness = 0.8
    material.envMapIntensity = 1.5
    material.clearcoat = concreteParams.clearcoat
    material.clearcoatRoughness = concreteParams.clearcoatRoughness
    material.sheen = concreteParams.sheen
    material.sheenRoughness = concreteParams.sheenRoughness
    material.transmission = concreteParams.transmission
    material.thickness = concreteParams.thickness
    material.ior = concreteParams.ior
    material.emissive = new THREE.Color('#ffffff')
    material.emissiveIntensity = 0.5
    material.colorNode = color(concreteParams.color)
    material.normalNode = concreteTexture
    material.normalScale = { x: concreteParams.normalIntensity, y: concreteParams.normalIntensity }
    material.bumpScale = concreteParams.bumpScale
}

updateMaterial()

// Load model
const loader = new GLTFLoader()
loader.load(
    '/models/logo.glb',
    (gltf) => {
        const model = gltf.scene
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = material
            }
        })
        scene.add(model)
    },
    (progress) => {
        console.log('Loading model...', (progress.loaded / progress.total * 100) + '%')
    },
    (error) => {
        console.error('Error loading model:', error)
    }
)

// Post processing
let postProcessing = new THREE.PostProcessing(renderer)
const scenePass = pass(scene, camera)
const scenePassColor = scenePass.getTextureNode('output')

// Bloom parameters
const bloomParams = {
    intensity: 3.5,
    threshold: 0.4,
    radius: 1.2,
    exposure: 1.2
}

const bloomPass = bloom(
    scenePassColor,
    bloomParams.intensity,
    bloomParams.threshold,
    bloomParams.radius
)

postProcessing.outputNode = scenePassColor.add(bloomPass).mul(bloomParams.exposure)

// Update lighting
directionalLight.intensity = .5
directionalLight.position.set(5, 5, 5)
ambientLight.intensity = 0.2
scene.environmentIntensity = 2.0

/**
 * Animate
 */
const tick = () =>
{
    controls.update()
    postProcessing.renderAsync(scene, camera)
}
renderer.setAnimationLoop(tick)
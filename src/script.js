import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import {
    DepthOfFieldEffect,
    EffectComposer,
    EffectPass,
    RenderPass,
} from 'postprocessing'

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340, closeFolders: true })
gui.close()
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// // Axes helper
// const axesHelper = new THREE.AxesHelper()
// axesHelper.position.y += 0.25
// scene.add(axesHelper)

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(30, 30, 1024, 1024)
waterGeometry.deleteAttribute('normal') // not using these
waterGeometry.deleteAttribute('uv') // not using these

// Colors
debugObject.depthColor = '#151c37'
debugObject.surfaceColor = '#0b3c20'

gui.addColor(debugObject, 'depthColor').onChange(() => {
    waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor)
})
gui.addColor(debugObject, 'surfaceColor').onChange(() => {
    waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor)
})

// Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms: {
        uTime: { value: 0 },

        uBigWavesElevation: { value: 0.04 },
        uBigWavesFrequency: { value: new THREE.Vector2(3, 1) },
        uBigWavesSpeed: { value: 0.75 },

        uSmallWavesElevation: { value: 0.015 },
        uSmallWavesFrequency: { value: 5 },
        uSmallWavesSpeed: { value: 0.2 },
        uSmallIterations: { value: 4 },

        uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
        uColorOffset: { value: 0.3 },
        uColorMultiplier: { value: 0.9 },
    },
})

gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uBigWavesElevation')
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uBigWavesFrequencyX')
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uBigWavesFrequencyY')
gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value')
    .min(0)
    .max(4)
    .step(0.001)
    .name('uBigWavesSpeed')

gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uSmallWavesElevation')
gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value')
    .min(0)
    .max(30)
    .step(0.001)
    .name('uSmallWavesFrequency')
gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value')
    .min(0)
    .max(4)
    .step(0.001)
    .name('uSmallWavesSpeed')
gui.add(waterMaterial.uniforms.uSmallIterations, 'value')
    .min(0)
    .max(5)
    .step(1)
    .name('uSmallIterations')

gui.add(waterMaterial.uniforms.uColorOffset, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uColorOffset')
gui.add(waterMaterial.uniforms.uColorMultiplier, 'value')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uColorMultiplier')

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = -Math.PI * 0.5
scene.add(water)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
)
camera.position.set(5, 0.75, 5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableRotate = false
controls.enableZoom = false
controls.enablePan = false

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    powerPreference: 'high-performance',
    antialias: true,
    stencil: false,
    depth: false,
})
renderer.setClearColor('#010206') //background color
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Post processing
 */
const composer = new EffectComposer(renderer)
composer.preserveDrawingBuffer = true

composer.addPass(new RenderPass(scene, camera))

const dofEffect = new DepthOfFieldEffect(camera, {
    focusDistance: 0.065,
    focalLength: 0.15,
    bokehScale: 7.0,
})

// const dofPass = new EffectPass(camera, dofEffect)
// dofEffect.blendMode.opacity.value = 1.0
// dofEffect.renderToScreen = true
// composer.addPass(dofPass)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render composer
    composer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

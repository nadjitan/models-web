import {
  AmbientLight,
  AnimationMixer,
  Box3,
  Clock,
  DirectionalLight,
  GridHelper,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import Stats from "three/examples/jsm/libs/stats.module"

// Source: https://stackoverflow.com/a/63933117
type NonEmptyString<T> = T extends "" ? never : T

type RenderOptions = Partial<{
  /** If it is not set it will default to `<body>` */
  containerId: string
}>

export default class Render {
  #renderer = new WebGLRenderer()
  #container: HTMLElement
  #scene = new Scene()

  #directionalLight = new DirectionalLight(0xfffbdb, 0.5)
  #ambientLight = new AmbientLight(0xfffbdb, 1)
  #camera: PerspectiveCamera
  #controls: OrbitControls
  #assetLoader = new GLTFLoader()

  #clock = new Clock()
  #grid = new GridHelper(12, 12, 0x625834)
  #stats = Stats()

  constructor({ containerId = "" }: RenderOptions = {}) {
    const appendToBody = !containerId || containerId.length === 0

    this.#container = appendToBody
      ? document.body
      : document.getElementById(containerId!)!

    this.#camera = new PerspectiveCamera(
      45,
      this.#container.clientWidth / this.#container.clientHeight,
      0.1,
      1000
    )

    this.#controls = new OrbitControls(this.#camera, this.#container)

    this.#renderer.setSize(
      appendToBody ? window.innerWidth : this.#container.clientWidth,
      appendToBody ? window.innerHeight : this.#container.clientHeight
    )
    this.#renderer.setClearColor(0xfffbdb)
    this.#container.appendChild(this.#renderer.domElement)
    this.#container.appendChild(this.#stats.dom)

    this.#directionalLight.position.set(15, 15, 15)
    this.#directionalLight.castShadow = true

    this.#camera.position.set(15, 15, 15)
    this.#controls.update()

    this.#scene.add(this.#grid, this.#directionalLight, this.#ambientLight)

    window.onresize = () => {
      this.#camera.aspect = appendToBody
        ? window.innerWidth / window.innerHeight
        : this.#container.clientWidth / this.#container.clientHeight
      this.#camera.updateProjectionMatrix()

      this.#renderer.setSize(
        appendToBody ? window.innerWidth : this.#container.clientWidth,
        appendToBody ? window.innerHeight : this.#container.clientHeight
      )
    }
  }

  set directionalLight(intensity: number) {
    this.#directionalLight.intensity = intensity
  }

  /**
   * @param modelPath Path to a model with the extension. (e.g. `../models/dog.glb`)
   */
  setupObject<T extends string>(modelPath: NonEmptyString<T>) {
    if (!modelPath || modelPath.length === 0) return
    // REMOVE OBJECTS IN SCENE
    let objectsToRemove: Object3D[] = []
    this.#scene.traverse(
      node => node instanceof Mesh && objectsToRemove.push(node)
    )
    objectsToRemove.forEach(node => node.parent!.remove(node))

    // const buildingObj = new URL(
    //   this.#pathToModels + modelFile,
    //   import.meta.url
    // )

    let mixer: AnimationMixer

    this.#assetLoader.load(
      modelPath,
      gltf => {
        const model = gltf.scene
        // CENTER OBJECT
        const box3 = new Box3().setFromObject(model)
        const vector = new Vector3()
        box3.getCenter(vector)
        model.position.set(-vector.x, 0.2, -vector.z)

        this.#scene.add(model)
        mixer = new AnimationMixer(model)
        const clips = gltf.animations

        // Play a certain animation
        // const clip = THREE.AnimationClip.findByName(clips, 'HeadAction');
        // const action = mixer.clipAction(clip);
        // action.play();

        // Play all animations at the same time
        clips.forEach(clip => {
          const action = mixer.clipAction(clip)
          action.play()
        })
      },
      xhr => {
        // LOADING
        const loader = document.getElementById("loader-container")

        if (loader) {
          const progress = (xhr.loaded / xhr.total) * 100
          loader.textContent = progress.toFixed(0) + "%"

          if (progress >= 100) loader.style.display = "none"
        }
      },
      error => console.error(error)
    )

    this.#renderer.setAnimationLoop(() => {
      if (mixer) mixer.update(this.#clock.getDelta())
      this.#renderer.render(this.#scene, this.#camera)

      this.#stats.update()
    })
  }

  resetCamera() {
    this.#controls.reset()
    this.#camera.position.set(15, 15, 15)
    this.#controls.update()
  }
}

import {
  AnimationMixer,
  Clock,
  DirectionalLight,
  GridHelper,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import Stats from "three/examples/jsm/libs/stats.module"

// Source: https://stackoverflow.com/a/63933117
type NonEmptyString<T> = T extends "" ? never : T

export class Render {
  #renderer = new WebGLRenderer()
  #container = document.getElementById("renderer-container")!
  #scene = new Scene()

  #directionalLight = new DirectionalLight(0xffffff, 2)
  #camera = new PerspectiveCamera(
    45,
    this.#container.clientWidth / this.#container.clientHeight,
    0.1,
    1000
  )
  #orbit = new OrbitControls(this.#camera, this.#container)
  #assetLoader = new GLTFLoader()

  #grid = new GridHelper(3, 3)
  #clock = new Clock()
  #stats = Stats()

  constructor() {
    this.#renderer.setSize(
      this.#container.clientWidth,
      this.#container.clientHeight
    )
    this.#renderer.setClearColor(0xa3a3a3)
    this.#container.appendChild(this.#renderer.domElement)

    // LIGHTING
    this.#directionalLight.position.set(0, 32, 64)
    this.#scene.add(this.#directionalLight)

    this.#camera.position.set(4, 4, 4)

    this.#orbit.update()

    this.#scene.add(this.#grid)
    this.#container.appendChild(this.#stats.dom)

    window.onresize = () => {
      this.#camera.aspect =
        this.#container.clientWidth / this.#container.clientHeight
      this.#camera.updateProjectionMatrix()

      this.#renderer.setSize(
        this.#container.clientWidth,
        this.#container.clientHeight
      )
    }
  }

  /**
   * @param container The id of an element where the renderer will be appended to.
   * @returns
   */
  setupObject<T extends string>(container: NonEmptyString<T>) {
    if (!container || container.length === 0) return

    // REMOVE OBJECTS IN SCENE
    let objectsToRemove: Object3D[] = []
    this.#scene.traverse(node => {
      if (node instanceof Mesh) objectsToRemove.push(node)
    })
    objectsToRemove.forEach(node => node.parent!.remove(node))

    const buildingObj = new URL(`../models/${container}`, import.meta.url)
    let mixer: AnimationMixer

    this.#assetLoader.load(
      buildingObj.href,
      gltf => {
        const model = gltf.scene
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
      undefined,
      error => console.error(error)
    )

    this.#renderer.setAnimationLoop(() => {
      if (mixer) mixer.update(this.#clock.getDelta())
      this.#renderer.render(this.#scene, this.#camera)

      this.#stats.update()
    })
  }
}

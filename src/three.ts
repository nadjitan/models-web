import {
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

export default class Render {
  #pathToModels

  #renderer = new WebGLRenderer()
  #container: HTMLElement
  #scene = new Scene()

  #directionalLight = new DirectionalLight(0xffffff, 2)
  #camera: PerspectiveCamera
  #orbit: OrbitControls
  #assetLoader = new GLTFLoader()

  #clock = new Clock()
  #grid = new GridHelper(3, 3)
  #stats = Stats()

  constructor(options: {
    pathToModels: string
    /** If it is not set it will default to `<body>` */
    containerId?: string
  }) {
    let { pathToModels, containerId } = options
    const appendToBody = !containerId || containerId.length === 0
    this.#pathToModels = pathToModels

    this.#container = appendToBody
      ? document.body
      : document.getElementById(containerId!)!

    this.#camera = new PerspectiveCamera(
      45,
      this.#container.clientWidth / this.#container.clientHeight,
      0.1,
      1000
    )

    this.#orbit = new OrbitControls(this.#camera, this.#container)

    this.#renderer.setSize(
      appendToBody ? window.innerWidth : this.#container.clientWidth,
      appendToBody ? window.innerHeight : this.#container.clientHeight
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

  /**
   * @param modelFilename Filename of model with the extension. (e.g. "dog.glb")
   * @returns
   */
  setupObject<T extends string>(modelFilename: NonEmptyString<T>) {
    if (!modelFilename || modelFilename.length === 0) return
    // REMOVE OBJECTS IN SCENE
    let objectsToRemove: Object3D[] = []
    this.#scene.traverse(node => {
      if (node instanceof Mesh) objectsToRemove.push(node)
    })
    objectsToRemove.forEach(node => node.parent!.remove(node))

    const buildingObj = new URL(
      this.#pathToModels + modelFilename,
      import.meta.url
    )

    let mixer: AnimationMixer

    this.#assetLoader.load(
      buildingObj.href,
      gltf => {
        const model = gltf.scene
        // CENTER OBJECT
        // Source: https://discourse.threejs.org/t/calculate-position-of-object-based-on-center/16990/2
        const box3 = new Box3().setFromObject(model)
        const vector = new Vector3()
        box3.getCenter(vector)
        model.position.set(-vector.x, 0, -vector.z)

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
        const loader = document.querySelector(
          "#loader-container"
        ) as HTMLElement

        if (loader) {
          const progress = (xhr.loaded / xhr.total) * 100
          loader.textContent = progress.toFixed(0) + "%"

          if (progress === 100) loader.style.display = "none"
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
}

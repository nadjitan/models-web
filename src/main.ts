import "./style.css"
import Render from "./three"

const models = ["my_animated_rooster.glb", "soft_armchair.glb"]
const controlsEl = document.getElementById("controls")

const render = new Render({
  pathToModels: "/models/",
  containerId: "renderer-container",
})
render.setupObject(models[0])

const loader = document.querySelector("#loader-container") as HTMLElement

models.forEach(str => {
  const btn = document.createElement("button")
  btn.textContent = str

  btn.onclick = () => {
    render.setupObject(str)
    loader.style.display = "flex"
  }

  controlsEl?.prepend(btn)
})

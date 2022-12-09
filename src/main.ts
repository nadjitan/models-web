import "./style.css"
import Render from "./three"
import model1 from "../models/my_animated_rooster.glb"
import model2 from "../models/soft_armchair.glb"

const models = [model1, model2]
const controlsEl = document.getElementById("controls")

const render = new Render({
  containerId: "renderer-container",
})
render.setupObject(models[0])

const loader = document.querySelector("#loader-container") as HTMLElement

models.forEach(str => {
  const btn = document.createElement("button")
  btn.textContent = str.substring(str.lastIndexOf("/") + 1)

  btn.onclick = () => {
    render.setupObject(str)
    loader.style.display = "flex"
  }

  controlsEl?.prepend(btn)
})

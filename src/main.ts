import "./style.css"
import { Render } from "./three"

const models = ["my_animated_rooster.glb", "soft_armchair.glb"]
const controlsEl = document.getElementById("controls")

const render = new Render()
render.setupObject(models[0])

models.forEach(str => {
  const btn = document.createElement("button")
  btn.textContent = str

  btn.onclick = () => {
    render.setupObject(str)
  }

  controlsEl?.appendChild(btn)
})

import "./style.css"
import Render from "./three"
import model1 from "../models/ac_-_alfa_romeo_155_v6_ti.glb"
import model2 from "../models/windmill.glb"

const models = [model1, model2]
const controlsEl = document.getElementById("controls")
const loader = document.getElementById("loader-container")!

const render = new Render({ containerId: "renderer-container" })
render.setupObject(models[0])

models.forEach(str => {
  const btn = document.createElement("button")
  const fileName = str.substring(str.lastIndexOf("/") + 1)
  btn.textContent = fileName

  btn.onclick = () => {
    render.setupObject(str)
    loader.style.display = "flex"

    if (fileName === "windmill.glb") {
      render.directionalLight = 1.5
    } else {
      render.directionalLight = 0.5
    }
  }

  controlsEl?.prepend(btn)
})

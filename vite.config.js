import { defineConfig } from "vite"

export default defineConfig({
  base: "/models-web/",
  assetsInclude: ["**/*.glb"],
  server: {
    port: 3000,
  },
})

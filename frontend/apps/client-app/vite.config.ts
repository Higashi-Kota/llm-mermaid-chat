import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV !== "production"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: resolve(__dirname, "./src") },
      // In dev mode, resolve to source for HMR
      ...(isDev
        ? [
            {
              find: "@mermaid-chat/mermaid",
              replacement: resolve(__dirname, "../../packages/mermaid/src"),
            },
            {
              find: "@mermaid-chat/chat",
              replacement: resolve(__dirname, "../../packages/chat/src"),
            },
            {
              find: "@mermaid-chat/types",
              replacement: resolve(__dirname, "../../packages/types/src"),
            },
          ]
        : []),
    ],
  },
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
})

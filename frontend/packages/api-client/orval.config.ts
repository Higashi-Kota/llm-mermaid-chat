import { defineConfig } from "orval"

export default defineConfig({
  mermaidChat: {
    input: {
      target: "../../../specs/tsp-output/openapi.yaml",
    },
    output: {
      clean: true,
      mode: "tags-split",
      target: "./src/generated/endpoints",
      schemas: "./src/generated/models",
      client: "fetch",
      httpClient: "fetch",
      mock: false,
      override: {
        mutator: {
          path: "./src/fetcher.ts",
          name: "customInstance",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "pnpm run format",
    },
  },
})

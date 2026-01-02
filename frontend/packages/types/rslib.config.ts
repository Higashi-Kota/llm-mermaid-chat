import { defineConfig } from "@rslib/core"

const isProduction = process.env.NODE_ENV === "production"
const isDevelopment = process.env.NODE_ENV !== "production"

export default defineConfig({
  lib: [
    {
      format: "esm",
      syntax: "esnext",
      dts: true,
      bundle: true,
      output: {
        minify: isProduction,
        sourceMap: isDevelopment,
      },
    },
  ],
  source: {
    entry: {
      index: "src/index.ts",
    },
    tsconfigPath: "./tsconfig.json",
  },
  output: {
    distPath: {
      root: "dist",
    },
    cleanDistPath: "auto",
  },
})

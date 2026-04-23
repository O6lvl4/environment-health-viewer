/// <reference types="vitest" />
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/application/**"],
      reporter: ["text", "html"],
    },
  },
});

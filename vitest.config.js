const { defineConfig } = require("vitest/config")
const path = require("path")
const react = require("@vitejs/plugin-react")

module.exports = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
    // 12 parallel jsdom fork workers exhaust memory on this machine and
    // randomly fail to start ("Failed to start forks worker").
    maxWorkers: 4,
  },
})

const { defineConfig } = require("vitest/config")

module.exports = defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    globals: true,
  },
})

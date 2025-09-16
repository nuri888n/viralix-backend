const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: {
    ...tsJestTransformCfg,
  },
};
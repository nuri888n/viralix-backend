// eslint.config.mjs
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts"],
    ignores: ["node_modules/**", "dist/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.node,
        console: "readonly",
        setTimeout: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Basis-Regel aus @eslint/js deaktivieren → sonst doppelte Fehler
      "no-unused-vars": "off",

      // TS-Variante aktivieren
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      // nervige Regel deaktivieren, die Type-Checking will
      "@typescript-eslint/await-thenable": "off",
    },
  },

  // Extra-Block für Tests (Jest)
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
];
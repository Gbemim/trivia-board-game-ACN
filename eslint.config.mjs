import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // JavaScript base rules
  js.configs.recommended,
  
  // TypeScript rules
  ...tseslint.configs.recommended,
  
  // Project-specific configuration
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,  // Node.js globals (process, Buffer, etc.)
        ...globals.es2022 // Modern JavaScript globals
      },
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      // Custom rules for your project
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  
  // Ignore patterns
  {
    ignores: ["dist/**", "node_modules/**", "*.js"]
  }
];

// ESLint "flat config": an array of rule layers, applied top to bottom.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // 1. Never lint generated or third-party files.
  { ignores: ["**/node_modules/", "**/dist/", "**/build/", "docs/"] },

  // 2. Base rules: plain JS mistakes, then TypeScript mistakes that need type info.
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // 3. Tell ESLint where to find type info, and which globals exist (process, console…).
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    rules: {
      // Convention: a leading underscore means "unused on purpose" (e.g. Express's _next).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Plain .js files (like this config) aren't part of any tsconfig, so skip type-aware rules.
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },

  // 4. Last: turn off any rule that would fight with Prettier's formatting.
  prettier,
);

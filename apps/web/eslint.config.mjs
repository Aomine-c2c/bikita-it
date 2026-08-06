import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { 
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    } 
  },
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "src-tauri/**", "temp_tauri/**"]),
]);
export default eslintConfig;

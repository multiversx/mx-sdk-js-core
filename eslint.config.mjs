// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    // Flat config does not read .gitignore, so every non-source folder is listed here.
    globalIgnores([
        "node_modules",
        "out",
        "out-tests",
        "out-browser",
        "out-browser-tests",
        "cookbook",
        "package-tests",
        "src/proto/compiled.js",
        "eslint.config.mjs",
    ]),
    tseslint.configs.recommended,
    prettier,
    {
        languageOptions: {
            globals: { ...globals.node },
            parserOptions: { project: ["tsconfig.json", "tsconfig.tests.json"] },
        },
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-use-before-define": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-namespace": "warn",
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "prefer-const": "off",
        },
    },
    {
        // chai assertions such as `expect(x).to.be.true` are expressions by design.
        files: ["**/*.spec.ts"],
        rules: { "@typescript-eslint/no-unused-expressions": "off" },
    },
);

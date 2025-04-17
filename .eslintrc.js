module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["tsconfig.json", "tsconfig.tests.json"],
        sourceType: "module",
    },
    plugins: ["@typescript-eslint/eslint-plugin"],
    extends: ["plugin:@typescript-eslint/eslint-recommended", "plugin:@typescript-eslint/recommended", "prettier"],
    root: true,
    env: {
        node: true,
    },
    ignorePatterns: [
        ".eslintrc.js",
        "node_modules",
        "out",
        "out-tests",
        "out-browser",
        "out-browser-tests",
        "cookbook",
    ],
    rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/quotes": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-namespace": "warn",
        "@typescript-eslint/no-var-requires": "warn",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
            },
        ],
        "prefer-const": "off",
    },
};

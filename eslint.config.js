import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: [
            ".claude/**",
            "dist/**",
            "dist-electron/**",
            "node_modules/**",
            "src-tauri/target/**",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{cjs,js,jsx,mjs,ts,tsx}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            "react-hooks": reactHooks,
        },
        rules: {
            "no-case-declarations": "off",
            "no-console": "off",
            "no-empty": "off",
            "no-undef": "off",
            "no-useless-escape": "off",
            "no-unused-vars": "off",
            "no-var": "off",
            "prefer-const": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-wrapper-object-types": "off",
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
];

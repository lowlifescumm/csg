import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
        baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("eslint-config-next/core-web-vitals"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "app__disabled/**",
      "next-env.d.ts",
    ],
    rules: {
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
];

export default eslintConfig;

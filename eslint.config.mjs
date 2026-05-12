const eslintConfig = {
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
    "no-console": ["error", { "allow": ["trace"] }],
  },
};

export default eslintConfig;

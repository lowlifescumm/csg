import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'app__disabled/**',
      'next-env.d.ts',
      'scripts/**',
      '__tests__/**',
      'test/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
      'no-console': ['error', { allow: ['trace'] }],
    },
  },
  {
    files: ['lib/logger.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['app/**/page.js', 'app/**/page.jsx', 'components/**/*.js', 'components/**/*.jsx'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default eslintConfig;

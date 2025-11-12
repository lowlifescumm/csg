import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const config = [
  ...compat.extends('eslint-config-next/core-web-vitals'),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'eslint.migration.config.mjs'],
  },
  {
    files: ['app__disabled/**/*.{js,jsx}'],
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      '@next/next/no-sync-scripts': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/alt-text': 'off',
    },
  },
  {
    files: ['app/page.{js,jsx}', 'app/layout.{js,jsx}', 'app/**/page.{js,jsx}', 'app/**/layout.{js,jsx}'],
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['lib/transit-engine.js', 'lib/transit-monitor.js'],
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    files: [
      'app/admin/**/*.{js,jsx}',
      'app/blog/**/*.{js,jsx}',
      'app/forecasts/**/*.{js,jsx}',
      'app/transits/**/*.{js,jsx}',
      'app/reset-password/**/*.{js,jsx}',
      'app/login/**/*.{js,jsx}',
      'app/credits/**/*.{js,jsx}',
      'app/birth-chart/**/*.{js,jsx}',
      'app/moon-reading/**/*.{js,jsx}',
      'app/my-chart/**/*.{js,jsx}',
    ],
    rules: {
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['app/layout.{js,jsx}'],
    rules: {
      '@next/next/no-sync-scripts': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  },
]

export default config

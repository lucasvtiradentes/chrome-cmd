/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check
const { defineConfig } = require('eslint-define-config');

/// <reference types="@eslint-types/typescript-eslint" />
module.exports = defineConfig({
  root: true,
  env: {
    es2020: true
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022
  },
  plugins: ['eslint-plugin-import-helpers', 'unused-imports'],
  rules: {
    // ORDER IMPORTS BY GROUP
    'import-helpers/order-imports': [
      'warn',
      {
        newlinesBetween: 'always',
        groups: ['module', '/^@\\//', ['parent', 'sibling'], 'index']
      }
    ],

    // REMOVE UNUSED IMPORTS
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_'
      }
    ]
  },
  overrides: [
    {
      files: ['packages/ui/**'],
      env: {
        browser: true
      },
      extends: ['plugin:react-hooks/recommended', 'plugin:react/recommended', 'plugin:tailwindcss/recommended'],
      plugins: ['react', 'react-hooks', 'react-refresh', 'tailwindcss'],
      settings: {
        react: {
          version: 'detect'
        }
      },
      rules: {
        // DISABLED RULES
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',

        // REACT HOT REFRESH
        'react-refresh/only-export-components': ['error', { allowExportNames: ['metadata'] }],

        // REACT GOOD PRACTICES
        'react/button-has-type': 'error',
        'react-hooks/exhaustive-deps': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react/jsx-key': ['error', { checkFragmentShorthand: true }],

        // NO UNFOUND TAILWIND CLASSES
        'tailwindcss/no-custom-classname': [
          'warn',
          {
            config: './packages/ui/tailwind.config.ts',
            cssFiles: [],
            callees: ['twMerge', 'cva'],
            whitelist: ['debug', 'anchor', 'callout', 'progress', 'bg-gradient', 'bg-stars']
          }
        ]
      }
    }
  ]
});

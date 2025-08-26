/* eslint-disable @typescript-eslint/no-require-imports */
const js = require('@eslint/js')
const typescript = require('typescript-eslint')
const prettier = require('eslint-plugin-prettier')
const vitestGlobals = require('eslint-plugin-vitest-globals')
const globals = require('globals')

module.exports = [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: ['node_modules/**', 'build/**', 'dist/**'],
  },

  // Configuration for CommonJS files (.cjs)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-commonjs': 'off',
    },
  },

  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript configuration
  ...typescript.configs.recommended,

  // Configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...vitestGlobals.environments.env.globals,
      },
    },
    plugins: {
      '@typescript-eslint': typescript.plugin,
      prettier,
      'vitest-globals': vitestGlobals,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': ['error', { endOfLine: 'auto', singleQuote: true }],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // Disable problematic rules
      'require-jsdoc': 'off',
      'new-cap': 'off',
      camelcase: 'off',

      // Google style guide rules (manual implementation of key rules)
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
]

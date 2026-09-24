import js from '@eslint/js'
import globals from 'globals'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

// Flat-config port of the previous .eslintrc. The .mjs extension is required:
// this package is "type": "module".
export default [
  {
    ignores: ['coverage/**'],
  },
  js.configs.recommended,
  prettierRecommended,
  {
    // The lint script previously passed --ext .js,.cjs, which eslint 9 removed.
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
]

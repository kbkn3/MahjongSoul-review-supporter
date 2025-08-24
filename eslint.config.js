import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  // 基本設定：全ファイル
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-wxt/**',
      '**/build/**',
      '**/.wxt/**',
      '**/coverage/**',
      '**/archive/**',
      '**/*.log'
    ]
  },

  // JavaScript/Vue基本設定
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  // 全ファイル共通設定
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions,
        chrome: 'readonly',
        browser: 'readonly'
      }
    },
    rules: {}
  },

  // TypeScriptファイル設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },

  // テストファイル設定
  {
    files: ['tests/**/*.js', 'tests/**/*.ts', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },

  // Vueファイル設定
  {
    files: ['**/*.vue'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions
      }
    },
    rules: {
      // Vue3固有のルール
      'vue/multi-word-component-names': 'off'
    }
  }
];
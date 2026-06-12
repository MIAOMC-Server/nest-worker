// eslint.config.mjs
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'

export default [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            '**/*.min.js',
            'generated/**',

            // lock files
            'bun.lock',
            'bun.lockb',
            'package-lock.json',
            'yarn.lock',
            'pnpm-lock.yaml'
        ]
    },
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2022
            },
            globals: {
                ...globals.node
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    args: 'after-used',
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_',
                    ignoreRestSiblings: true
                }
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-empty-function': 'off'
        }
    },
    {
        files: ['**/test/**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/*.{spec,test}.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest
            }
        }
    },
    {
        plugins: {
            'simple-import-sort': simpleImportSortPlugin
        },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error'
        }
    },
    prettierConfig,
    {
        plugins: {
            prettier: prettierPlugin
        },
        rules: {
            'prettier/prettier': 'error'
        }
    },
    {
        plugins: { 'unused-imports': unusedImports },
        rules: {
            'unused-imports/no-unused-imports': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-vars': [
                'warn',
                { vars: 'all', args: 'after-used', varsIgnorePattern: '^_', argsIgnorePattern: '^_' }
            ]
        }
    }
]

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
  ],
  plugins: ['@typescript-eslint', 'prettier', 'simple-import-sort'],
  env: {
    jest: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-use-before-define': ['error', { variables: false, functions: false }],
    '@typescript-eslint/no-var-requires': 'off',
    'import/order': 'off',
    'no-console': 'error',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        bracketSpacing: true,
        semi: false,
        printWidth: 100,
      },
    ],
    'simple-import-sort/sort': 'error',
    'sort-imports': 'off',
  },
};

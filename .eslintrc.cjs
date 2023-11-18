/* eslint-disable no-unused-vars, no-multi-spaces */
const OFF       = 0;
const WARNING   = 1;
const ERROR     = 2;
/* eslint-enable no-unused-vars, no-multi-spaces */

module.exports = {
  env: {
    amd: true,
    browser: true,
  },
  extends: [
    './node_modules/eslint-config-airbnb-base/rules/best-practices',
    './node_modules/eslint-config-airbnb-base/rules/errors',
    './node_modules/eslint-config-airbnb-base/rules/node',
    './node_modules/eslint-config-airbnb-base/rules/style',
    './node_modules/eslint-config-airbnb-base/rules/variables',
    './node_modules/eslint-config-airbnb-base/rules/es6',
    './node_modules/eslint-config-airbnb-base/rules/strict',
  ].map(require.resolve),
  globals: {},
  parserOptions: {
    ecmaVersion: 'latest',
    // sourceType: 'commonjs',
  },
  rules: {
    'default-case': OFF,
    'function-paren-newline': OFF,
    'max-len': OFF,
    'no-param-reassign': OFF,
    'no-plusplus': OFF,
    'no-underscore-dangle': OFF,
    'no-use-before-define': OFF,
    'object-curly-newline': [ERROR, {
      ImportDeclaration: {
        multiline: true,
        minProperties: 5,
      },
    }],
  },
  overrides: [{
    files: ['**/*.test.js'],
    // env: {
    //   'jest/globals': true,
    // },
    globals: {
      describe: 'readonly',
      it: 'readonly',
      expect: 'readonly',
    },
  }],
};

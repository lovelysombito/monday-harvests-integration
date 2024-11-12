module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        mocha: true,
    },
    extends: 'eslint:recommended',
    overrides: [],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'no-unused-vars': 0,
        'no-prototype-builtins': 0,
    },
};

const path = require('path');

module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-test-renderer$': '<rootDir>/node_modules/react-test-renderer',
    '^react-native($|/.*)': `${path.dirname(require.resolve('react-native'))}/$1`,
    '^@react-native-clipboard/clipboard$': '<rootDir>/__mocks__/clipboard.js',
    '^react-native-svg$': '<rootDir>/__mocks__/svg.js',
    '^react-native-svg/(.*)$': '<rootDir>/__mocks__/svg.js',
    '^react-native-linear-gradient$': '<rootDir>/__mocks__/linearGradient.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-linear-gradient)/)',
  ],
};


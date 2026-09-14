module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ...(process.env.E2E_COVERAGE === 'true' ? ['istanbul'] : []),
  ],
};


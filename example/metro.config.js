if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

const util = require('util');
if (!util.styleText) {
  util.styleText = function(format, text) {
    return text;
  };
}

const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(root, 'node_modules'),
    ],
    // Force all modules to resolve to the example app's node_modules to avoid duplicates
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => path.join(__dirname, 'node_modules', name),
      }
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

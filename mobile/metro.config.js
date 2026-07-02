const { loadProjectEnv } = require('../env/load-env.cjs');

loadProjectEnv('mobile');

const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// Keep Node server code out of the Expo bundle.
// Ignore native build trees inside node_modules (Gradle/Xcode intermediates are
// ephemeral and crash Metro's watcher with ENOENT when dirs are deleted mid-build).
config.resolver.blockList = exclusionList([
  /[/\\]server[/\\].*/,
  /[/\\]node_modules[/\\].*[/\\]android[/\\].*/,
  /[/\\]node_modules[/\\].*[/\\]ios[/\\].*/,
]);

module.exports = config;

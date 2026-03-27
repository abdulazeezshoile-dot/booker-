/** @type {import('expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Exclude backend and other non-JS folders from file watching
  // Prevents Metro timeout on Windows when watching monorepo trees
  config.resolver.blockList = [
    /\/backend\/.*/,
    /\/\.git\/.*/,
  ];

  return config;
})();

// Suppress Web3 source map warnings in development
const { override, addWebpackModuleRule } = require('customize-cra');

module.exports = override(
  addWebpackModuleRule({
    test: /\.js$/,
    enforce: 'pre',
    use: ['source-map-loader'],
    exclude: [
      /node_modules\/web3/,
      /node_modules\/@web3js/,
      /node_modules\/ethers/,
      /node_modules\/@ethersproject/
    ],
  }),
  (config) => {
    // Ignore source map warnings from Web3 dependencies
    if (config.ignoreWarnings) {
      config.ignoreWarnings = config.ignoreWarnings.concat([
        {
          module: /web3/,
        },
        {
          module: /@web3js/,
        },
        {
          message: /Failed to parse source map/,
        },
      ]);
    } else {
      config.ignoreWarnings = [
        {
          module: /web3/,
        },
        {
          module: /@web3js/,
        },
        {
          message: /Failed to parse source map/,
        },
      ];
    }
    return config;
  }
);
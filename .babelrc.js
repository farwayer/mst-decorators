module.exports = {
  presets: [
    ['@babel/env', {targets: {node: 'current'}, shippedProposals: true}],
  ],
  plugins: [
    '@babel/proposal-decorators',
    ['@babel/proposal-class-properties', {loose: true}],
    // '@babel/transform-runtime',
  ],
};

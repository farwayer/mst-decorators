const esm = !!process.env.ESM

module.exports = {
  presets: [
    ['@babel/preset-env', {...(esm ? {modules: false} : {})}],
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', {legacy: true}],
    ['@babel/plugin-proposal-class-properties', {loose: true}],
    ['@babel/plugin-transform-runtime', {useESModules: esm}],
  ],
}

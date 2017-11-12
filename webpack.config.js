const path = require('path')

module.exports = {
  entry: ['./test.js'],
  module: {
    rules: [{
      test: /\.swagger(json|ya?ml)?$/,
      use: [{
        loader: path.resolve('index.js'),
        options: {/* ... */}
      }]
    }]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'out')
  }
}

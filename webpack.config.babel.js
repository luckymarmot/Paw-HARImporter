import webpack from 'webpack'
import path from 'path'

const name = 'HARImporter'

const production = process.env.NODE_ENV === 'production'

const config = {
  target: 'node-webkit',
  entry: {
    main: `./src/HarImporter.js`
  },
  output: {
    path: path.resolve(__dirname, `./build/com.luckymarmot.PawExtensions.${name}`),
    publicPath: '/build/',
    filename: `${name}.js`
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'src'),
        ],
        test: /\.js$/,
      }
    ]
  }
}

export default config

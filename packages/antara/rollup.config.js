// @ts-check
import path from 'path';
import esbuild from 'rollup-plugin-esbuild';
import resolve from 'rollup-plugin-node-resolve';
const packageJSON = require("./package.json");

export default {
  input: path.join(__dirname, 'lib', 'index.ts'),
  treeshake: false,
  output: {
    dir: path.join(__dirname, 'dist'),
    format: 'es',
  },
  plugins: [
    esbuild({
      // All options are optional
      include: /\.[jt]sx?$/, // default, inferred from `loaders` option
      exclude: /node_modules/, // default
      sourceMap: false, // by default inferred from rollup's `output.sourcemap` option
      minify: process.env.NODE_ENV === 'production',
      target: 'es2017', // default, or 'es20XX', 'esnext'
      jsx: 'transform', // default, or 'preserve'
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      // Like @rollup/plugin-replace
      define: {
        __VERSION__: `"${packageJSON.version}"`,
      },
      tsconfig: 'tsconfig.json', // default
      // Add extra loaders
      loaders: {
        // Add .json files support
        // require @rollup/plugin-commonjs
        '.json': 'json'
      },
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    })
  ],
}
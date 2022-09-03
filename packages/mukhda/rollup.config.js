// @ts-check
import path from 'path';
import fs from 'fs';
import esbuild from 'rollup-plugin-esbuild';
import resolve from 'rollup-plugin-node-resolve';
import os from 'os';
import {liveServer} from 'rollup-plugin-live-server';
import copyPlugin from 'rollup-plugin-copy';
const packageJSON = require("./package.json");

const isProduction = process.env.NODE_ENV === 'production';

const shouldRunAlongside = !!process.env.BUNDLED_BUILD;

const DEFAULT_DIRECTORY = path.join( os.homedir(), ".chitrakar", "mukhda");

if (shouldRunAlongside) {
  if (!fs.existsSync(DEFAULT_DIRECTORY)) fs.mkdirSync(DEFAULT_DIRECTORY, { recursive: true })
}

const plugins = [
  esbuild({
    // All options are optional
    include: /\.[jt]sx?$/, // default, inferred from `loaders` option
    exclude: /node_modules/, // default
    sourceMap: false, // by default inferred from rollup's `output.sourcemap` option
    minify: isProduction,
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
      '.json': 'json',
      // Enable JSX in .js files too
      '.js': 'jsx',
    },
  }),
  resolve({
    jsnext: true,
    main: true,
    browser: true,
  }),
];

if (!isProduction) {
  plugins.push(
    liveServer({
      port: 8001,
      host: "0.0.0.0",
      file: "index.html",
      mount: [['/dist', './dist'], ['/src', './src'], ['/node_modules', './node_modules']],
      open: false,
      wait: 500
    })
  )
}

if (shouldRunAlongside) {
  plugins.push(
    copyPlugin({
      overwrite: true,
      targets: [
        { src: "index.html", dest: DEFAULT_DIRECTORY },
        { src: "./dist/**/*", dest: path.join(DEFAULT_DIRECTORY, "dist") }
      ]
    })
  )
}

export default {
  input: path.join(__dirname, 'lib', 'index.ts'),
  treeshake: false,
  output: {
    dir: path.join(__dirname, 'dist'),
    format: 'es',
  },
  plugins: plugins,
}
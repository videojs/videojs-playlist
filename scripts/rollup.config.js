/**
 * Rollup configuration for packaging the plugin in various formats.
 */
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const multiEntry = require('rollup-plugin-multi-entry');
const resolve = require('rollup-plugin-node-resolve');
const {uglify} = require('rollup-plugin-uglify');
const {minify} = require('uglify-es');
const pkg = require('../package.json');

/* General Globals */
const moduleName = 'videojsPlaylist';
const pluginName = 'videojs-playlist';
const mainFile = 'src/plugin.js';
const banner = `/*! @name ${pkg.name} @version ${pkg.version} @license ${pkg.license} */`;

/* configuration for plugins */
const primedPlugins = {
  babel: babel({
    babelrc: false,
    exclude: 'node_modules/**',
    presets: [
      ['env', {loose: true, modules: false, targets: {browsers: pkg.browserslist}}]
    ],
    plugins: [
      'external-helpers',
      'transform-object-assign'
    ]
  }),
  commonjs: commonjs({sourceMap: false}),
  json: json(),
  multiEntry: multiEntry({exports: false}),
  resolve: resolve({browser: true, main: true, jsnext: true}),
  uglify: uglify({output: {comments: 'some'}}, minify)
};

// to prevent a screen during rollup watch/build
process.stderr.isTTY = false;

let isWatch = false;

process.argv.forEach((a) => {
  if ((/-w|--watch/).test(a)) {
    isWatch = true;
  }
});

// globals, aka replace require calls
// with this
const globals = {
  umd: {
    'video.js': 'videojs',
    'global': 'window',
    'global/window': 'window',
    'global/document': 'document'
  },
  module: {
    'video.js': 'videojs'
  },
  test: {
    'qunit': 'QUnit',
    'qunitjs': 'QUnit',
    'sinon': 'sinon',
    'video.js': 'videojs'
  }
};

// externals, aka don't bundle there
// and if not listed as a global don't require
// them either
const externals = {
  umd: Object.keys(globals.umd).concat([

  ]),
  module: Object.keys(globals.module).concat([

  ]),
  test: Object.keys(globals.test).concat([

  ])
};

/* plugins that should be used in each bundle with caveats as comments */
const plugins = {
  // note uglify will be added before babel for minified bundle
  // see minPlugins below
  umd: [
    primedPlugins.resolve,
    primedPlugins.json,
    primedPlugins.commonjs,
    primedPlugins.babel
  ],

  // note babel will be removed for es module bundle
  // see esPlugins below
  module: [
    primedPlugins.resolve,
    primedPlugins.json,
    primedPlugins.commonjs,
    primedPlugins.babel
  ],

  test: [
    primedPlugins.multiEntry,
    primedPlugins.resolve,
    primedPlugins.json,
    primedPlugins.commonjs,
    primedPlugins.babel
  ]
};

// clone module plugins, remove babel
const esPlugins = plugins.module.slice();

esPlugins.splice(plugins.module.indexOf(primedPlugins.babel), 1);

// clone umd plugins, remove babel, add uglify then babel
const minPlugins = plugins.umd.slice();

minPlugins.splice(plugins.umd.indexOf(primedPlugins.babel), 1);
minPlugins.push(primedPlugins.uglify);
minPlugins.push(primedPlugins.babel);

const builds = [{
  // umd
  input: mainFile,
  output: {
    name: moduleName,
    file: `dist/${pluginName}.js`,
    format: 'umd',
    globals: globals.umd,
    banner
  },
  external: externals.umd,
  plugins: plugins.umd
}, {
  // cjs
  input: mainFile,
  output: [{
    file: `dist/${pluginName}.cjs.js`,
    format: 'cjs',
    globals: globals.module,
    banner
  }],
  external: externals.module,
  plugins: plugins.module
}, {
  // es
  input: mainFile,
  output: [{
    file: `dist/${pluginName}.es.js`,
    format: 'es',
    globals: globals.module,
    banner
  }],
  external: externals.module,
  plugins: esPlugins
}, {
  // test bundle
  input: 'test/**/*.test.js',
  output: {
    name: `${moduleName}Tests`,
    file: 'test/dist/bundle.js',
    format: 'iife',
    globals: globals.test
  },
  external: externals.test,
  plugins: plugins.test
}];

if (!isWatch) {
  builds.push({
    // minified umd
    input: mainFile,
    output: {
      name: moduleName,
      file: `dist/${pluginName}.min.js`,
      format: 'umd',
      globals: globals.umd,
      banner
    },
    external: externals.umd,
    plugins: minPlugins
  });
}

export default builds;

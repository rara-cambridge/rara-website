// webpack.config.js (production-ready minification + TS + React)

const path = require('path');
const fs = require('fs');
const { execFileSync, execSync } = require('child_process');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin');

// Optional plugins
let ForkTsCheckerWebpackPlugin = null;
try {
  ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
} catch {}
let ReactRefreshWebpackPlugin = null;
try {
  ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
} catch {}

function getCommitHash() {
  const status = execSync('git status --porcelain').toString('utf8').trim();
  let commit = execSync('git rev-parse HEAD').toString('utf8').trim();
  if (status) commit += '-dirty';
  return commit;
}

const isDev = process.env.NODE_ENV === 'development';
const minify = !isDev || process.env.WEBPACK_MINIFY === '1';
const commit = getCommitHash();
const banner = `Built from commit: ${commit}`;

const dataDir = path.resolve(__dirname, 'data');
const script = path.resolve(__dirname, 'scripts/compose.js');
const tpl = path.resolve(dataDir, 'data.json.hbs');
const emittedAssetPath = 'data.json';

// ComposeJsonPlugin (same as before)
const ComposeJsonPlugin = {
  apply(compiler) {
    const projectRoot = __dirname;
    compiler.hooks.thisCompilation.tap('ComposeJsonPlugin', (compilation) => {
      compilation.contextDependencies.add(dataDir);
      const { RawSource } = webpack.sources;

      compilation.hooks.processAssets.tapPromise(
        { name: 'ComposeJsonPlugin', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS },
        async () => {
          const tmpOut = path.resolve(projectRoot, 'build', '.__data_temp.json');
          try {
            fs.mkdirSync(path.dirname(tmpOut), { recursive: true });
            execFileSync(process.execPath, [script, tpl, tmpOut], { stdio: 'inherit' });
            const content = fs.readFileSync(tmpOut);
            compilation.emitAsset(emittedAssetPath, new RawSource(content));
            try {
              fs.unlinkSync(tmpOut);
            } catch {}
          } catch (err) {
            console.error('ComposeJsonPlugin failed', err);
            throw err;
          }
        }
      );
    });
  },
};

// TypeScript detection
const hasTsConfig = fs.existsSync(path.resolve(__dirname, 'tsconfig.json'));
const hasAnyTsFile = !!['src', '.'].some((dir) => {
  try {
    return fs
      .readdirSync(path.resolve(__dirname, dir))
      .some((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  } catch {
    return false;
  }
});
const useTypeScript = hasTsConfig || hasAnyTsFile;

const baseConfig = {
  mode: isDev ? 'development' : 'production',
  entry: {
    app: './app/index.tsx',
    lib: './lib/index.ts',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    publicPath: isDev ? '/build/' : '/',
    library: { name: 'raraMaps', type: 'window' },
    clean: true,
  },
  resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },

  module: {
    rules: [
      // JS/TS via Babel
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              ...(useTypeScript ? [['@babel/preset-typescript']] : []),
            ],
            plugins: [
              // Only in dev: React Refresh
              ...(isDev && ReactRefreshWebpackPlugin
                ? [require.resolve('react-refresh/babel')]
                : []),
              // Always: Babel runtime helpers
              ['@babel/plugin-transform-runtime', { regenerator: true }],
            ],
          },
        },
      },

      // CSS modules
      {
        test: /\.module\.css$/i,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              esModule: false,
              modules: { localIdentName: isDev ? '[path][name]__[local]' : '[hash:base64]' },
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: { postcssOptions: { plugins: [['autoprefixer']] } },
          },
        ],
      },

      // Global CSS
      {
        test: /\.css$/i,
        exclude: /\.module\.css$/i,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: { postcssOptions: { plugins: [['autoprefixer']] } },
          },
        ],
      },

      { enforce: 'pre', test: /\.js$/, use: ['source-map-loader'] },
    ],
  },

  externals: isDev
    ? {}
    : {
        'maplibre-gl': 'maplibregl', // global variable name from CDN
        '@turf/turf': 'turf', // global variable name from CDN
      },

  optimization: {
    minimize: minify,
    minimizer: minify
      ? [
          new TerserPlugin({
            extractComments: false,
            parallel: true,
            terserOptions: {
              compress: { defaults: true },
              mangle: true,
              format: { comments: false },
            },
            exclude: /node_modules/,
          }),
          new JsonMinimizerPlugin(),
        ]
      : [],
  },

  plugins: [
    ComposeJsonPlugin,
    new webpack.BannerPlugin({ banner }),
    ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: 'bundle.css' })]),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, 'data/style.json'), to: '.' }],
    }),
    ...(useTypeScript && ForkTsCheckerWebpackPlugin
      ? [
          new ForkTsCheckerWebpackPlugin({
            async: isDev,
            typescript: {
              configFile: hasTsConfig ? path.resolve(__dirname, 'tsconfig.json') : undefined,
            },
          }),
        ]
      : []),
    ...(isDev && ReactRefreshWebpackPlugin ? [new ReactRefreshWebpackPlugin()] : []),
  ],

  devtool: minify ? false : 'eval-source-map',

  ...(isDev
    ? {
        devServer: {
          static: [
            { directory: path.resolve(__dirname, 'assets'), publicPath: '/assets' },
            { directory: path.resolve(__dirname, 'test'), publicPath: '/test' },
          ],
          hot: true,
          port: 3000,
          devMiddleware: { publicPath: '/build/' },
        },
      }
    : {}),
};

module.exports = baseConfig;

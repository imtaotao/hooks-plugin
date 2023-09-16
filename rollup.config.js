import path from 'path';
import json from '@rollup/plugin-json';
import cleanup from 'rollup-plugin-cleanup';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { version } from './package.json';

const banner =
  '/*!\n' +
  ` * hooksPlugin.js v${version}\n` +
  ` * (c) 2023-${new Date().getFullYear()} Imtaotao\n` +
  ' * Released under the MIT License.\n' +
  ' */'

const outputConfigs = {
  umd: {
    banner,
    format: 'umd',
    file: path.resolve(__dirname, 'dist/hooks.umd.js'),
  },
  cjs: {
    banner,
    format: 'cjs',
    file: path.resolve(__dirname, 'dist/hooks.cjs.js'),
  },
  'esm-bundler': {
    banner,
    format: 'es',
    file: path.resolve(__dirname, 'dist/hooks.esm-bundler.js'),
  },
};

const createReplacePlugin = () => {
  return replace({
    __VERSION__: `'${version}'`,
  });
};

const packageConfigs = Object.keys(outputConfigs).map((format) =>
  createConfig(format, outputConfigs[format]),
);

function createConfig(format, output) {
  let nodePlugins = [];
  const isUmdBuild = /umd/.test(format);
  const input = path.resolve(__dirname, 'index.ts')

  output.externalLiveBindings = false;
  if (isUmdBuild) output.name = 'HooksPlugin';
  
  if (format !== 'cjs') {
    nodePlugins = [
      nodeResolve({ browser: isUmdBuild }),
      commonjs({ sourceMap: false }),
    ];
  }

  return {
    input,
    output,
    plugins: [
      cleanup(),
      json({
        namedExports: false,
      }),
      typescript({
        clean: true, // no cache
        typescript: require('typescript'),
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
      }),
      createReplacePlugin(),
      ...nodePlugins,
    ],
  };
}

export default packageConfigs;

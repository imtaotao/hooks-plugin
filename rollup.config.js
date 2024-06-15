import path from 'path';
import json from '@rollup/plugin-json';
import cleanup from 'rollup-plugin-cleanup';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { version, dependencies } from './package.json';

const outputConfigs = {
  umd: {
    format: 'umd',
    file: path.resolve(__dirname, 'dist/hooks.umd.js'),
  },
  cjs: {
    format: 'cjs',
    file: path.resolve(__dirname, 'dist/hooks.cjs.js'),
  },
  'esm-bundler': {
    format: 'es',
    file: path.resolve(__dirname, 'dist/hooks.esm-bundler.js'),
  },
};

const createReplacePlugin = () => {
  return replace({
    __TEST__: `false`,
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
  const external = isUmdBuild ? [] : Object.keys(dependencies);

  output.externalLiveBindings = true;
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
    external,
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

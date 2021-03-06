import axios from 'axios';
import * as esbuild from 'esbuild-wasm';
import { UNPACKAGE_URL } from '../utils/const';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // build.onResolve is to find out where is the file in our local system
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);

        if (args.path === 'index.js') {
          return { path: args.path, namespace: 'a' };
        }

        if (args.path.includes('./') || args.path.includes('../')) {
          return {
            namespace: 'a',
            path: new URL(args.path, `https://unpkg.com${args.resolveDir}/`).href
          };
        }

        return { path: `${UNPACKAGE_URL}${args.path}`, namespace: 'a' };
      });

      // build.onLoad is trigger whenever a resolve is triggered -  I mean that the file is loaded
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              const message = require('react');
              console.log(message);
            `
          };
        }

        const { data, request } = await axios.get(args.path);

        return {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname
        };
      });
    }
  };
};

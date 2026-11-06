import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const legacy = {
 'geo-data': ['geo', 'GEO_CN'],
 'lunar-data': ['lunar', 'Lunar'],
 'reading-texts': ['texts', 'TEXTS'],
};
// Adapt the legacy data scripts to the same module interface in both runtimes.
const embeddedData = {
 name: 'firstlight-local-data',
 setup(build) {
  build.onResolve({filter: /^\.\/legacy-data\.mjs$/}, () => ({path: 'legacy-data', namespace: 'firstlight'}));
  build.onLoad({filter: /.*/, namespace: 'firstlight'}, async () => {
   const declarations = await Promise.all(Object.entries(legacy).map(async ([key, [file, field]]) => {
    const source = await readFile(new URL('assets/' + file + '.js', root), 'utf8');
    return JSON.stringify(key) + ': () => { const window = {}, module = undefined;\n' + source + '\nreturn window.' + field + '; }';
   }));
   return {contents: 'const data = {' + declarations.join(',\n') + '}; export const legacyData = name => data[name]();'};
  });
 }
};

export function buildConsole(write = true) {
 return build({
  absWorkingDir: fileURLToPath(root), entryPoints: ['assets/console/app.js'],
  outfile: 'js/console.js', bundle: true, platform: 'browser', format: 'iife',
  target: 'safari15', legalComments: 'inline', minify: true, plugins: [embeddedData], write,
 });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await buildConsole();

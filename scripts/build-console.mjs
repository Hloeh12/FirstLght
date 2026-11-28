import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {checkRelease} from './check-release.mjs';

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
 checkRelease();
 const commit=process.env.FIRSTLIGHT_COMMIT||process.env.GITHUB_SHA||'local';
 return build({
  absWorkingDir: fileURLToPath(root), entryPoints: ['assets/console/app.js'],
  outfile: 'js/console.js', bundle: true, platform: 'browser', format: 'iife',
  define:{__FIRSTLIGHT_COMMIT__:JSON.stringify(commit)},
  target: 'safari15', legalComments: 'inline', minify: true, plugins: [embeddedData], write,
  // v0.89.0 体积优化：保留中文原始 UTF-8，不再转义成 \uXXXX。esbuild 默认 charset=ascii，
  // 把每个汉字（UTF-8 3 字节）转成 \uXXXX（6 字节）——中国区划表等中文数据被多占一倍。
  // 产物以 UTF-8 加载（index.html 已声明 charset=utf-8），safari15 起原生支持。
  charset: 'utf8',
 });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await buildConsole();

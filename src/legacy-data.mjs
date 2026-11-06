import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const files = {
 'geo-data': ['geo', 'GEO_CN'],
 'lunar-data': ['lunar', 'Lunar'],
 'reading-texts': ['texts', 'TEXTS'],
};

export function legacyData(name) {
 const [file, field] = files[name];
 const window = {};
 runInNewContext(readFileSync(new URL('../assets/' + file + '.js', import.meta.url), 'utf8'), {window});
 return window[field];
}

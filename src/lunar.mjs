import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(here,'../assets/lunar.js'),'utf8'),ctx);
export const Lunar=ctx.window.Lunar;
export function lunarToSolar(y,m,d,leap){return Lunar.lunarToSolar(y,m,d,!!leap);}
export function solarToLunar(y,m,d){return Lunar.solarToLunar(y,m,d);}
export function leapMonth(y){return Lunar.leapMonth(y);}

import {legacyData} from './legacy-data.mjs';
export const Lunar=legacyData('lunar-data');
export function lunarToSolar(y,m,d,leap){return Lunar.lunarToSolar(y,m,d,!!leap);}
export function solarToLunar(y,m,d){return Lunar.solarToLunar(y,m,d);}
export function leapMonth(y){return Lunar.leapMonth(y);}

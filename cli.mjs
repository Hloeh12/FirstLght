#!/usr/bin/env node
import fs from 'node:fs';
import { chart } from './src/chart.mjs';
import { toMarkdown, toHtml } from './src/export.mjs';
const args=process.argv.slice(2);
const arg=(k,d)=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:d;};
const [Y,M,D]=String(arg('date','2000-08-16')).split('-').map(Number);
const [h,mi]=String(arg('time','12:00')).split(':').map(Number);
const input={Y,M,D,h,mi,gender:arg('gender','女'),dateStr:arg('date','2000-08-16'),timeStr:arg('time','12:00'),useSolarTime:args.includes('--solar'),city:{label:arg('label','手动位置'),lat:Number(arg('lat','31.2304')),lon:Number(arg('lon','121.4737')),tz:Number(arg('tz','8'))}};
const c=chart(input);
const fmt=arg('format','md');
const text=fmt==='json'?JSON.stringify(c,null,2):fmt==='html'?toHtml(c):toMarkdown(c);
const out=arg('out',null);
if(out){fs.writeFileSync(out,text);console.log('written:',out,`(${text.length} bytes)`);}else console.log(text);

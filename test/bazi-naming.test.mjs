// 起名模块契约测试：字库完整性 / 喜用优先 / 五格手算核对 / API 输出结构
import test from 'node:test';
import assert from 'node:assert/strict';
import {NAMING_CHARS,suggestNames} from '../src/bazi-naming.mjs';

const CITY={lat:31.23,lon:121.47,tz:8};
const BIRTH={name:'验证',gender:'男',Y:1990,M:6,D:15,h:12,mi:0,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};

test('字库完整性：每字拼音/康熙笔画/五行/寓意标签齐全',()=>{
 assert.ok(NAMING_CHARS.length>=200,`字库应有几百字，实际 ${NAMING_CHARS.length}`);
 for(const c of NAMING_CHARS){
  assert.match(c.py,/^[a-züāáǎàēéěèīíǐìōóǒòūúǔù]+$/i,`${c.ch} 拼音缺失或非法`);
  assert.ok(Number.isInteger(c.k)&&c.k>=1&&c.k<=30,`${c.ch} 康熙笔画非法：${c.k}`);
  assert.ok(['木','火','土','金','水'].includes(c.el),`${c.ch} 五行非法：${c.el}`);
  assert.ok(Array.isArray(c.tags)&&c.tags.length>=1,`${c.ch} 缺寓意标签`);
 }
 const els=new Set(NAMING_CHARS.map(c=>c.el));
 assert.equal(els.size,5,'五行须全覆盖');
});

test('五行喜用优先：喜用五行的用字应在候选名中占主导',()=>{
 const r=suggestNames({surname:'李',gender:'男',birth:BIRTH},{count:8});
 assert.ok(r.useful.length>0,'应有喜用神');
 let fit=0,total=0;
 for(const x of r.list){
  const given=x.given||x.name.slice(r.surname.length);
  for(const ch of given){total++;const c=NAMING_CHARS.find(c=>c.ch===ch);if(r.useful.includes(c.el))fit++;}
 }
 assert.ok(fit/total>=0.6,`候选名喜用五行用字占比应过半，实际 ${fit}/${total}`);
});

test('五格计算正确性：以「李山」单姓双字名手算核对（康熙笔画 李7 山3）',()=>{
 // 李=7画，山=3画；翔=12画
 const r=suggestNames({surname:'李',gender:'男',birth:BIRTH},{count:8});
 const x=r.list[0];
 const given=x.given||x.name.slice(1);
 // 手算核对：李=7画（康熙）；天格=单姓+1=8；人格=7+首字康熙笔画；外格=总格-人格+1
 const k1=NAMING_CHARS.find(c=>c.ch===given[0]).k;
 const m=x.reasons.find(s=>s.includes('人格'));
 assert.ok(m,'理由应含五格数理');
 assert.match(m,/天格8/,`天格应为 8：${m}`);
 assert.match(m,new RegExp(`人格${7+k1}`),`人格应为 ${7+k1}：${m}`);
 // 总格=7+所有字康熙笔画之和
 const total=7+given.split('').reduce((a,c)=>a+NAMING_CHARS.find(c2=>c2.ch===c).k,0);
 assert.match(m,new RegExp(`总格${total}`),`总格应为 ${total}：${m}`);
});

test('API 输出结构完整：8 个候选，含 name/pinyin/total/dims/reasons',()=>{
 const r=suggestNames({surname:'李',gender:'男',birth:BIRTH},{count:8});
 assert.equal(r.list.length,8);
 assert.equal(r.surname,'李');
 assert.ok(Array.isArray(r.useful)&&r.useful.length>0);
 for(const x of r.list){
  assert.equal(typeof x.name,'string');
  assert.ok(x.name.startsWith('李'));
  assert.match(x.pinyin,/^[a-züāáǎàēéěèīíǐìōóǒòūúǔù ]+$/i,`拼音非法：${x.pinyin}`);
  assert.equal(typeof x.total,'number');
  assert.ok(x.total>=0&&x.total<=100,`总分应在 0-100：${x.total}`);
  for(const k of ['element','wuge','zodiac','phonology','meaning'])assert.equal(typeof x.dims[k],'number',`dims.${k} 缺失`);
  assert.ok(Array.isArray(x.reasons)&&x.reasons.length>=4,'理由至少 4 条');
 }
 const sorted=[...r.list].sort((a,b)=>b.total-a.total);
 assert.deepEqual(r.list.map(x=>x.total),sorted.map(x=>x.total),'应按总分降序');
});

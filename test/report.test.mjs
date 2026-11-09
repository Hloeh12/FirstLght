import test from 'node:test';
import assert from 'node:assert/strict';
import { localTemplateReport } from '../src/report-template.mjs';
import { energy } from '../src/energy.mjs';
import { ziweiChart } from '../src/ziwei.mjs';
import { chart } from '../src/chart.mjs';
const a={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{label:'上海',lat:31.2304,lon:121.4737,tz:8}};
test('local template has 9 sections',()=>{const r=localTemplateReport(chart(a));assert.equal(Object.keys(r.sections).length,9);assert.equal(r.kind,'local-template');});
test('energy has 7 chakras within bounds',()=>{const e=energy(chart(a).western,'x');assert.equal(e.chakras.length,7);for(const c of e.chakras)assert.ok(c.score>=22&&c.score<=96);});
test('ziwei chart 12 palaces & soul',()=>{const z=ziweiChart({dateStr:'2000-08-16',timeIndex:6,gender:'女'});assert.equal(z.palaces.length,12);assert.ok(z.soul);});
test('ziwei rejects bad date',()=>{assert.throws(()=>ziweiChart({dateStr:'bad',timeIndex:1,gender:'女'}));});

import {buildBaziKnowledgeReport,buildZiweiKnowledgeReport} from '../www/js/rules.js';
test('offline Bazi report emits four evidence-based long sections',()=>{
 const report=buildBaziKnowledgeReport({
  dayMaster:{stem:'甲'},strength:{support:58.4},natalStrength:{support:51.2},
  selected:[{stem:'丙',branch:'午',name:'流年'}],
  guidance:{title:'2026丙午流年',tenGod:'食神'},
  pillars:[{name:'日柱',stem:'甲',branch:'子'}],
  relationships:[{pattern:'子午',type:'六冲',meaning:'水火相冲'}],
  months:[{label:'立春',stem:'庚',branch:'寅',links:['寅午半合']}]
 });
 assert.equal(report.sections.length,4);
 assert.ok(report.characters>=1000);
 assert.ok(report.sections[1].lines.join('').includes('用神受制'));
 assert.ok(report.sections[1].lines.join('').includes('忌神'));
});
test('offline Ziwei report emits four layers and validates real pattern evidence',()=>{
 const report=buildZiweiKnowledgeReport({palaces:[{branch:0,name:'命宫',majorStars:[{name:'紫微'}],borrowedStars:[],minorStars:[],stars:[{name:'禄存'}]},{branch:5,name:'官禄宫',majorStars:[],borrowedStars:[],minorStars:[{name:'擎羊'}]},{branch:6,name:'迁移宫',majorStars:[],borrowedStars:[],minorStars:[]},{branch:7,name:'财帛宫',majorStars:[],borrowedStars:[],minorStars:[{name:'陀罗'}]}]},{
  scope:'yearly',label:'流年',ganZhi:'丙午',date:'2026-06-01',palaceNames:{0:'命宫',6:'迁移'},
  mutagens:[{star:'紫微',type:'禄',branch:0},{star:'天府',type:'禄',branch:6},{star:'天机',type:'忌',branch:6}]
 });
 assert.equal(report.sections.length,4);
 assert.ok(report.characters>=1000);
 assert.ok(report.sections[1].lines.join('').includes('双禄交驰'));
 assert.ok(report.sections[1].lines.join('').includes('禄逢冲破'));
 assert.ok(report.sections[1].lines.join('').includes('羊陀夹忌候选'));
});

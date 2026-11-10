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
 assert.ok(report.characters>=1200&&report.characters<=1800);
 assert.equal(report.sections[1].lines.filter(x=>x.includes('用神受制')||x.includes('冲去忌神')).length,1);
 assert.ok(!report.sections[1].lines.join('').includes('年柱：'));
 assert.ok(report.sections[1].lines.join('').includes('用神受制'));
});

test('Bazi annual report changes by selected year and emits exclusive clash branches',()=>{
 const base={dayMaster:{stem:'甲'},strength:{support:58},natalStrength:{support:50,useful:['水','木'],caution:['火','土']},pillars:[
  {name:'年柱',stem:'庚',branch:'辰',branchElement:'土'},{name:'月柱',stem:'壬',branch:'申',branchElement:'金'},{name:'日柱',stem:'甲',branch:'子',branchElement:'水'},{name:'时柱',stem:'丁',branch:'卯',branchElement:'木'}],months:[]};
 const make=(stem,branch,tenGod,stemElement,branchElement,links=[])=>buildBaziKnowledgeReport({...base,selected:[{name:'流年',stem,branch,tenGod,stemElement,branchElement}],guidance:{tenGod},relationships:links});
 const y26=make('丙','午','食神','火','火',[{pattern:'子午',type:'六冲',ids:[2,4],meaning:'水火相冲'}]);
 const y27=make('丁','未','伤官','火','土',[{pattern:'午未',type:'六合',ids:[4,3],meaning:'相合'}]);
 const y28=make('戊','申','偏财','土','金',[]);
 for(const r of [y26,y27,y28])assert.equal(r.sections.length,4);
 const second=[y26,y27,y28].map(r=>r.sections[1].lines.join(''));
 const third=[y26,y27,y28].map(r=>r.sections[2].lines.join(''));
 assert.notEqual(second[0],second[1]);assert.notEqual(second[1],second[2]);assert.notEqual(second[0],second[2]);
 assert.notEqual(third[0],third[1]);assert.notEqual(third[1],third[2]);assert.notEqual(third[0],third[2]);
 assert(second[0].includes('用神受制')||second[0].includes('冲去忌神'));
 assert(second[1].includes('岁运逢合'));
 assert(second[2].includes('岁运安和'));
 assert(!second[0].includes('冲去忌神')||!second[0].includes('用神受制'));
});

test('offline Ziwei report emits four layers and validates real pattern evidence',()=>{
 const report=buildZiweiKnowledgeReport({palaces:[{branch:0,name:'命宫',majorStars:[{name:'紫微'}],borrowedStars:[],minorStars:[],stars:[{name:'禄存'}]},{branch:5,name:'官禄宫',majorStars:[],borrowedStars:[],minorStars:[{name:'擎羊'}]},{branch:6,name:'迁移宫',majorStars:[],borrowedStars:[],minorStars:[]},{branch:7,name:'财帛宫',majorStars:[],borrowedStars:[],minorStars:[{name:'陀罗'}]}]},{
  scope:'yearly',label:'流年',ganZhi:'丙午',date:'2026-06-01',palaceNames:{0:'命宫',6:'迁移'},
  mutagens:[{star:'紫微',type:'禄',branch:0},{star:'天府',type:'禄',branch:6},{star:'天机',type:'忌',branch:6}]
 });
 assert.equal(report.sections.length,4);
 assert.ok(report.characters>=1200&&report.characters<=1800);
 assert.ok(report.sections[1].lines.join('').includes('【双禄交驰·锦上添花】'));
 assert.ok(report.sections[1].lines.join('').includes('【禄逢冲破·吉处藏凶】'));
 assert.ok(report.sections[1].lines.join('').includes('【羊陀夹忌·动辄得咎】'));
});

import {BAZI_FLOW_RULES,ZIWEI_FLOW_RULES} from '../www/js/rules.js';
import {practicalZiwei} from '../src/ziwei-practical.mjs';

test('Ziwei annual patterns are suppressed without a selected annual flow',()=>{
 const chart={palaces:[{branch:0,name:'命宫',stars:[{name:'禄存'}]},{branch:4,name:'官禄宫',stars:[{name:'太阳',siHua:'禄'}]}]};
 assert.deepEqual(practicalZiwei(chart,null),[]);
});

test('classical corpus uses the requested judgments and avoids corporate jargon',()=>{
 assert.equal(BAZI_FLOW_RULES.clash.caution,'【冲去忌神·枯木逢春】岁运犹如烈火熔金，将多年积压的旧有阻碍一扫而空，虽有环境剧烈变迁或身心动荡，实为打破僵局、凤凰涅槃之良机，大利开创新局');
 assert.equal(BAZI_FLOW_RULES.clash.useful,'【用神受制·惊涛骇浪】核心元气受伐，岁运浮沉，主心绪难宁、计划受阻。此时宜退守自保、以静制动，严防冲动投资与口舌官非');
 assert.equal(ZIWEI_FLOW_RULES.patterns.双禄交驰,'【双禄交驰·锦上添花】本命禄存与流年化禄同宫或三方拱照，主今年财源滚滚、名利双收，有置业、加薪或得大财之喜');
 assert.equal(ZIWEI_FLOW_RULES.patterns.禄逢冲破,'【禄逢冲破·吉处藏凶】化忌凶星直冲禄位，犹如美玉有瑕，看似进财机遇，实则暗藏巨额消耗或纠纷，务必见好就收、守住本金');
 assert.equal(ZIWEI_FLOW_RULES.patterns.羊陀夹忌,'【羊陀夹忌·动辄得咎】凶煞夹攻，四面楚歌，主外部压力剧增、身心俱疲，凡事宜低调退让、切勿强出头');
 const corpus=JSON.stringify({BAZI_FLOW_RULES,ZIWEI_FLOW_RULES});
 for(const term of ['发票','报销','授权考核','退出机制','考核口径','报价验收','合同附件'])assert(!corpus.includes(term),term+' must not appear in the offline corpus');
});

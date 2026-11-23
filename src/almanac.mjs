// 个性化择日引擎 v2（v0.60.0）：日课基盘与事项层分离，支持多事项并排比较与全年运程轴
// 旧实现只有「黄历宜忌 + 日课与本命冲合（每项 ±2）」，看不出分从哪来，也不能按要做的事排序。
// 本模块把择日拆成可核对的六层证据，每一分都带 label/delta/why，前端原样展示：
//   1 本命喜忌（扶抑 useful/caution；中和盘改取《穷通宝鉴》调候用神，权重减半）
//   2 日课与四柱的刑冲合害（按落宫加权：日柱夫妻宫 > 月柱 > 年柱/时柱）
//   3 黄历宜忌与所选事项的匹配
//   4 建除十二神与日值神吉凶
//   5 日支冲本命生肖
//   6 时辰层：时干时支喜忌、日破时、与命局冲合、时家值神、旬空
import {Solar} from 'lunar-javascript';
import {baziPro,branches,relations,stemElements,branchElements,civilSolar} from './bazi-pro.mjs';
import {tenGod} from './bazi.mjs';

const STEMS='甲乙丙丁戊己庚辛壬癸';
const WEEK=['周日','周一','周二','周三','周四','周五','周六'];
// 六冲对照与五行相克，用于岁破／月破／天克地冲判断（只查表，不做推断）。
const CLASH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
const CONTROL={木:'土',土:'水',水:'火',火:'金',金:'木'};

export const EVENTS={
 general:{label:'综合参考',terms:[]},
 contract:{label:'签约立券',terms:['立券','交易','纳财','会亲友']},
 open:{label:'开业开市',terms:['开市','交易','立券','纳财','挂匾']},
 travel:{label:'出行远行',terms:['出行','赴任']},
 move:{label:'搬家入宅',terms:['入宅','移徙','安床']},
 wedding:{label:'婚嫁订盟',terms:['嫁娶','纳采','订盟','会亲友']},
 medical:{label:'求医问诊',terms:['求医','治病','针灸']},
 exam:{label:'考试面试',terms:['入学','赴任','会亲友']},
 negotiate:{label:'谈判议价',terms:['会亲友','立券','纳财']},
 build:{label:'动土装修',terms:['动土','修造','竖柱','上梁','安门']},
 pray:{label:'祈福许愿',terms:['祈福','斋醮','祭祀']},
 burial:{label:'安葬立碑',terms:['安葬','破土','立碑']}
};

// 建除十二神：除危定执成开为黄道可用日，破最忌，其余偏保守。
const ZHIXING={黄:['除','危','定','执','成','开'],破:['破']};
// 日课地支落宫权重（0 年柱 / 1 月柱 / 2 日柱 / 3 时柱）。
const HIT={
 六冲:{2:-4.5,1:-3,0:-2.5,3:-2},
 六合:{2:2.5,1:1.5,0:1.5,3:1.5},
 三合局:{2:1.5,1:1.5,0:1,3:1},
 相刑:{2:-2,1:-1.5,0:-1,3:-1},
 相害:{2:-1.5,1:-1.5,0:-1,3:-1},
 相破:{2:-1,1:-1,0:-1,3:-1}
};
const DAY_ELEM={use:{stem:3,branch:2},avoid:{stem:-3,branch:-2},enemy:{stem:-1.5,branch:-1},idle:{stem:0,branch:0}};
const HOUR_ELEM={use:{stem:2,branch:1.5},avoid:{stem:-2,branch:-1.5},enemy:{stem:-1,branch:-.75},idle:{stem:0,branch:0}};
// 岁运层（v0.59.0）：日课与当值大运／流年的刑冲合害。
// 大运是十年环境，权重大于流年；流年六冲即「岁破」，已在硬忌里单列，这里不再重复计分。
const LUCK_REL={六冲:-3,六合:2,三合局:1.5,相刑:-1.5,相害:-1.5,相破:-1};
const YEAR_REL={六冲:0,六合:1.5,三合局:1,相刑:-1,相害:-1,相破:-.75};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const round1=value=>Math.round(value*10)/10;
const scoreOf=(raw,scale)=>clamp(Math.round(50+45*Math.tanh(raw/scale)),3,98);
const tierOf=score=>score>=82?'上吉':score>=68?'吉':score>=52?'平':score>=38?'慎':'避';
const TIER_MEAN={上吉:'诸事顺遂，可放手推进',吉:'条件偏顺，适合安排要事',平:'吉凶参半，按细节取舍',慎:'有明确阻力，非必要不安排',避:'冲忌较重，建议另择他日'};

// 本命喜忌口径：扶抑优先；中和盘 useful 为空时改取调候用神，并如实标出来源。
export function natalBasis(birth){
 if(!birth)return null;
 let b;
 try{b=baziPro({birth});}catch{return null;}
 const strength=b.strength||{};
 const use=[...(strength.useful||[])];
 const avoid=[...(strength.caution||[])];
 const enemy=[...(strength.roles?.enemy||[])];
 const tiao=b.tiaoHou?.elements||[];
 let source='扶抑',note='';
 if(!use.length&&!avoid.length){
  if(tiao.length){
   use.push(...tiao);source='调候';
   note='本命扶抑判断为'+(strength.kind||'中和')+'，喜用未单列，改以《穷通宝鉴》调候用神作参考（权重减半）。';
  }else{
   source='均衡';
   note='本命五行较均衡，不做单一喜忌加权，仅按日课与命局的冲合及黄历取用。';
  }
 }
 return {
  use,avoid,enemy,source,note,half:source==='调候',
  kind:strength.kind||'—',
  dayMaster:b.dayMaster?.stem||'',
  dayElement:b.dayMaster?.element||'',
  pillars:b.pillars.map(p=>({name:p.name,stem:p.stem,branch:p.branch})),
  // 大运序列：择日要落在大运/流年背景里看，否则同一分数在「喜用十年」与「忌神十年」意义不同。
  cycles:(b.cycles||[]).map(c=>({index:c.index,stem:c.stem,branch:c.branch,startYear:c.startYear,
   endYear:c.endYear??c.startYear+9,startUtc:c.startUtc,endUtc:c.endUtc,age:c.age})),
  tiaoHou:b.tiaoHou?.gods||[]
 };
}
const roleOf=(element,basis)=>{
 if(!basis)return 'idle';
 if(basis.avoid.includes(element))return 'avoid';
 if(basis.use.includes(element))return 'use';
 if(basis.enemy.includes(element))return 'enemy';
 return 'idle';
};
const elemWeight=(table,role,part,basis)=>{
 if(!basis||basis.source==='均衡')return 0;
 const scale=basis.half?0.5:1;
 return ((table[role]||table.idle)[part]||0)*scale;
};
const dayAdd=(role,part,basis)=>elemWeight(DAY_ELEM,role,part,basis);
const hourAdd=(role,part,basis)=>elemWeight(HOUR_ELEM,role,part,basis);

// 岁运干支对本命的喜忌（只作背景标注，不计入日课分数）：
// 天干权重 2、地支 1，喜用取正、忌神取负、仇神减半，合计符号即「喜／忌／平」。
function favorOf(gz,basis){
 if(!basis||basis.source==='均衡')return {label:'平',role:'idle',score:0};
 const rs=roleOf(stemElements[STEMS.indexOf(gz[0])],basis),rb=roleOf(branchElements[branches.indexOf(gz[1])],basis);
 const score=(rs==='use'?2:rs==='avoid'?-2:rs==='enemy'?-1:0)+(rb==='use'?1:rb==='avoid'?-1:rb==='enemy'?-.5:0);
 return {label:score>0?'喜':score<0?'忌':'平',role:score>0?'use':score<0?'avoid':'idle',score};
}
// 定位某公历日所属的大运：优先按交运 UT 精确落位，缺 UT 时退回起止年。
function luckAt(basis,date){
 const cycles=basis?.cycles||[];
 if(!cycles.length)return null;
 const at=Date.parse(date+'T04:00:00Z');
 const exact=cycles.find(c=>c.startUtc&&c.endUtc&&Date.parse(c.startUtc)<=at&&at<Date.parse(c.endUtc));
 if(exact)return exact;
 const year=Number(date.slice(0,4));
 return cycles.find(c=>c.startYear<=year&&year<=(c.endYear??c.startYear+9))||null;
}

function dayRelations(natal,gz){
 if(!natal?.pillars?.length)return [];
 return relations([...natal.pillars,{name:'日课',stem:gz[0],branch:gz[1]}]).filter(r=>r.ids.includes(4));
}

function scoreHours({s,lunar,day,basis}){
 return Array.from({length:12},(_,j)=>{
  // j=0 取 00:00 采样即早子时；干支与值神随日干走，与 23:00 晚子时同柱。
  const sample=Solar.fromYmdHms(s.getYear(),s.getMonth(),s.getDay(),j*2,0,0).getLunar();
  const time=sample.getTimeInGanZhi();
  const hs=time[0],hb=time[1];
  const he=stemElements[STEMS.indexOf(hs)],be=branchElements[branches.indexOf(hb)];
  const plus=[],minus=[];
  const add=(list,label,delta,why)=>{if(delta)list.push({k:label,v:round1(delta),why});};
  if(basis){
   const rs=roleOf(he,basis),rb=roleOf(be,basis);
   const ws=hourAdd(rs,'stem',basis),wb=hourAdd(rb,'branch',basis);
   add(ws>=0?plus:minus,`时干${hs}${he}`,ws,ws>0?'时干属本命喜用':'时干属本命忌神');
   add(wb>=0?plus:minus,`时支${hb}${be}`,wb,wb>0?'时支五行得用':'时支五行失宜');
  }
  // 时支与日支
  for(const r of relations([{name:'日课',stem:day[0],branch:day[1]},{name:'时课',stem:hs,branch:hb}]).filter(x=>x.ids.includes(1))){
   const delta=r.type==='六冲'?-4.5:r.type==='六合'?1.5:r.type==='三合局'?1.5:r.type==='相刑'?-1.5:r.type==='相害'?-1:r.type==='相破'?-.75:0;
   if(delta)add(delta>0?plus:minus,r.type==='六冲'?'日破时':r.type+'·日支',delta,r.type==='六冲'?'时支冲日支，传统称日破时':'时支与日支'+r.type);
  }
  // 时支与命局四柱
  if(basis?.pillars?.length){
   let total=0;
   for(const r of relations([...basis.pillars,{name:'时课',stem:hs,branch:hb}]).filter(x=>x.ids.includes(4))){
    for(const id of r.ids){
     if(id===4)continue;
     const delta=r.type==='六冲'?(id===2?-2.5:-1):r.type==='六合'?(id===2?1.5:.75):0;
     if(!delta)continue;
     total+=delta;
     add(delta>0?plus:minus,`${r.type}·${basis.pillars[id].name}`,delta,'时支与'+basis.pillars[id].name+'柱'+r.type);
    }
   }
   if(Math.abs(total)>4){
    const ratio=4/Math.abs(total);
    for(const item of [...plus,...minus])item.v=round1(item.v*ratio);
   }
  }
  const hl=sample.getTimeTianShenLuck();
  add(hl==='吉'?plus:minus,`时值神·${sample.getTimeTianShen()}`,hl==='吉'?.5:-.5,'时家值神吉凶');
  if(basis?.pillars?.[0]&&CLASH[basis.pillars[0].branch]===hb)add(minus,'时冲本命生肖',-1.5,'时支冲本命年支');
  const xunKong=lunar.getDayXunKong();
  if(xunKong.includes(hb))add(minus,'时支落旬空',-1,'当日旬空在'+xunKong);
  const raw=[...plus,...minus].reduce((n,x)=>n+x.v,0);
  const score=scoreOf(raw,7);
  const range=j===0?'23:00–00:59':String(2*j-1).padStart(2,'0')+':00–'+String(2*j+1).padStart(2,'0')+':59';
  return {branch:hb,time:hs+hb,range,god:sample.getTimeTianShen(),traditional:hl,
   links:[...plus,...minus].map(x=>x.k),score,tier:tierOf(score),
   plus:plus.sort((a,b)=>b.v-a.v),minus:minus.sort((a,b)=>a.v-b.v)};
 });
}

// 日课基盘：除「黄历宜忌 × 事项」之外的全部层。
// 事项层只改加减分、不改时辰，所以一次基盘可以复用给任意多个事项——
// 这是「多事项并排对比」与「全年运程轴」不至于把手机算卡的成本前提。
function dayBase({s,natal}){
 const lunar=s.getLunar();
 const gz=lunar.getDayInGanZhi();
 const stem=gz[0],branch=gz[1];
 const stemElem=stemElements[STEMS.indexOf(stem)];
 const branchElem=branchElements[branches.indexOf(branch)];
 const plus=[],minus=[];
 const add=(list,label,delta,why)=>{if(delta)list.push({k:label,v:round1(delta),why});};

 // 1 本命喜忌
 if(natal){
  const ws=dayAdd(roleOf(stemElem,natal),'stem',natal);
  const wb=dayAdd(roleOf(branchElem,natal),'branch',natal);
  add(ws>=0?plus:minus,`日干${stem}${stemElem}`,ws,ws>0?'日干五行属本命喜用':'日干五行属本命忌神');
  add(wb>=0?plus:minus,`日支${branch}${branchElem}`,wb,wb>0?'日支五行属本命喜用':'日支五行属本命忌神');
 }
 // 2 日课与四柱冲合，总幅封顶 ±8
 const rows=dayRelations(natal,gz);
 if(rows.length){
  let total=0;
  for(const r of rows){
   const weight=HIT[r.type];
   if(!weight)continue;
   for(const id of r.ids){
    if(id===4)continue;
    const delta=weight[id]||0;
    if(!delta)continue;
    total+=delta;
    const label=basisLabel(natal,id);
    add(delta>0?plus:minus,`${r.type}·${label}`,delta,`日支${branch}与${label}${natal.pillars[id].branch}${r.type}`);
   }
  }
  if(Math.abs(total)>8){
   const ratio=8/Math.abs(total);
   for(const item of [...plus,...minus])if(/冲|合|刑|害|破/.test(item.k))item.v=round1(item.v*ratio);
  }
  if(rows.some(r=>r.type==='天干五合'&&r.ids.includes(2))){
   add(plus,'日干合日主',2,'日干与日主天干相合，人事易接洽');
  }
 }
 // 2b 岁破 / 月破 / 天克地冲：择日里最常被单独点名的三类硬忌，凭日支即可核对。
 const yearBranch=lunar.getYearInGanZhiByLiChun()[1],monthBranch=lunar.getMonthInGanZhi()[1];
 if(CLASH[yearBranch]===branch)add(minus,`岁破·冲${yearBranch}太岁`,-3.5,'日支冲当年太岁，传统列为大忌');
 if(CLASH[monthBranch]===branch)add(minus,`月破·冲${monthBranch}月建`,-3,'日支冲当月月建，传统忌举大事');
 if(natal?.pillars?.[2]&&CONTROL[stemElem]===stemElements[STEMS.indexOf(natal.pillars[2].stem)]&&CLASH[natal.pillars[2].branch]===branch){
  add(minus,'天克地冲本命日柱',-2,'日干克本命日干、日支冲本命日支，本命主题最易被动摇');
 }
 // 4 建除十二神与日值神
 const zhiXing=lunar.getZhiXing();
 if(ZHIXING.破.includes(zhiXing))add(minus,`建除·${zhiXing}日`,-3,'破日传统不举大事');
 else if(ZHIXING.黄.includes(zhiXing))add(plus,`建除·${zhiXing}日`,1.5,'黄道可用之日');
 else add(minus,`建除·${zhiXing}日`,-1.5,'建满平收闭偏保守');
 const tianShen=lunar.getDayTianShen(),luck=lunar.getDayTianShenLuck();
 add(luck==='吉'?plus:minus,`日值神·${tianShen}`,luck==='吉'?1:-1,luck==='吉'?'值神为吉':'值神为凶');
 // 6 岁运层：日课落在哪一步大运、哪一年，两者与本命是喜是忌只作背景标注；
 //   真正逐日变化的是「日课干支 × 大运／流年干支」的刑冲合害与伏吟、天克。
 const yearGz=lunar.getYearInGanZhiByLiChun();
 const luckPillar=luckAt(natal,s.toYmd());
 const suiYun={year:{gz:yearGz,favor:favorOf(yearGz,natal)},luck:null};
 if(luckPillar){
  const luckGz=luckPillar.stem+luckPillar.branch;
  suiYun.luck={gz:luckGz,startYear:luckPillar.startYear,endYear:luckPillar.endYear??luckPillar.startYear+9,
   age:luckPillar.age??null,favor:favorOf(luckGz,natal)};
  for(const r of relations([{name:'日课',stem,branch},{name:'大运',stem:luckPillar.stem,branch:luckPillar.branch}]).filter(x=>x.ids.includes(1))){
   const delta=LUCK_REL[r.type]||0;
   if(!delta)continue;
   add(delta>0?plus:minus,`大运·${r.type}`,delta,
    r.type==='六冲'?'日课冲当值大运，一步之内最忌硬碰，宜留缓冲':r.type==='六合'?'日课与当值大运相合，行事易得环境配合':'日课与当值大运'+r.type+'，提示该月主题多牵制');
  }
  if(luckGz===gz)add(minus,'伏吟·运同日课',-2,'日课干支与大运完全相同，传统称伏吟，主反复拖沓');
  const luckStemElem=stemElements[STEMS.indexOf(luckPillar.stem)];
  if(CONTROL[stemElem]===luckStemElem||CONTROL[luckStemElem]===stemElem)add(minus,'运日天干相克',-1,'日课天干与当值大运天干相克，推进中阻力偏多');
 }
 for(const r of relations([{name:'日课',stem,branch},{name:'流年',stem:yearGz[0],branch:yearGz[1]}]).filter(x=>x.ids.includes(1))){
  const delta=YEAR_REL[r.type]||0;
  if(!delta)continue;
  add(delta>0?plus:minus,`流年·${r.type}`,delta,
   r.type==='六合'?'日课与流年相合，易得当年外力配合':'日课与流年'+r.type+'，当年主题易起摩擦');
 }
 if(yearGz===gz)add(minus,'伏吟·年同日课',-1.5,'日课干支与流年相同，传统称太岁伏吟，宜守成');
 if(suiYun.luck&&suiYun.luck.gz===yearGz)add(minus,'岁运并临',-1,'大运与流年干支相同，该段主题高度集中，宜稳中取进');
 // 5 日支冲本命生肖
 if(natal?.pillars?.[0]&&relations([{name:'年',branch:natal.pillars[0].branch},{name:'日课',branch:gz[1]}]).some(r=>r.type==='六冲')){
  add(minus,'日支冲本命生肖',-3,'当日地支冲本命年支，大事宜缓');
 }

 return {lunar,gz,stem,branch,stemElem,branchElem,plus,minus,zhiXing,tianShen,luck,suiYun,
  sum:[...plus,...minus].reduce((n,x)=>n+x.v,0)};
}

// 事项层：只比对黄历宜忌与所选事项词。预取 yi/ji 可让一年 365 天只取一次黄历数组。
function eventLayer(lunar,event,pre){
 const terms=EVENTS[event]?.terms||[];
 const hits={yi:[],ji:[]},plus=[],minus=[];
 if(terms.length){
  const yi=pre?.yi??lunar.getDayYi(),ji=pre?.ji??lunar.getDayJi();
  hits.yi=terms.filter(t=>yi.some(x=>x.includes(t)));
  hits.ji=terms.filter(t=>ji.some(x=>x.includes(t)));
  if(hits.yi.length)plus.push({k:'黄历宜·'+hits.yi.join('、'),v:round1(Math.min(5,hits.yi.length*2.5)),why:'所选事项在当日宜项内'});
  if(hits.ji.length)minus.push({k:'黄历忌·'+hits.ji.join('、'),v:round1(Math.max(-6,-hits.ji.length*3)),why:'所选事项在当日忌项内'});
 }
 return {hits,plus,minus,delta:round1([...plus,...minus].reduce((n,x)=>n+x.v,0))};
}

function scoreDay({s,natal,event,events=[],light=false}){
 const base=dayBase({s,natal});
 const key=EVENTS[event]?event:'general';
 const layer=eventLayer(base.lunar,key);
 const plus=[...base.plus,...layer.plus].sort((a,b)=>b.v-a.v);
 const minus=[...base.minus,...layer.minus].sort((a,b)=>a.v-b.v);
 const raw=round1(base.sum+layer.delta);
 const score=scoreOf(raw,9),tier=tierOf(score);
 // 多事项：同一基盘只换事项层，分数仍是同一条公式，才能并排比较而不用说「口径不同」。
 const byEvent={};
 for(const k of new Set([key,...events])){
  if(!EVENTS[k])continue;
  if(k===key){byEvent[k]={score,tier,delta:layer.delta,hits:layer.hits};continue;}
  const extra=eventLayer(base.lunar,k);
  const one=scoreOf(round1(base.sum+extra.delta),9);
  byEvent[k]={score:one,tier:tierOf(one),delta:extra.delta,hits:extra.hits};
 }
 // light 模式跳过十二时辰（全年轴只到日），这是 365 天能进 0.3s 的关键。
 const hours=light?[]:scoreHours({s,lunar:base.lunar,day:base.gz,basis:natal});
 const bestHours=light?[]:[...hours].sort((a,b)=>b.score-a.score).filter(h=>h.score>=55).slice(0,3);
 return {
  date:s.toYmd(),weekday:WEEK[s.getWeek()],lunar:base.lunar.getMonthInChinese()+'月'+base.lunar.getDayInChinese(),gz:base.gz,
  zhiXing:base.zhiXing,tianShen:base.tianShen,tianShenLuck:base.luck,
  chong:base.lunar.getDayChongDesc(),sha:base.lunar.getDaySha(),xunKong:base.lunar.getDayXunKong(),
  yi:base.lunar.getDayYi(),ji:base.lunar.getDayJi(),good:base.lunar.getDayJiShen(),bad:base.lunar.getDayXiongSha(),
  score,tier,tierMean:TIER_MEAN[tier],raw:round1(raw),
  plus,minus,eventHits:layer.hits,tenGod:natal?tenGod(STEMS.indexOf(natal.dayMaster),STEMS.indexOf(base.stem)):null,
  suiYun:base.suiYun,hours,bestHours,links:[...plus,...minus].map(x=>x.k),
  // 流月干支与喜忌：月历要把「这一天」放回「这个流月」里看，两者同屏才读得出是月助还是月阻。
  // 与岁运层同理，只作背景标注，不计入分数。
  monthGz:base.lunar.getMonthInGanZhi(),monthFavor:favorOf(base.lunar.getMonthInGanZhi(),natal),
  monthLabel:MONTH_LABEL[base.lunar.getMonthInGanZhi()[1]]||base.lunar.getMonthInGanZhi()[1]+'月',
  byEvent,personal:Boolean(natal),lite:light
 };
}
const basisLabel=(natal,id)=>natal?.pillars?.[id]?.name||'命局';

export function almanac({birth,date,days=1,event='general',events=[]}){
 // 节气流月可能出现 32 天（如芒种→小暑），上限留到 32，避免「看整月」漏掉末日。
 if(!Number.isInteger(days)||days<1||days>32)throw Error('最多查询 32 天');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date??''))throw Error('请选择有效公历日期');
 const solar=civilSolar(...date.split('-').map(Number));
 if(solar.toYmd()!==date)throw Error('该日期不存在');
 const natal=birth?natalBasis(birth):null;
 const key=EVENTS[event]?event:'general';
 const list=[...new Set(Array.isArray(events)?events:[])].filter(k=>EVENTS[k]).slice(0,12);
 const dates=Array.from({length:days},(_,i)=>scoreDay({s:solar.next(i),natal,event:key,events:list}));
 const ranked=[...dates].sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
 ranked.forEach((d,i)=>{d.rank=i+1;d.percentile=dates.length>1?Math.round((1-i/(dates.length-1))*100):100;});
 return {
  dates,event:key,eventLabel:EVENTS[key].label,terms:EVENTS[key].terms,byEvent:list,
  best:ranked[0]?.date??null,worst:ranked.at(-1)?.date??null,
  basis:natal?{use:natal.use,avoid:natal.avoid,enemy:natal.enemy,source:natal.source,kind:natal.kind,
   dayMaster:natal.dayMaster,note:natal.note,tiaoHou:natal.tiaoHou}:null,
  method:'个人部分：日干／日支五行是否属本命喜用（忌神、仇神递减）＋日课地支与本命四柱的刑冲合害（日支＝夫妻宫权重最高，月支次之，年支、时支递减）＋日支是否冲本命生肖，累计原始分后以 tanh 映射到 0–98，避免极值堆叠。岁运层：按交运时刻定位当值大运、按立春定位流年，只把「日课与大运／流年」之间的刑冲合害（大运权重高于流年）、伏吟、天干相克、岁运并临计入分数；大运流年本身是喜是忌只作背景标注，不按日重复加减，避免整月分数被同一条拉平。另有岁破（日冲太岁）、月破（日冲月建）、天克地冲本命日柱三项硬忌单独计分。公共部分取黄历宜忌、建除十二神、日值神。时辰层另按「时干时支喜忌＋是否日破时＋与命局冲合＋时家值神＋旬空＋时冲生肖」计分。冲刑不代表绝对凶，只提示该日主题易起变动，须结合实际安排取舍；本命喜用取自扶抑模型，中和盘改用《穷通宝鉴》调候并减半计入。'
 };
}

// 流月名：以月建地支对照农历月序，避免「第 8 月」与公历 8 月混淆。
const MONTH_LABEL={寅:'正月',卯:'二月',辰:'三月',巳:'四月',午:'五月',未:'六月',申:'七月',酉:'八月',戌:'九月',亥:'十月',子:'冬月',丑:'腊月'};

// 全年运程轴：按节气切十二流月，逐日套用与择日完全相同的公式（只到日、不到时辰），
// 每月给出「该事项最优的一天」与「当月最宜的三件不同事项」，供择日页面直接跳转。
export function yearAgenda({birth,year,events=[],event='general'}){
 const y=Number(year);
 if(!Number.isInteger(y)||y<1901||y>2099)throw Error('年份超出可查范围（1901–2099）');
 const natal=birth?natalBasis(birth):null;
 const base=EVENTS[event]?event:'general';
 const list=[...new Set(Array.isArray(events)?events:[])].filter(k=>EVENTS[k]).slice(0,12);
 const keys=[...new Set([base,...list])];
 // 以立春为年界：十二流月正好寅月到丑月，年干支全年一致，
 // 年头的子月、年尾的丑月不会被切成两个半截桶。
 const from=civilSolar(y,6,1).getLunar().getJieQiTable()['立春'];
 const to=civilSolar(y+1,6,1).getLunar().getJieQiTable()['立春'];
 const start=civilSolar(...from.toYmd().split('-').map(Number));
 const total=Math.round((Date.parse(to.toYmd()+'T00:00:00Z')-Date.parse(from.toYmd()+'T00:00:00Z'))/86400000);
 const months=[];
 let cur=null;
 for(let i=0;i<total;i++){
  const s=start.next(i);
  const lunar=s.getLunar();
  const yearGz=lunar.getYearInGanZhiByLiChun(),monthGz=lunar.getMonthInGanZhi();
  const id=yearGz+monthGz;
  if(!cur||cur.id!==id){
   cur={id,gz:monthGz,yearGz,start:s.toYmd(),end:s.toYmd(),days:0,good:{},best:{}};
   months.push(cur);
  }
  cur.end=s.toYmd();cur.days++;
  const day=dayBase({s,natal});
  const pre={yi:day.lunar.getDayYi(),ji:day.lunar.getDayJi()};
  for(const k of keys){
   const score=scoreOf(round1(day.sum+eventLayer(day.lunar,k,pre).delta),9);
   if(score>=68)cur.good[k]=(cur.good[k]||0)+1;
   const prev=cur.best[k];
   if(!prev||score>prev.score)cur.best[k]={event:k,label:EVENTS[k].label,date:s.toYmd(),score,tier:tierOf(score)};
  }
 }
 for(const m of months){
  m.favor=favorOf(m.gz,natal);
  m.label=MONTH_LABEL[m.gz[1]]||m.gz[1]+'月';
  // 先按分数排序，再优先挑不同日期：三件都落在同一天时，读者会以为是重复而非「这天多能」。
  const sorted=Object.values(m.best).sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
  const picked=[],used=new Set();
  for(const t of sorted){if(used.has(t.date))continue;used.add(t.date);picked.push(t);if(picked.length===3)break;}
  for(const t of sorted){if(picked.length>=3)break;if(!picked.includes(t))picked.push(t);}
  m.top=picked.sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
  m.bestFor=m.best[base]||null;
  m.goodFor=m.good[base]||0;
 }
 const yGz=months[0]?.yearGz||civilSolar(y,6,1).getLunar().getYearInGanZhiByLiChun();
 const luck=luckAt(natal,`${y}-06-01`);
 const ranked=months.flatMap(m=>m.top.map(t=>({...t,month:m.label,monthGz:m.gz}))).sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date)).slice(0,5);
 return {
  year:y,months,event:base,eventLabel:EVENTS[base].label,byEvent:list,
  yearGz:{gz:yGz,favor:favorOf(yGz,natal)},
  luck:luck?{gz:luck.stem+luck.branch,startYear:luck.startYear,endYear:luck.endYear??luck.startYear+9,age:luck.age??null,favor:favorOf(luck.stem+luck.branch,natal)}:null,
  top:ranked,
  basis:natal?{use:natal.use,avoid:natal.avoid,enemy:natal.enemy,source:natal.source,kind:natal.kind,dayMaster:natal.dayMaster,note:natal.note}:null,
  method:'按节气切十二流月，逐日套用与择日相同的计分公式（本命喜忌＋四柱刑冲合害＋黄历事项＋建除值神＋岁运层＋岁破月破等硬忌），全年只算到日、不到时辰，因此单月最优日可能与逐时细算相差一两分。每月「最优」取所选事项在该月得分最高的一天；「最宜三事」取当月各事项各自最优日中分数最高的三件不同事项，不对同一件事重复占位。'
 };
}

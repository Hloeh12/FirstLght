import {compositePro} from './composite.mjs';
import {vedicReading,vedicPro} from './vedic-pro.mjs';
import {resonance} from './resonance.mjs';
import {ashtakoota} from './ashtakoota.mjs';
import {chart,synastry} from './chart.mjs';
import {ziweiChart,ziweiFlow} from './ziwei.mjs';
import {baziMatch,ziweiMatch,mangalDosh,westernKeyStars} from './match-making.mjs';
import {pairCycle} from './pair-cycle.mjs';
import {localTemplateReport,pairReport} from './report-template.mjs';
import {westernPro} from './western-pro.mjs';
import {baziPro,reverseBazi,convertBirth,relations} from './bazi-pro.mjs';
import {boneWeight,qizheng,yijing,almanac} from './traditions.mjs';
import {qiGuaByTime} from './liuyao.mjs';
import {suggestNames} from './bazi-naming.mjs';
import {yearAgenda} from './almanac.mjs';
import {timingCross} from './timing-cross.mjs';
import {searchPlaces,resolvePlace} from './geo.mjs';
import {lunarToSolar} from './lunar.mjs';
import {todaySky,dailyGuidance} from './today-sky.mjs';

function solarInput(birth,bazi=baziPro({birth})){
 const [Y,M,D]=bazi.info.solar.split('-').map(Number);
 const h=birth.timeUnknown?12:birth.h,mi=birth.timeUnknown?0:birth.mi;
 return {...birth,Y,M,D,h,mi,dateStr:bazi.info.solar,calendar:'solar',dayBoundaryAt2300:birth.lateZishi!=='current-day'};
}
function consoleReading({birth}){
 const bazi=baziPro({birth}),standard=solarInput(birth,bazi);
 const ziwei=ziweiChart(standard);
 // 印占走 vedicPro：附 Shadbala 六力、Bhava Bala 与 Varshaphala 岁运——报告与面板依赖这些字段
 const vedic=vedicPro({birth:standard});
 const full=chart(standard,{baseOnly:true});
 return {bazi,ziwei,western:full.western,vedic,analysis:full.analysis,meta:full.meta,
  report:localTemplateReport({...full,ziwei})};
}
function pairReading({a,b,mode,config}){
 if(mode!==undefined&&!['synastry','composite','midpoint','davison','cross-a','cross-b','mars-a','mars-b'].includes(mode))throw Error('无效合盘类型');
 const ba=baziPro({birth:a}),bb=baziPro({birth:b});
 const solarA=solarInput(a,ba),solarB=solarInput(b,bb);
 const result=synastry({...solarA,skipZiwei:true},{...solarB,skipZiwei:true},mode||'synastry'); // 多体系合婚：八字干支/十神/喜用 + 紫微命宫夫妻宫互参（不虚构契合度，分数仍取八科）
 const bm=baziMatch(ba,bb),zm=ziweiMatch(solarA,solarB);
 const md=mangalDosh(result.vedic?.a?.d1,result.vedic?.b?.d1);
 const {total:forward,max}=result.vedic.koota;
 const revKoota=ashtakoota(result.vedic.b.d1,result.vedic.a.d1);
 const reverse=revKoota.total;
 const total=(forward+reverse)/2;
 // 双向八科明细：前端可切换查看「以当前案例为基准」与「反向」两套分科得分
 const bothKoota={
  forward:{total:forward,max,items:result.vedic.koota.items,percent:result.vedic.koota.percent,label:'当前案例 × 第二人'},
  reverse:{total:reverse,max:revKoota.max,items:revKoota.items,percent:revKoota.percent,label:'第二人 × 当前案例'}
 };
 const pillars=[...ba.pillars.map(p=>({...p,name:'当前案例'+p.name})),...bb.pillars.map(p=>({...p,name:'关联案例'+p.name}))];
 const cross=relations(pillars).filter(r=>r.ids.some(i=>i<4)&&r.ids.some(i=>i>=4));
 const supportive=cross.find(r=>['天干五合','六合','三合局'].includes(r.type));
 const challenging=cross.find(r=>['六冲','相刑','相害','相破'].includes(r.type));
 const aspects=[...result.western.interAspects].sort((x,y)=>x.orb-y.orb);
 const key=aspects.find(x=>[0,60,120].includes(x.angle)),tension=aspects.find(x=>[90,180].includes(x.angle));
 const label=r=>r.pattern+' · '+r.type;
 const aspect=x=>x.a+'与'+x.b+x.type+'（'+x.orb.toFixed(2)+'°）';
 const insights=[
  {name:'互动助力',text:[supportive?label(supportive):'',key?aspect(key):''].filter(Boolean).join('；')||'当前规则未检出突出的相合线索。'},
  {name:'相处留意',text:[challenging?label(challenging):'',tension?aspect(tension):''].filter(Boolean).join('；')||'当前规则未检出突出的冲克线索。'}
 ];
 const fit={total,max,percent:Math.round(100*total/max),kootaBoth:bothKoota,highlight:supportive?label(supportive):challenging?label(challenging):key?aspect(key):'',insights};
 const combined=mode==='composite'?compositePro({a,b,config}):null;
 // 西占重点星：只筛金星/火星/月亮的跨盘相位，按融合/和谐/张力归类，不并入八科总分
 const keyStars=westernKeyStars(result.western.interAspects);
 // 关系周期与婚期应期：流月/流年干支 × 双方婚姻宫
 const cycle=pairCycle({ba,bb});
 const base={ok:true,...result,ziwei:zm,baziMatch:bm,ziweiMatch:zm,mangal:md,keyStars,cycle,
  western:combined?{...result.western,chart:combined.chart,composite:combined.chart}:result.western,fit,crossRelations:cross,composite:combined};
 // 核心结论摘要：每条都指向一项可复核证据，不给笼统好话
 const firstSentence=t=>{const s=String(t||'');const i=s.indexOf('。');return (i>0?s.slice(0,i):s).replace(/。$/,'');};
 const bestBm=bm.items.find(x=>x.level==='support'),worstBm=bm.items.find(x=>x.level==='challenge');
 const fly=zm.sihuaFly?.hits?.[0];
 const summary=[
  {key:'fit',label:'契合结构',text:`印度八科双向平均 ${fit.percent}%（${total}/${max}）；八科只量星宿结构，不等于关系质量。`},
  {key:'bazi',label:'八字取向',text:[bestBm?'最有利的一项：'+bestBm.name+'——'+firstSentence(bestBm.text):'八字各项均无明显助力项',
    worstBm?'最需磨合的一项：'+worstBm.name+'——'+firstSentence(worstBm.text):'八字未见明显冲克项'].join('；')},
  {key:'ziwei',label:'紫微动力',text:fly?`${fly.side==='a'?'甲方':'乙方'}${fly.scope==='life'?'命宫':'夫妻宫'}宫干化${fly.type}（${fly.star}）${fly.self?'自化于本宫':'飞入对方「'+fly.inOther+'」'}——这是两人关系里最直接的「谁在给、给到哪」的线索。`:zm.ok?'双方命宫/夫妻宫四化未互飞入关键宫位，关系动力更多来自后天互动。':'紫微排盘不可用，不做互飞推断。'},
  {key:'west',label:'情感三角',text:keyStars.core?.length?keyStars.top.text:keyStars.text}
 ];
 const report=pairReport({...base,summary},a.name||'当前案例',b.name||'第二人');
 // v0.81.0 生辰合盘：双方八字详细对比数据（四柱十神/纳音/藏干/五行占比/命卦/日主），供前端「生辰合盘」分区渲染。
 const elementOf=p=>p?.stemElement||p?.element||'';
 const pillarRow=p=>({name:p.name,stem:p.stem,branch:p.branch,tenGod:p.tenGod,nayin:p.nayin,changsheng:p.changsheng,
  stemElement:p.stemElement,branchElement:p.branchElement,hidden:(p.hidden||[]).map(h=>({stem:h.stem,element:h.element,rank:h.rank,god:h.god}))});
 const baziSide=(pro)=>({
  name:pro?.info?.gender||'',
  dayMaster:pro?.dayMaster||null,
  pillars:(pro?.pillars||[]).map(pillarRow),
  percentages:pro?.strength?.percentages||null,
  tenGods:(pro?.pillars||[]).filter(p=>p.name!=='日柱').map(p=>({pillar:p.name,tenGod:p.tenGod,stem:p.stem,branch:p.branch,hidden:p.hidden})),
  traditional:pro?.traditional||null,
  lunarYear:pro?.info?.lunarYear||'',
  lunar:pro?.info?.lunar||'',
  nayin:(pro?.pillars||[]).map(p=>p.nayin),
  strength:pro?.strength?.kind||''
 });
 const bazi={a:baziSide(ba),b:baziSide(bb)};
 return {...base,summary,report,bazi};
}
/* v0.84.0：合盘时点专项——在给定时刻，双方各自出「本命 + 行运」双圈盘，
 * 并计算两对跨盘相位：A行运×B本命（A的当下星触发B的领域）与 B行运×A本命。
 * 这是「双人合盘时点专项报告」的数据源：正文按该时刻逐条推导，不重复本命全文。
 * 复用 westernPro(mode='transit') 拿各自行运，再用 chart.mjs 的 crossAspects 思想算跨盘。
 * 不虚构吉凶，只列可核的星历相位证据。 */
function pairPeriod({a,b,at,mode='transit'}){
 if(!['transit','secondary','tertiary','solar','lunar'].includes(mode))throw Error('合盘时点专项不支持此盘类');
 const cfg={};
 const side=(birth)=>{
  const natal=westernPro({birth,config:cfg,mode:'natal'}).chart;
  const prog=westernPro({birth,config:cfg,mode,at});
  // transit/secondary/tertiary 返回 {chart:natal,outer:progressed,cross}；
  // solar/lunar 返照返回 {chart:progressed,natalCross,returnEvent}，逐类取「推进盘」与「自有跨盘相位」。
  const transit=prog.outer||prog.chart;
  const crossOwn=prog.cross||prog.natalCross||[];
  return {natal,transit,crossOwn};
 };
 const A=side(a),B=side(b);
 const cross=(aP,bP)=>{const out=[];for(const x of aP)for(const y of bP){let sep=Math.abs(x.lon-y.lon)%360;if(sep>180)sep=360-sep;for(const [angle,name,orb] of [[0,'合相',8],[60,'六分相',5],[90,'四分相',6],[120,'三分相',6],[180,'对分相',8]])if(Math.abs(sep-angle)<=orb){out.push({a:x.name,b:y.name,type:name,angle,orb:Math.abs(sep-angle)});break;}}return out.sort((x,y)=>x.orb-y.orb);};
 return {
  mode,at,
  a:A,b:B,
  // 跨盘：A行运×B本命（A的当下星触发B的生活领域）+ B行运×A本命
  aOnB:cross(A.transit.planets,B.natal.planets),
  bOnA:cross(B.transit.planets,A.natal.planets)
 };
}

export const consoleRoutes={
 '/api/console/vedic':vedicPro,'/api/console/resonance':resonance,'/api/console/reading':consoleReading,'/api/console/western':westernPro,'/api/console/bazi':baziPro,
 '/api/console/reverse-bazi':reverseBazi,'/api/console/convert':convertBirth,
 '/api/console/bones':({birth})=>boneWeight(birth),'/api/console/qizheng':({birth})=>qizheng(birth),
 '/api/console/yijing':yijing,'/api/console/calendar':almanac,'/api/console/year-agenda':yearAgenda,'/api/console/timing-cross':timingCross,
 '/api/console/liuyao':({date})=>qiGuaByTime({date}),
 '/api/console/naming':data=>suggestNames(data),
 '/api/console/today-sky':todaySky,'/api/console/daily-guidance':dailyGuidance,
 '/api/console/relationship':data=>pairReading(data).fit,
 '/api/console/pair-period':pairPeriod
};

export function localRequest(path, data) {
 const url = new URL(path, 'https://firstlight.local');
 if (Object.hasOwn(consoleRoutes, url.pathname)) return consoleRoutes[url.pathname](data);
 switch (url.pathname) {
  case '/api/geo/search': return {items:searchPlaces(url.searchParams.get('q'))};
  case '/api/geo/resolve': {
   const place = resolvePlace(Object.fromEntries(url.searchParams));
   if (!place) throw Error('未找到该地区坐标');
   return place;
  }
  case '/api/ziwei': {
   const dateStr = data.calendar === 'lunar' ? lunarToSolar(data.Y,data.M,data.D,!!data.leapMonth) : data.dateStr;
   if (!dateStr) throw Error('农历日期无效');
   return ziweiChart({...data,dateStr});
  }
  case '/api/ziwei-flow': return ziweiFlow({...data,timeIndex:data.ziweiTimeIndex??data.timeIndex??0});
  case '/api/synastry/chart': return pairReading(data);
  default: throw Error('本机不支持此计算');
 }
}

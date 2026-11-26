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
 if(mode!==undefined&&!['synastry','composite','midpoint','davison'].includes(mode))throw Error('无效合盘类型');
 const ba=baziPro({birth:a}),bb=baziPro({birth:b});
 const solarA=solarInput(a,ba),solarB=solarInput(b,bb);
 const result=synastry({...solarA,skipZiwei:true},{...solarB,skipZiwei:true},mode||'synastry');
 // 多体系合婚：八字干支/十神/喜用 + 紫微命宫夫妻宫互参（不虚构契合度，分数仍取八科）
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
 return {...base,summary,report};
}
export const consoleRoutes={
 '/api/console/vedic':vedicPro,'/api/console/resonance':resonance,'/api/console/reading':consoleReading,'/api/console/western':westernPro,'/api/console/bazi':baziPro,
 '/api/console/reverse-bazi':reverseBazi,'/api/console/convert':convertBirth,
 '/api/console/bones':({birth})=>boneWeight(birth),'/api/console/qizheng':({birth})=>qizheng(birth),
 '/api/console/yijing':yijing,'/api/console/calendar':almanac,'/api/console/year-agenda':yearAgenda,'/api/console/timing-cross':timingCross,
 '/api/console/liuyao':({date})=>qiGuaByTime({date}),
 '/api/console/naming':data=>suggestNames(data),
 '/api/console/today-sky':todaySky,'/api/console/daily-guidance':dailyGuidance,
 '/api/console/relationship':data=>pairReading(data).fit
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

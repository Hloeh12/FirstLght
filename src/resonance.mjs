import {baziPro} from './bazi-pro.mjs';
import {ziweiChart,ziweiFlow} from './ziwei.mjs';
import {westernPro} from './western-pro.mjs';
import {yearPillar} from './bazi.mjs';
import {Solar} from 'lunar-javascript';
const topics=['行动与节奏','事业职责','财富资源','关系互动'];
const topicOfPillar=name=>name==='日柱'?3:name==='月柱'?1:name==='时柱'?2:0;
const topicOfPalace=name=>/财帛|田宅/.test(name)?2:/官禄/.test(name)?1:/夫妻|交友|兄弟|子女/.test(name)?3:0;
const topicOfHouse=house=>[2,8].includes(house)?2:[6,10].includes(house)?1:[5,7,11].includes(house)?3:0;
// Evidence is counted only when an actual selected-period relation exists.
// Coverage is a rule match count, never a forecast probability or fabricated score.
export function resonance({birth,at=new Date().toISOString(),config={}}){
 const date=new Date(at);if(!Number.isFinite(+date))throw Error('共振时刻无效');
 const wall=new Date(+date+Number(birth.city.tz??8)*3600000),year=yearPillar(date,wall.getUTCFullYear()).year;
 let b=baziPro({birth,selection:{year}});
 const month=b.months.findLastIndex(m=>Date.parse(m.date)<=+date);
 if(month>=0)b=baziPro({birth,selection:{year,month}});
 const z=ziweiChart({...birth,dateStr:b.info.solar,h:birth.timeUnknown?12:birth.h,mi:birth.timeUnknown?0:birth.mi});
 const lunar=Solar.fromYmd(wall.getUTCFullYear(),wall.getUTCMonth()+1,wall.getUTCDate()).getLunar();
 const flow=ziweiFlow({dateStr:z.effectiveDate,timeIndex:z.effectiveTimeIndex,gender:birth.gender,astroType:'heaven',ziweiLeap:birth.ziweiLeap,ziweiSchool:birth.ziweiSchool,flowYear:lunar.getYear(),scope:'monthly',month:lunar.getMonth()});
 const west=westernPro({birth,at:date.toISOString(),mode:'transit',config});
 const evidence=[];
 for(const r of b.relationships.filter(r=>r.ids.some(i=>i>=4)&&r.ids.some(i=>i<4))){
  const native=r.ids.find(i=>i<4),name=b.pillars[native].name;
  evidence.push({system:'八字',topic:topicOfPillar(name),direction:['六冲','相刑','相害','相破'].includes(r.type)?'张力':'助力',text:r.pillars.join('／')+' · '+r.pattern+r.type,source:r});
 }
 for(const m of flow.mutagens){
  const palace=z.palaces.find(p=>p.branch===m.branch);
  if(!palace)continue;
  evidence.push({system:'紫微',topic:topicOfPalace(palace.name),direction:m.type==='忌'?'张力':'助力',text:flow.ganZhi+'流月 · '+m.star+'化'+m.type+'入本命'+palace.name,source:m});
 }
 for(const a of west.cross.filter(a=>['sun','moon','mercury','venus','mars'].includes(a.bKey)&&[60,90,120,180].includes(a.angle))){
  const target=west.chart.planets.find(p=>p.key===a.bKey);
  evidence.push({system:'西洋',topic:topicOfHouse(target.house),direction:[90,180].includes(a.angle)?'张力':'助力',text:'行运'+a.a+' '+a.type+' 本命'+a.b+'（第'+target.house+'宫） · Orb '+a.orb.toFixed(3)+'°'+(a.applying===null?'':a.applying?' 入相位':' 出相位'),source:a});
 }
 const chains=topics.flatMap((topic,index)=>['助力','张力'].map(direction=>{
  const items=evidence.filter(e=>e.topic===index&&e.direction===direction),systems=[...new Set(items.map(e=>e.system))];
  return {topic,direction,systems,coverage:systems.length,items};
 })).filter(c=>c.items.length).sort((a,b)=>b.coverage-a.coverage);
 return {at:date.toISOString(),period:flow.date,chains,consensus:chains.filter(c=>c.coverage===3),method:'同一时刻：八字节气岁运、紫微农历流月、西洋对本命行运。按主题和助力/张力规则交叉匹配；证据覆盖率不是吉凶概率。无三体系同向时明确留空。'};
}

/* bazi-zhuangge.mjs —— 专旺格判定（曲直/炎上/稼穑/从革/润下）+ 化气格判定。
 * 与扶抑/调候/从格并列的第四、第五种格局入口；条件不足一律返回 null，不妄断。
 * 依据：
 *  - 专旺：《滴天髓》「一气专旺」取象——日主五行在天干地支成绝对主导（≥75%）、
 *    印比连成一片、克泄之神无根或被合会收编。
 *  - 化气：《子平真诠》/《渊海子平》化气十段——日干与邻干五合、化神得月令或成局引化、
 *    化神不被冲克破局。
 */
import {STEMS,BRANCHES,produce,control} from './bazi-tiaohou.mjs';

const ELEM='木木火火土土金金水水';
const elemOfStem=s=>ELEM[STEMS.indexOf(s)]||'';
const ZHUANWANG={木:['曲直格','仁寿格'],火:['炎上格'],土:['稼穑格'],金:['从革格'],水:['润下格']};

/** 专旺格判定
 * weights: 五行权重；roots: 地支本气根五行数组（含位置）；pillars: 四柱干支。
 * 返回 null 表示不构成。 */
export function detectZhuanWang(weights,roots,pillars){
 const total=Object.values(weights).reduce((a,b)=>a+b,0);
 if(!total)return null;
 const dayStem=pillars[2]?.stem,self=elemOfStem(dayStem);
 const entries=Object.entries(weights).sort((a,b)=>b[1]-a[1]);
 const [topElem,topVal]=entries[0];
 if(topElem!==self)return null;                 // 主导五行必须是日主本气
 const ratio=topVal/total;
 if(ratio<0.72)return null;
 // 印比连片：同我 + 生我 ≥ 85%（produce[x]=x所生，故生我者=「被我生关系里反过来」→ 找 produce[k]===self）
 const resourceElem=Object.keys(produce).find(k=>produce[k]===self); // 生我者（水←金）
 const helper=(weights[self]+(weights[resourceElem]||0))/total;
 if(helper<0.85)return null;
 // 克泄（我克/克我/我生）无强根：三会三合以外的地支本气根不计
 const drain=produce[self],opp=control[self],ctrl=Object.keys(control).find(k=>control[k]===self);
 const hostile=(weights[drain]||0)+(weights[opp]||0)+(weights[ctrl]||0);
 if(hostile/total>0.15)return null;
 const names=ZHUANWANG[self];
 return {kind:names[0],element:self,ratio:+(ratio*100).toFixed(1),
  use:[produce[self],produce[produce[self]]],
  avoid:[ctrl,opp],
  note:`${names[0]}（${self}一气专旺）：${self}占 ${(ratio*100).toFixed(0)}%，印比连片 ${(helper*100).toFixed(0)}%，克泄无根。顺其气势，以${produce[self]}、${produce[produce[self]]}为用，忌${ctrl}逆势。`};
}

/** 化气格判定：日干与月干（或时干，紧贴日主者）五合，化神得月令或三合局引化，化神不破。
 * pillars: [{stem,branch}]×4；月支为令；weights 供三合局判断。 */
const STEM_COMBINE={'甲':'己','乙':'庚','丙':'辛','丁':'壬','戊':'癸','己':'甲','庚':'乙','辛':'丙','壬':'丁','癸':'戊'};
const COMBINE_ELEM={'甲己':'土','乙庚':'金','丙辛':'水','丁壬':'木','戊癸':'火'};
const SANHE={'水':['申','子','辰'],'木':['亥','卯','未'],'火':['寅','午','戌'],'金':['巳','酉','丑']};
export function detectHuaQi(pillars,monthBranch,weights){
 const dayStem=pillars[2]?.stem;
 if(!dayStem)return null;
 const candidates=[1,3].filter(i=>pillars[i]?.stem&&STEM_COMBINE[dayStem]===pillars[i].stem);
 if(!candidates.length)return null;
 const pair=[dayStem,STEM_COMBINE[dayStem]].sort((a,b)=>STEMS.indexOf(a)-STEMS.indexOf(b)).join('');
 const elem=COMBINE_ELEM[pair];
 if(!elem)return null;
 // 化神得令：月支本气或余气支持化神；或三合局成
 const hidden={子:'癸',丑:'己癸辛',寅:'甲丙戊',卯:'乙',辰:'戊乙癸',巳:'丙庚戊',午:'丁己',未:'己丁乙',申:'庚壬戊',酉:'辛',戌:'戊辛丁',亥:'壬甲'};
 const deLing=hidden[monthBranch]?.includes({土:'戊己',金:'庚辛',水:'壬癸',木:'甲乙',火:'丙丁'}[elem].split('')[0]??'');
 const sanhe=SANHE[elem]?.every(b=>pillars.some(p=>p.branch===b));
 if(!deLing&&!sanhe)return null;
 // 破局：化神被冲、或合而不化的日主本气根强
 const clash={'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
 const broken=pillars.some(p=>p.branch&&clash[p.branch]===monthBranch);
 const total=Object.values(weights).reduce((a,b)=>a+b,0)||1;
 const selfRoot=(pillars.some(p=>p.branch&&hidden[p.branch]?.includes(dayStem)&&hidden[p.branch][0]===dayStem));
 if(broken)return null;
 return {kind:`${dayStem}${STEM_COMBINE[dayStem]}合化${elem}格`,element:elem,
  with:STEM_COMBINE[dayStem],deLing:!!deLing,sanhe:!!sanhe,
  use:[elem,produce[elem]],
  avoid:[control[elem]],
  note:`${dayStem}${STEM_COMBINE[dayStem]}五合${deLing?'，化神得月令':''}${sanhe?'，三合局引化':''}，化神${elem}不破，论化气。以${elem}与其所生${produce[elem]}为用。`};
}

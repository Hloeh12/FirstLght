import hexagrams from './reference/zhouyi.json' with {type:'json'};
import {Solar,LunarUtil} from 'lunar-javascript';
import {baziPro,stems,stemElements} from './bazi-pro.mjs';
import {tenGod} from './bazi.mjs';
import {bodyAt,norm} from './ephemeris.mjs';

const zodiac=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
const phases=['新月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'];
const moods=['适合从一件小事开始。','适合给刚萌芽的计划留一点空间。','适合把犹豫拆成一个可执行步骤。','适合调整细节，让计划更容易持续。','适合回顾结果，也给自己片刻停顿。','适合整理所得，分享一条有用经验。','适合删去一件已经不必坚持的事。','适合放慢节奏，给新周期留白。'];
const position=longitude=>{
 const minutes=Math.floor(norm(longitude)*60),sign=Math.floor(minutes/1800);
 return {longitude,sign:zodiac[sign],degree:Math.floor(minutes%1800/60),minute:minutes%60};
};
export function todaySky({at}={}){
 const date=at===undefined?new Date():new Date(at);
 if(!Number.isFinite(+date))throw Error('无效的观测时间');
 const sun=position(bodyAt(date,0,null).longitude),moon=position(bodyAt(date,1,null).longitude);
 const angle=norm(moon.longitude-sun.longitude),phase=Math.round(angle/45)%8;
 const wall=new Date(+date+8*3600000);
 return {at:date.toISOString(),day:wall.toISOString().slice(0,10),hour:wall.getUTCHours(),sun,moon,
  phase:phases[phase],angle,litPercent:Math.round(50*(1-Math.cos(angle*Math.PI/180))),
  hint:`月亮在${moon.sign}座 · ${moods[phase]}`};
}

const produce={木:'火',火:'土',土:'金',金:'水',水:'木'};
const controls={木:'土',火:'金',土:'水',金:'木',水:'火'};
const palettes={
 木:{color:'樱芽粉',swatch:'#efabd2',direction:'东方',action:'梳理学习计划，向可信任的人请教',rest:'给想法留一段生长时间'},
 火:{color:'玫瑰粉',swatch:'#ff77aa',direction:'南方',action:'清楚表达想法，完成一个可展示的小成果',rest:'把热情留给真正想照亮的事'},
 土:{color:'晨曦金',swatch:'#edc396',direction:'中央',action:'整理清单、预算与居住空间',rest:'先安顿好自己，再处理复杂的问题'},
 金:{color:'珍珠樱白',swatch:'#ffe6f0',direction:'西方',action:'划清任务边界，复核约定与细节',rest:'放下多余的要求，让重要的事有位置'},
 水:{color:'雾樱紫',swatch:'#d8acd4',direction:'北方',action:'记录感受，给行程与对话留出弹性',rest:'允许自己调整方向，节奏也可以温柔'}
};
const angleRelation=(day,element)=>element===day?'同我':produce[element]===day?'生我':produce[day]===element?'我生':controls[element]===day?'克我':'我克';
export function dailyGuidance({at,birth}={}){
 if(!birth)throw Error('请先选择命主，抽取专属指引');
 const date=at===undefined?new Date():new Date(at);
 if(!Number.isFinite(+date))throw Error('无效的抽取时间');
 const natal=baziPro({birth}),master=natal.dayMaster,stemIndex=stems.indexOf(master.stem);
 const clock=new Date(+date+8*3600000);
 const lunar=Solar.fromYmdHms(clock.getUTCFullYear(),clock.getUTCMonth()+1,clock.getUTCDate(),clock.getUTCHours(),clock.getUTCMinutes(),clock.getUTCSeconds()).getLunar();
 const eight=lunar.getEightChar();
 eight.setSect(birth.lateZishi==='current-day'?2:1);
 const day=eight.getDay(),hour=eight.getTime(),dayStem=day[0],hourStem=hour[0];
 const weights={...natal.strength.weights};
 for(const [pillar,scale] of [[day,1],[hour,.65]]){
  weights[stemElements[stems.indexOf(pillar[0])]]+=scale;
  const hidden=LunarUtil.ZHI_HIDE_GAN[pillar[1]];
  const fractions=[[],[1],[.7,.3],[.6,.25,.15]][hidden.length];
  hidden.forEach((s,i)=>{weights[stemElements[stems.indexOf(s)]]+=scale*fractions[i];});
 }
 const resource=Object.keys(produce).find(e=>produce[e]===master.element);
 const total=Object.values(weights).reduce((sum,value)=>sum+value,0);
 const support=100*(weights[master.element]+weights[resource])/total;
 const mode=support<40?'扶助偏少':support>60?'扶助较多':'扶助相对均衡';
 const useful=support<40?resource:support>60?produce[master.element]:controls[master.element];
 const palette=palettes[useful];
 const dayElement=stemElements[stems.indexOf(dayStem)],hourElement=stemElements[stems.indexOf(hourStem)];
 const dayGod=tenGod(stemIndex,stems.indexOf(dayStem)),hourGod=tenGod(stemIndex,stems.indexOf(hourStem));
 const branch=hour[1],ganzhiIndex=LunarUtil.JIA_ZI.indexOf(day),hourIndex=LunarUtil.ZHI.indexOf(branch)-1;
 const dateHour=((clock.getUTCFullYear()*12+clock.getUTCMonth())*31+clock.getUTCDate()-1)*24+clock.getUTCHours();
 const elementIndex='木火土金水'.indexOf(master.element);
 const seed=dateHour*50+stemIndex*5+elementIndex;
 const hexagram=hexagrams[((seed%64)+64)%64];
 const benefit=produce[dayElement]===master.element||dayElement===master.element;
 const avoid=benefit?'在获得支持时接下过多承诺':'在疲惫或犹豫时急着作重要承诺';
 return {
  day:clock.toISOString().slice(0,10),branch,dayPillar:day,hourPillar:hour,dayMaster:master.stem+master.element,
  seed,seedSource:{calendar:'Asia/Shanghai',dateHour,stem:master.stem,element:master.element},hexagram:{number:hexagram.number,name:hexagram.name_full,guaci:hexagram.guaci},color:palette.color,swatch:palette.swatch,direction:palette.direction,element:useful,
  energy:`${master.stem}${master.element}日主 · 今日${day}（${dayGod}，${angleRelation(master.element,dayElement)}） · ${hour}时（${hourGod}，${angleRelation(master.element,hourElement)}）。加入日时权重后，扶助约 ${support.toFixed(1)}%，${mode}。`,
  good:palette.action+'；'+(/食神|伤官/.test(hourGod)?'此时可先整理表达，再确认对方的理解。':/官|杀/.test(hourGod)?'此时先明确责任与期限。':'此时适合把计划拆成一件可完成的小事。'),
  avoid,motto:`${master.stem}${master.element}的你，${palette.rest}。${['慢一点，也能走到心之所向','把今天过好，就是新的转机','温柔待己，也是一种笃定','容许不同的节奏，共处仍有空间','不必一次解答所有问题','做一件小事，让生活重新流动','先听见自己，再回应世界','每次停顿都可以是重新选择'][seed%8]}。`,
  support:Number(support.toFixed(2))
 };
}

import {bodyAt,norm} from './ephemeris.mjs';

const zodiac=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
const phases=['新月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'];
const moods=['适合从一件小事开始。','适合给刚萌芽的计划留一点空间。','适合把犹豫拆成一个可执行步骤。','适合调整细节，让计划更容易持续。','适合回顾结果，也给自己片刻停顿。','适合整理所得，分享一条有用经验。','适合删去一件已经不必坚持的事。','适合放慢节奏，给新周期留白。'];
const DAY=86400000;
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

const cards=[
 ['樱花粉','#ff77aa','东方','开始一件小事','在犹豫时反复责备自己','花开的速度，由它自己决定。'],
 ['玫瑰粉','#f57ba6','东南','说出具体的愿望','替别人预先作决定','温柔地开口，也是一种勇气。'],
 ['蜜桃粉','#ffb4a8','南方','整理一件重要物品','同时开启太多任务','把今天照亮一小块，就已经足够。'],
 ['晨曦金','#f3be7d','西南','给自己留出散步时间','把忙碌当成唯一答案','脚步放慢时，你依然在前进。'],
 ['雾樱紫','#d7a2cf','西方','写下一件想感谢的事','把片刻情绪当成定论','有些事只需要被看见，就会轻一点。'],
 ['暖桃粉','#f9adba','西北','完成一个小承诺','把每件事都变成考核','你的节奏不必与任何人相同。'],
 ['蔷薇粉','#ec8eb3','北方','先休息，再处理复杂的事','在疲惫时急着回复','停下来，也是照顾正在生长的自己。'],
 ['初光粉','#ffcedf','东北','为明天准备一件轻便的物品','为没做完的事熬夜','留一点空白，光才有地方落下。']
];
export function dailyGuidance({at}={}){
 const date=at===undefined?new Date():new Date(at);
 if(!Number.isFinite(+date))throw Error('无效的抽取时间');
 const wall=+date+8*3600000,clock=new Date(wall);
 const day=Math.floor(wall/DAY),slot=Math.floor((clock.getUTCHours()+1)/2)%12;
 const ordinal=day*12+slot;
 const seed=Math.imul(ordinal^(ordinal>>>13),0x45d9f3b)>>>0;
 const [color,swatch,direction,good,avoid,motto]=cards[seed%cards.length];
 return {day:clock.toISOString().slice(0,10),branch:'子丑寅卯辰巳午未申酉戌亥'[slot],color,swatch,direction,good,avoid,motto};
}

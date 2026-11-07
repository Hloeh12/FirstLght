import {solarTerms} from './bazi.mjs';
import {DAY_MS} from './time-constants.mjs';
// 《三命通会》卷二「论人元司事」首段分日。保留壬水墓库等正文口径，
// 不把司事余气偷偷改写成另一版本的通行藏干表。末段延续至下一个节。
export const COMMAND_PHASES={
 寅:[['戊',5],['丙',5],['甲',20]],卯:[['甲',7],['乙',23]],
 辰:[['乙',7],['壬',5],['戊',18]],巳:[['戊',7],['庚',5],['丙',18]],
 午:[['丙',7],['丁',23]],未:[['丁',7],['甲',5],['己',18]],
 申:[['己',5],['壬',5],['庚',20]],酉:[['庚',7],['辛',23]],
 戌:[['辛',7],['丙',5],['戊',18]],亥:[['戊',5],['甲',5],['壬',20]],
 子:[['壬',7],['癸',23]],丑:[['癸',7],['庚',5],['己',18]]
};
const branches='寅卯辰巳午未申酉戌亥子丑';
export function seasonalCommand(at){
 const date=new Date(at),y=date.getUTCFullYear();
 if(!Number.isFinite(+date))throw Error('司令需要有效出生时刻');
 const list=[y-1,y,y+1].flatMap(solarTerms).sort((a,b)=>a.date-b.date);
 let index=0;for(let i=0;i<list.length;i++)if(list[i].date<=date)index=i;
 const term=list[index],next=list[index+1];
 const branch=branches[term.lon===285?11:((term.lon-315+360)%360)/30];
 const elapsed=(date-term.date)/DAY_MS,rows=COMMAND_PHASES[branch];
 let lower=0,phase=rows.length-1;
 for(let i=0;i<rows.length;i++){if(elapsed<lower+rows[i][1]){phase=i;break;}lower+=rows[i][1];}
 const startDay=rows.slice(0,phase).reduce((n,r)=>n+r[1],0);
 return {stem:rows[phase][0],branch,elapsedDays:elapsed,phase:phase+1,startDay,
  phaseStart:new Date(+term.date+startDay*DAY_MS).toISOString(),
  phaseEnd:new Date(phase===rows.length-1?+next.date:Math.min(+next.date,+term.date+(startDay+rows[phase][1])*DAY_MS)).toISOString(),
  term:{name:term.name,utc:term.date.toISOString(),longitude:term.lon},next:{name:next.name,utc:next.date.toISOString()},
  method:'《三命通会·论人元司事》首段分日表；从真实交节 UT 起逐 24 小时计日，末段延续到下一节。司事余气与通行藏干异文分开展示。'};
}

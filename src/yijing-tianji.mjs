import {housingReading} from './housing.mjs';
import hexagrams from './reference/zhouyi.json' with {type:'json'};
import {baziPro,branches} from './bazi-pro.mjs';
import {bodyAt} from './ephemeris.mjs';

const trigrams=['乾','兑','离','震','巽','坎','艮','坤'];
const traditional=['乾','兌','離','震','巽','坎','艮','坤'];
const bits=['111','110','101','100','011','010','001','000'];
const images=['天','泽','火','雷','风','水','山','地'];
const themes=['主动开创','交流协商','辨明方向','应对变动','循序渗透','审慎过险','设立边界','承载与配合'];
export const STEM_NUMBERS={甲:6,乙:2,丙:8,丁:7,戊:1,己:9,庚:3,辛:4,壬:6,癸:2};
const branchNumbers={子:[1,6],亥:[1,6],寅:[3,8],卯:[3,8],巳:[2,7],午:[2,7],申:[4,9],酉:[4,9],辰:[5,10],戌:[5,10],丑:[5,10],未:[5,10]};
const luoshu={1:'坎',2:'坤',3:'震',4:'巽',6:'乾',7:'兑',8:'艮',9:'离'};
const mod=(n,m)=>((n%m)+m)%m;
const record=g=>({...g,lines:[...bits[traditional.indexOf(g.trigrams.lower)>=0?traditional.indexOf(g.trigrams.lower):trigrams.indexOf(g.trigrams.lower)]+bits[traditional.indexOf(g.trigrams.upper)>=0?traditional.indexOf(g.trigrams.upper):trigrams.indexOf(g.trigrams.upper)]].map(Number)});
const corpus=hexagrams.map(record);
export function hexFromLines(lines,change=-1){
 const g=corpus.find(x=>x.lines.join('')===lines.join(''));
 if(!g)throw Error('无效六爻卦象');
 const lower=bits.indexOf(lines.slice(0,3).join('')),upper=bits.indexOf(lines.slice(3).join(''));
 return {number:g.number,name:g.name_full,guaci:g.guaci,line:change<0?null:g.yaoci[change]?.text,change:change+1,lines:[...lines],
  reading:'上卦'+images[upper]+'侧重'+themes[upper]+'，下卦'+images[lower]+'侧重'+themes[lower]+'。'+(change>=0?'结合第'+(change+1)+'爻的处境，':'')+'先观察所处阶段，再选择推进、等待或调整。'};
}
export function reduceHeluo(sum,base){
 const remaining=sum>base?sum-base:sum;
 const number=remaining%10||Math.floor(remaining/10);
 if(number<1||number>9)throw Error('河洛取数超出可配卦范围');
 return {sum,base,remaining,number};
}
export function heluoNumbers(pillars,{year,gender}){
 const rows=pillars.map(p=>({pillar:p.stem+p.branch,stem:STEM_NUMBERS[p.stem],branch:branchNumbers[p.branch]}));
 if(rows.some(r=>!r.stem||!r.branch))throw Error('河洛取数需要四柱有效干支');
 const numbers=rows.flatMap(r=>[r.stem,...r.branch]);
 const heaven=reduceHeluo(numbers.filter(x=>x%2).reduce((a,b)=>a+b,0),25);
 const earth=reduceHeluo(numbers.filter(x=>!(x%2)).reduce((a,b)=>a+b,0),30);
 const era=mod(Math.floor((year-1864)/60),3),male=gender==='男',yang=branches.indexOf(pillars[0].branch)%2===0;
 const lodging=era===0?(male?'艮':'坤'):era===2?(male?'离':'兑'):male===yang?'艮':'坤';
 const trigram=n=>n===5?lodging:luoshu[n];
 const sky=trigram(heaven.number),land=trigram(earth.number),top=male===yang;
 const upper=trigrams.indexOf(top?sky:land),lower=trigrams.indexOf(top?land:sky);
 return {rows,heaven,earth,era:['上元','中元','下元'][era],lodging,sky,land,skyOnTop:top,lines:[...bits[lower]+bits[upper]].map(Number)};
}
// 按教材印页47–48逐图核对：少于四同类爻时先复数两轮，
// 四、五同类爻只数一轮，再自下而上移入异类爻。
export function yuantang(lines,hour,gender,yangSeason){
 if(!Number.isInteger(hour)||hour<0||hour>11)throw Error('无效元堂时支');
 const value=hour<6?1:0,offset=hour%6,male=gender==='男';
 const preferred=lines.flatMap((v,i)=>v===value?[i]:[]),other=lines.flatMap((v,i)=>v!==value?[i]:[]);
 if(lines.every(x=>x===lines[0])){
  let sequence;
  if(lines[0]===1){
   sequence=male?(hour<6?[0,1,2]:[3,4,5]):yangSeason?(hour<6?[5,4,3]:[2,1,0]):(hour<6?[0,1,2]:[3,4,5]);
  }else{
   sequence=!male?(hour<6?[0,1,2]:[3,4,5]):yangSeason?(hour<6?[2,1,0]:[5,4,3]):(hour<6?[3,4,5]:[0,1,2]);
  }
  return sequence[offset%3];
 }
 const list=[...preferred,...(preferred.length<=3?preferred:[]),...other];
 return list[offset];
}
const sovereign={
 // [阴令卦序, 阳令卦序]，另标后天元堂，直接保留教材特殊图例。
 '29:4':[7,16], '3:4':[24,23], '39:4':[15,8],
 '29:5':[48,42], '3:5':[32,53], '39:5':[18,59]
};
export function posterior(natal,origin,yangSeason){
 const special=sovereign[natal.number+':'+origin];
 if(special){
  const index=origin===4?(yangSeason?1:4):(yangSeason?5:2);
  const g=corpus.find(x=>x.number===special[yangSeason?1:0]);
  return {...hexFromLines(g.lines,index),origin:index,special:'三至尊卦特殊换卦（教材印页50–51）'};
 }
 const lines=[...natal.lines];lines[origin]=1-lines[origin];
 const index=(origin+3)%6;
 return {...hexFromLines([...lines.slice(3),...lines.slice(0,3)],index),origin:index,special:null};
}
export function tianjiAnnual(natal,changed,birthYear,year){
 const age=year-birthYear+1;
 if(age<1)return {annual:null,periods:[],notice:'所选流年早于出生干支年。'};
 let start=1;
 const periods=[natal,changed].flatMap((g,phase)=>Array.from({length:6},(_,i)=>{
  const line=(g.origin+i)%6,length=g.lines[line]?9:6;
  const p={phase:phase?'后天':'先天',line:line+1,startAge:start,endAge:start+length-1,base:g};start+=length;return p;
 }));
 const active=periods.find(p=>age>=p.startAge&&age<=p.endAge);
 if(!active)return {annual:null,periods:periods.map(({base,...p})=>p),notice:'所选年龄超出先后天十二爻运限，不外推卦象。'};
 const lines=[...active.base.lines],baseLine=active.line-1,offset=age-active.startAge;
 let last=-1;
 for(let i=0;i<=offset;i++){
  const flowYear=birthYear+active.startAge+i-1,yangYear=mod(flowYear-4,12)%2===0;
  let index;
  if(active.base.lines[baseLine]){
   if(i===0&&yangYear)continue;
   index=i===0?baseLine:i===1?(baseLine+3)%6:i===2?baseLine:(baseLine+i-2)%6;
  }else index=(baseLine+i)%6;
  lines[index]=1-lines[index];last=index;
 }
 return {annual:{...hexFromLines(lines,last),age,taisuibranch:branches[mod(year-4,12)],period:active.phase+' '+active.startAge+'–'+active.endAge+'岁 · 第'+active.line+'爻'},
  periods:periods.map(({base,...p})=>p),notice:''};
}
export function yijing({birth,year=new Date().getUTCFullYear()}){
 if(birth.timeUnknown)throw Error('元堂取爻需要出生时辰');
 if(!Number.isInteger(year)||year<1800||year>2399)throw Error('无效流年');
 const b=baziPro({birth}),bornYear=b.info.solarYear;
 const numbers=heluoNumbers(b.pillars,{year:bornYear,gender:birth.gender});
 const longitude=bodyAt(new Date(b.info.utc),0,null).longitude,yangSeason=longitude>=270||longitude<90;
 const origin=yuantang(numbers.lines,branches.indexOf(b.info.hourBranch),birth.gender,yangSeason);
 const natal={...hexFromLines(numbers.lines,origin),origin};
 const changed=posterior(natal,origin,yangSeason);
 const flow=tianjiAnnual(natal,changed,bornYear,year);
 return {housing:housingReading(birth.housing),numbers,natal,changed,...flow,year,yangSeason,library:corpus.map(x=>hexFromLines(x.lines)),
  method:'天纪《天机道》20100907教材：天干洛书、地支河图，奇合天数、偶合地数；按25/30消纳、五数寄宫、阴阳男女定上下卦。生时定元堂，变元堂再换上下卦，三至尊按专项图表。流年按元堂阳九阴六运限，依太岁阴阳与本应爻游变；并非年支简单取余六。'};
}

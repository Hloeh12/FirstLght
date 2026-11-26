/* 双人关系周期与婚期应期（v0.77.0）
 * 只做一件可算的事：把「流月 / 流年干支」逐一与双方日支（婚姻宫）、年支（生肖）、日干对照，
 * 按传统刑冲合害给正负权重，得到一条可复核的曲线；不给「幸福指数」这类伪精确结论。
 * 权重是取象口径（合为顺、冲为动），已在 method 里明示，可被用户自行替换。 */
import {Solar} from 'lunar-javascript';
import {branchRelation} from './match-making.mjs';

const STEM_HE={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
const WEIGHT={'六合':2,'三合局':2,'半合':1.2,'同支':0.4,'相刑':-1.5,'相害':-1.2,'相破':-0.6,'六冲':-2,'无':0,unknown:0};
const KIND_ADVICE={
 '六合':'合则事缓，适合定日子、见家长、把关系往前推一步',
 '三合局':'同气相求，适合共同做一件需要协作的事（搬家、装修、合伙）',
 '半合':'有亲近感但差一口气，适合同游、试住、磨合生活细节',
 '同支':'节奏相近，容易各说各话，需刻意换位',
 '相刑':'易在礼数与对错上较劲，重大决定宜延后或请第三方',
 '相害':'暗耗偏多，注意家庭期待带来的隐性压力',
 '相破':'小事易互相打乱，不宜安排高密度行程',
 '六冲':'冲则动，适合旅行、搬迁、换工作这类「以动应动」，不宜在情绪高点定终身',
 '五合':'心意被牵动，容易动念、也容易一时冲动，重要承诺留到冷静后',
 '红鸾天喜':'红鸾/天喜照命，传统视为谈婚论嫁的动象，适合见家长、定名分',
 '无':'无强信号，按日常节奏走'
};
const BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const RED_LUAN=i=>(3-i+12)%12; // 红鸾：子年在卯、丑年在寅…逆数三位
const TIAN_XI=i=>(RED_LUAN(i)+6)%12;
const idx=b=>BRANCHES.indexOf(b);

function relationsOf({branch,stem,dayBranch,dayStem,yearBranch,tag}){
 const out=[];
 if(dayBranch){
  const r=branchRelation(branch,dayBranch);
  out.push({scope:'日支',tag,kind:r.kind,hua:r.hua||null,weight:WEIGHT[r.kind]??0,advice:KIND_ADVICE[r.kind]||''});
 }
 if(yearBranch){
  const r=branchRelation(branch,yearBranch);
  out.push({scope:'年支',tag,kind:r.kind,hua:r.hua||null,weight:(WEIGHT[r.kind]??0)*0.6,advice:KIND_ADVICE[r.kind]||''});
 }
 if(dayStem&&STEM_HE[stem]===dayStem)out.push({scope:'日干',tag,kind:'五合',weight:0.8,advice:'日干被合，心意容易被牵动'}); // kind 只写「五合」：拼出来是「乙方日干五合」，不能再叠一个「天干」
 if(yearBranch){
  const i=idx(yearBranch);
  if(i>=0&&(idx(branch)===RED_LUAN(i)||idx(branch)===TIAN_XI(i)))out.push({scope:'年支',tag,kind:'红鸾天喜',weight:1,advice:'红鸾/天喜照命，传统视为谈婚论嫁的动象'});
 }
 return out;
}
const sum=a=>Number(a.reduce((s,x)=>s+x.weight,0).toFixed(2));
function reasons(rels){
 return rels.filter(r=>Math.abs(r.weight)>=0.8).map(r=>`${r.tag}${r.scope}${r.kind}(${r.weight>0?'+':''}${r.weight})`);
}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

export function pairCycle({ba,bb,months=12,years=12,from}={}){
 const now=from||(()=>{const d=new Date();return {Y:d.getFullYear(),M:d.getMonth()+1,D:d.getDate()};})();
 const dayA=ba?.pillars?.[2]?.branch,dayB=bb?.pillars?.[2]?.branch;
 const stemA=ba?.pillars?.[2]?.stem,stemB=bb?.pillars?.[2]?.stem;
 const yearA=ba?.pillars?.[0]?.branch,yearB=bb?.pillars?.[0]?.branch;
 const whoA='甲方',whoB='乙方';
 const monthList=[];
 for(let i=0;i<months;i++){
  const d=new Date(now.Y,now.M-1+i,15);
  const y=d.getFullYear(),m=d.getMonth()+1;
  const lunar=Solar.fromYmd(y,m,15).getLunar();
  const gz=lunar.getMonthInGanZhi();
  const rels=[
   ...relationsOf({branch:gz[1],stem:gz[0],dayBranch:dayA,dayStem:stemA,yearBranch:yearA,tag:whoA}),
   ...relationsOf({branch:gz[1],stem:gz[0],dayBranch:dayB,dayStem:stemB,yearBranch:yearB,tag:whoB})
  ];
  const score=sum(rels);
  monthList.push({key:`${y}-${String(m).padStart(2,'0')}`,label:`${m}月`,year:y,month:m,gz,score,
   pct:Math.round(clamp((score+6)/12,0,1)*100),reasons:reasons(rels),advice:KIND_ADVICE[rels.slice().sort((x,y)=>Math.abs(y.weight)-Math.abs(x.weight))[0]?.kind]||''});
 }
 const yearList=[];
 for(let i=0;i<years;i++){
  const y=now.Y+i;
  const lunar=Solar.fromYmd(y,7,1).getLunar();
  const gz=lunar.getYearInGanZhi();
  const rels=[
   ...relationsOf({branch:gz[1],stem:gz[0],dayBranch:dayA,dayStem:stemA,yearBranch:yearA,tag:whoA}),
   ...relationsOf({branch:gz[1],stem:gz[0],dayBranch:dayB,dayStem:stemB,yearBranch:yearB,tag:whoB})
  ];
  const score=sum(rels);
  yearList.push({year:y,gz,score,pct:Math.round(clamp((score+5)/10,0,1)*100),reasons:reasons(rels),
   advice:KIND_ADVICE[rels.slice().sort((x,y)=>Math.abs(y.weight)-Math.abs(x.weight))[0]?.kind]||''});
 }
 const peakMonths=monthList.filter(m=>m.score>=2).sort((a,b)=>b.score-a.score).slice(0,3);
 const roughMonths=monthList.filter(m=>m.score<=-2).sort((a,b)=>a.score-b.score).slice(0,2);
 // 应期只取前 8 年：再远的年份变量太多，给太远的「婚期」既不负责也不好用
 const peakYears=yearList.slice(0,8).filter(y=>y.score>=2).sort((a,b)=>b.score-a.score).slice(0,3)
  .sort((a,b)=>a.year-b.year);
 const text=(peakMonths.length
  ?`未来 ${months} 个月里，${peakMonths.map(m=>m.label+'（'+m.gz+'）').join('、')} 的合象最明显：${peakMonths[0].reasons.join('、')}，${peakMonths[0].advice}。`
  :`未来 ${months} 个月无突出的冲合窗口，关系按日常节奏推进，不必挑日子。`)
  +(roughMonths.length?`${roughMonths.map(m=>m.label).join('、')} 冲刑偏重，宜避开定日子、签长期合约。`:'')
  +(peakYears.length?`婚期应期上，${peakYears.map(y=>y.year+'（'+y.gz+'）').join('、')} 与双方婚姻宫/日干有合，传统视为可议婚嫁的窗口；其余年份若两人心意已定，不必为「年份不合」推迟。`:'');
 return {months:monthList,years:yearList,peakMonths,roughMonths,peakYears,text,
  method:'以流月/流年干支逐一对照双方日支（婚姻宫）、年支（生肖）与日干：六合/三合 +2、半合 +1.2、同支 +0.4、相冲 −2、相刑 −1.5、相害 −1.2、相破 −0.6；对年支按 0.6 折；日干五合 +0.8；年支逢红鸾/天喜 +1。权重为传统取象口径，仅用于排窗口，不是关系质量评分。'};
}

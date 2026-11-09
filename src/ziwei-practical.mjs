import {ZIWEI_FLOW_RULES} from '../www/js/rules.js';
export function practicalZiwei(chart,flow){
 const results=[],palaces=chart?.palaces||[];
 const byBranch=branch=>palaces.find(p=>p.branch===branch);
 const natalLuCun=palaces.flatMap(p=>(p.stars||[]).filter(s=>s.name==='禄存').map(s=>({branch:p.branch,palace:p,star:s})));
 const natalHuaLu=palaces.flatMap(p=>(p.stars||[]).filter(s=>s.siHua==='禄').map(s=>({branch:p.branch,palace:p,star:s})));
 const seen=new Set();
 for(const lu of natalLuCun)for(const hua of natalHuaLu){
  const delta=(hua.branch-lu.branch+12)%12;
  if([0,4,8].includes(delta)){
   const key=[lu.branch,hua.branch].join(':');
   if(!seen.has(key)){seen.add(key);results.push({name:'双禄交驰',palace:hua.palace.name,branch:hua.branch,text:ZIWEI_FLOW_RULES.patterns.双禄交驰});}
  }
 }
 const flowLu=(flow?.mutagens||[]).find(m=>m.type==='禄'&&Number.isInteger(m.branch));
 const yearlyLuCun=flow?.yearlyLuCunBranch;
 if(flowLu&&Number.isInteger(yearlyLuCun)){
  const palace=byBranch(flowLu.branch),delta=(flowLu.branch-yearlyLuCun+12)%12;
  const natalLu=palace?.stars?.some(star=>star.name==='禄存');
  if(palace&&([0,4,8].includes(delta)||natalLu)){
   results.push({name:'双禄交驰',palace:palace.name,branch:palace.branch,text:ZIWEI_FLOW_RULES.patterns.双禄交驰});
  }else if(palace&&delta===6){
   results.push({name:'禄逢冲破',palace:palace.name,branch:palace.branch,text:ZIWEI_FLOW_RULES.patterns.禄逢冲破});
  }
 }
 for(const m of flow?.mutagens||[]){
  if(m.type!=='忌'||!Number.isInteger(m.branch))continue;
  const opposite=byBranch((m.branch+6)%12),target=byBranch(m.branch);
  if(opposite?.stars?.some(s=>s.name==='禄存'||s.siHua==='禄')){
   results.push({name:'禄逢冲破',palace:opposite.name,branch:opposite.branch,text:ZIWEI_FLOW_RULES.patterns.禄逢冲破});
  }
  const neighbors=[byBranch((m.branch+1)%12),byBranch((m.branch+11)%12)].filter(Boolean);
  if(neighbors.some(p=>p.stars?.some(s=>s.name==='擎羊'))&&neighbors.some(p=>p.stars?.some(s=>s.name==='陀罗'))){
   results.push({name:'羊陀夹忌',palace:target?.name||'待定位',branch:m.branch,text:ZIWEI_FLOW_RULES.patterns.羊陀夹忌});
  }
  if(opposite?.stars?.some(s=>s.siHua==='忌')){
   results.push({name:'忌冲本命忌',palace:opposite.name,branch:opposite.branch,text:'流忌对冲本命忌位，传统取象主反复牵挂与阻滞；宜缓进守成，仍须参看三方四正，不可单凭一忌断凶。'});
  }
 }
 return results;
}

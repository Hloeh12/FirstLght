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
   if(!seen.has(key)){seen.add(key);results.push({name:'双禄交驰',palace:hua.palace.name,branch:hua.branch,text:(delta===0?'禄存与生年化禄同宫。':'禄存与生年化禄三合会照。')+'传统上观察资源协同与可用渠道增多；仍需核验兑现条件、成本与分配，不代表必然收益。'});}
  }
 }
 const flowLu=(flow?.mutagens||[]).find(m=>m.type==='禄'&&Number.isInteger(m.branch));
 const yearlyLuCun=flow?.yearlyLuCunBranch;
 if(flowLu&&Number.isInteger(yearlyLuCun)){
  const palace=byBranch(flowLu.branch),delta=(flowLu.branch-yearlyLuCun+12)%12;
  const natalLu=palace?.stars?.some(star=>star.name==='禄存');
  if(palace&&([0,4,8].includes(delta)||natalLu)){
   results.push({name:'双禄交驰',palace:palace.name,branch:palace.branch,
    text:(natalLu?'所选'+(flow.label||'流限')+'化禄进入本命禄存宫。':delta===0?'所选'+(flow.label||'流限')+'禄存与化禄同宫。':'所选'+(flow.label||'流限')+'禄存与化禄三合会照。')+'传统上观察资源入口、合作机会与资产沉淀；必须核验付款方、合同、交付能力和现金到账。'});
  }else if(palace&&delta===6){
   results.push({name:'禄逢冲破',palace:palace.name,branch:palace.branch,text:'所选'+(flow.label||'流限')+'化禄与流年禄存处于对冲位置，机会可能伴随竞争、延迟或资源分流；宜分阶段签约、验收后付款，并预留回款缓冲。'});
  }
 }
 for(const m of flow?.mutagens||[]){
  if(m.type!=='忌'||!Number.isInteger(m.branch))continue;
  const opposite=byBranch((m.branch+6)%12),target=byBranch(m.branch);
  if(opposite?.stars?.some(s=>s.name==='禄存'||s.siHua==='禄')){
   results.push({name:'禄逢冲破',palace:opposite.name,branch:opposite.branch,text:'流年或流限化忌对冲本命禄位，资源入口与兑现端存在拉扯；优先复核合约、账期、共同资金和承诺边界。'});
  }
  const neighbors=[byBranch((m.branch+1)%12),byBranch((m.branch+11)%12)].filter(Boolean);
  if(neighbors.some(p=>p.stars?.some(s=>s.name==='擎羊'))&&neighbors.some(p=>p.stars?.some(s=>s.name==='陀罗'))){
   results.push({name:'羊陀夹忌',palace:target?.name||'待定位',branch:m.branch,text:'化忌宫两侧分别见擎羊与陀罗，形成羊陀夹忌候选；推进阻力与资源占用可能同时上升，宜缩小承诺范围、设置退出节点。'});
  }
  if(opposite?.stars?.some(s=>s.siHua==='忌')){
   results.push({name:'忌冲本命忌',palace:opposite.name,branch:opposite.branch,text:'流忌对冲本命忌位，留意重复压力、延误和沟通成本；这与羊陀夹忌是不同结构。'});
  }
 }
 return results;
}

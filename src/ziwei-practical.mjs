export function practicalZiwei(chart,flow){
 const results=[];
 for(const p of chart.palaces){
  const tri=[p.branch,(p.branch+4)%12,(p.branch+8)%12],stars=chart.palaces.filter(q=>tri.includes(q.branch)).flatMap(q=>q.stars);
  if(stars.some(s=>s.name==='禄存')&&stars.some(s=>s.siHua==='禄'))results.push({name:'双禄交驰',palace:p.name,branch:p.branch,text:'禄存与生年化禄同宫或三合会照，传统上观察资源协同；不代表必然收益。'});
 }
 for(const m of flow?.mutagens||[]){if(m.type!=='忌')continue;
  const opposite=chart.palaces.find(p=>p.branch===(m.branch+6)%12);
  if(opposite.stars.some(s=>s.name==='禄存'||s.siHua==='禄'))results.push({name:'禄逢冲破',palace:opposite.name,branch:opposite.branch,text:'流忌对冲本命禄位，宜复核收支、合同与资源承诺。'});
  const target=chart.palaces.find(p=>p.branch===m.branch),neighbors=chart.palaces.filter(p=>[(m.branch+1)%12,(m.branch+11)%12].includes(p.branch));
  if(neighbors.some(p=>p.stars.some(s=>s.name==='擎羊'))&&neighbors.some(p=>p.stars.some(s=>s.name==='陀罗')))results.push({name:'羊陀夹忌',palace:target.name,branch:m.branch,text:'流忌所在宫左右分别见羊陀，宜给计划留缓冲，减少冲动决策。'});
  if(opposite.stars.some(s=>s.siHua==='忌'))results.push({name:'忌冲本命忌',palace:opposite.name,branch:opposite.branch,text:'流忌对冲本命忌位，留意重复压力；不将其误称羊陀夹忌。'});
 }return results;
}

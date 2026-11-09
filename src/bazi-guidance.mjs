import {buildPeriodReport} from './period-report.mjs';
import {BAZI_FLOW_RULES} from '../www/js/rules.js';
const themes=['长辈、家门与外缘','父母师友、事业环境','自身心性与婚姻相处','子息门生与长远志业'];
const riskTypes=new Set(['六冲','相刑','相害','相破']);
export function generateTimeStepInsight(data){
 const {pillars,selected,relationships,strength,natalStrength=strength}=data;
 if(!selected.length)return null;
 const current=[...selected].reverse().find(p=>['流日','流月','流年'].includes(p.name))??selected.at(-1);
 const links=relationships.filter(r=>r.ids.some(i=>i<pillars.length)&&r.ids.some(i=>i>=pillars.length));
 const risk=links.filter(r=>riskTypes.has(r.type)),harmonious=links.filter(r=>['天干五合','六合','三合局','三会方'].includes(r.type));
 const influences=links.map(r=>{
  const locations=r.ids.filter(i=>i<pillars.length).map(i=>pillars[i].name+'（'+themes[i]+'）');
  const activated=strength.activated.some(a=>a.type===r.type&&a.pattern===r.pattern&&a.ids.join()===r.ids.join());
  const affected=riskTypes.has(r.type)?r.ids.filter(i=>i<pillars.length).map(i=>{
   const element=pillars[i].branchElement;
   const role=natalStrength.useful.includes(element)?'useful':natalStrength.caution.includes(element)?'caution':'neutral';
   return {pillar:pillars[i].name,branch:pillars[i].branch,element,role};
  }):[];
  const impact=affected.map(({pillar,branch,element,role})=>
   role==='useful'?pillar+branch+element+'为原局用神，'+BAZI_FLOW_RULES.clash.useful:
   role==='caution'?pillar+branch+element+'为原局忌神，'+BAZI_FLOW_RULES.clash.caution:
   pillar+branch+element+'之喜忌未明，须参月令与全局，不可妄断。').join('');
  const meaning=r.type==='天干五合'?(activated?'本次合化模型已计入'+r.element:'先论相合牵绊，未足条件不言化局'):r.meaning;
  return {type:r.type,pattern:r.pattern,locations,affected,text:r.ids.filter(i=>i>=pillars.length).map(i=>selected[i-pillars.length]).map(p=>p.stem+p.branch+p.name).join('、')+'引动'+r.pattern+r.type+'，涉及'+locations.join('、')+'。'+meaning+impact};
 });
 const usefulHit=influences.some(item=>item.affected.some(x=>x.role==='useful'));
 const cautionHit=influences.some(item=>item.affected.some(x=>x.role==='caution'));
 const stem=current.stem+current.stemElement+'为'+current.tenGod;
 const action=BAZI_FLOW_RULES.tenGods[current.tenGod]||['岁运之气既动，宜察时度势、修德进业。','财帛之事贵在知足守分，量入为出。','待人以诚，言语有度，家和为贵。'];
 const work=action[0]+(usefulHit?'用神受冲，先固本守成，待气势平复再图进取。':cautionHit?'忌神受冲，旧局有松动之机，可审慎开创新局。':'进退以中和为贵，勿因一时顺逆失其常度。');
 const caution=risk.length?'原局逢'+risk.map(r=>r.pattern+r.type).join('、')+'，须察所冲为喜为忌，再定进退。':
  harmonious.length?'原局见'+harmonious.map(r=>r.pattern+r.type).join('、')+'，有相合相助之象，仍须辨明合化条件。':'本期未见直接牵动原局之刑冲合会，宜依日主旺衰与月令察其气势。';
 return {
  title:current.stem+current.branch+' '+current.name+' · 岁运提要',
  stem,scope:current.name,year:current.year??null,month:current.label??null,
  summary:current.stem+current.branch+current.name+'引动：'+stem+'。日主扶助参考'+strength.support.toFixed(1)+'%，'+strength.kind+'，原局'+natalStrength.support.toFixed(1)+'%。'+caution,
  influences,
  sections:buildPeriodReport({...data,natalStrength},current,influences,data.monthWindows??[]),
  advice:[
   {topic:'事业与进取',text:work},
   {topic:'财帛与守成',text:usefulHit?'用神受制，宜退守自保、以静制动，暂缓冒进与高风险投资。':cautionHit?'冲去忌神有枯木逢春之象，可择善而行，仍须量力，不可贪胜。':action[1]},
   {topic:'情缘与起居',text:risk.some(r=>r.ids.includes(2))?'日支受触，伴侣相处与家中日常宜多体谅、多商量，切勿以一时意气伤情分。':strength.kind==='身弱'?'身气偏弱，宜养精蓄锐、劳逸有度，凡事循序渐进。':'守常养和，为亲友与自己留出安宁相处的时光。'}
  ]
 };
}
export const periodGuidance=generateTimeStepInsight;

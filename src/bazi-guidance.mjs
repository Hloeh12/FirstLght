const themes=['长辈、外部环境','工作与组织','亲密相处、日常安排','长期计划、照顾责任'];
const riskTypes=new Set(['六冲','相刑','相害','相破']);
export function generateTimeStepInsight(data){
 const {pillars,selected,relationships,strength,natalStrength=strength}=data;
 if(!selected.length)return null;
 const current=[...selected].reverse().find(p=>['流日','流月','流年'].includes(p.name))??selected.at(-1);
 const index=pillars.length+selected.indexOf(current);
 const links=relationships.filter(r=>r.ids.includes(index)&&r.ids.some(i=>i<pillars.length));
 const risk=links.filter(r=>riskTypes.has(r.type)),harmonious=links.filter(r=>['天干五合','六合','三合局','三会方'].includes(r.type));
 const influences=links.map(r=>{
  const locations=r.ids.filter(i=>i<pillars.length).map(i=>pillars[i].name+'（'+themes[i]+'）');
  const activated=strength.activated.some(a=>a.type===r.type&&a.pattern===r.pattern&&a.ids.join()===r.ids.join());
  const affected=r.type==='六冲'?r.ids.filter(i=>i<pillars.length).map(i=>{
   const element=pillars[i].branchElement;
   const role=natalStrength.useful.includes(element)?'useful':natalStrength.caution.includes(element)?'caution':'neutral';
   return {pillar:pillars[i].name,branch:pillars[i].branch,element,role};
  }):[];
  const impact=affected.map(({pillar,branch,element,role})=>
   role==='useful'?pillar+branch+element+'为原局取用，用神受冲，先保护现有支持、财务缓冲和关系边界。':
   role==='caution'?pillar+branch+element+'为原局所忌，冲忌有松动旧局的机会，宜试探新方案，仍需核实成本和回报。':
   pillar+branch+element+'未列入原局喜忌，按该柱领域的变动观察。').join('');
  const meaning=r.type==='天干五合'?(activated?'本次合化模型已计入'+r.element:'先按相合观察，未直接认定化局'):r.meaning;
  return {type:r.type,pattern:r.pattern,locations,affected,text:current.stem+current.branch+current.name+'引动 '+r.pattern+r.type+'，涉及'+locations.join('、')+'。'+meaning+impact};
 });
 const usefulHit=influences.some(item=>item.affected.some(x=>x.role==='useful'));
 const cautionHit=influences.some(item=>item.affected.some(x=>x.role==='caution'));
 const stem=current.stem+current.stemElement+'为'+current.tenGod;
 const work=/官|杀/.test(current.tenGod)?'本期责任与规则主题较明显，先核对职责、期限，再承诺交付。':
  /印/.test(current.tenGod)?'把学习、文档和支持资源放进计划，适合先补齐条件再推进。':
  /食神|伤官/.test(current.tenGod)?'本期重在输出与表达，先做可验证的小成果，并确认沟通对象的预期。':
  /财/.test(current.tenGod)?'本期资源与回报主题较明显，先明确成本、验收和回款节点。':'本期同辈与自主行动主题较明显，合作时明确分工和资源归属。';
 const caution=risk.length?'与原局形成'+risk.map(r=>r.pattern+r.type).join('、')+'，重要安排留出缓冲，分歧尽量落实到具体条件。':
  harmonious.length?'与原局出现'+harmonious.map(r=>r.pattern+r.type).join('、')+'，可从条件清晰的小范围合作开始。':'本期未检出直接牵动原局的刑冲合会，结合日主扶助变化观察节奏。';
 return {
  title:current.stem+current.branch+' '+current.name+' · 当期生活指引',
  stem,scope:current.name,year:current.year??null,month:current.label??null,
  summary:current.stem+current.branch+current.name+'引动：'+stem+'。日主扶助参考 '+strength.support.toFixed(1)+'%，'+strength.kind+'，原局 '+natalStrength.support.toFixed(1)+'%。'+caution,
  influences,
  advice:[
   {topic:'事业与行动',text:work+(usefulHit?'保留原有支持，分阶段推进。':cautionHit?'可小范围试行替代方案，核对结果再扩大。':'')},
   {topic:'财务与边界',text:usefulHit?'用神受冲，优先保留现金缓冲并延后不可逆的大额承诺。':cautionHit?'可整理低效支出并试行新收入渠道，按实际回款判断。':risk.length?'本期先核对付款、合同和共同支出，减少临时承诺。':
    /比肩|劫财/.test(current.tenGod)?'共同投入先写清份额，个人预算与合作预算分开记录。':'将目标拆成预算与执行节点，按实际可用资源推进。'},
   {topic:'情感与生活节奏',text:risk.some(r=>r.ids.includes(2))?'日支被触动，亲密相处与日常安排宜多确认，疲惫时先缓一缓再讨论。':
    strength.kind==='身弱'?'给休息与准备留出时间，任务分批处理，避免一次接下过多安排。':'保持稳定作息，为关系和个人空间各留一段时间。'}
  ]
 };
}

export const periodGuidance = generateTimeStepInsight;

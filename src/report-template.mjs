import {legacyData} from './legacy-data.mjs';
export const TEXTS=legacyData('reading-texts');
const ELEMENT=['火','土','风','水','火','土','风','水','火','土','风','水'];
const NAK_EN=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
function personaCombo(sunSign,moonSign){const e1=ELEMENT[sunSign],e2=ELEMENT[moonSign],YANG=['火','风'];if(e1===e2)return `太阳与月亮同属${e1}象：内外同频、表里如一，目标与感受方向统一，能量非常集中。`;const y1=YANG.includes(e1),y2=YANG.includes(e2);if(y1===y2)return `太阳属${e1}象、月亮属${e2}象，同属${y1?'阳':'阴'}性气质，外在表现与内在需求能互相配合，行事风格协调。`;return `太阳属${e1}象、月亮属${e2}象：外显与内需有反差——别人看到的是${y1?'行动果断的你':'温和亲切的你'}，而真实的你更需要${y2?'被理解的温度':'独处与空间'}。`;}
/* 复现公开客户端的“断网兜底”模板：字段 + 固定文案，不调用任何模型。 */
export function localTemplateReport(res){
 const w=res.western,v=res.vedic,z=res.ziwei;
 const S=x=>['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'][x];
 const sun=w.planets.find(p=>p.key==='sun'),moon=w.planets.find(p=>p.key==='moon'),venus=w.planets.find(p=>p.key==='venus');
 const sunZ=w.planets.find(p=>p.key==='sun').sign, moonZ=w.planets.find(p=>p.key==='moon').sign, venusZ=w.planets.find(p=>p.key==='venus').sign;
 const sunSign=w.planets.findIndex(p=>p.key==='sun');
 const sec={};
 sec['w-persona']=[`太阳 ${sunZ}（核心自我）：${TEXTS.SUN[sunZ]}`,`月亮 ${moonZ}（情感需求）：${TEXTS.MOON[moonZ]}`,`上升 ${w.asc.sign}（人格面具）：${TEXTS.ASC[w.asc.sign]}`,personaCombo(sunSign,w.planets.findIndex(p=>p.key==='moon'))];
 sec['w-career']=[`天顶 MC 在 ${w.mc.sign}，你的公开舞台倾向：${TEXTS.MC[w.mc.sign]}。`,`太阳落第 ${sun.house} 宫：${TEXTS.HOUSE[sun.house]}`,`把「${TEXTS.SUN_KEYWORD[sunZ]}」的动能导入上述赛道。`];
 sec['w-wealth']=[`金星 ${venusZ} 落第 ${venus.house} 宫：${TEXTS.VENUS[venusZ]} ${TEXTS.HOUSE[venus.house]}`,`你的财富杠杆是「${TEXTS.SUN_KEYWORD[sunZ]}」。`];
 sec['w-love']=[`如何去爱（金星 ${venusZ}）：${TEXTS.VENUS[venusZ]}`,`需要怎样的爱（月亮 ${moonZ}）：${TEXTS.MOON[moonZ]}`,`相处提醒：先满足月亮的安全感，金星的表达才会自然流动。`];
 sec['w-health']=[`太阳属${ELEMENT[sunSign]}象：${TEXTS.ELEMENT_VITALITY[ELEMENT[sunSign]]}`,`月亮 ${moonZ} 提示：情绪周期对状态影响明显，按月相安排休息与冲刺。`];
 if(z&&!z.error){
  sec['z-palaces']=z.palaces.map(p=>{const key=p.name.replace('宫','');const stars=p.majorStars.map(s=>s.name+(s.mutagen?`（化${s.mutagen}）`:'')).join('、')||'无主星（空宫）';const star= p.majorStars.length?TEXTS.ZW_STAR[p.majorStars[0].name]||'':TEXTS.ZW_STAR['空宫'];return `${p.name}｜${p.heavenlyStem}${p.earthlyBranch}｜${stars}｜${TEXTS.ZW_PALACE[key]||''} ${star}`;});
  const MEAN={禄:'机遇与资源的加持点',权:'掌控与话语权的发力点',科:'贵人、名声与考运所在',忌:'执念、功课与消耗点'};
  const muts=[];for(const p of z.palaces)for(const st of [...p.majorStars,...p.minorStars])if(st.mutagen)muts.push({mutagen:st.mutagen,star:st.name,palace:p.name,ganzhi:p.heavenlyStem+p.earthlyBranch});
  sec['z-mutagen']=muts.map(m=>`化${m.mutagen} · ${m.star} → ${m.palace}（${m.ganzhi}）：${MEAN[m.mutagen]}。`);
  const ji=muts.filter(m=>m.mutagen==='忌');
  sec['w-risks']=(ji.length?ji.map(m=>`化忌 ${m.star} → ${m.palace}：这是需要主动管理的执念与消耗点，建议为该领域设定止损线。`):['生年忌星不显，功课更多在心态层面：注意完美主义与情绪内耗。']).concat(['具体健康与财务风险请以理性判断为准，本节仅供参考。']);
 }else{for(const k of ['z-palaces','z-mutagen','w-risks'])sec[k]=['紫微排盘不可用。'];}
 const cur=v.dashas.find(d=>d.current)||v.dashas[0];
 const moonV=v.planets.find(p=>p.key==='moon');
 sec['v-dasha']=[`当前大运：${cur?cur.lord+' 大运':'—'}（${cur?cur.start.slice(0,7)+' – '+cur.end.slice(0,7):''}）。月亮落 ${moonV.nakshatra} 第 ${moonV.pada} 步：${TEXTS.NAK[NAK_EN[moonV.nakIndex]]||''}`];
 return {kind:'local-template',notice:'此报告由公开客户端兜底模板复现，非原站服务端 AI 输出。',sections:sec};
}

/* v0.76.0 双人合婚报告：把 pairReading 返回的结构化证据转成分节自然段落。
 * 口径与 console 内一致：八字干支/十神/用神互参、紫微命宫夫妻宫互参、印度八科分数、
 * 西占组合主题。只描述可算结构，不虚构契合度结论，不作关系吉凶实证断言。 */
export function pairReport(r,nameA='当前案例',nameB='第二人'){
 const sec={};
 const fit=r.fit||{},kt=fit.kootaBoth||{};
 // 1) 关系概览：契合度（双向八科均值）+ 互动助力/留意
 sec['p-overview']=[
  `${nameA} × ${nameB} 的双人合盘以「八字干支互参 + 紫微命宫夫妻宫互参 + 印度八科 + 西占组合」四路证据交叉取象。`,
  fit.percent!=null?`印度 Ashtakoota 八科双向平均得分率约 ${fit.percent}%（单项总分 ${fit.total}/${fit.max}）；此分数只反映八科结构，不代表组合盘评分，也不作关系质量实证结论。`:'印度八科分数暂不可用。',
  ...(fit.insights||[]).map(i=>`${i.name}：${i.text}`)
 ];
 // 2) 八字合婚：日柱/日干/生肖/十神/用神逐项成文
 if(r.baziMatch?.items?.length){
  sec['p-bazi']=r.baziMatch.items.map(x=>{
   const lv=x.level==='support'?'偏助力':x.level==='challenge'?'需磨合':x.level==='warn'?'偏张力':'中性';
   return `${lv} · ${x.name}：${x.text}`;
  }).concat([r.baziMatch.method]);
 }
 // 3) 印度八科：逐科断语 + 火星煞
 const koota=kt.forward||r.vedic?.koota;
 if(koota){
  const low=koota.items.filter(x=>x.score<x.max/2);
  const zh={varna:'心性层级',vashya:'相处引力',tara:'命星',yoni:'本能契合',maitri:'星谊',gana:'天性',bhakoot:'情位',nadi:'命脉'};
  sec['p-vedic']=[
   `八科总分 ${koota.total}/${koota.max}（${koota.percent}%）。${kt.reverse?`反向（${nameB}为基准）得分率 ${kt.reverse.percent}%，双向平均后即上方契合度。`:''}`,
   ...(low.length?low.map(x=>`${zh[x.key]||x.zh}偏低（${x.score}/${x.max}）：${x.note}。适合在日常相处中核对双方需求，不以分数代替体验。`):['八科相对均衡，无明显偏低项。'])
  ];
 }
 if(r.mangal?.ok)sec['p-mangal']=[r.mangal.a?.text,r.mangal.b?.text,r.mangal.text,r.mangal.method].filter(Boolean);
 // 4) 紫微互参：命宫/夫妻宫/互落宫位
 if(r.ziweiMatch?.items?.length)sec['p-ziwei']=r.ziweiMatch.items.map(x=>`${x.name}：${x.text}`).concat([r.ziweiMatch.method]);
 // 5) 西占组合主题
 if(r.composite?.readings?.length){
  sec['p-western']=[
   `组合中点盘（Composite）把两人各自行星取中点，得到「关系本身」的一张盘——它描述共同主题，而非任何一方的个人盘。`,
   ...r.composite.readings.map(x=>`${x.title}：${x.text}`)
  ];
 }
 if(r.crossRelations?.length)sec['p-cross']=[`八字跨盘干支：`,...r.crossRelations.map(x=>`${x.type} · ${x.pattern}（${x.pillars.join('／')}）`)];
 // 6) 结语：口径声明
 sec['p-notes']=[
  '以上为多体系结构化取象，分属不同命理传统，彼此不互证、不折算成单一分数。',
  '关系质量最终取决于双方真实沟通与经营，本报告仅供文化参考，不作吉凶判决。'
 ];
 return {kind:'pair-report',notice:'合婚报告由各体系公开规则程序化生成，非 AI 模型输出，仅供传统取象参考。',sections:sec,nameA,nameB};
}

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

/* 报告速览（v0.62.0）
   问题不在内容少，而在入口长：一份四体系详批少则七千字、多则三万字，用户点开只看到
   「第一章 命局总览」，读完第一屏还不知道这份报告到底说了什么。目录解决「跳」，不解决「先看什么」。
   速览只做两件事：把引擎已经算好的关键字段摆成指标；把正文里的结论句提到第一屏，并挂回章节。
   因此它不新增任何断语——正文没有的判断，这里也不许出现；每条要点都带 chips 说明依据来自哪几个字段。
   时点报告不走这里（buildPeriodReport 自己成篇，只讲一个时点），速览只属于终身详批。 */
import {GEOGE_DEEP} from '../../www/js/deep-bazi.js';

// 自带一份转义：这个模块要能在 Node 里单测，不把 ui.js → console-engine 的整条链拖进测试进程。
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const S=(v,d='—')=>v===undefined||v===null||v===''?d:String(v);
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const listOf=(a,sep='、')=>Array.isArray(a)&&a.length?a.join(sep):'';
const gz=p=>p&&p.stem?String(p.stem)+String(p.branch):'';
/* 章节锚点：按标题找章，找不到退回第 1 章。章号写错会让「点进去看依据」落到无关章节，
   比不给链接更糟，所以宁可退回第一章也不猜。 */
const secOf=(sections,re,fallback=1)=>{
 const i=(sections||[]).findIndex(s=>re.test(String(s.title||'')));
 return i<0?Math.min(fallback,(sections||[]).length||1):i+1;
};
const yearOf=iso=>{const y=Number(String(iso||'').slice(0,4));return Number.isFinite(y)?y:null;};

/* 当前大运：大运有精确交运时刻（startUtc/endUtc），跨年比较会在大运交接那几个月判错，
   所以先按时刻比、再退回按年份比。 */
function currentCycle(cycles,now=Date.now()){
 const arr=(cycles||[]).filter(c=>c&&c.stem);
 const byTime=arr.find(c=>{
  const a=Date.parse(c.startUtc||''),b=Date.parse(c.endUtc||'');
  return Number.isFinite(a)&&now>=a&&(!Number.isFinite(b)||now<b);
 });
 if(byTime)return byTime;
 const y=new Date(now).getFullYear();
 return arr.find(c=>{
  const a=Number(c.startYear);
  return Number.isFinite(a)&&y>=a&&y<a+10;
 })||null;
}

function baziBrief({state,report}){
 const d=state?.reading?.bazi||state?.chartState?.bazi?.data||{};
 const st=d.strength||{},dm=d.dayMaster||{};
 const cy=currentCycle(d.cycles);
 const sec=Array.isArray(report?.sections)?report.sections:[];
 const gege=report?.gege||'';
 const gegeGloss=GEOGE_DEEP?.[gege]?.gloss||'';
 const use=listOf(st.useful,''),avoid=listOf(st.caution,'');
 const metrics=[
  {k:'日主',v:dm.stem?`${dm.stem}${dm.element||''}`:'—',s:'本命'},
  {k:'原局扶助',v:num(st.support)!==null?`${num(st.support).toFixed(1)}%`:'—',s:st.kind||'五行模型'},
  {k:'格局',v:gege||'待定',s:'月令取格'},
  {k:'当前大运',v:cy?gz(cy):'—',s:cy&&cy.startYear?`${cy.startYear}–${Number(cy.startYear)+10}`:'交运时刻未定'}
 ];
 const points=[];
 if(dm.stem){
  points.push({
   t:`日主${dm.stem}${dm.element||''}，原局扶助${num(st.support)!==null?num(st.support).toFixed(1)+'%':'未定'}，判为${st.kind||'待定'}：${use?`喜${use}生扶`:'喜用未单列'}、${avoid?`忌${avoid}耗泄`:'忌未单列'}。`,
   ev:[st.kind?`判定 ${st.kind}`:'',num(st.support)!==null?`扶助 ${num(st.support).toFixed(1)}%`:'',use?`喜 ${use}`:'',avoid?`忌 ${avoid}`:''].filter(Boolean),
   sec:secOf(sec,/命局|总览|格局/)
  });
 }
 if(gege){
  points.push({
   t:`格局取${gege}${gegeGloss?`：${gegeGloss}`:'。'}`,
   ev:[`月令 ${d.pillars?.find?.(p=>p.name==='月柱')?.stem||''}${d.pillars?.find?.(p=>p.name==='月柱')?.branch||''}`.trim(),gege],
   sec:secOf(sec,/命局|总览|格局/)
  });
 }
 if(cy){
  points.push({
   t:`当前走${gz(cy)}大运（${cy.startYear}–${Number(cy.startYear)+10}）${cy.tenGod?`，天干透${cy.tenGod}`:''}；这一步定十年的底色，具体年份再按流年叠加看。`,
   ev:[`${gz(cy)}`,`${cy.startYear}–${Number(cy.startYear)+10}`,cy.tenGod?`透 ${cy.tenGod}`:''].filter(Boolean),
   sec:secOf(sec,/大运/)
  });
 }
 return {metrics,points};
}

function ziweiBrief({state,report}){
 const z=state?.reading?.ziwei||state?.chartState?.ziwei?.chart||{};
 const palaces=z.palaces||[],sec=Array.isArray(report?.sections)?report.sections:[];
 const life=palaces.find(p=>p.name==='命宫');
 const body=palaces.find(p=>p.isBodyPalace);
 const stars=(life?.majorStars?.length?life.majorStars:life?.borrowedStars||[]).map(s=>s.name);
 const ji=(z.sihua||[]).find(x=>x.type==='忌');
 const y=new Date().getFullYear();
 const dec=(z.decades||[]).find(d=>{
  const [a,b]=d.yearRange||[];
  return Number.isFinite(a)&&y>=a&&y<=b;
 });
 const metrics=[
  {k:'命宫',v:life?`${life.earthlyBranch}宫`:'—',s:stars.length?stars.slice(0,2).join('、'):'空宫借星'},
  {k:'五行局',v:z.fiveElementsClass||'—',s:'定大限起法'},
  {k:'身宫',v:body?body.name:'—',s:'后天着力处'},
  {k:'当前大限',v:dec?`${dec.palaceName}`:'—',s:dec?`${dec.yearRange?.[0]}–${dec.yearRange?.[1]}`:'—'}
 ];
 const points=[];
 if(life){
  points.push({
   t:`命宫在${life.earthlyBranch}，${stars.length?`主星${stars.join('、')}`:'无主星，借对宫之星'}${body?`；身宫落${body.name}`:''}。`,
   ev:[`${life.heavenlyStem||''}${life.earthlyBranch||''}`.trim(),stars.join('、')||'空宫'].filter(Boolean),
   sec:secOf(sec,/总览|命盘|三方/)
  });
 }
 if(ji){
  points.push({
   t:`生年化${ji.type}落${ji.palace}（${ji.star}）——这一宫是终身要主动管理的功课，不是吉凶判决。`,
   ev:[`化${ji.type} ${ji.star}`,`${ji.palace}`],
   sec:secOf(sec,/四化|飞星/)
  });
 }
 if(dec){
  points.push({
   t:`当前大限${dec.yearRange?.[0]}–${dec.yearRange?.[1]}走${dec.palaceName}，${dec.ageRange?`${dec.ageRange[0]}–${dec.ageRange[1]} 岁` :''}这十年的主题看该宫星曜组合。`,
   ev:[`${dec.palaceName}`,dec.yearRange?`${dec.yearRange[0]}–${dec.yearRange[1]}`:''].filter(Boolean),
   sec:secOf(sec,/大限/)
  });
 }
 return {metrics,points};
}

function vedicBrief({state,report}){
 const v=state?.reading?.vedic||{},sec=Array.isArray(report?.sections)?report.sections:[];
 const moon=(v.planets||[]).find(p=>p.key==='moon');
 const y=new Date().getFullYear();
 const da=(v.dashas||[]).find(d=>{
  const a=yearOf(d.start),b=yearOf(d.end);
  return Number.isFinite(a)&&Number.isFinite(b)&&y>=a&&y<=b;
 });
 const yogas=Array.isArray(report?.yogas)?report.yogas:[];
 const metrics=[
  {k:'上升',v:v.lagna||'—',s:'Lahiri 恒星黄道'},
  {k:'月宿',v:moon?.nakshatra||'—',s:moon?`第 ${moon.pada} 步 · ${moon.nakLord||''}`:'—'},
  {k:'当前大运',v:da?`${da.lord}运`:'—',s:da?`${yearOf(da.start)}–${yearOf(da.end)}`:'—'},
  {k:'成立命格',v:yogas.length?`${yogas.length} 组`:'未检出',s:'Yoga 判据'}
 ];
 const points=[];
 if(v.lagna){
  points.push({
   t:`上升${v.lagna}，月亮落${moon?.sign||'—'}${moon?.nakshatra?`·${moon.nakshatra}第 ${moon.pada} 步`:''}——印占先看上升定命主，再看月亮定心性节律。`,
   ev:[`上升 ${v.lagna}`,moon?.nakshatra?`月宿 ${moon.nakshatra}`:''].filter(Boolean),
   sec:secOf(sec,/上升|主轴/)
  });
 }
 if(da){
  points.push({
   t:`当前走${da.lord}大运（${yearOf(da.start)}–${yearOf(da.end)}），大运星落宫与力量决定这十年的顺逆。`,
   ev:[`${da.lord}运`,`${yearOf(da.start)}–${yearOf(da.end)}`],
   sec:secOf(sec,/大运|逐运/)
  });
 }
 if(yogas.length){
  points.push({
   t:`本盘成立${yogas.length}组命格，第一组为「${yogas[0].name||'—'}」${yogas[0].desc?`：${String(yogas[0].desc).slice(0,40)}`:''}。`,
   ev:[`${yogas.length} 组`,yogas[0].name||''].filter(Boolean),
   sec:secOf(sec,/Yoga|命格/)
  });
 }
 return {metrics,points};
}

function westBrief({state,report}){
 const w=state?.reading?.western||{},an=state?.reading?.analysis||w.analysis||{},sec=Array.isArray(report?.sections)?report.sections:[];
 const p=k=>(w.planets||[]).find(x=>x.key===k)||{};
 const sun=p('sun'),moon=p('moon');
 const el=an.elements||{};
 const ruler=an.chartRuler||null;
 const metrics=[
  {k:'太阳',v:sun.sign?`${sun.sign}`:'—',s:sun.house?`第 ${sun.house} 宫`:'—'},
  {k:'月亮',v:moon.sign||'—',s:moon.house?`第 ${moon.house} 宫`:'—'},
  {k:'上升',v:w.asc?.sign||'—',s:'人格面具'},
  {k:'天顶',v:w.mc?.sign||'—',s:'公开舞台'}
 ];
 const points=[];
 if(sun.sign||moon.sign){
  points.push({
   t:`太阳${sun.sign||'—'}${sun.house?`落第 ${sun.house} 宫`:''}，月亮${moon.sign||'—'}${moon.house?`落第 ${moon.house} 宫`:''}，上升${w.asc?.sign||'—'}——外显与内需先看这三处。`,
   ev:[`太阳 ${sun.sign||'—'}`,`月亮 ${moon.sign||'—'}`,`上升 ${w.asc?.sign||'—'}`],
   sec:secOf(sec,/核心|三要素|逐星/)
  });
 }
 if(el.percentages){
  const rank=Object.entries(el.percentages).sort((a,b)=>b[1]-a[1]).slice(0,2);
  points.push({
   t:`元素分布偏${listOf(el.dominant||rank.map(x=>x[0]))}（${rank.map(([k,v])=>k+v+'%').join(' / ')}），强项与短板都从这里起。`,
   ev:rank.map(([k,v])=>`${k} ${v}%`),
   sec:secOf(sec,/格局|失衡|元素/)
  });
 }
 if(ruler?.planet){
  points.push({
   t:`命主星为${ruler.planet}（${ruler.dignity||'状态未定'}）${ruler.house?`，落第 ${ruler.house} 宫`:''}——盘面的总调度，遇到抉择先看它。`,
   ev:[`命主星 ${ruler.planet}`,ruler.dignity||'',ruler.house?`第 ${ruler.house} 宫`:''].filter(Boolean),
   sec:secOf(sec,/逐星|相位|格局/)
  });
 }
 return {metrics,points};
}

function synastryBrief({state,report}){
 const syn=state?.chartState?.synastry||{};
 const fit=syn.result?.fit||syn.fit||{};
 const insights=fit.insights||[];
 const metrics=[
  {k:'契合度',v:Number.isFinite(Number(fit.percent))?`${fit.percent}%`:'—',s:Number.isFinite(Number(fit.total))?`${fit.total}/${fit.max||36}`:'八科合计'},
  {k:'最突出的合',v:fit.highlight||'—',s:'八科最高项'},
  {k:'相处主线',v:insights[1]?.text?String(insights[1].text).split('；')[0]:'未检出',s:'待留意'}
 ];
 const points=[];
 if(Number.isFinite(Number(fit.percent))){
  points.push({
   t:`综合契合度${fit.percent}%${fit.highlight?`，其中「${fit.highlight}」是这组关系最明显的助力`:'，八科未见突出合项'}。`,
   ev:[`${fit.percent}%`,fit.highlight||''].filter(Boolean),sec:1
  });
 }
 for(const it of insights.slice(0,2)){
  if(it?.text)points.push({t:`${it.name}：${it.text}`,ev:[it.name],sec:1});
 }
 return {metrics,points};
}

const BUILDERS={bazi:baziBrief,ziwei:ziweiBrief,vedic:vedicBrief,west:westBrief,synastry:synastryBrief};

/* 出口三个：去择日（带着本命喜忌）、看时点专项、复制速览。
   合盘的主场景是婚期，所以它默认落到「嫁娶」而不是「通用」。 */
const ACTIONS={
 bazi:[{k:'cal:general',label:'去择日'},{k:'period',label:'看时点专项'},{k:'copy',label:'复制速览'}],
 ziwei:[{k:'cal:general',label:'去择日'},{k:'period',label:'看时点专项'},{k:'copy',label:'复制速览'}],
 vedic:[{k:'cal:general',label:'去择日'},{k:'period',label:'看时点专项'},{k:'copy',label:'复制速览'}],
 west:[{k:'cal:general',label:'去择日'},{k:'period',label:'看时点专项'},{k:'copy',label:'复制速览'}],
 synastry:[{k:'cal:wedding',label:'择嫁娶日'},{k:'period',label:'看时点专项'},{k:'copy',label:'复制速览'}]
};

export function buildBrief({kind,state,report}){
 const build=BUILDERS[kind];
 if(!build)return null;
 let made=null;
 try{made=build({state,report});}catch{return null;}
 // 占位值一律当「没这项」：把「格局 待定」摆在速览里，等于用空指标假装有结论。
 const real=v=>Boolean(v)&&!['—','待定','未检出'].includes(String(v));
 const metrics=(made.metrics||[]).filter(m=>m&&real(m.v));
 const points=(made.points||[]).filter(p=>p&&p.t);
 // 只有一条指标、又没有任何要点时不出速览：那不是速览，是一行残缺的题头。
 if(!points.length&&metrics.length<2)return null;
 return {metrics,points:points.slice(0,4),actions:ACTIONS[kind]||ACTIONS.bazi};
}

export function briefHtml(brief){
 if(!brief)return '';
 const metrics=brief.metrics?.length?`<div class="rpt-metrics">${brief.metrics.map(m=>`<div class="rpt-metric"><small>${esc(m.k)}</small><b>${esc(m.v)}</b><span>${esc(m.s||'')}</span></div>`).join('')}</div>`:'';
 const points=brief.points?.length?`<ol class="rpt-points">${brief.points.map(p=>`<li class="rpt-point"><button type="button" class="rpt-point-go" data-toc="${p.sec}" aria-label="跳到第 ${p.sec} 章看这一段"><span class="rpt-point-t">${esc(p.t)}</span><em>第 ${String(p.sec).padStart(2,'0')} 章 ›</em></button>${p.ev?.length?`<p class="rpt-point-ev">依据：${esc(p.ev.join(' · '))}</p>`:''}</li>`).join('')}</ol>`:'';
 const acts=brief.actions?.length?`<div class="rpt-brief-act">${brief.actions.map(a=>`<button type="button" class="rpt-act${a.k==='copy'?' ghost':''}" data-brief-act="${esc(a.k)}">${esc(a.label)}</button>`).join('')}</div>`:'';
 return `<section class="rpt-brief" aria-label="报告速览"><div class="rpt-brief-head"><b>速览</b><small>先读这一页，再进正文；每条都能点回原章</small></div>${metrics}${points}${acts}<p class="rpt-brief-note">速览只汇总正文里已经写明的判断，不另下断语。</p></section>`;
}

import {buildBaziKnowledgeReport,buildZiweiKnowledgeReport} from '../../www/js/rules.js';
import {insightModel,summaryHtml,dimsHtml,digestBlockHtml,lifecycleBlockHtml,wireDims,SYSTEM_LABEL} from './insight.js';
import {composeFullReport,reportHtml,tocItems,cleanSecTitle,sectionGroup} from './full-report.js';
import {periodSections} from './ui.js';
import {installCivilPickers} from './civil-picker.js';
import {ProfileMachine} from './profile-machine.js';
import {DIRECTIONS} from '../../src/housing.mjs';
import {localNowParams,formatLocalDisplayTime,localDisplayTime} from './now.js';
import {migrateStorage} from './schema.js';
import {vedicView,vedicTools} from './vedic.js';
import {versionCard,releaseHistory} from './releases.js';
import {ZIWEI_SCHOOLS} from '../../src/ziwei-rules.mjs';
import {updateLiquidPill} from './bottom-nav.js';
import {lockViewport,fitKeyboard} from './viewport.js';
import {diagnosticsPanel,installDiagnostics,resetCaches} from './diagnostics.js';
import {soulWidgets,wireSoul} from './soul-home.js';
import {feedbackEnabled,installFeedback,playSuccessSound,setFeedback} from './feedback.js';
import {exportReportDocument} from './report-export.js';import {exportReportPdf} from './report-export.js';
import {firstRunHome,DEMO_CASES,refreshToday} from './first-run.js';
import {$,esc,btn,stored,save,request,labels,splitDate,isoLocal,table} from './ui.js';
import {ziweiView,ziweiTools,ziweiPatterns,ziweiPeriodEvidence} from './ziwei.js';
import {baziView,baziTools,baziQuick,baziGrid} from './bazi.js';
import {westernView,westernTools,astroHouse,houseOptions,houseLabels,setAstroHouse} from './western.js';
import {extraView} from './extras.js';
import {shareChart} from './share.js';
import {buildPeriodReport,SCOPES,NAMES as PERIOD_NAMES,baziMoment,baziSelOf,baziPickOptions,focusSectionsFor,focusBodyHtml} from './period-report.js';
import {DICTIONARY} from './dictionary-data.js';
import {termCard} from './term-card.js';
import {caseSpace,relationStorageKey,relationships,pairKey,linkedCases,galaxy,soulCard,mergeBackup,recomputeFit} from './case-space.js';
import {getFavorites,getHistory,getHistoryEntry,deleteHistory,toggleFavorite,isFavorite,recordHistory,favoritesHtml,historyHtml,compareHtml} from './library.js';

installDiagnostics();
try{migrateStorage(localStorage);}catch(error){console.error(error.message);}
lockViewport();
fitKeyboard();

const CASES='xy:cases:v2',ACTIVE='xy_active_profile',SETTINGS='xy:settings:v2';
const standardGroups=['我的','亲人','朋友','特别关注'];
const state={
 cases:stored(CASES,[]),profile:stored(ACTIVE,null),groups:stored('xy:case-groups',[]).filter(x=>x!=='客户'),
 recent:stored('xy_recent_cases',[]),settings:stored(SETTINGS,{}),reading:null,tab:'chart',system:'ziwei',
 query:'',filter:'全部',chartState:{},pending:false,error:''
};
const profileMachine=new ProfileMachine(birth=>request('/api/console/reading',{birth}));
/* 五行配色固定为传统五行色（木绿 / 火红 / 土黄 / 金白 / 水蓝黑）。
   v0.51.0 移除「五行配色」切换项：旧开关只改 7 个 CSS 变量，绝大多数干支色已被
   更具体的规则覆盖，切了几乎看不出差别，属于「摆着但没作用」的设置，直接删掉。 */
const root=$('#screen');
let generation=0,flight,noticeTimer,locationToken=0,locationReply;
window.firstlightLocation=(token,lat,lon)=>{if(token===locationToken)locationReply?.(lat,lon);};
function tell(message){
 const node=$('#notice');node.textContent=message;node.hidden=false;
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{node.hidden=true;},3600);
}
window.firstlightReminderStatus=tell;
function syncModalState(){
 const drawer=$('#caseDrawer');
 $('#mainScrollView').style.pointerEvents=drawer?.hasAttribute('open')?'none':'auto';
 document.body.classList.toggle('modal-open',Boolean(document.querySelector('dialog[open]')));
}
function close(dialog){
 if(!dialog.hasAttribute('open'))return;
 if(dialog.close)dialog.close();
 else{dialog.removeAttribute('open');dialog.classList.remove('fallback');}
 syncModalState();
}
function open(dialog){
 if(dialog.hasAttribute('open'))return;
 if(dialog.showModal)dialog.showModal();
 else{dialog.setAttribute('open','');dialog.classList.add('fallback');}
 syncModalState();
}
for(const d of document.querySelectorAll('dialog')){
 d.addEventListener('click',e=>{if(e.target===d)close(d);});
 d.addEventListener('close',syncModalState);
 d.addEventListener('cancel',e=>{e.preventDefault();close(d);});
}
function sheet(id,title,body){
 const d=$('#'+id),prefix={inputSheet:'birth',caseDrawer:'drawer',toolSheet:'tool',termSheet:'term',configSheet:'config',moduleSheet:'module'}[id];
 d.innerHTML=`<div class="dialog-content"><div class="sheet-grip" aria-hidden="true"></div><header class="sheet-head">
 <h2 id="${prefix}Title">${esc(title)}</h2>${btn('×','class="icon" aria-label="关闭" data-close')}</header><div class="sheet-body">${body}<div class="scroll-clearance" aria-hidden="true"></div></div></div>`;
 installCivilPickers(d);
 $('[data-close]',d).onclick=()=>close(d);
 open(d);
 return d;
}
// v0.41.0 跳动修复：体系切换条只滚自身 scrollLeft，绝不用 scrollIntoView——
// scrollIntoView 会连带滚动所有祖先滚动容器（含 #mainScrollView / dialog），
// 与紧邻的 scrollTo(0,0) 相互打架，正是「输出排盘时界面跳动」的主因。
function centerRail(){
 const rail=$('#chartSystemSwitch');
 if(!rail||rail.hidden)return;
 const active=rail.querySelector('[data-system-switch][aria-pressed=true]');
 if(!active)return;
 const target=active.offsetLeft-(rail.clientWidth-active.offsetWidth)/2;
 if(Math.abs(rail.scrollLeft-target)>1)rail.scrollLeft=Math.max(0,target);
}
function switchTab(tab,system=state.system){
 if(!['chart','insights'].includes(tab))restoreInstant();
 for(const d of document.querySelectorAll('dialog'))close(d);
 state.tab=tab;state.system=system;
 render();
 // 同步瞬时归位，避免 smooth 滚动与随后 DOM 重建争抢滚动位置造成跳动。
 $('#mainScrollView').scrollTo?.(0,0);
 const screenEl=$('#screen');
 if(screenEl){screenEl.classList.remove('fl-swap');void screenEl.offsetWidth;screenEl.classList.add('fl-swap');}
 centerRail();
}
function switchNavTab(tabName,index){
 if(!['cases','chart','period','insights','me'].includes(tabName))return;
 const tabs=[...document.querySelectorAll('#bottomNav .nav-tab-item')];
 for(const [i,tab] of tabs.entries())tab.classList.toggle('active',i===index);
 switchTab(tabName);
}
function persist(){
 save(CASES,state.cases);
 if(state.profile)save(ACTIVE,state.profile);
 else localStorage.removeItem(ACTIVE);
 save('xy_recent_cases',state.recent);
}
function normalized(profile){
 const f=profile.fields??{};
 const date=f.dateStr??[f.Y,String(f.M).padStart(2,'0'),String(f.D).padStart(2,'0')].join('-');
 const clock=f.timeStr??[f.h??12,f.mi??0].map(n=>String(n).padStart(2,'0')).join(':');
 const [h,mi]=clock.split(':').map(Number);
 return {...f,...splitDate(date),name:profile.name,dateStr:date,timeStr:clock,h,mi,gender:f.gender||'女',
  useSolarTime:f.useSolarTime??state.settings.useSolarTime??(Number.isFinite(Number(f.city?.lon))&&Math.abs(Number(f.city?.lon))<=180),
  ziweiSchool:state.settings.ziweiSchool||'quanshu',
  ziweiLeap:state.settings.ziweiLeap||'split',dst1988Rule:state.settings.dst1988Rule||'iana',
  lateZishi:f.lateZishi||state.settings.lateZishi||'next-day',
  city:{...f.city,lat:Number(f.city?.lat),lon:Number(f.city?.lon),tz:Number(f.city?.tz??8)}};
}
function summary(result){
 const [year,,day]=result.bazi.pillars;
 const west=result.western,zi=result.ziwei;
 const palace=zi.palaces.find(p=>p.name==='命宫');
 const stars=palace.majorStars.length?palace.majorStars:palace.borrowedStars;
 return {
  yearDay:year.stem+year.branch+'年 '+day.stem+day.branch+'日',
  pillars:result.bazi.pillars.map(p=>p.stem+p.branch).join(' '),
  soul:result.ziwei.soul,
  day:result.bazi.dayMaster.stem+result.bazi.dayMaster.element+' '+result.bazi.strength.kind,
  ziwei:(palace.majorStars.length?'':'借')+(stars.map(s=>s.name).join('、')||'空宫')+'在'+palace.earthlyBranch,
  signs:'太阳'+west.planets.find(p=>p.key==='sun').sign+' · 上升'+west.asc.sign,
  solar:result.bazi.info.solar,lunar:result.bazi.info.lunar
 };
}
function installReading(profile,result){
 restoreInstant();
 profile.summary=summary(result);
 profile.tags=[...new Set([...(profile.tags||[]),...Object.values(profile.summary)])];
 state.reading=result;state.profile=profile;state.chartState={};state.activeTimeSystem=null;state.resonanceProfile=null;state.error='';
 state.cases=[profile,...state.cases.filter(c=>c.id!==profile.id)];
 state.recent=[profile.id,...state.recent.filter(id=>id!==profile.id)].slice(0,5);
 persist();
}
async function activate(profile,go=true){
 restoreInstant();
 const token=++generation;
 flight?.abort();flight=new AbortController();
 const birth=normalized(profile),cached=profileMachine.peek(birth);
 state.profile=profile;state.reading=cached;state.chartState={};state.activeTimeSystem=null;state.error='';state.pending=!cached;
 state.recent=[profile.id,...state.recent.filter(id=>id!==profile.id)].slice(0,5);
 persist();
 if(cached){profileMachine.sequence++;profileMachine.profile=profile;profileMachine.status='ready';installReading(profile,cached);state.pending=false;if(go)switchTab('chart');else render();return;}
 if(go)switchTab('chart');else render();
 try{
  const result=await profileMachine.activate(profile,birth);
  if(result&&token===generation)installReading(profile,result);
 }catch(error){if(token===generation)state.error=error.message;}
 finally{if(token===generation){state.pending=false;render();}}
}
function setGroup(filter){state.filter=filter;renderCases();}
const searchKey=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/(\d)[年月日时分]/g,'$1').replace(/[\s/.:\-]/g,'');
function caseCard(c){
 const f=c.fields||{},s=c.summary||{};
 const summaryItems=[
  ['八字',s.pillars||c.pillarSummary],['日元',s.day],['紫微',s.ziwei],['星座',s.signs]
 ].filter(([,v])=>v);
 const dates=[s.solar?'公历 '+s.solar:f.dateStr,s.lunar?'农历 '+s.lunar:null].filter(Boolean).join(' · ');
 return `<article class="case-card card liquid-glass ${state.profile?.id===c.id?'active':''}" data-case="${esc(c.id)}" tabindex="0" aria-label="${esc(c.name)}">
 <div><h3><span class="case-group-badge">${esc(c.category==='客户'?'特别关注':c.category||'我的')}</span> ${esc(c.name)} <small>${f.gender==='男'?'♂':'♀'}</small> ${state.profile?.id===c.id?'<span class="chip">当前案例</span>':''}</h3>
 <p>${esc(dates)} ${esc(f.timeUnknown?'时辰未知':f.timeStr||'')} · ${esc(f.city?.label||'手动坐标')}</p></div>
 <div class="case-actions">${btn('设为全局使用','class="primary" data-action="use"')}${btn(c.pinned?'取消置顶':'📌 置顶','data-action="pin"')}${btn('编辑','data-action="edit"')}${btn('删除','data-action="delete"')}</div>
 <div class="case-foot"><div class="chips">${summaryItems.map(([k,v])=>`<span class="chip">${k} · ${esc(v)}</span>`).join('')}</div>${btn('详情','class="case-detail" data-action="detail"')}</div></article>`;
}
function renderCases(){
 if(!$('[data-case-list]',root))root.innerHTML=`<section class="cases-page" aria-labelledby="casesTitle"><header class="page-head"><div class="page-head-main"><p class="kicker">FIRST LIGHT · 案例</p><h1 id="casesTitle">案例</h1></div><div class="page-head-actions">${btn('关系星系','class="ghost-pill" data-galaxy-open')}${btn('＋','class="ghost-pill ghost-pill-sm" data-create aria-label="新建案例" title="新建案例"')}</div></header>
 <div class="case-search"><label><input id="caseSearch" class="liquid-glass" type="search" value="${esc(state.query)}" placeholder="搜索姓名、生辰、城市或标签" aria-label="搜索案例"></label>${btn('清除','data-clear-search aria-label="清除案例搜索"')}</div>
 <div class="case-cluster-row"><div class="rail" aria-label="特征聚类">${btn('同日元','data-cluster="day"')}${btn('同紫微命主','data-cluster="soul"')}${btn('全部特征','data-cluster=""')}</div><p class="thin" data-search-scope role="status"></p></div>
 <div class="rail case-groups" id="caseGroups" aria-label="案例分组"></div><div data-case-list></div></section>`;
 $('#caseSearch').oninput=e=>{state.query=e.target.value;renderCases();};
 $('[data-clear-search]',root).onclick=()=>{state.query='';$('#caseSearch').value='';renderCases();$('#caseSearch').focus();};
 $('[data-create]',root).onclick=()=>birthSheet(null);
 $('[data-galaxy-open]',root).onclick=()=>showGalaxy();
 const groups=['全部',...standardGroups,...state.groups];
 const groupRail=$('#caseGroups'),groupScroll=groupRail.scrollLeft;
 groupRail.innerHTML=groups.map(g=>btn(g,`data-group="${esc(g)}" aria-pressed="${state.filter===g}"`)).join('')+btn('+ 新建分组','data-add-group');
 groupRail.scrollLeft=groupScroll;
 groupRail.onclick=e=>{
  const item=e.target.closest('button');
  if(item?.hasAttribute('data-add-group')){
   const d=sheet('toolSheet','新建分组','<form><label>分组名称<input name="group" maxlength="12" required></label><button class="primary">创建</button></form>');
   $('form',d).onsubmit=event=>{
    event.preventDefault();const group=new FormData(event.currentTarget).get('group').trim();
    if(!group||group==='客户'||groups.includes(group)){tell('请使用新的分组名称');return;}
    state.groups.push(group);save('xy:case-groups',state.groups);close(d);setGroup(group);
   };
  }else if(item?.dataset.group)setGroup(item.dataset.group);
 };
 for(const b of root.querySelectorAll('[data-cluster]'))b.onclick=async()=>{
  state.cluster=b.dataset.cluster;
  const label=b.textContent;if(state.cluster){b.disabled=true;b.textContent='核对档案…';for(const c of state.cases){if(c.summary?.day&&c.summary?.soul)continue;try{c.summary=summary(await request('/api/console/reading',{birth:normalized(c)}));}catch{ /* Invalid legacy birth data remains available for editing. */ }}persist();b.disabled=false;b.textContent=label;}
  if(state.tab==='cases')renderCases();
 };
 const q=searchKey(state.query);
 const list=state.cases.filter(c=>!state.cluster||(state.cluster==='day'?c.summary?.day&&c.summary.day.split(' ')[0]===state.profile?.summary?.day?.split(' ')[0]:c.summary?.soul&&c.summary.soul===state.profile?.summary?.soul)).filter(c=>(q||state.filter==='全部'||(c.category==='客户'?'特别关注':c.category||'我的')===state.filter)&&
  [...(c.tags||[]),...Object.values(c.summary||{}),c.name,c.fields?.dateStr,c.fields?.timeStr,c.fields?.city?.label,[c.fields?.Y,c.fields?.M,c.fields?.D].filter(Boolean).join('-')].some(v=>searchKey(v).includes(q)));
 $('[data-search-scope]',root).textContent=q?'全案例跨组搜索 · '+list.length+' 个结果':state.cluster?'特征筛选 · '+list.length+' 例':'共 '+list.length+' 例';

 const host=$('[data-case-list]',root);
 list.sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned));
 host.innerHTML=list.map(caseCard).join('')||'<p class="empty">这里还没有匹配的案例。</p>';
 host.animate?.([{opacity:.7},{opacity:1}],{duration:180,easing:'ease-out'});
 host.onclick=e=>{
  if(host.dataset.longPress==='true'){delete host.dataset.longPress;return;}
  const card=e.target.closest('[data-case]');
  if(!card)return;
  const c=state.cases.find(x=>x.id===card.dataset.case);
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='pin'){c.pinned=!c.pinned;persist();renderCases();}
  else if(action==='edit')birthSheet(c);
  else if(action==='detail')caseDetail(c);
  else if(action==='delete')confirmDelete(c);
  else activate(c);
 };
 let press;host.onpointerdown=e=>{const card=e.target.closest('[data-case]');delete host.dataset.longPress;if(card&&!e.target.closest('button'))press=setTimeout(()=>{const c=state.cases.find(c=>c.id===card.dataset.case);c.pinned=true;host.dataset.longPress='true';persist();renderCases();},650);};host.onpointerup=host.onpointercancel=()=>clearTimeout(press);host.onpointermove=()=>clearTimeout(press);
 host.onkeydown=e=>{if(e.target.matches('[data-case]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}};
}
function confirmDelete(c){
 const d=sheet('toolSheet','删除案例',`<p>删除「${esc(c.name)}」及其本机札记和关系？</p><div class="confirm-actions">${btn('取消','data-cancel-delete')}${btn('确认删除','class="primary" data-confirm')}</div>`);
 $('[data-cancel-delete]',d).onclick=()=>close(d);
 $('[data-confirm]',d).onclick=()=>{
  state.cases=state.cases.filter(x=>x.id!==c.id);
  const data=stored('xy_case_space',{links:[],notes:{},reminders:{}});
  data.links=data.links.filter(l=>!l.ids.includes(c.id));
  delete data.notes[c.id];
  for(const reminder of data.reminders[c.id]||[])window.webkit?.messageHandlers?.caseReminder?.postMessage({id:reminder.id,cancel:true});
  delete data.reminders[c.id];save('xy_case_space',data);
  if(state.profile?.id===c.id){profileMachine.clear();generation++;flight?.abort();state.profile=null;state.reading=null;state.error='';state.pending=false;}
  persist();close(d);render();
 };
}
function showGalaxy(profile=state.profile){
 if(!profile){tell('请先设定一个全局案例作为星系中心');return;}
 const d=sheet('toolSheet','关系星系 · '+profile.name,'<div data-galaxy><p class="muted">正在计算关系轨道…</p></div>');
 fillGalaxy(d,profile);
}
function fillGalaxy(dialog,profile){
 const host=$('[data-galaxy]',dialog);
 linkedCases(profile,state.cases,caseSpace().links,request,normalized).then(items=>{
  if(!host.isConnected||!dialog.open)return;
  const draw=page=>{
   host.innerHTML=galaxy(profile,items,page);
   for(const b of host.querySelectorAll('[data-galaxy-page]'))b.onclick=()=>draw(+b.dataset.galaxyPage);
   for(const node of host.querySelectorAll('[data-galaxy-case]')){
    const show=()=>showRelation(profile,items.find(item=>item.other.id===node.dataset.galaxyCase));
    node.onclick=show;
    if(node.tagName.toLowerCase()==='g')node.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();show();}};
   }
  };
  draw(0);
 });
}
function showRelation(profile,item){
 const {other,score,type}=item;
 const d=sheet('termSheet',other.name+' · 关系名片',`<article class="card liquid-glass galaxy-profile">
 <p class="kicker">${esc(type)}</p><p class="relation-score">${score?'契合度 '+score.percent+'%':'契合度暂不可用'}</p>
 ${score?(score.insights||[]).map(i=>`<p><b>${esc(i.name)}</b> · ${esc(i.text)}</p>`).join('')+'<small>合盘是传统观察线索。</small>':'<p class="muted">远程合盘服务未响应。可点「重新计算」用本机引擎离线生成契合度，或查看下方深度双人合盘。</p>'}</article>
 <div class="spread">${score?'':btn('重新计算契合度','class="primary" data-recompute-fit')}${btn('查看深度双人合盘',score?'data-deep-pair':'class="primary" data-deep-pair')}</div>`);
 if(!score)$('[data-recompute-fit]',d).onclick=()=>{
  try{
   const fit=recomputeFit(normalized(profile),normalized(other));
   const box=$('.relation-score',d),ins=$('.galaxy-profile',d);
   if(box)box.textContent='契合度 '+fit.percent+'%';
   if(ins&&fit.insights?.length)ins.insertAdjacentHTML('beforeend',fit.insights.map(i=>`<p><b>${esc(i.name)}</b> · ${esc(i.text)}</p>`).join(''));
   tell('已用本机引擎算出契合度');
  }catch(e){tell('本机合盘计算失败：'+e.message);}
 };
 $('[data-deep-pair]',d).onclick=()=>{
  if(state.profile?.id!==profile.id){tell('请重新打开当前命主的关系星系');return;}
  state.chartState.synastry={other:other.id,token:0,result:null,error:''};
  switchTab('chart','synastry');
 };
}
function caseDetail(c){
 const data=caseSpace();
 const linked=data.links.filter(l=>l.ids.includes(c.id)).map(l=>({...l,other:state.cases.find(p=>p.id===l.ids.find(id=>id!==c.id))})).filter(x=>x.other);
 const candidates=state.cases.filter(x=>x.id!==c.id);
 const reminders=data.reminders[c.id]||[];
 const d=sheet('toolSheet',c.name+' · 案例空间',`
 ${state.profile?.id===c.id?'<details><summary>查看关系星系</summary><div data-galaxy></div></details>':''}
 <div class="stack">${linked.map((l,i)=>`<div class="spread"><span>${esc(l.other.name)} · ${esc(l.type)}</span>${btn('解除',`data-unlink="${i}"`)}</div>`).join('')}</div>
 ${candidates.length?`<form id="addRelation" class="form-grid"><label>关联案例<select name="other">${candidates.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></label>
 <label>关系类型<select name="kind">${relationships.map(x=>`<option>${x}</option>`).join('')}<option value="custom">＋自定义</option></select></label>
 <label class="wide" data-custom-kind hidden>自定义关系<input name="custom" maxlength="24"></label>
 <button class="wide">保存双向关系</button></form>`:''}
 <form id="caseNote"><label>个人札记<textarea name="note" maxlength="8000" rows="4">${esc(data.notes[c.id])}</textarea></label><button>保存札记</button></form>
 <form id="caseReminder" class="form-grid"><label>提醒时间<input name="when" type="datetime-local" required></label><label>提醒内容<input name="message" maxlength="80" required></label><button class="wide">添加提醒</button></form>
 <div class="stack">${reminders.map(r=>`<div class="spread"><span>${r.kind==='almanac'?'<b class="plan-badge">择日</b>':''}${esc(r.when.replace('T',' '))} · ${esc(r.message)}</span>${btn('取消',`data-cancel-reminder="${esc(r.id)}"`)}</div>`).join('')}</div>`);
 const store=()=>save(relationStorageKey,data);
 const disclosure=$('details',d);
 if(disclosure)disclosure.ontoggle=()=>{if(disclosure.open&&!$('[data-galaxy]',d).hasChildNodes())fillGalaxy(d,c);};
 const rel=$('#addRelation',d);
 if(rel){
  const {other,kind,custom}=rel.elements;
  const reveal=()=>$('[data-custom-kind]',rel).hidden=kind.value!=='custom';
  const sync=()=>{
   const l=linked.find(x=>x.other.id===other.value);
   kind.value=l?(relationships.includes(l.type)?l.type:'custom'):relationships[0];
   custom.value=kind.value==='custom'?l.type:'';
   reveal();
  };
  other.onchange=sync;kind.onchange=reveal;sync();
  rel.onsubmit=e=>{
   e.preventDefault();
   const type=kind.value==='custom'?custom.value.trim():kind.value;
   if(!type){tell('请输入自定义关系');return;}
   const ids=[c.id,other.value].sort(),key=pairKey(ids);
   data.links=data.links.filter(l=>pairKey(l.ids)!==key);
   data.links.push({ids,type});
   store();caseDetail(c);
  };
 }
 for(const b of d.querySelectorAll('[data-unlink]'))b.onclick=()=>{
  const key=pairKey(linked[b.dataset.unlink].ids);
  data.links=data.links.filter(l=>pairKey(l.ids)!==key);store();caseDetail(c);
 };
 $('#caseNote',d).onsubmit=e=>{e.preventDefault();data.notes[c.id]=new FormData(e.currentTarget).get('note');store();tell('札记已保存');};
 $('#caseReminder',d).onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.currentTarget),when=f.get('when'),message=f.get('message').trim(),at=Date.parse(when);
  if(!message||!(at>Date.now())){tell('请输入未来的提醒时间和内容');return;}
  const id=crypto.randomUUID?.()??Date.now().toString();
  (data.reminders[c.id]??=[]).push({id,when,message});store();
  const native=window.webkit?.messageHandlers?.caseReminder;
  if(native)native.postMessage({id,seconds:(at-Date.now())/1000,message});
  else tell('已保存，网页打开时会提示到期提醒');
  caseDetail(c);
 };
 for(const b of d.querySelectorAll('[data-cancel-reminder]'))b.onclick=()=>{
  const id=b.dataset.cancelReminder;data.reminders[c.id]=reminders.filter(r=>r.id!==id);store();
  window.webkit?.messageHandlers?.caseReminder?.postMessage({id,cancel:true});caseDetail(c);
 };
}
function birthSheet(profile,seed={}){
 const existing=profile?normalized(profile):{};
 const f={...existing,...seed};
 const setting=state.settings;
 const city={...{lat:setting.lat,lon:setting.lon,tz:setting.tz??8,label:setting.place},...f.city};
 const options=[...standardGroups,...state.groups].map(g=>`<option ${g===(profile?.category==='客户'?'特别关注':profile?.category||'我的')?'selected':''}>${esc(g)}</option>`).join('');
 const d=sheet('inputSheet',profile?'编辑出生资料':'起盘工作台',`
 <form id="birthForm" class="form-grid" novalidate>
  <label>命主姓名<input name="name" value="${esc(f.name)}" maxlength="40" placeholder="姓名或昵称"></label>
  <label>性别<select name="gender"><option ${f.gender==='男'?'selected':''}>男</option><option ${f.gender!=='男'?'selected':''}>女</option></select></label>
  <label>历法<select name="calendar"><option value="solar">公历</option><option value="lunar" ${f.calendar==='lunar'?'selected':''}>农历</option></select></label>
  <label>出生日期<input name="date" type="date" value="${esc(f.dateStr||'')}" placeholder="YYYY-MM-DD"></label>
  <label>出生时刻<input name="clock" type="time" value="${esc(f.timeStr||'12:00')}"></label>
  <label class="wide time-unknown-wrap"><span class="time-unknown-label">出生时刻不确定？</span><button type="button" class="time-unknown-toggle" data-unknown-toggle aria-pressed="${f.timeUnknown?'true':'false'}">${f.timeUnknown?'已按未知时刻排盘 · 点此填时刻':'出生时刻未知 · 只排三柱'}</button></label>
  <label>案例分组<select name="category">${options}</select></label>
  <label>阳宅居住方位（可选）<select name="homeDirection"><option value="">不设置</option>${Object.entries(DIRECTIONS).map(([k,v])=>`<option value="${k}" ${f.housing?.direction===k?'selected':''}>${k}(${v})</option>`).join('')}</select></label><label>家庭身份（可选）<select name="homeMember"><option value="">不设置</option>${Object.entries({乾:'父',坤:'母',震:'长子',巽:'长女',坎:'中子',离:'中女',艮:'少子',兑:'少女'}).map(([k,v])=>`<option value="${k}" ${f.housing?.member===k?'selected':''}>${v}</option>`).join('')}</select></label>
  <label class="wide">出生城市<input name="city" value="${esc(city.label)}" placeholder="搜索城市，也可直接填写坐标" autocomplete="off"></label>
  <div id="cityMatches" class="rail wide" aria-label="城市搜索结果"></div>
  <label>纬度<input name="lat" type="number" step="any" value="${Number.isFinite(city.lat)?city.lat:''}" placeholder="−90 到 90"></label>
  <label>经度<input name="lon" type="number" step="any" value="${Number.isFinite(city.lon)?city.lon:''}" placeholder="−180 到 180"></label>
  <label>UTC 偏移<input name="tz" type="number" step="any" value="${esc(city.tz)}"></label>
  ${btn('使用当前位置','data-locate')}
  <div class="checks wide"><input name="unknown" type="checkbox" ${f.timeUnknown?'checked':''} hidden><label><input name="solar" type="checkbox" ${(f.useSolarTime??setting.useSolarTime??(Number.isFinite(city.lon)&&Math.abs(city.lon)<=180))?'checked':''}>真太阳时${(f.useSolarTime??setting.useSolarTime)==null&&Number.isFinite(city.lon)?'<small>（已按出生地经度默认开启）</small>':''}</label><label data-leap><input name="leap" type="checkbox" ${f.leapMonth?'checked':''}>闰月</label></div>
  <p class="wide muted" id="birthStatus" role="status"></p><button type="submit" class="wide primary">生成命盘</button>
 </form>
 <div class="rail" aria-label="历史案例">${state.cases.slice(0,5).map(c=>btn(c.name,`data-use-case="${esc(c.id)}"`)).join('')}${profile?btn('＋ 起新盘','data-new'):''}</div>`);
 const form=$('form',d),fields=form.elements,feedback=$('#birthStatus',d),matches=$('#cityMatches',d);
 // 真太阳时默认策略：用户没手动碰过开关时，一旦有有效经度就默认开启（问真/狗运极佳口径）
 let solarTouched=false;
 fields.solar.onchange=()=>{solarTouched=true;};
 const autoSolar=()=>{if(!solarTouched){const lon=Number(fields.lon.value);fields.solar.checked=Number.isFinite(lon)&&Math.abs(lon)<=180;}};
 const calendar=()=>{
  const lunar=fields.calendar.value==='lunar';
  $('[data-leap]',d).hidden=!lunar;
 };
 fields.calendar.onchange=calendar;calendar();
 const unknownToggle=$('[data-unknown-toggle]',d);
 const paintUnknown=()=>{
  const on=fields.unknown.checked;
  fields.clock.disabled=on;
  unknownToggle.setAttribute('aria-pressed',String(on));
  unknownToggle.textContent=on?'已按未知时刻排盘 · 点此填时刻':'出生时刻未知 · 只排三柱';
 };
 fields.unknown.onchange=paintUnknown;paintUnknown();
 unknownToggle.onclick=()=>{fields.unknown.checked=!fields.unknown.checked;fields.unknown.onchange();};
 let query=0;
 fields.city.oninput=async()=>{
  const id=++query,value=fields.city.value.trim();
  matches.replaceChildren();if(!value)return;
  try{
   const result=await request('/api/geo/search?q='+encodeURIComponent(value));
   if(id!==query||!d.open)return;
   for(const item of result.items.slice(0,8)){
    const b=document.createElement('button');b.type='button';b.textContent=item.name;
    b.onclick=async()=>{
     const token=++query;
     try{
      const location=await request('/api/geo/resolve?'+new URLSearchParams({p:item.provinceCode||item.code,c:item.cityCode||(item.level==='city'?item.code:''),d:item.level==='county'?item.code:''}));
      if(token!==query||!d.open)return;
      fields.city.value=location.label||item.name;fields.lat.value=location.lat;fields.lon.value=location.lon;fields.tz.value=8;autoSolar();
      matches.replaceChildren();
     }catch(error){feedback.textContent=error.message;}
    };matches.append(b);
   }
  }catch{if(id===query)feedback.textContent='城市搜索暂不可用，可直接填写坐标';}
 };
 for(const k of ['lat','lon','tz'])fields[k].oninput=()=>{query++;matches.replaceChildren();autoSolar();};
 $('[data-locate]',d).onclick=()=>{
  const token=++query;
  const reply=(lat,lon)=>{
   if(token!==query||!d.open||!form.isConnected)return;
   if(!Number.isFinite(lat)||!Number.isFinite(lon)){feedback.textContent='定位未完成，可手动填写';return;}
   fields.lat.value=lat.toFixed(6);fields.lon.value=lon.toFixed(6);autoSolar();
   fields.city.value='当前位置';fields.tz.value=-new Date().getTimezoneOffset()/60;feedback.textContent='坐标已填写';
  };
  const native=window.webkit?.messageHandlers?.findLocation;
  if(native){locationReply=reply;native.postMessage(++locationToken);}
  else if(navigator.geolocation)navigator.geolocation.getCurrentPosition(p=>reply(p.coords.latitude,p.coords.longitude),()=>reply(null,null));
  else reply(null,null);
 };
 for(const b of d.querySelectorAll('[data-use-case]'))b.onclick=()=>activate(state.cases.find(c=>c.id===b.dataset.useCase));
 const fresh=$('[data-new]',d);if(fresh)fresh.onclick=()=>birthSheet(null);
 form.onsubmit=async e=>{
  e.preventDefault();
  const lat=Number(fields.lat.value),lon=Number(fields.lon.value),tz=fields.tz.value.trim()===''?(setting.tz??8):Number(fields.tz.value);
  if([fields.lat,fields.lon].some(k=>k.value.trim()==='')||![lat,lon,tz].every(Number.isFinite)||Math.abs(lat)>90||Math.abs(lon)>180||tz< -12||tz>14){feedback.textContent='请填写有效经纬度和 UTC 偏移';return;}
  const dateStr=fields.date.value.trim(),timeStr=fields.unknown.checked?'12:00':fields.clock.value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeStr)){feedback.textContent='请填写有效出生日期和时间';return;}
  const [h,mi]=timeStr.split(':').map(Number),name=fields.name.value.trim()||'未命名案例';
  const next={...profile,id:profile?.id??(crypto.randomUUID?.()||Date.now().toString()),name,category:fields.category.value,updatedAt:new Date().toISOString(),
   fields:{housing:fields.homeDirection.value&&fields.homeMember.value?{direction:fields.homeDirection.value,member:fields.homeMember.value}:null,...splitDate(dateStr),dateStr,timeStr,h,mi,name,gender:fields.gender.value,calendar:fields.calendar.value,leapMonth:fields.calendar.value==='lunar'&&fields.leap.checked,
    timeUnknown:fields.unknown.checked,useSolarTime:fields.solar.checked,lateZishi:setting.lateZishi||'next-day',city:{lat,lon,tz,label:fields.city.value.trim()||'手动坐标'}}};
  const submit=$('[type=submit]',form);submit.disabled=true;feedback.textContent='正在排盘…';
  const token=++generation;flight?.abort();flight=new AbortController();
  let settled=false; // v0.44.0：骨架过渡已接管 pending，finally 不再提前清掉
  try{
   const reading=await request('/api/console/reading',{birth:normalized(next)},flight.signal);
   if(token!==generation||!d.open||!form.isConnected)return;
   // v0.44.0 防跳动：先关表单并切到排盘页显示固定高度骨架，下一帧再装盘面。
   // 原先「关表单 + 装数据 + 渲染整块盘面」同帧完成，#screen 高度 74px→1280px 瞬间暴涨，
   // 底部体系栏同时弹出——这就是「排盘打开跳一下」。骨架过渡把这次突变拆成两步。
   state.profile=next;state.reading=null;state.chartState={};state.activeTimeSystem=null;state.error='';state.pending=true;
   switchTab('chart');
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(token!==generation)return;
    installReading(next,reading);state.pending=false;render();playSuccessSound();
   }));
   settled=true;
  }catch(error){if(token===generation)feedback.textContent=error.message;}
  finally{if(token===generation&&!settled)state.pending=false;submit.disabled=false;}
 };
}
function settingsForm(){
 const s=state.settings;
 return `<form id="prefs" class="form-grid">
 <label class="checks wide"><input name="solar" type="checkbox" ${s.useSolarTime?'checked':''}>新案例默认使用真太阳时</label>
 ${state.profile?`<label class="checks wide"><input name="activeSolar" type="checkbox" ${normalized(state.profile).useSolarTime?'checked':''}>当前案例使用真太阳时</label>`: ''}
 <label>晚子时（23:00–24:00）<select name="late"><option value="next-day">归次日</option><option value="current-day" ${s.lateZishi==='current-day'?'selected':''}>归当日</option></select></label>
 <label class="wide">紫微十干四化口径<select name="ziweiSchool">${Object.entries(ZIWEI_SCHOOLS).map(([id,v])=>`<option value="${id}" ${s.ziweiSchool===id?'selected':''}>${esc(v.label+' · '+v.description)}</option>`).join('')}</select></label>
 <label>紫微闰月规则<select name="ziweiLeap">${[['split','15日分界'],['prev-month','视作本月'],['next-month','视作下月']].map(([id,label])=>`<option value="${id}" ${s.ziweiLeap===id?'selected':''}>${label}</option>`).join('')}</select></label>
 <label>1988 夏令时口径<select name="dst1988Rule"><option value="iana">公告 / IANA：4月17日</option><option value="compat-apr10" ${s.dst1988Rule==='compat-apr10'?'selected':''}>4月10日兼容（非公告）</option></select></label>
 <label>西洋分宫制<select name="house">${houseOptions(astroHouse())}</select></label>
 <label>默认地点<input name="place" value="${esc(s.place)}"></label><label>UTC 偏移<input name="tz" type="number" step="any" value="${esc(s.tz??8)}"></label>
 <label>纬度<input name="lat" type="number" step="any" value="${esc(s.lat)}"></label><label>经度<input name="lon" type="number" step="any" value="${esc(s.lon)}"></label>
 <button class="wide primary">保存设置</button></form>`;
}
function savePreferences(e){
 restoreInstant();
 e.preventDefault();
 const f=new FormData(e.currentTarget),[lat,lon,tz]=['lat','lon','tz'].map(k=>f.get(k)===''?undefined:Number(f.get(k)));
 if([lat,lon,tz].some(v=>v!==undefined&&!Number.isFinite(v))||Math.abs(lat)>90||Math.abs(lon)>180||tz< -12||tz>14){tell('默认坐标或时区无效');return;}
 state.settings={ziweiLeap:f.get('ziweiLeap'),dst1988Rule:f.get('dst1988Rule'),ziweiSchool:f.get('ziweiSchool'),lateZishi:f.get('late'),useSolarTime:f.has('solar'),place:f.get('place'),lat,lon,tz:tz??8};
 save(SETTINGS,state.settings);
 const drawer=e.currentTarget.closest('dialog');if(drawer)close(drawer);
 setAstroHouse(ctx,f.get('house'));
 if(state.profile){
  const birth=normalized(state.profile),lateZishi=state.settings.lateZishi,useSolarTime=f.has('activeSolar');
  activate({...state.profile,fields:{...state.profile.fields,lateZishi,useSolarTime}},false);
 }
 const status=$('[data-pref-status]',e.currentTarget.parentElement);
 if(status)status.textContent='已保存至本机。';
}
function caseDrawer(){
 const p=state.profile;
 const entries=[...state.recent.map(id=>state.cases.find(c=>c.id===id)).filter(Boolean),...state.cases.filter(c=>!state.recent.includes(c.id))].slice(0,5);
 const d=sheet('caseDrawer','快捷案例',`<div class="card"><span class="kicker">当前案例</span><h3>${esc(p?.name||'尚未选择案例')}</h3><p>${esc(p?.summary?.pillars||'')}</p><small>${esc(p?.fields?.dateStr||'')} ${esc(p?.fields?.timeStr||'')} ${esc(p?.fields?.city?.label||'')}</small></div>
 <div class="drawer-accordion">
 <details><summary>📁 快捷档案库</summary><div class="stack archive-list">${entries.map(c=>`<button type="button" class="drawer-case" data-recent="${esc(c.id)}">
 <span class="archive-avatar" aria-hidden="true">${esc(Array.from(c.name)[0]||'星')}</span><span><b>${esc(c.name)}</b><small>${esc(c.summary?.pillars||c.fields?.dateStr||'')}</small></span></button>`).join('')||'<p class="muted">还没有可切换的档案。</p>'}</div></details>
 ${[
  ['天机排盘工坊',[['东方盘',['ziwei','bazi','qizheng']],['西洋盘',['west']],['印度盘',['vedic']]]],
  ['推运时空',[['西洋推运',['transit','secondary','tertiary','solar','lunar','firdaria']],['每日时空',['calendar']]]],
  ['易经古籍',[['卦象与经典',['yijing']]]],
  ['关系星系',[['双向案例',['galaxy','synastry']]]],
 ].map(([title,sections])=>`<details><summary>${title}</summary><div>${sections.map(([name,items])=>`<details><summary>${name}</summary><div class="tool-grid">${items.map(id=>btn(labels[id]||{transit:'行运',secondary:'次限',tertiary:'三限',solar:'日返',lunar:'月返',firdaria:'法达',galaxy:'关系图谱'}[id],`data-destination="${id}"`)).join('')}</div></details>`).join('')}</div></details>`).join('')}
 ${state.reading?`<details><summary>盘面工具</summary><div class="tool-grid">${btn('快捷八字','data-quick-bazi')}${state.system==='ziwei'&&state.tab==='chart'?btn('格局神煞','data-ziwei-patterns'):''}${state.tab==='chart'?btn('分享长图','data-share-chart'):''}</div></details>`:''}
 <details><summary>⚙️ 命理口径与算法配置</summary><div>${settingsForm()}<p class="thin" role="status" data-pref-status></p></div></details></div>
 <div class="tool-grid">${btn('＋ 新建案例','class="primary" data-fresh')}${btn('运行诊断与日志','data-diagnostics')}</div>`);
 $('[data-diagnostics]',d).onclick=()=>{close(d);diagnosticsPanel(ctx);};
 $('#prefs',d).onsubmit=savePreferences;
 const quick=$('[data-quick-bazi]',d),share=$('[data-share-chart]',d);
 if(quick)quick.onclick=()=>{close(d);baziQuick(ctx);};
 const patterns=$('[data-ziwei-patterns]',d);
 if(patterns)patterns.onclick=()=>{close(d);ziweiPatterns(ctx);};
 if(share)share.onclick=()=>{close(d);shareChart(root,$('[data-profile-name]').textContent).catch(e=>tell(e.message));};
 for(const b of d.querySelectorAll('[data-recent]'))b.onclick=()=>activate(state.cases.find(c=>c.id===b.dataset.recent));
 for(const b of d.querySelectorAll('[data-destination]'))b.onclick=()=>{
  const id=b.dataset.destination;
  if(id==='galaxy'){close(d);showGalaxy();return;}
  if(labels[id]){switchTab('chart',id);return;}
  state.chartState.west={mode:id,at:new Date(),result:null,token:0,pending:false,error:'',requested:false};
  switchTab('chart','west');
 };
 $('[data-fresh]',d).onclick=()=>{close(d);birthSheet(null);};
}

function restoreInstant(){if(state.instantSnapshot){Object.assign(state,state.instantSnapshot);state.instantSnapshot=null;}}
function restoreOriginal(){
 if(!state.instantSnapshot)return;
 restoreInstant();state.chartState={};state.activeTimeSystem=null;state.pending=false;state.error='';render();
}
async function instantChart(){
 const at=new Date(),system=['bazi','ziwei','vedic','west'].includes(state.system)?state.system:'ziwei',token=++generation;flight?.abort();
 for(const d of document.querySelectorAll('dialog'))close(d);
 const birth=localNowParams(at,state.profile?.fields?.city);
 try{
  const result=await request('/api/console/reading',{birth});if(token!==generation)return;
  state.instantSnapshot??={profile:state.profile,reading:state.reading,chartState:state.chartState,activeTimeSystem:state.activeTimeSystem};
  state.profile={id:'instant-preview',name:'即刻天象',fields:birth,summary:summary(result)};state.reading=result;state.chartState={};state.activeTimeSystem=null;state.pending=false;state.error='';
  if(system==='west')state.chartState.west={mode:'sky',at,result:null,token:0,error:'',requested:false,instant:{at:at.toISOString(),local:formatLocalDisplayTime(birth),place:birth.city.label,source:'设备本地时区 UTC'+birth.tz}};
  state.instantAt=at.toISOString();state.tab='chart';state.system=system;render();
 }catch(error){tell(error.message);}
}
/* ===== v0.59.0 择日闭环：选日 → 看那一刻的盘 → 定事并留痕 =====
   择日页只给「哪天哪个时辰合适」，真正要下判断还得看那一刻的盘。
   这里把「某日 + 某时辰」换算成 baziPro 的索引式 selection（大运/流年/流月/流日/流时），
   直接调用时点专项的同一套内核出详批，避免另写一份口径。 */
const BRANCHES='子丑寅卯辰巳午未申酉戌亥';
// 子时取 00:30（早子时），与择日引擎按 00:00 采样日柱的口径一致；其余取该时辰中点。
function clockForBranch(branch){
 const i=Math.max(0,BRANCHES.indexOf(branch));
 return i===0?'00:30':String(i*2).padStart(2,'0')+':30';
}
async function baziSelectionAt(date,hourBranch){
 const birth=ctx.birth,year=Number(date.slice(0,4));
 const probe=await request('/api/console/bazi',{birth,selection:{year},combine:false});
 const cycles=probe.cycles||[],at=Date.parse(date+'T04:00:00Z');
 const beforeStart=cycles.length?Date.parse(cycles[0].startUtc)>at:false;
 let luck=cycles.findIndex(c=>c.startUtc&&c.endUtc&&Date.parse(c.startUtc)<=at&&at<Date.parse(c.endUtc));
 if(luck<0)luck=cycles.findIndex(c=>c.startYear<=year&&year<=(c.endYear??c.startYear+9));
 const months=probe.months||[];
 let month=months.findIndex((m,i)=>m.date.slice(0,10)<=date&&date<(months[i+1]?.date.slice(0,10)??'9999'));
 if(month<0&&months.length)month=0;
 const selection={year};
 if(!beforeStart&&luck>=0)selection.luck=luck;
 if(month!=null)selection.month=month;
 if(month!=null){
  const withMonth=await request('/api/console/bazi',{birth,selection:{...selection},combine:false});
  const day=(withMonth.days||[]).findIndex(d=>d.date===date);
  if(day>=0)selection.day=day;
 }
 const hour=BRANCHES.indexOf(hourBranch);
 if(hour>=0&&!birth.timeUnknown&&selection.day!=null)selection.hour=hour;
 return selection;
}
async function openMomentReport({date,hourBranch='巳',label}){
 if(!state.profile){tell('请先激活一个案例，再看该时刻的时点盘');return;}
 try{
  tell('正在按这一刻重排时点盘…');
  const selection=await baziSelectionAt(date,hourBranch);
  const spot=label||`${date} ${hourBranch}时`;
  const report=await buildPeriodReport(ctx,'bazi','hour',selection,spot,'focus');
  openFullReport(report);
 }catch(error){tell('时点盘生成失败：'+error.message);}
}
// 择日结果写入案例日程：本地提醒 + 原生通知 + 札记留痕，三处同一条记录，便于回看。
function addAlmanacPlan({date,hourBranch='巳',eventLabel='择日',score,tier,gz,clock}){
 if(!state.profile){tell('请先激活一个案例，再把择日结果存入日程');return false;}
 const at=clock||clockForBranch(hourBranch),when=date+'T'+at;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(at)){tell('请选择有效的日期与时间');return false;}
 if(!(Date.parse(when)>Date.now())){tell('这个时段已经过去，换一个未来时段再存');return false;}
 const message=`${eventLabel} · ${hourBranch}时 · ${tier||''} ${score??''} 分`.replace(/\s+/g,' ').trim();
 const id=crypto.randomUUID?.()??String(Date.now());
 const data=stored(relationStorageKey,{links:[],notes:{},reminders:{}});
 data.reminders??={};data.notes??={};
 (data.reminders[state.profile.id]??=[]).push({id,when,message,kind:'almanac',date,event:eventLabel,score,tier,gz});
 const line=`【择日日程】${date} ${hourBranch}时（${at}）${eventLabel} · ${tier||'—'} ${score??'—'} 分 · ${gz||'—'}日`;
 const note=String(data.notes[state.profile.id]||'');
 if(!note.includes(line))data.notes[state.profile.id]=[note,line].filter(Boolean).join('\n');
 save(relationStorageKey,data);
 const native=window.webkit?.messageHandlers?.caseReminder;
 if(native)native.postMessage({id,seconds:(Date.parse(when)-Date.now())/1000,message});
 tell(native?'已存入日程，并设好当天提醒':'已存入日程与案例札记');
 return true;
}
// 择日日程读回（v0.61.0）：月历与日卡片都要知道「这天有没有已经定下来的事」，只读不写。
function almanacPlans(date){
 if(!state.profile)return [];
 const data=stored(relationStorageKey,{links:[],notes:{},reminders:{}});
 const list=data.reminders?.[state.profile.id]||[];
 return list.filter(r=>r&&r.kind==='almanac'&&(!date||r.date===date))
  .sort((a,b)=>String(a.when).localeCompare(String(b.when)));
}
const PAGE_TITLES={cases:'案例库',chart:'排盘',period:'时点专项',insights:'洞见',me:'我的'};const SYSTEM_NAMES={bazi:'八字',ziwei:'紫微',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘',calendar:'历法'};
function profileTitle(){
 const p=state.profile,info=state.reading?.bazi.info;
 const pageTitle=$('#pageTitle');if(pageTitle)pageTitle.textContent=PAGE_TITLES[state.tab]||'排盘';
 const mark=$('#avatarMark');
 if(mark){const nm=state.profile?.name?[...state.profile.name][0]:'星';if(mark.textContent!==nm)mark.textContent=nm;}
 const screenEl=$('#screen');if(screenEl)screenEl.dataset.screenTab=state.tab;
 const late=(info?.effectiveHour??Number(p?.fields?.h??p?.fields?.timeStr?.split(':')[0]))===23;
 const dst=info?.timeCorrection?.dstApplied?' · [夏令时-1h]':'';
 const badge=late?' · 晚子时'+((info?.lateZishi||p.fields.lateZishi)==='current-day'?'归当日':'归次日'):'';
 const instant=state.tab==='chart'&&state.system==='west'&&state.chartState.west?.instant;
 const ICON_CLOCK='<svg viewBox="0 0 16 16" aria-hidden="true" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="5.6"/><path d="M8 4.9V8l2.2 1.4"/></svg>';
const ICON_PENCIL='<svg viewBox="0 0 16 16" aria-hidden="true" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 2.9l2.5 2.5-7.3 7.3-3.2.7.7-3.2z"/><path d="M9.2 4.3l2.5 2.5"/></svg>';
const label=state.instantSnapshot?ICON_CLOCK+' 即刻天象':p?p.name+badge+dst:instant?ICON_CLOCK+' 即刻':'开始排盘';
 const nameEl=$('[data-profile-name]');
 if(nameEl){if(label.includes('<svg'))nameEl.innerHTML=label;else nameEl.textContent=label;}
 const dstChip=$('[data-profile-dst]');dstChip.textContent=dst?'夏令时-1h':'';dstChip.hidden=!dst;
 dstChip.title=info?.timeCorrection?.warning||'中国历史夏令时校正';
 const rule=$('[data-profile-rule]'),school=ZIWEI_SCHOOLS[state.settings.ziweiSchool||'quanshu'];
 $('#activeProfile').dataset.showRule=String(Boolean(p&&state.tab==='chart'&&state.system==='ziwei'));
 rule.textContent=school.label;rule.title=school.description;rule.hidden=!p||state.tab!=='chart'||state.system!=='ziwei';
 const editBtn=$('[data-profile-edit]');if(editBtn){editBtn.innerHTML=p?ICON_PENCIL:'＋';editBtn.dataset.hasIcon=p?'1':'0';}
 $('#activeProfile').setAttribute('aria-label',p?(p.name+'，编辑出生资料'):'选择出生资料');

}
function resonanceCard(){
 const result=state.resonance;
 if(!result)return '<article class="card liquid-glass" data-resonance><h2>三盘共振证据链</h2><p role="status">正在本机交叉核对岁运、四化与行运…</p></article>';
 if(result.error)return `<article class="card" data-resonance><h2>三盘共振证据链</h2><p>${esc(result.error)}</p></article>`;
 return `<article class="card liquid-glass" data-resonance><h2>三盘共振证据链</h2><p class="thin">核对时刻 ${esc(localDisplayTime(result.at))}</p>
 <p>${result.consensus.length?'检出 '+result.consensus.length+' 组同主题、同向的三体系线索。':'当前没有三体系同主题同向共振，不强行拼接结论。'}</p>
 ${result.chains.slice(0,6).map((c,i)=>`<details class="res-ev"${i===0?' open':''}><summary><b>${esc(c.topic)}</b><span class="res-dir">${esc(c.direction)}</span><span class="res-dots" aria-label="${c.coverage}/3 体系" role="img">${[0,1,2].map(k=>`<i class="${k<c.coverage?'on':''}"></i>`).join('')}<em>${c.coverage}/3</em></span></summary><div class="res-body">${c.items.slice(0,6).map(e=>`<p><small>${esc(e.system)}</small>${esc(e.text)}</p>`).join('')}</div></details>`).join('')}<small>${esc(result.method)}</small></article>`;
}
function renderDynamicInsightBySystem(){
 const system=state.system;
 const b=system==='bazi'?state.chartState.bazi?.data?.guidance:null;
 const z=system==='ziwei'?state.chartState.ziwei?.flow:null;
 const w=system==='west'&&state.chartState.west?.mode!=='natal'?state.chartState.west:null;
 const v=system==='vedic'?state.chartState.vedic:null;
 if(state.instantSnapshot&&!b&&!z&&!w?.result&&!v?.activePeriod){
  const data=state.reading;
  const pillars=data.bazi.pillars.map(p=>p.stem+p.branch).join(' ');
  const life=data.ziwei.palaces.find(p=>p.name==='命宫');
  const planet=data.western.planets.find(p=>p.key==='sun');
  return `<article class="card liquid-glass period-guidance"><h2>即刻天象 · 当下推演</h2><p>${esc(formatLocalDisplayTime(state.profile.fields))}</p><p>八字四柱 ${esc(pillars)} · 日主 ${esc(data.bazi.strength.kind)}。</p><p>紫微命宫 ${esc(life.earthlyBranch)} · 西洋太阳 ${esc(planet.sign)} · 印度上升 ${esc(data.vedic.lagna)}。</p></article>`;
 }
 if(!b&&!z&&!w?.result&&!v?.activePeriod)return '<article class="card liquid-glass"><h2>当前时空点</h2><p>当前为本命视角。选择时间滑轨后，这里展示对应的阶段线索。</p></article>';
 const parts=[];
 if(b){const report=buildBaziKnowledgeReport(state.chartState.bazi.data);parts.push(`<article class="card liquid-glass knowledge-report" data-knowledge-report data-report-characters="${report.characters}"><h3>${esc(report.title)}</h3><p class="thin">离线岁运知识库 · ${report.characters} 字</p>${report.sections.map(section=>`<section><h4>${esc(section.title)}</h4>${section.lines.map(line=>`<p>${esc(line)}</p>`).join('')}</section>`).join('')}<small>传统术数观察，不构成事实预测、投资建议或医疗意见。</small></article>`);}
 if(z){
  const chart=state.chartState.ziwei.chart;
  const report=buildZiweiKnowledgeReport(chart,z);
  parts.push(`<article class="card liquid-glass knowledge-report" data-knowledge-report data-report-characters="${report.characters}"><h3>${esc(report.title)}</h3><p class="thin">流年命宫、四化落宫与格局证据 · ${report.characters} 字</p>${report.sections.map(section=>`<section><h4>${esc(section.title)}</h4>${section.lines.map(line=>`<p>${esc(line)}</p>`).join('')}</section>`).join('')}<small>传统术数观察，不构成事实预测、投资建议或医疗意见。</small></article>`);
  const palace=chart?.palaces.find(p=>z.palaceNames[p.branch]==='命宫');
  const named=name=>chart?.palaces.find(p=>z.palaceNames[p.branch]===name)?.name||'待定位';
  const evidence=ziweiPeriodEvidence(chart,z);
  const lifeStars=palace?.majorStars?.length?palace.majorStars:palace?.borrowedStars||[];
  const four=(z.mutagens||[]).map(m=>{const target=chart?.palaces.find(p=>p.branch===m.branch);const opposite=chart?.palaces.find(p=>p.branch===(m.branch+6)%12);return m.star+'化'+m.type+'落'+(target?.name||'待定位')+'宫，对宫'+(opposite?.name||'待定位')+'。'+(globalThis.ZIWEI_FLOW_RULES?.transformations?.[m.type]||'按实际落宫复核四化作用。');});
  const starText=lifeStars.map(s=>s.name+(s.brightness?'（'+s.brightness+'）':'')).join('、')||'流命主星待定位';
  const palaceText=globalThis.ZIWEI_FLOW_RULES?.palaces||{};
  const long=[
   '第一层｜流命与三方四正定性：本次选择'+z.label+' '+z.ganZhi+'（'+z.date+'），流命落本命'+(palace?.name||'待定位')+'宫，流官对应'+named('官禄')+'，流财对应'+named('财帛')+'。流命主星为'+starText+'。'+(palace?.majorStars?.length?'以本宫坐守星曜为主，结合三方四正事业、财帛和迁移结构综合判断。':'本宫无主星时借对宫主星作为结构补充，再回看三方四正，不将空宫解释为缺乏能力。')+'当前先辨认资源来自本宫还是对宫会照，再判断行动主轴；宫位主题是现实核对范围，不是事件必然发生。',
   '第二层｜流年四化入宫与对冲：四化依当前流年天干和所选派别计算，逐项列出星曜、落宫和对宫。'+(four.join(' ')||'本次没有可定位的四化落宫数据，不补造星曜。')+'化禄看资源入口和兑现链，化权看责任、授权与执行压力，化科看文书、资质和第三方缓冲，化忌看反复、延误、占用与边界问题。冲击力须同时检查本宫、对宫、三方四正及禄科权会照；单见化忌不等于灾祸，单见化禄也不等于现金到账。',
   '第三层｜星曜格局与古法辨证：本层依星曜实际落宫辨双禄交驰、禄逢冲破、羊陀夹忌。'+(evidence.join(' ')||'本年未见格局成立的充分凭据，不强立格名。')+'双禄须见禄存与化禄同宫或三方拱照；禄逢冲破须见化忌直冲禄位；羊陀夹忌须擎羊、陀罗分居忌宫两侧。格局既成，仍须兼看庙旺、辅曜、三方四正与本命根基。',
   '第四层｜人生四事与趋避：事业看官禄、命宫及迁移三方，吉曜扶持则勤修学业、施展才华，煞忌交侵则沉心蓄力、慎择进退；财帛看财帛、田宅与福德，得禄宜惜福守成，逢忌宜节用远险；婚恋看夫妻宫与命福互动，以诚相待、互敬互谅，不凭单一四化断分合；疾厄宫只作传统身心象意参考，不作疾病诊断。'
  ];
  const palaceDetails=Object.entries(palaceText).map(([name,meaning])=>name+'：'+meaning);
  parts.push(`<h3>紫微 · ${esc(z.label+' '+z.ganZhi+' · '+z.date)}</h3><p>流命落 ${esc(palace?.name||'待定位')}，流官对应 ${esc(named('官禄'))}，流财对应 ${esc(named('财帛'))}。</p>${long.map((line,i)=>'<section><h4>'+['第一层｜流命与三方四正','第二层｜流年四化入宫与对冲','第三层｜实战格局核验','第四层｜现实维度建议'][i]+'</h4><p>'+esc(line)+'</p></section>').join('')}${palaceDetails.map(line=>'<p>'+esc(line)+'</p>').join('')}`);
 }
 if(w?.result){
  const result=w.result;
  const cross=result.cross||result.natalCross;
  const outerKeys=new Set(['jupiter','saturn','uranus','neptune','pluto']);
  const relations=(cross||result.chart?.aspects||[])
   .filter(a=>[0,90,180].includes(a.angle)&&outerKeys.has(a.aKey))
   .sort((a,b)=>a.orb-b.orb).slice(0,5);
  const title={sky:'天象',transit:'行运',secondary:'次限',tertiary:'三限',solar:'日返',lunar:'月返',firdaria:'法达',profection:'小限',natal:'本命'}[w.mode]||w.mode;
  parts.push(`<h3>西洋 · ${esc(w.at.getFullYear()+'年'+(w.at.getMonth()+1)+'月')} ${esc(title)}推演</h3><p>所选时刻 ${esc(localDisplayTime(w.at))} 本地；${cross?'推运星体对照本命星位':'当前盘面'}。</p>${relations.map(a=>`<p><b>${esc(a.a+' '+a.type+' '+(cross?'本命':'')+a.b)}</b> · Orb ${a.orb.toFixed(2)}°，${a.applying===true?'入相':a.applying===false?'出相':'阶段未定'}；${[90,180].includes(a.angle)?'优先核对现实压力与边界，暂缓过量承诺。':'可观察合作、表达或行动窗口，仍须结合具体落宫。'}</p>`).join('')||'<p>当前容许度内未检出关键相位，不额外编造事件。</p>'}`);
 }
 if(v?.activePeriod){
  const p=v.activePeriod,chart=v.data||state.reading.vedic,lord=chart?.planets?.find(x=>x.name===p.lord);
  const houseThemes={1:'身体状态、自我定位与发起方式',2:'积蓄、饮食、家族资源与表达',3:'沟通、技能训练、手足与短途行动',4:'居所、内在安全、母系与基础教育',5:'创作、学习、子女与判断力',6:'日常工作、服务、债务管理与竞争',7:'合作、伴侣、契约与公开关系',8:'共同资源、研究、转化与风险管理',9:'高等学习、信念、导师与远行',10:'职业责任、公众角色与可见成果',11:'收益、人脉、长期愿望与社群',12:'休息、隐退、远方支出与内在整理'};
  const house=p.house||lord?.house||0,theme=houseThemes[house]||'宫位主题待核';
  const selectedVarga=state.chartState.vedic?.n||p.varga||1;
  const vargaTitle=({1:'Rashi 本命',9:'Navamsha 关系',10:'Dashamsha 事业'})[selectedVarga]||'专项分盘';
  const dashaPath=(p.lords||[]).join(' → ')||p.lord;
  const planetContext=lord?`${lord.name}本命在${lord.sign}第${lord.house}宫，落${lord.nakshatra||'宿位待核'}宿，${lord.retro?'逆行，宜复核延迟与返工主题。':'以顺行节奏观察其主题推进。'}`:'当前缓存未含大运主星完整本命位置，故不补造星曜状态。';
  parts.push(`<article class="card liquid-glass period-domain-report" data-vedic-period-report><h3>印度占星 · 当前专属时空报告</h3><p><b>所选时点</b> ${esc(p.date)} · D${selectedVarga} ${esc(vargaTitle)}</p><p><b>四级 Dasha</b> ${esc(dashaPath)}；本层微运主星 ${esc(p.lord)}。</p><p><b>主星落点</b> ${esc(planetContext)}</p><p><b>主运主题</b> 主星落第 ${house||'—'} 宫，主要核对${esc(theme)}。这是阶段重点，不表示事件必然发生。</p><p><b>传统照宫</b> 第 ${esc(p.aspects.join('、')||'—')} 宫；结合这些宫的本命行星、宫主与现实事项核查，不把照宫直接等同吉凶。</p><p><b>盘面联读</b> D1 确认本命根基；D${selectedVarga} 用于${esc(vargaTitle)}主题；副运切换时比较主星与副星是否同指一宫、是否重复触发同一星宿或宫主。只在可验证的宫位关系重合时增强判断，否则保留为分歧线索。</p><p><b>建议的现实核对</b> 在${esc(theme)}相关决策上记录期限、资源来源和可撤回选项；若本层主星与副运主星并不共同指向该领域，就不将其他体系的断语挪来补足。</p></article>`);
 }
 return `<article class="card liquid-glass period-guidance" aria-live="polite"><h2>当前时空点 · 专属推演</h2>${parts.join('')}<small>根据所选时间滑轨的本地盘面重算结果生成；传统术数仅作观察参考。</small></article>`;
}
const selectedPeriodCard = renderDynamicInsightBySystem;
function onSelectTimeNode(system){
 state.activeTimeSystem=system;
 // 共振卡片是异步次要内容：延后到下一帧刷新，让盘面先完成渲染。
 // forceRefreshAllInsights 内部本就先置 loading 态再发请求，延后一帧不影响数据口径。
 requestAnimationFrame(()=>forceRefreshAllInsights());
 if(state.tab==='chart'&&['west','vedic'].includes(system)){
  // 排盘页的共振宿主在体系容器内（西洋/印占均如此），直接从 root 找，避免作用域过窄漏掉。
  const host=root.querySelector('[data-period-resonance]');
  if(host)host.innerHTML=resonanceCard();
 }
}
function selectedTimeISO(){
 if(state.system==='ziwei'&&state.activeTimeSystem==='ziwei'){
  const value=state.chartState.ziwei?.flow?.date;
  if(value&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value+'T12:00:00Z';
 }
 if(state.system==='bazi'&&state.activeTimeSystem==='bazi'){
  const s=state.chartState.bazi;
  if(s?.pick?.day!=null){const value=s.data.days?.[s.pick.day]?.date;if(value)return value+'T12:00:00Z';}
  if(s?.pick?.month!=null){const value=s.data.months?.[s.pick.month]?.date;if(value&&!Number.isNaN(Date.parse(value)))return value;}
  if(s?.pick?.year!=null)return s.pick.year+'-07-01T12:00:00Z';
  if(s?.pick?.luck!=null){const year=s.data.cycles?.[s.pick.luck]?.startYear;if(year)return year+'-07-01T12:00:00Z';}
 }
 if(state.instantSnapshot&&state.activeTimeSystem===null)return state.instantAt;
 if(state.system==='west'&&state.chartState.west?.mode!=='natal'&&state.chartState.west?.at)return state.chartState.west.at.toISOString();
 if(state.system==='vedic'&&state.chartState.vedic?.activePeriod?.at)return state.chartState.vedic.activePeriod.at;
 return new Date().toISOString();
}
let insightGeneration=0;
function paintResonance(){
 // 洞见页宿主 + 排盘页各体系的反馈区都刷新，避免只刷一处导致另一处卡在 loading。
 for(const host of document.querySelectorAll('#screen [data-resonance-host], #screen [data-period-resonance]'))host.innerHTML=resonanceCard();
}
function forceRefreshAllInsights(){
 const revision=++insightGeneration;
 if(!state.reading||!state.profile)return;
 const hosts=[...document.querySelectorAll('#screen [data-resonance-host], #screen [data-period-resonance]')];
 if(!hosts.length)return;
 state.resonance=null;
 paintResonance();
 const at=selectedTimeISO(),config=stored('xy_astro_config',{});
 request('/api/console/resonance',{birth:normalized(state.profile),at,config}).then(result=>{
  if(revision!==insightGeneration)return;
  state.resonance=result;paintResonance();
 }).catch(error=>{
  if(revision!==insightGeneration)return;
  state.resonance={error:error.message};paintResonance();
 });
}
// 生成成篇深度报告：复活四层知识库，做成可生成/可导出/可复制的产品功能。
// 可传入预生成的 report（时点专项报告工作台用），否则按当前本命盘生成。
// 速选条横向滚动位置：进来时选中的年份常常在末位（如 2026 在 2017–2026 的最后一格），
// 不滚过去就只能看到开头几年，误以为「没有今年」。用 rect 差值居中，不依赖 offsetParent。
function centerBfRails(host){
 if(!host)return;
 for(const rail of host.querySelectorAll('.bf-year-rail,.bf-month-rail')){
  const on=rail.querySelector('.on');
  if(!on)continue;
  const rb=rail.getBoundingClientRect(),ob=on.getBoundingClientRect();
  if(!rb.width)continue;
  rail.scrollLeft+=Math.round((ob.left-rb.left)-(rb.width-ob.width)/2);
 }
}
function openFullReport(prebuilt,opts={}){
 const synReady=state.system==='synastry'&&state.chartState.synastry?.result;
 if(!prebuilt&&!state.reading&&!synReady){tell('请先排盘，再生成报告。');return;}
 const names={bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘'};
 const d=document.getElementById('reportSheet');
 const report=prebuilt||composeFullReport(state,names);
 // 关注领域：直接取正文分区，不维护第二份分组表——章节改了什么，筛选条就跟着改。
 const scopeGroups=[...new Set((report.sections||[]).map(s=>sectionGroup(s.title)))];
 // 报告滚动节流的缓存：章节节点 / 目录按钮只查一次，时点重排后置空重取
 let rptSecs=null,rptTocBtns=null,rptRaf=0;
 // 报告历史：元数据 + 整份纯数据快照，供「我」页点开原样复盘（v0.48.0）。
 // opts.replay=从历史打开旧报告：原样重绘，但不再写一条新历史（否则每看一次多一条）。
 if(!opts.replay){try{recordHistory({caseId:state.profile?.id,name:state.profile?.name,system:report.cover?.system,
  title:report.title,sections:report.sections?.length,characters:report.characters,snapshot:report});}catch{}}
 d.innerHTML=`<div class="dialog-content report-content">
  <div class="rpt-topbar"><button type="button" class="icon" data-rpt-close aria-label="关闭报告">×</button>
   <span class="rpt-topbar-title">深度报告 · ${esc(report.cover.system)}</span>
   <button type="button" class="rpt-act" data-rpt-find>检索</button>
   <button type="button" class="rpt-act" data-rpt-copy>复制</button>
   <button type="button" class="rpt-act primary" data-rpt-export>导出文档</button>
   <button type="button" class="rpt-act" data-rpt-pdf hidden>导出 PDF</button></div>
  <div class="rpt-find" data-rpt-findbar hidden>
   <div class="rpt-find-row">
    <input type="text" inputmode="search" enterkeyhint="search" data-find-input placeholder="在全文里找术语、宫位、年份" autocomplete="off" aria-label="在报告中检索">
    <span class="rpt-find-count" data-find-count aria-live="polite">0</span>
    <button type="button" class="icon" data-find-prev aria-label="上一处">↑</button>
    <button type="button" class="icon" data-find-next aria-label="下一处">↓</button>
    <button type="button" class="icon" data-find-close aria-label="关闭检索">×</button>
   </div>
   <div class="rpt-find-list" data-find-list></div>
  </div>
  <div class="rpt-scoperail" data-scope-rail hidden></div>
  <div class="rpt-rail" data-rpt-rail aria-hidden="true">
   <span class="rpt-rail-no" data-rpt-rail-no></span>
   <span class="rpt-rail-title" data-rpt-rail-title>${esc(report.title||'')}</span>
   <i class="rpt-rail-track"><b data-rpt-rail-fill></b></i>
  </div>
  <div class="sheet-body rpt-body" id="reportBody">${reportHtml(report,{lazy:true})}<div class="scroll-clearance" aria-hidden="true"></div></div>
  <button type="button" class="rpt-nav-fab" data-rpt-nav aria-expanded="false" aria-controls="reportNavDrawer" aria-label="打开章节目录"><span class="rpt-nav-fab-ico" aria-hidden="true">☰</span><span data-rpt-fab-label>目录</span><span class="rpt-nav-pct" data-rpt-progress>0%</span></button>
  <div class="rpt-nav-scrim" data-rpt-nav-close aria-hidden="true"></div>
  <aside class="rpt-nav-drawer" id="reportNavDrawer" data-rpt-drawer role="dialog" aria-label="章节目录" aria-hidden="true">
   <div class="rpt-nav-grip" data-rpt-nav-close aria-hidden="true"></div>
   <div class="rpt-nav-head"><div><b>章节目录</b><small>${esc(report.cover.system)} · ${report.sections?.length||0} 章 · 点选跳转</small></div><button type="button" class="icon" data-rpt-nav-close aria-label="收起目录">×</button></div>
   <div class="rpt-nav-progress"><span>阅读进度</span><b data-rpt-progress>0%</b></div>
   ${scopeGroups.length>1?`<div class="rpt-scope" role="group" aria-label="关注领域"><button type="button" data-rpt-scope="全部" aria-pressed="true">全部</button>${scopeGroups.map(g=>`<button type="button" data-rpt-scope="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join('')}</div>`:''}
   <div class="rpt-nav-list" data-rpt-nav-list></div>
   <p class="rpt-nav-tip">点选章节直接跳转 · 下滑把手或点空白处收起</p>
  </aside>
 </div>`;
 // 底部玻璃面板的章节直接复用内联目录的分区结构，保证两处高亮/分组同源，不维护第二份章节表。
 const tocList=d.querySelector('[data-full-report] .rpt-toc-list');
 const navList=d.querySelector('[data-rpt-nav-list]');
 if(tocList&&navList)navList.appendChild(tocList.cloneNode(true));
 // v0.50.0 时点级联：改大运收窄流年、改流年重排流月，任何一处变更都回后端按新选择重算，
 // 再同步刷新盘面 / 落点文案 / 正文 / 目录 / 字数——四者共用同一份 data，不会再出现
 // 「选了第8步、右边流年还停在 2026」或「盘变了但正文一字未动」的割裂。
 const applyBaziPick=async(box,patch)=>{
  const uid=box?.dataset.baziFlow,P=globalThis.__FL_BAZI_FLOW__?.[uid];
  if(!P||box.classList.contains('is-busy'))return;
  const sel={...P.sel};
  if(patch.luck!=null){sel.luck=Number(patch.luck);delete sel.year;delete sel.month;}
  if(patch.year!=null){sel.year=Number(patch.year);delete sel.month;}
  if(patch.month!=null)sel.month=Number(patch.month);
  const selection={};
  if(Number.isInteger(sel.luck))selection.luck=sel.luck;
  if(sel.year!=null)selection.year=Number(sel.year);
  if(Number.isInteger(sel.month))selection.month=sel.month;
  box.classList.add('is-busy');
  try{
   const data=await ctx.request('/api/console/bazi',{birth:ctx.birth,selection,combine:false});
   const next=baziSelOf(data);
   P.data=data;P.sel=next;
   const moment=baziMoment(data,next);
   const {cOpts,yOpts,mOpts,monthRail,yearRail}=baziPickOptions(data,next);
   const setSel=(k,html)=>{const el=box.querySelector('[data-bf="'+k+'"]');if(el)el.innerHTML=html;};
   setSel('luck',cOpts);setSel('year',yOpts);setSel('month',mOpts);
   const rail=box.querySelector('.bf-month-rail');if(rail)rail.innerHTML=monthRail;
   const yrail=box.querySelector('.bf-year-rail');if(yrail)yrail.innerHTML=yearRail;
   centerBfRails(box);
   const mEl=box.querySelector('[data-bf-moment]');if(mEl)mEl.textContent=moment.title||'本命原局';
   const sEl=box.querySelector('[data-bf-moment-sub]');if(sEl)sEl.textContent=moment.sub;
   const spEl=box.querySelector('.bf-clock-span');
   if(spEl){spEl.textContent=moment.span||'';spEl.hidden=!moment.span;}
   const natal=(data.pillars||[]).filter(Boolean);
   const yi=(data.years||[]).findIndex(y=>String(y.year)===String(next.year));
   const flow=[data.cycles?.[next.luck],yi<0?null:data.years[yi],data.months?.[next.month]].filter(p=>p&&p.stem&&p.branch);
   const pillars=[...natal,...flow];
   const host=box.querySelector('[data-bf-grid]');
   if(host)host.innerHTML=`<div class="bazi-grid rpt-bazi-grid" style="--bg-cols:${pillars.length}">${baziGrid({...data,pillars})}</div>`;
   const cap=box.querySelector('[data-bf-caption]');
   if(cap)cap.textContent=`当前时点：${moment.title}（${moment.sub}）。盘面与下方逐条推导都已按这一刻重算。`;
   // 正文与目录同时重排：时点报告的章节本身就是随落点变的，只换盘不换字等于没切换。
   const spot=moment.brief||[moment.title,moment.sub].filter(Boolean).join(' · ');
   const secs=focusSectionsFor('bazi',P.scope||'luck',spot,data);
   const bodyEl=d.querySelector('[data-report-body]');
   if(bodyEl)bodyEl.innerHTML=focusBodyHtml(secs);
   report.sections=secs;
   report.title=`八字 · ${spot}`;
   report.characters=secs.reduce((n,s)=>n+(s.title?.length||0)+(s.lines||[]).join('').length,0);
   // 导语里也写死了旧落点名，不跟着换就会「标题 2067、导语仍说本命原局」。
   report.lead=`【时点专属详批】只围绕「${esc(spot)}」展开：盘面快照 + 该时点逐条推导，正文随所选时点变化，不重复本命全文。日主 ${esc(data.dayMaster?.stem||'—')}${esc(data.dayMaster?.element||'')} · ${esc(data.strength?.kind||'')}。`;
   const leadEl=d.querySelector('.rpt-lead');if(leadEl)leadEl.innerHTML=report.lead;
   const titleEl=d.querySelector('#reportTitle');if(titleEl)titleEl.textContent=report.title;
   const chartTitle=d.querySelector('.rpt-chart-title');if(chartTitle)chartTitle.textContent=`八字${pillars.length}列详盘 · ${spot}`;
   const wordEl=d.querySelector('.rpt-meta');if(wordEl)wordEl.textContent=`全文 ${report.characters} 字`;
   const items=tocItems(secs);
   const tocEl=d.querySelector('.rpt-toc-list');if(tocEl)tocEl.innerHTML=items;
   const navEl=d.querySelector('[data-rpt-nav-list]');if(navEl)navEl.innerHTML=items;
   rptSecs=null;rptTocBtns=null;
   // 速览讲的是终身结构，换了时点就与正文不同源，宁可收起也不能张冠李戴。
   const briefEl=d.querySelector('.rpt-brief');if(briefEl)briefEl.hidden=true;
   if(scope!=='全部')applyScope('全部'); // 正文已整体重排，旧的领域筛选与章号对不上
   if(bodyEl)bodyEl.scrollTop=0;
   const body2=d.querySelector('#reportBody');if(body2)body2.scrollTo?.({top:0,behavior:'smooth'});
  }catch(err){tell('该时点重算失败：'+(err.message||err));}
  finally{box.classList.remove('is-busy');}
 };
 d.onchange=e=>{
  const s=e.target.closest?.('[data-bf]');if(!s)return;
  applyBaziPick(s.closest('[data-bazi-flow]'),{[s.dataset.bf]:s.value});
 };
 // 回到当下 / 逐运浏览 / 流月速选：都是「换一个时点」，统一走同一条重算路径。
 d.addEventListener('click',e=>{
  const box=e.target.closest?.('[data-bazi-flow]');if(!box)return;
  const P=globalThis.__FL_BAZI_FLOW__?.[box.dataset.baziFlow];if(!P)return;
  if(e.target.closest('[data-bf-now]')){
   const nowY=new Date().getFullYear();
   const i=(P.data?.cycles||[]).findIndex(c=>(c.startYear??9999)<=nowY&&nowY<(c.endYear??c.startYear+10));
   applyBaziPick(box,{luck:i<0?0:i});return;
  }
  const step=e.target.closest('[data-bf-step]');
  if(step){
   const n=(P.data?.cycles||[]).length;if(!n)return;
   const to=Math.min(n-1,Math.max(0,(P.sel.luck??0)+Number(step.dataset.bfStep)));
   if(to!==P.sel.luck)applyBaziPick(box,{luck:to});
   return;
  }
  const m=e.target.closest('[data-bf-month]');
  if(m){applyBaziPick(box,{month:Number(m.dataset.bfMonth)});return;}
  const y=e.target.closest('[data-bf-year]');
  if(y)applyBaziPick(box,{year:Number(y.dataset.bfYear)});
 });
 // 章节收藏：点标题旁 ☆ 存本章纯文本；再点取消。
 for(const fb of d.querySelectorAll('[data-fav-sec]')){
  const sec=fb.closest('.rpt-sec'),idx=fb.dataset.favSec;
  const key=[state.profile?.id||'anon',report.kind||report.cover?.system||'rpt',idx].join('|');
  const paint=()=>{fb.textContent=isFavorite(key)?'★':'☆';fb.classList.toggle('on',isFavorite(key));};
  paint();
  fb.onclick=()=>{
   flushLazy(); // 未就位的章节 innerText 为空，收藏会存成空壳
   const title=sec?.querySelector('h3')?.textContent.replace('☆','').replace('★','').trim()||`第 ${idx} 章`;
   const text=sec?.innerText||'';
   const r=toggleFavorite({key,title,text,owner:state.profile?.name||'',system:report.cover?.system||''});
   paint();tell(r.added?'已收藏本章':'已取消收藏');
  };
 }
 d.querySelector('[data-rpt-close]').onclick=()=>close(d);
 d.querySelector('[data-rpt-copy]').onclick=async()=>{
  flushLazy(); // 隐藏章节取不到 innerText，先全部就位
  const doc=d.querySelector('[data-full-report]');
  const text=[doc.querySelector('h2')?.innerText,doc.querySelector('.rpt-owner')?.innerText,
   ...[...doc.querySelectorAll('.rpt-sec')].filter(s=>!s.hidden).map(s=>s.innerText)].filter(Boolean).join('\n\n');
  try{await navigator.clipboard.writeText(text);tell('报告文本已复制。');}
  catch{e=>tell('复制失败，请使用导出文档。');}
 };
  d.querySelector('[data-rpt-export]').onclick=async e=>{
  const b=e.currentTarget;b.disabled=true;
  try{tell(await exportReportDocument(viewReport()));}
  catch(err){tell('导出失败：'+(err.message||err));}
  finally{b.disabled=false;}
 };
 /* v0.64.0 PDF 直出按钮：仅原生壳存在 exportPdf 通道时显示（exportReportPdf 无通道返回 null）。 */
 const pdfBtn=d.querySelector('[data-rpt-pdf]');
 if(pdfBtn){
  if(!window.webkit?.messageHandlers?.exportPdf)pdfBtn.hidden=true;
  else pdfBtn.onclick=async e=>{
   const b=e.currentTarget;b.disabled=true;
   try{tell(await exportReportPdf(viewReport())??'当前环境不支持 PDF 导出。');}
   catch(err){tell('PDF 导出失败：'+(err.message||err));}
   finally{b.disabled=false;}
  };
 }
 /* 目录交互：顶部目录 + 侧边抽屉共用一套锚点跳转，滚动时两处同步高亮 */
 const rptBody=d.querySelector('#reportBody');
 const rptDoc=d.querySelector('[data-full-report]');
const rptContent=d.querySelector('.report-content');
const rptNav=d.querySelector('[data-rpt-nav]');
/* v0.54.0 分帧渲染：reportHtml(report,{lazy:true}) 只直出前三章，其余挂在
   [data-rpt-lazy] 这个 display:none 容器里，这里每帧搬两章出来。
   一次 innerHTML 全量注入后首帧布局实测 132ms（390×844 WebKit），
   拆开后首屏只排三章，用户点「深度报告」不再先白一下。
   flushLazy() 供目录跳转/复制/收藏使用——隐藏容器里的 offsetTop 恒为 0，
   innerText 也拿不到，必须先全部就位。 */
const flushLazy=()=>{
 const host=rptDoc?.querySelector('[data-rpt-lazy]');
 if(!host)return false;
 const parent=host.parentElement;
 while(host.firstElementChild)parent.insertBefore(host.firstElementChild,host);
 host.remove();rptSecs=null;rptTocBtns=null;
 return true;
};
const pumpLazy=()=>{
 if(!rptDoc?.isConnected)return; // 报告已关闭，别继续搬
 const host=rptDoc.querySelector('[data-rpt-lazy]');
 if(!host)return;
 const parent=host.parentElement;
 for(let i=0;i<3&&host.firstElementChild;i++)parent.insertBefore(host.firstElementChild,host);
 if(host.firstElementChild)requestAnimationFrame(pumpLazy);
 else{host.remove();rptSecs=null;rptTocBtns=null;}
};
if(rptDoc?.querySelector('[data-rpt-lazy]'))requestAnimationFrame(pumpLazy);

/* ===== 报告全文检索（v0.62.0）=====
   三万字报告靠目录只能「跳章」，找「化忌」「申宫」「2029」只能一路滚。
   这里直接对正文文本节点做检索并把命中包成 <mark>：不做索引、不预建全文副本，
   所以搜到的字就是正文里的字，位置不会和排版脱节。
   上限 200 处：再多的命中列表也不再是一条条可用的线索，反而卡住输入。 */
const findBar=d.querySelector('[data-rpt-findbar]');
const findInput=d.querySelector('[data-find-input]');
const findCount=d.querySelector('[data-find-count]');
const findList=d.querySelector('[data-find-list]');
let finds=[],findAt=-1,findTimer=0,findQuery='';
const HIT_MAX=200;
const clearHits=()=>{
 const marks=d.querySelectorAll('mark.rpt-hit');
 if(marks.length){
  for(const m of marks)m.replaceWith(document.createTextNode(m.textContent));
  rptDoc.normalize(); // 还原后合并文本节点，否则下一次检索会把同一句切成碎块
 }
 finds=[];findAt=-1;findQuery='';
 if(findCount)findCount.textContent='0';
 if(findList)findList.innerHTML='';
};
const jumpHit=at=>{
 if(!finds.length||!rptBody)return;
 findAt=(at+finds.length)%finds.length;
 finds.forEach((f,i)=>f.mark.classList.toggle('is-cur',i===findAt));
 const m=finds[findAt].mark;
 // 用 rect 差值定位：mark 的 offsetParent 可能是 <p>，offsetTop 只到段落级，滚不到字上。
 const rb=rptBody.getBoundingClientRect(),mr=m.getBoundingClientRect();
 rptBody.scrollTop+=mr.top-rb.top-rptBody.clientHeight*0.32-mr.height;
 if(findCount)findCount.textContent=(findAt+1)+'/'+finds.length;
 for(const row of findList?.querySelectorAll('[data-find-sec]')||[])row.classList.toggle('on',Number(row.dataset.findSec)===finds[findAt].sec);
};
const paintFindList=()=>{
 if(!findList)return;
 if(!finds.length){findList.innerHTML=`<p class="rpt-find-empty">正文里没有「${esc(findQuery)}」。只搜正文各章（不含封面、盘面注与目录），可试术语（化忌、伏吟）、宫位（申宫）、年份（2029）。</p>`;return;}
 const groups=new Map();
 for(const f of finds){
  const g=groups.get(f.sec)||{n:0,first:f};
  g.n++;groups.set(f.sec,g);
 }
 findList.innerHTML=[...groups].map(([sec,g])=>`<button type="button" class="rpt-find-item" data-find-sec="${sec}"><b>${String(sec).padStart(2,'0')}</b><span>${esc(report.sections?.[sec-1]?.title||'')}</span><em>${g.n}</em><small>${esc(g.first.snip)}</small></button>`).join('')
  +`<p class="rpt-find-tip">共 ${finds.length} 处${finds.length>=HIT_MAX?'（已达 200 处上限，换个更具体的词更准）':''} · 点章节跳到该章第一处</p>`;
};
const searchText=q=>{
 clearHits();
 findQuery=q;
 if(!q)return;
 flushLazy();
 const host=rptDoc.querySelector('[data-report-body]')||rptDoc;
 const walker=document.createTreeWalker(host,4);
 const nodes=[];
 let node;
 while((node=walker.nextNode())){
  if(!node.nodeValue||!node.nodeValue.trim())continue;
  const p=node.parentElement;
  if(!p||p.closest('button,script,style,.rpt-toc'))continue;
  const secEl=p.closest('.rpt-sec');
  if(secEl&&secEl.hidden)continue; // 已筛掉的章节不参与检索，否则「有命中却看不到」
  nodes.push(node);
 }
 const ql=q.toLowerCase();
 for(const textNode of nodes){
  if(finds.length>=HIT_MAX)break;
  const v=textNode.nodeValue,low=v.toLowerCase(),sec=Number(textNode.parentElement?.closest('.rpt-sec')?.dataset.sec||0);
  let i=0,frag=null;
  while(i<v.length&&finds.length<HIT_MAX){
   const at=low.indexOf(ql,i);
   if(at<0)break;
   if(!frag)frag=document.createDocumentFragment();
   if(at>i)frag.appendChild(document.createTextNode(v.slice(i,at)));
   const mark=document.createElement('mark');
   mark.className='rpt-hit';mark.textContent=v.slice(at,at+q.length);
   frag.appendChild(mark);
   finds.push({mark,sec,snip:`…${v.slice(Math.max(0,at-14),at).replace(/\s+/g,'')}${v.slice(at,at+q.length)}${v.slice(at+q.length,at+q.length+14).replace(/\s+/g,'')}…`});
   i=at+q.length;
  }
  if(frag){
   const tail=v.slice(i);
   if(tail)frag.appendChild(document.createTextNode(tail));
   textNode.replaceWith(frag);
  }
 }
 paintFindList();
 if(finds.length)jumpHit(0);
 else if(findCount)findCount.textContent='0/0';
};
const openFind=()=>{
 if(!findBar)return;
 findBar.hidden=false;
 findInput?.focus();
 if(findInput?.value.trim())searchText(findInput.value.trim());
};
const closeFind=()=>{
 if(!findBar)return;
 findBar.hidden=true;
 clearHits();
 if(findInput)findInput.value='';
};
d.querySelector('[data-rpt-find]')?.addEventListener('click',openFind);
d.querySelector('[data-find-close]')?.addEventListener('click',closeFind);
d.querySelector('[data-find-prev]')?.addEventListener('click',()=>jumpHit(findAt-1));
d.querySelector('[data-find-next]')?.addEventListener('click',()=>jumpHit(findAt+1));
findInput?.addEventListener('input',()=>{
 clearTimeout(findTimer);
 // 190ms：中文输入法组字期间 value 会连续变，立刻检索等于每敲一个字全量重排一遍正文。
 findTimer=setTimeout(()=>searchText(findInput.value.trim()),190);
});
findInput?.addEventListener('keydown',e=>{
 if(e.key==='Enter'){e.preventDefault();jumpHit(findAt+1);}
 if(e.key==='Escape'){e.preventDefault();closeFind();}
});
findList?.addEventListener('click',e=>{
 const row=e.target.closest('[data-find-sec]');
 if(!row)return;
 const at=finds.findIndex(f=>f.sec===Number(row.dataset.findSec));
 if(at>=0)jumpHit(at);
});

/* ===== 关注领域筛选（v0.62.0）=====
   13 章里用户真正要读的常常只有两三章。筛选只隐藏节点、不重排正文：
   章号沿用原编号，正文里「详见第九章」这类交叉引用不会错位；
   导出与复制走 viewReport()，拿的是筛选后的拷贝，原报告不被改写、也不重算。 */
let scope='全部';
const scopeRail=d.querySelector('[data-scope-rail]');
const groupOf=no=>sectionGroup(report.sections?.[no-1]?.title||'');
const visibleNos=()=>[...rptDoc.querySelectorAll('.rpt-sec')].filter(s=>!s.hidden).map(s=>Number(s.dataset.sec)).filter(n=>n>0).sort((a,b)=>a-b);
const viewReport=()=>{
 const nos=visibleNos();
 if(scope==='全部'||!nos.length||!report.sections?.length)return report;
 return {...report,
  scopeNote:`筛选视图：只看「${scope}」· 保留 ${nos.length}/${report.sections.length} 章（章号沿用原编号）`,
  sections:nos.map(n=>({...report.sections[n-1],__no:n}))};
};
const applyScope=(g,opts={})=>{
 scope=g;
 flushLazy();
 closeFind();
 const secs=[...rptDoc.querySelectorAll('.rpt-sec')];
 for(const sec of secs){
  const no=Number(sec.dataset.sec);
  sec.hidden=g!=='全部'&&groupOf(no)!==g;
 }
 const nos=visibleNos();
 const items=nos.length?tocItems(nos.map(n=>report.sections[n-1]),nos):'';
 const tocEl=d.querySelector('.rpt-toc-list');if(tocEl)tocEl.innerHTML=items;
 const navEl=d.querySelector('[data-rpt-nav-list]');if(navEl)navEl.innerHTML=items;
 for(const b of d.querySelectorAll('[data-rpt-scope]'))b.setAttribute('aria-pressed',String(b.dataset.rptScope===g));
 if(scopeRail){
  scopeRail.hidden=g==='全部';
  scopeRail.innerHTML=g==='全部'?'':`<span>只看「${esc(g)}」· ${nos.length}/${secs.length} 章</span><button type="button" data-scope-reset>看全部</button>`;
 }
 rptSecs=null;rptTocBtns=null;
 if(!opts.keepScroll&&rptBody)rptBody.scrollTo?.({top:0,behavior:'smooth'});
 requestAnimationFrame(()=>rptOnScroll());
};
for(const b of d.querySelectorAll('[data-rpt-scope]'))b.addEventListener('click',()=>applyScope(b.dataset.rptScope));
scopeRail?.addEventListener('click',e=>{if(e.target.closest('[data-scope-reset]'))applyScope('全部');});

/* ===== 速览出口：择日 / 时点 / 复制（v0.62.0）=====
   报告不该是死文档。择日带着本命喜忌、时点带着同一个案例，
   三个出口都只做「转场」，不在报告里另起一套计算。 */
for(const b of d.querySelectorAll('[data-brief-act]')){
 b.addEventListener('click',async()=>{
  const [kind,arg]=String(b.dataset.briefAct||'').split(':');
  if(kind==='copy'){
   const briefEl=d.querySelector('.rpt-brief');
   const text=['【速览】',...(briefEl?[...briefEl.querySelectorAll('.rpt-point-t')].map(x=>'· '+x.textContent):[]),
    ...(briefEl?[...briefEl.querySelectorAll('.rpt-metric')].map(x=>x.textContent):[])].join('\n');
   try{await navigator.clipboard.writeText(text);tell('速览已复制。');}
   catch{tell('复制失败，可直接用系统分享。');}
   return;
  }
  if(kind==='period'){close(d);switchTab('period');return;}
  if(kind==='cal'){
   close(d);
   // 择日页的状态是按页存的，这里种一份带事项的初始状态，跳过去就是本命口径的择日。
   state.chartState.calendar={date:isoLocal(),days:7,event:arg||'general',sort:'score',excludeClash:false,compare:false,picked:[],token:0,result:null,error:''};
   switchTab('chart','calendar');
   tell('已按本命喜忌进入择日，可再切换事项。');
  }
 });
}

 const setNav=on=>{
  rptContent?.classList.toggle('rpt-nav-open',on);
  if(rptNav)rptNav.setAttribute('aria-expanded',String(on));
  const drawer=d.querySelector('[data-rpt-drawer]');
  if(drawer)drawer.setAttribute('aria-hidden',String(!on));
 };
 rptNav?.addEventListener('click',()=>setNav(!rptContent?.classList.contains('rpt-nav-open')));
 // v0.43.0：正文「目录 · 分区导航」入口条不再就地展开列表，改为唤起底部液态玻璃面板。
 const tocSummary=d.querySelector('.rpt-toc > summary');
 tocSummary?.addEventListener('click',e=>{e.preventDefault();setNav(true);});
 d.querySelectorAll('[data-rpt-nav-close]').forEach(b=>b.addEventListener('click',()=>setNav(false)));
 d.addEventListener('click',e=>{
 const t=e.target.closest('[data-toc]');
 if(t&&rptDoc){
  // 目标章可能还在隐藏容器里：那里 offsetTop 恒为 0，先全部就位再量
  flushLazy();
  let sec=rptDoc.querySelector(`[data-sec="${t.dataset.toc}"]`);
   // 速览与目录都可能指向被筛掉的章节：先还原筛选再跳，否则会滚到 0（隐藏节点没有高度）。
   if(sec&&sec.hidden){applyScope('全部',{keepScroll:true});sec=rptDoc.querySelector(`[data-sec="${t.dataset.toc}"]`);}
   if(sec&&rptBody){
    // v0.42.0 防跳动：只滚报告阅读容器自身，不用 scrollIntoView——
    // 后者会连带滚动 dialog / #mainScrollView 等祖先，造成「点目录整页跳一下」。
    const top=sec.offsetTop-rptBody.offsetTop-8;
    rptBody.scrollTo?.({top:Math.max(0,top),behavior:'smooth'});
   }
   setNav(false);
   return;
  }
  // 报告内命盘术语可点击查看解释（报告弹层在 #screen 之外，不共享 root 的术语委托）
  const termEl=e.target.closest('[data-term]');
  if(termEl){e.preventDefault();ctx.explain(termEl.dataset.term,termEl.dataset.explain,termEl.dataset.source);}
 });
const rptProg=d.querySelectorAll('[data-rpt-progress]');
const rptFabLabel=d.querySelector('[data-rpt-fab-label]');
// v0.53.0：正文两万多像素，翻到中段就不知道自己在第几章了。顶部加一条定位条，
// 随滚动更新「章号 + 章名」与一条进度细线；数仍以右下角 FAB 为准，这里不重复数字。
const rptRail=d.querySelector('[data-rpt-rail]');
const rptRailNo=d.querySelector('[data-rpt-rail-no]');
const rptRailTitle=d.querySelector('[data-rpt-rail-title]');
const rptRailFill=d.querySelector('[data-rpt-rail-fill]');
/* 章节节点与目录按钮只查一次。旧实现每次 scroll 事件都 querySelectorAll 两遍
   （20+ 章、40+ 目录项），iOS 上手感是「滚动发涩」；这里缓存 DOM 引用，
   再用 rAF 把一帧内的多次 scroll 合并成一次测量，滚动期间只读不查。 */
const rptOnScroll=()=>{
 if(!rptBody||!rptDoc)return;
 const total=rptDoc.scrollHeight-rptBody.clientHeight;
 const p=total>0?Math.min(100,Math.round((rptBody.scrollTop/total)*100)):0;
 rptProg.forEach(x=>x.textContent=p+'%');
 if(rptRailFill)rptRailFill.style.width=p+'%';
 // 筛选后隐藏章节的 offsetTop 恒为 0，按序数推 active 会把高亮顶到第一章；
 // 这里只量可见章节，并用 data-sec（原始章号）反查标题与目录项。
 const cur=rptSecs||(rptSecs=[...rptDoc.querySelectorAll('.rpt-sec:not([hidden])')]);
 const at=rptBody.scrollTop;
 // scrollTop 为 0 时直接算成「封面」：对话框刚打开还没布局完，各章 offsetTop 都是 0，
 // 循环会把 active 一路顶到最后一章（实测出现「刚打开就显示 11 附、术语小词典」）。
 let active=0;
 if(at>2)for(const sec of cur){if(sec.offsetTop-rptBody.offsetTop<=at+80)active=Number(sec.dataset.sec)||0;}
 if(rptRail){
  // 未进正文时只留标题，进了正文才出现章号——避免封面下就挂一个「00」
  if(rptRailNo)rptRailNo.textContent=active>0?String(active).padStart(2,'0'):'';
  if(rptRailTitle){
   const label=active>0?cleanSecTitle(report.sections?.[active-1]?.title||''):(report.title||'');
   if(rptRailTitle.textContent!==label)rptRailTitle.textContent=label;
  }
  rptRail.classList.toggle('is-live',active>0);
 }
  (rptTocBtns||(rptTocBtns=[...d.querySelectorAll('[data-toc]')])).forEach(b=>{
   const on=Number(b.dataset.toc)===active;
   b.classList.toggle('on',on);
   if(on)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');
   // v0.49.0：浮动钮不再显示当前章节长名（会横向压住正文），固定为「目录」，
   // 当前章节只在抽屉列表里高亮；按钮 title 仍带章节名供长按/辅助读取。
   if(on&&rptFabLabel){
    rptFabLabel.textContent='目录';
    const navBtn=d.querySelector('[data-rpt-nav]');
    if(navBtn)navBtn.title='当前章节：'+(report.sections?.[active-1]?.title||'目录');
   }
  });
  // v0.43.0：目录已改为点击唤起的底部玻璃面板，无需内联 rail 居中。
  // 面板打开时让当前章节条目滚入可视区——只滚面板自身 scrollTop，不碰祖先滚动容器。
  if(rptContent?.classList.contains('rpt-nav-open')){
   const curNav=d.querySelector('[data-rpt-nav-list] [data-toc="'+active+'"]');
   const navBox=d.querySelector('[data-rpt-nav-list]');
   if(curNav&&navBox){
    const top=curNav.offsetTop-navBox.offsetTop-navBox.clientHeight/2+curNav.offsetHeight/2;
    if(Math.abs(navBox.scrollTop-Math.max(0,top))>2)navBox.scrollTop=Math.max(0,top);
   }
  }
 };
 rptBody?.addEventListener('scroll',()=>{
  if(rptRaf)return;
  rptRaf=requestAnimationFrame(()=>{rptRaf=0;rptOnScroll();});
 },{passive:true});
 rptOnScroll();
 open(d);
 requestAnimationFrame(()=>{centerBfRails(d);rptOnScroll();});
}
// v0.51.0 洞见页重做：四体系收进同一骨架（主轴摘要 → 六维结构 → 深度详批 → 终身周期）。
// 内容生成全部搬到 insight.js：那里按盘面字段推导，不再「紫微万字、八字四句」。
let lastInsightSystem=null;
function insights(){
 const r=state.reading;
 if(!r){root.innerHTML='<p class="empty">激活案例后查看专属报告。</p>';return;}
 // 洞见页只讲本命四体系：双人合盘/择日等页面进来时，旧代码会落到 else 分支显示西洋，
 // 但体系名与分段器都没有选中项（副标题出现空名）。这里先归一，保证「标题-分段器-内容」三者一致。
 const order=['bazi','ziwei','west','vedic'];
 const current=order.includes(state.system)?state.system:'west',names=SYSTEM_LABEL;
 // v0.53.0：体系互切原本是整页硬替换——内容闪一下、滚动位置留在原处（旧内容的第 900px
 // 换成新体系的第 900px，等于把人扔进半篇中间）。改为记录上一体系，切换时回顶部并做入场过渡。
 const swapped=lastInsightSystem!==null&&lastInsightSystem!==current;
 lastInsightSystem=current;
 let model=null;
 try{model=insightModel(current,r,{flow:state.chartState?.ziwei?.flow||null});}
 catch(error){console.warn('洞见内容生成失败：'+error.message);}
 const nav=['bazi','ziwei','west','vedic'].map(k=>btn(names[k],`data-insight-system="${k}" aria-pressed="${current===k}"`)).join('');
 const body=model?summaryHtml(model)+dimsHtml(model):'<p class="empty">当前体系的盘面数据尚未就绪，重新生成命盘后再看。</p>';
 root.innerHTML=`<section class="insight-page${swapped?' is-swap':''}">
  <header class="page-head"><div class="page-head-main"><p class="kicker">FIRST LIGHT · 本命全局</p><h1>洞见</h1><p class="muted thin">命主 ${esc(state.profile.name)} · ${esc(names[current])} · 本命终身结构 · 不含流年流月</p></div></header>
  <div class="insight-system-tabs">${nav}</div>
  <div data-natal-background>${body}</div>
  ${model?digestBlockHtml(model):''}
  ${lifecycleBlockHtml(current,r)}
  <section class="insight-bridges" data-resonance-host></section>
  <section class="is-tools" aria-label="报告操作">
   <button type="button" class="is-tool is-tool-main" data-open-report>
    <span class="is-tool-ico" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.4 3.2h6.1l3.3 3.3v10.1a1 1 0 0 1-1 1H5.4a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1z"/><path d="M11.4 3.2v3.5h3.4M7 10.3h6M7 13.1h4.2"/></svg></span>
    <span class="is-tool-body"><b>生成深度报告</b><small>完整章次 · 盘面证据逐条推导 · 可导出文档</small></span>
    <span class="is-tool-arrow" aria-hidden="true">›</span>
   </button>
   <button type="button" class="is-tool is-tool-alt" data-share-current>
    <span class="is-tool-ico" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.2v8.4M6.6 8.4 10 11.8l3.4-3.4"/><path d="M4.2 15.6h11.6"/></svg></span>
    <span class="is-tool-body"><b>导出当前长图</b><small>保存到相册或系统分享</small></span>
   </button>
  </section>
  <button type="button" class="period-cta" data-goto-period><span class="period-cta-ico">◷</span><span><b>要看某一年 / 某个月？转到时点</b><small>选一个时点，出该时刻的盘 + 该时刻的详批（与本页不重复）→</small></span><span class="period-cta-arrow">›</span></button>
 </section>`;
 for(const x of root.querySelectorAll('[data-insight-system]'))x.onclick=()=>{state.system=x.dataset.insightSystem;render();};
 const or=root.querySelector('[data-open-report]');if(or)or.onclick=()=>openFullReport();
 const ex=root.querySelector('[data-share-current]');if(ex)ex.onclick=async()=>{ex.disabled=true;try{await shareChart(root,`${state.profile.name} · ${names[current]}报告`);tell('当前报告已生成，可在系统分享面板保存。');}catch(e){tell('导出失败：'+e.message);}finally{ex.disabled=false;}};
 const gp=root.querySelector('[data-goto-period]');if(gp)gp.onclick=()=>switchTab('period');
 wireDims(root);
 if(swapped){
  // 新内容从分段器开始读，而不是停在旧内容滚到的位置
  const mv=document.getElementById('mainScrollView');
  if(mv)mv.scrollTop=0;
 }
 forceRefreshAllInsights();
}
/* ---------------- 洞见页：时点专项报告工作台 ---------------- */
// 根据体系从当前缓存数据准备时点选项：选「时点类型」→选具体时点→生成该时点的详细报告+命盘快照。
function periodOptions(system,scope){
 const cs=state.chartState||{},r=state.reading||{};
 const opt=(v,t,on)=>`<option value="${esc(String(v))}"${on?' selected':''}>${esc(t)}</option>`;
 if(system==='bazi'){
  const d=cs.bazi?.data||r.bazi||{};
  const key={luck:'cycles',year:'years',month:'months',day:'days'}[scope];
  const list=d[key]||[];
  const nowY=new Date().getFullYear();
  const currentLuck=Math.max(0,(d.cycles||[]).findIndex(c=>(c.startYear??9999)<=nowY&&nowY<(c.endYear??c.startYear+10)));
  // v0.50.0：不再提供「本命原局」一项——本命全局属于洞见页，时点页只谈具体时点；
  // 默认就落在「当前正在走的大运」，打开即是当下这一刻。
  if(scope==='luck')return list.map((x,i)=>opt(i,`第${i+1}步 ${x.stem||''}${x.branch||''}（${x.startYear||x.age||''}起）`,i===currentLuck)).join('');
  if(scope==='year'){const has=list.some(x=>x.year===nowY);return list.map(x=>opt(x.year,`${x.year} ${x.stem||''}${x.branch||''}${x.year===nowY?'（今年）':''}`,has?x.year===nowY:x===list.at(-1))).join('');}
  return list.map((x,i)=>opt(i,`${x.label||x.date?.slice(5)||('第'+(i+1))} ${x.stem||''}${x.branch||''}`)).join('');
 }
 if(system==='ziwei'){
  const ch=cs.ziwei?.chart||r.ziwei||{},birthYear=ch.effectiveDate?+ch.effectiveDate.slice(0,4):new Date().getFullYear();
  // 流年选择须覆盖「今年及未来」；从出生年顺排会让中年用户只能选到童年年份。
  const year=Math.max(birthYear,new Date().getFullYear()-2);
  if(scope==='decadal'){const list=ch.decades||[],nowY=new Date().getFullYear();return list.map((x,i)=>{const r=x.yearRange||[];return opt(r[0]||year+i*10,`${(x.ageRange||[]).join('–')}岁 ${r.join('–')} · ${x.palaceName||''}`,(r[0]??0)<=nowY&&nowY<=(r[1]??0));}).join('');}
  if(scope==='yearly'){const nowY=new Date().getFullYear();return Array.from({length:23},(_,i)=>opt(year+i,`${year+i} 年${year+i===nowY?'（今年）':''}`,year+i===nowY)).join('');}
  if(scope==='monthly'){const nowM=new Date().getMonth()+1;return Array.from({length:12},(_,i)=>opt(i+1,`第 ${i+1} 月${i+1===nowM?'（本月）':''}`,i+1===nowM)).join('');}
  return Array.from({length:30},(_,i)=>opt(i+1,`第 ${i+1} 日`)).join('');
 }
 // vedic / west：以年+月为时点，转成 ISO。
 // 覆盖今年往前 2 年、往后 20 年（原 length:8 只到 +5，用户反馈「西洋占只能选到 2031」）。
 const y=new Date().getFullYear();
 return Array.from({length:23},(_,i)=>opt(y-2+i,`${y-2+i} 年${y-2+i===y?'（今年）':''}`,y-2+i===y)).join('');
}
/* 时点专项独立页：体系四选一 → 时点类型 → 具体时点 → 报告模式二选一 → 出盘+出详批。
   与洞见页解耦，作为主导航第五个 Tab 存在。 */
const PERIOD_SYS_META={
 bazi:{name:'八字',desc:'四柱 · 十神 · 刑冲合会',ico:'干'},ziwei:{name:'紫微斗数',desc:'流命宫 · 四化飞星',ico:'微'},
 vedic:{name:'印度占星',desc:'Dasha · 分盘 · 星宿',ico:'印'},west:{name:'西洋占星',desc:'行运 · 次限 · 返照',ico:'星'}
};
function periodDashboard(){
 if(!state.profile||!state.reading){root.innerHTML=`<section class="period-page"><header class="page-head"><div class="page-head-main"><p class="kicker">FIRST LIGHT · 时点专项</p><h1>时点</h1></div></header><p class="empty">请先激活一个案例并完成排盘，再生成时点专项报告。</p></section>`;return;}
 const sysKeys=['bazi','ziwei','vedic','west'];
 let system=PERIOD_SYS_META[state.system]?state.system:'bazi';
 // v0.50.0 功能去重：原先这里还能选「本命全报告 + 时点章」，与本命深度报告（洞见页）几乎同文。
 // 现在时点页只出「该时点专属详批」，本命全局一律走洞见页，两处互不重复。
 const mode='focus';
 const draw=()=>{
  const meta=PERIOD_SYS_META[system],scopes=SCOPES[system]||[];
  const sysCards=sysKeys.map(k=>`<button type="button" class="period-sys${k===system?' on':''}" data-psys="${k}" aria-pressed="${k===system}"><span class="period-sys-ico">${PERIOD_SYS_META[k].ico}</span><b>${PERIOD_SYS_META[k].name}</b><small>${PERIOD_SYS_META[k].desc}</small></button>`).join('');
  const rail=scopes.map(([id,label],i)=>btn(label,`class="period-scope${i===0?' on':''}" data-period-scope="${id}" aria-pressed="${i===0}"`)).join('');
  root.innerHTML=`<section class="period-page"><header class="page-head"><div class="page-head-main"><p class="kicker">FIRST LIGHT · 时点专项报告</p><h1>时点</h1><p class="muted thin">命主 ${esc(state.profile.name)} · 选一个时点，出该时刻的盘 + 该时刻的详批</p></div></header>
   <div class="period-step"><span class="period-step-no">1</span><span class="period-step-label">选择排盘体系</span></div>
   <div class="period-sys-grid">${sysCards}</div>
   <div class="period-step"><span class="period-step-no">2</span><span class="period-step-label">选择时点类型 · ${esc(meta.name)}</span></div>
   <div class="period-scope-rail card liquid-glass" role="group" aria-label="时点类型">${rail}</div>
   <div class="period-controls card liquid-glass"><label>具体时点<select data-period-value>${periodOptions(system,scopes[0]?.[0])}</select></label>
    ${['vedic','west'].includes(system)?'<label>月份<select data-period-month>'+Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===new Date().getMonth()?'selected':''}>${i+1} 月</option>`).join('')+'</select></label>':''}
   </div>
   <p class="period-scope-note">只出这个时点的盘与详批，正文逐条按该时刻的干支重算；<b>本命终身结构</b>请看「洞见」页的深度报告，两处不重复。</p>
   <div class="period-action">${btn('生成这个时点 →','class="primary period-generate" data-period-generate')}<p class="thin" data-period-status role="status"></p></div>
  </section>`;
  wirePeriodPage();
 };
 const wirePeriodPage=()=>{
  const host=root;
  const scopes=SCOPES[system]||[],valSel=host.querySelector('[data-period-value]'),monthSel=host.querySelector('[data-period-month]'),status=host.querySelector('[data-period-status]');
  let scope=scopes[0]?.[0];
  const scopeLabel=()=>scopes.find(([id])=>id===scope)?.[1]||scope;
  for(const b of host.querySelectorAll('[data-psys]'))b.onclick=()=>{system=b.dataset.psys;if(!PERIOD_SYS_META[system])system='bazi';draw();};
  for(const b of host.querySelectorAll('[data-period-scope]'))b.onclick=()=>{
   scope=b.dataset.periodScope;
   for(const x of host.querySelectorAll('[data-period-scope]')){const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));}
   valSel.innerHTML=periodOptions(system,scope);if(status)status.textContent='';
  };
  const gen=host.querySelector('[data-period-generate]');
  gen.onclick=async()=>{
   const raw=valSel.value;let selection={scope},label='';
   try{
    gen.disabled=true;if(status)status.textContent='正在按所选时点重算命盘与报告…';
    if(system==='bazi'){
     const d=state.chartState?.bazi?.data||state.reading?.bazi||{};
     const cycles=d.cycles||[],years=d.years||[],nowY=new Date().getFullYear();
     // 年份必须连带「这一年属于哪步大运」一起传给后端，否则盘面大运列会停在今天那一步，
     // 与所选流年自相矛盾（正是「选了流年、大运列没跟着变」的旧毛病）。
     const luckOfYear=y=>{const i=cycles.findIndex(c=>(c.startYear??9999)<=y&&y<(c.endYear??c.startYear+10));return i<0?0:i;};
     if(scope==='luck'){selection={luck:Number(raw)};}
     else if(scope==='year'){const y=Number(raw);selection={luck:luckOfYear(y),year:y};}
     else if(scope==='month'){selection={luck:luckOfYear(nowY),year:nowY,month:Number(raw)};}
     else selection={luck:luckOfYear(nowY),year:nowY,day:Number(raw)};
     const list=scope==='year'?years:(d[{luck:'cycles',month:'months',day:'days'}[scope]]||[]);
     const item=scope==='year'?list.find(x=>String(x.year)===String(raw)):list[Number(raw)];
     label=item?`${scopeLabel()} ${(item.stem||'')+(item.branch||'')}${scope==='year'?' '+item.year:''}`.trim():scopeLabel();
    }else if(system==='ziwei'){
     const yr=Number(raw);
     selection={scope,year:yr,month:scope==='monthly'?Number(raw):undefined,day:scope==='daily'?Number(raw):undefined};
     label=`${scopeLabel()} ${scope==='yearly'?yr+' 年':scope==='monthly'?raw+' 月':scope==='daily'?raw+' 日':(state.chartState?.ziwei?.chart?.decades||[]).find(x=>String(x.yearRange?.[0])===String(raw))?.palaceName||raw}`;
    }else{
     const yr=Number(raw),mo=monthSel?Number(monthSel.value):1;
     const at=new Date(Date.UTC(yr,mo-1,15,12,0,0)).toISOString();
     selection=system==='vedic'?{at,varga:1}:{at,mode:scope};
     label=`${yr} 年 ${mo} 月 · ${scopeLabel()}`;
    }
    const report=await buildPeriodReport(ctx,system,scope,selection,label,mode);
    openFullReport(report);
    if(status)status.textContent='已生成：'+label+'（报告里可复制 / 导出文档）';
   }catch(e){if(status)status.textContent='生成失败：'+(e.message||e);}
   finally{gen.disabled=false;}
  };
 };
 draw();
}
function reportTitle(key){
 return {'w-persona':'性格与天赋','w-career':'事业方向','w-wealth':'资源与财富','w-love':'情感关系','w-health':'生活节奏','z-palaces':'紫微十二宫','z-mutagen':'生年四化','w-risks':'长期课题','v-dasha':'印度大运'}[key]||'综合观察';
}
function preferences(){
 root.innerHTML=`<section class="soul-home"><header><p class="kicker">FIRST LIGHT · 个人灵性空间</p><h1>我</h1></header>
 ${soulWidgets()}${soulCard(state.reading,state.profile?.name)}
 <article class="card"><h2>我的资料库</h2>
  <div class="tool-grid">${btn('收藏的章节 ('+getFavorites().length+')','data-lib-fav')}${btn('报告历史 ('+getHistory().length+')','data-lib-hist')}${btn('双人对比','data-lib-compare')}</div>
  <p class="thin">收藏精彩段落、回看报告生成记录、并排对比两个案例的命理摘要。</p></article>
 <article class="card"><h2>交互反馈</h2><label class="feedback-setting"><span>交互音效与震动</span><input type="checkbox" role="switch" data-feedback ${feedbackEnabled()?'checked':''}></label></article>
 <details class="card liquid-glass maintenance-center" data-maintenance><summary>⚙️ 数据中枢与运维诊断</summary><div class="maintenance-content">
 ${versionCard()}<section><h3>案例备份</h3><div class="tool-grid">${btn('导出全量 JSON','data-export')}${btn('导入 JSON','data-import')}</div><input type="file" accept="application/json" id="importBackup" hidden></section>
 <section><h3>运行维护</h3><div class="tool-grid">${btn('运行诊断与日志','data-diagnostics')}${btn('清除排盘缓存','data-maintenance-cache')}</div><p class="thin" data-maintenance-status role="status"></p></section></div></details>
 <footer class="soul-footer"><p>缘分不过天时地利 承诺不过逝水轻浅</p><a href="/assets/console/credits.html">来源与许可</a></footer></section>`;
 wireSoul(ctx);
 // SOUL PALETTE 卡片底部 CTA：跳到洞见页看完整深度报告（增加功能性，不改动其他入口）
 const soulCta=$('[data-goto-insights]',root);
 if(soulCta)soulCta.onclick=()=>switchTab('insights');
 $('[data-release-history]',root).onclick=()=>releaseHistory(ctx);
 // 资料库：收藏章节 / 报告历史 / 双案例对比
 $('[data-lib-fav]',root).onclick=()=>{
  const d=sheet('toolSheet','收藏的章节',favoritesHtml());
  for(const b of d.querySelectorAll('[data-fav-remove]'))b.onclick=()=>{toggleFavorite({key:b.dataset.favRemove});b.closest('[data-fav-item]')?.remove();tell('已取消收藏');};
  for(const b of d.querySelectorAll('[data-fav-copy]'))b.onclick=async()=>{
   const item=getFavorites().find(x=>x.key===b.dataset.favCopy);if(!item)return;
   try{await navigator.clipboard.writeText(item.title+'\n'+item.text);tell('已复制章节文本');}catch{tell('复制失败');}
  };
 };
 $('[data-lib-hist]',root).onclick=()=>{
  const redraw=()=>{
   const d=sheet('toolSheet','报告历史',historyHtml());
   // 打开历史报告：用快照原样重绘报告弹层，并标记 replay 避免重复写历史。
   for(const b of d.querySelectorAll('[data-hist-open]'))b.onclick=()=>{
    const entry=getHistoryEntry(b.dataset.histOpen);
    if(!entry?.snapshot){tell('这条旧记录没有正文快照，请重新排盘生成。');return;}
    close(d);
    openFullReport(entry.snapshot,{replay:true});
   };
   // 删除：二次点击确认（不依赖 window.confirm——WKWebView 未实现回调时会恒为 false 导致删不掉）。
   for(const b of d.querySelectorAll('[data-hist-del]'))b.onclick=()=>{
    if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='再点一次确认';setTimeout(()=>{if(b.dataset.confirm==='1'){b.dataset.confirm='0';b.textContent='删除';}},5000);return;}
    deleteHistory(b.dataset.histDel);
    tell('已删除该记录');redraw();
   };
  };
  redraw();
 };
 $('[data-lib-compare]',root).onclick=()=>{
  if(state.cases.length<2){tell('至少需要两个案例才能对比');return;}
  const opts=state.cases.map(c=>`<option value="${esc(c.id)}">${esc(c.name||'未命名')}</option>`).join('');
  const d=sheet('toolSheet','双人命理对比',`<div class="form-grid"><label>案例 A<select data-cmp-a>${opts}</select></label><label>案例 B<select data-cmp-b>${opts.replace(/<option value="([^"]+)"/g,(m,id)=>`<option value="${id}"${id===state.cases[1]?.id?' selected':''}`)}</select></label></div><div data-cmp-out></div>`);
  const first=d.querySelector('[data-cmp-a]'),second=d.querySelector('[data-cmp-b]');
  if(state.cases[0])first.value=state.cases[0].id;
  const renderCmp=async()=>{
   const [ca,cb]=[first.value,second.value].map(id=>state.cases.find(c=>c.id===id));
   if(!ca||!cb){tell('请选择两个不同案例');return;}
   const ensure=async c=>c.summary?.day&&c.summary?.soul?c.summary:(async()=>{try{const s=summary(await request('/api/console/reading',{birth:normalized(c)}));c.summary=s;persist();return s;}catch{return {};}})();
   const [sa,sb]=await Promise.all([ensure(ca),ensure(cb)]);
   const line=n=>[`八字：${n.pillars||'—'}`,`日主：${n.day||'—'}`,`紫微命宫：${n.ziwei||'—'}`,`西占：${n.signs||'—'}`];
   d.querySelector('[data-cmp-out]').innerHTML=compareHtml([{name:ca.name,lines:line(sa)},{name:cb.name,lines:line(sb)}],x=>x);
  };
  first.onchange=renderCmp;second.onchange=renderCmp;renderCmp();
 };
 $('[data-diagnostics]',root).onclick=()=>diagnosticsPanel(ctx);
 $('[data-maintenance-cache]',root).onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{$('[data-maintenance-status]',root).textContent=await resetCaches();}catch(error){tell(error.message);}finally{b.disabled=false;}};
 $('[data-feedback]',root).onchange=e=>setFeedback(e.currentTarget.checked);
 $('[data-export]',root).onclick=()=>download(JSON.stringify({format:'firstlight-cases',version:4,cases:state.cases,activeId:state.profile?.id,groups:state.groups,recent:state.recent,space:caseSpace()},null,2),'FirstLight-cases.json','application/json');
 $('[data-import]',root).onclick=()=>$('#importBackup').click();
 $('#importBackup').onchange=async e=>{
  try{
   const file=e.target.files[0];if(!file||file.size>5000000)throw Error('备份文件过大或未选中');
   const data=JSON.parse(await file.text());
   const count=state.cases.length,previous=state.profile;
   const restored=mergeBackup(data,state,caseSpace());
   save(relationStorageKey,restored.space);
   save('xy:case-groups',restored.groups);
   Object.assign(state,{cases:restored.cases,profile:restored.profile,groups:restored.groups,recent:restored.recent});
   persist();
   for(const r of restored.newReminders){
    const seconds=(Date.parse(r.when)-Date.now())/1000;
    if(seconds>0&&!r.delivered)window.webkit?.messageHandlers?.caseReminder?.postMessage({id:r.id,seconds,message:r.message});
   }
   if(!previous&&restored.profile)activate(restored.profile,false);
   tell('已导入 '+(state.cases.length-count)+' 个案例及可合并的资料');
  }catch(error){tell(error.message);}finally{e.target.value='';}
 };
}
function download(text,name,type){
 const native=window.webkit?.messageHandlers?.caseBackup;
 if(native&&name==='FirstLight-cases.json'&&type==='application/json'){
  if(new Blob([text]).size>5000000){tell('备份文件超过 5 MB');return;}
  native.postMessage(text);return;
 }
 const url=URL.createObjectURL(new Blob([text],{type}));
 const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
const chartTools={ziwei:ziweiTools,bazi:baziTools,west:westernTools,vedic:vedicTools};
/* ===== 配置面板：分组行式，右对齐取值 + 尖角 ===== */
function configRow(id,label,value,danger){
 return `<button type="button" class="cfg-row${danger?' cfg-danger':''}" data-config="${id}"><span class="cfg-label">${esc(label)}</span><span class="cfg-side"><span class="cfg-value">${esc(value||'')}</span><svg class="cfg-chev" viewBox="0 0 8 12" aria-hidden="true" width="7" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.6 1.6 6 6l-4.4 4.4"/></svg></span></button>`;
}
function cfgSection(title,rows){
 const body=rows.filter(Boolean).join('');
 return body?`<section class="cfg-group"><h4>${esc(title)}</h4><div class="cfg-card">${body}</div></section>`:'';
}
function configPanel(){
 const p=state.profile,b=p?normalized(p):null;
 const school=(ZIWEI_SCHOOLS[state.settings.ziweiSchool||'quanshu']||{}).label||'全书';
 const pad=n=>String(n??0).padStart(2,'0');
 const clock=b?`${b.Y}.${pad(b.M)}.${pad(b.D)} ${pad(b.h)}:${pad(b.mi)}`:'未设定';
 const place=b?.city?.label||p?.fields?.city?.label||'—';
 const solar=state.settings.useSolarTime?'开':'关';
 const later=(state.settings.lateZishi||'next-day')==='next-day'?'晚子时归次日':'晚子时归当日';
 const house=astroHouse();
 const getHouseLabel=id=>houseLabels[id]||id;
 const fn=configRow('tools',`${({bazi:'八字',ziwei:'紫微',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘'})[state.system]||''}功能`,'打开');
 const basis=configRow('basis','时间基准',state.instantSnapshot?'即刻天象':'本命基准');
 const chartRows={
  bazi:[basis,configRow('solar','真太阳时',solar),configRow('late','晚子时口径',later),fn],
  ziwei:[basis,configRow('school','四化口径',school),configRow('late','晚子时口径',later),fn],
  west:[basis,configRow('house','宫位制',getHouseLabel(house)),configRow('solar','真太阳时',solar),fn],
  vedic:[basis,configRow('house','宫位制',getHouseLabel(house)),configRow('solar','真太阳时',solar),fn],
  synastry:[basis,configRow('house','宫位制',getHouseLabel(house)),fn]
 }[state.system]||[basis];
 const html=[
  cfgSection('档案',[
   configRow('edit','当前命主',p?p.name:'未选择'),
   configRow('edit','出生信息',clock),
   configRow('edit','出生地',place)
  ]),
  cfgSection(labels[state.system]||'当前排盘',chartRows),
  cfgSection('报告与导出',[
   configRow('report','生成深度报告',state.reading?'全文详批 · 可导出':'需先排盘'),
   configRow('share','分享当前长图',state.tab==='chart'?'导出图片':'仅排盘页')
  ]),
  cfgSection('系统',[
   configRow('feedback','交互音效与震动',feedbackEnabled()?'开':'关'),
   configRow('diagnostics','运行诊断与日志',''),
   configRow('about','关于与版本',''),
   configRow('reset','回到排盘首页','',true)
  ])
 ].join('');
 const d=sheet('configSheet','配置',html);
 for(const row of d.querySelectorAll('[data-config]')){
  row.onclick=()=>{
   const id=row.dataset.config;
   if(id==='edit'){close(d);birthSheet(state.instantSnapshot?null:state.profile,state.instantSnapshot?state.profile.fields:undefined);return;}
   if(id==='basis'){close(d);if(state.instantSnapshot)restoreOriginal();else instantChart();return;}
   if(id==='system'){const order=['bazi','ziwei','west','vedic'],next=order[(order.indexOf(state.system)+1)%order.length];close(d);switchTab('chart',next);return;}
   if(id==='school'){const ids=Object.keys(ZIWEI_SCHOOLS),next=ids[(ids.indexOf(state.settings.ziweiSchool||'quanshu')+1)%ids.length];state.settings={...state.settings,ziweiSchool:next};save(SETTINGS,state.settings);profileMachine.clear();if(state.profile)activate({...state.profile,fields:{...state.profile.fields,ziweiSchool:next}},false);render();configPanel();tell('四化口径已切换为「'+(ZIWEI_SCHOOLS[next]||{}).label+'」，盘面已重算。');return;}
   if(id==='solar'){const next=!state.settings.useSolarTime;state.settings={...state.settings,useSolarTime:next};save(SETTINGS,state.settings);if(state.profile)activate({...state.profile,fields:{...state.profile.fields,useSolarTime:next}},false);configPanel();return;}
   if(id==='house'){const ids=Object.keys(houseLabels),next=ids[(ids.indexOf(astroHouse())+1)%ids.length];setAstroHouse(ctx,next);close(d);configPanel();return;}
   if(id==='late'){const next=(state.settings.lateZishi||'next-day')==='next-day'?'current-day':'next-day';state.settings={...state.settings,lateZishi:next};save(SETTINGS,state.settings);if(state.profile)activate({...state.profile,fields:{...state.profile.fields,lateZishi:next}},false);configPanel();return;}
   if(id==='feedback'){setFeedback(!feedbackEnabled());configPanel();return;}
   if(id==='report'){close(d);openFullReport();return;}
   if(id==='tools'||id==='share'){close(d);toolPanel();return;}
   if(id==='diagnostics'){close(d);diagnosticsPanel(ctx);return;}
   if(id==='about'){close(d);const about=sheet('termSheet','关于与版本',versionCard());about.querySelector('[data-release-history]').onclick=()=>releaseHistory(ctx);return;}
   if(id==='reset'){close(d);switchTab('chart');$('#mainScrollView').scrollTo?.({top:0,behavior:'smooth'});tell('已回到排盘首页。');}
  };
 }
 return d;
}
/* ===== 模块面板：4 列宫格，按排盘体系 / 查阅 / 工具分区 ===== */
const MODULE_ICONS={
 bazi:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M4 4.6h12M4 10h12M4 15.4h12"/><circle cx="7.6" cy="4.6" r="1.5" fill="currentColor" stroke="none"/><circle cx="12.4" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="15.4" r="1.5" fill="currentColor" stroke="none"/></svg>',
 ziwei:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="10" cy="10" r="6.6"/><path d="M10 3.4v13.2M3.4 10h13.2"/><circle cx="10" cy="10" r="1.7" fill="currentColor" stroke="none"/></svg>',
 west:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="10" cy="10" r="6.6"/><path d="M10 6.4l1.1 2.5 2.5 1.1-2.5 1.1L10 13.6 8.9 11.1 6.4 10l2.5-1.1z"/></svg>',
 vedic:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><rect x="3.6" y="3.6" width="12.8" height="12.8" rx="1.6"/><path d="M3.6 3.6l12.8 12.8M16.4 3.6L3.6 16.4"/></svg>',
 cases:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><rect x="3" y="5.4" width="14" height="10.4" rx="2.4"/><path d="M6 3h8"/></svg>',
 insights:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M2.4 10S5.1 5.4 10 5.4 17.6 10 17.6 10 14.9 14.6 10 14.6 2.4 10 2.4 10z"/><circle cx="10" cy="10" r="2.2"/></svg>',
 me:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="10" cy="7.3" r="3"/><path d="M4.4 16.6c.6-2.9 2.8-4.4 5.6-4.4s5 1.5 5.6 4.4"/></svg>',
 birth:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><rect x="3.4" y="4.6" width="13.2" height="12" rx="2.4"/><path d="M3.4 8.4h13.2M7.3 2.8v3M12.7 2.8v3"/></svg>',
 share:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12.6V3.6M6.6 6.8 10 3.4l3.4 3.4"/><path d="M4.2 11.4v3.8a1.6 1.6 0 0 0 1.6 1.6h8.4a1.6 1.6 0 0 0 1.6-1.6v-3.8"/></svg>',
 diagnostics:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.6 10h3.2l1.8-4.2 3 8.4 1.8-4.2h4.9"/></svg>',
 about:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="10" cy="10" r="6.8"/><path d="M10 8.8v4.4"/><circle cx="10" cy="6.5" r=".9" fill="currentColor" stroke="none"/></svg>',
 pair:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="7" cy="10" r="4.2"/><circle cx="13" cy="10" r="4.2"/></svg>'
};
function modulePanel(){
 const ico=(paths)=>`<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
 const sysIcons={qizheng:ico('<circle cx="10" cy="10" r="2.2" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="6.4"/><path d="M10 1.6v2.2M10 16.2v2.2M1.6 10h2.2M16.2 10h2.2"/>'),yijing:ico('<path d="M6 3.2h8v13.6H6zM10 3.2v13.6M6.6 7h1.4M12 7h1.4M6.6 13h1.4M12 13h1.4"/>'),calendar:ico('<rect x="3.4" y="4.6" width="13.2" height="12" rx="2.2"/><path d="M3.4 8.4h13.2M7 2.8v3M13 2.8v3"/>')};
 const sys=['bazi','ziwei','west','vedic'].map(id=>[id,SYSTEM_NAMES[id],MODULE_ICONS[id],state.system===id&&state.tab==='chart']);
 const extra=[['qizheng','七政四余',sysIcons.qizheng,state.system==='qizheng'&&state.tab==='chart'],['yijing','易经推命',sysIcons.yijing,state.system==='yijing'&&state.tab==='chart'],['calendar','万年历择日',sysIcons.calendar,state.system==='calendar'&&state.tab==='chart']];
 const pair=[['synastry','双人合盘',MODULE_ICONS.pair,state.tab==='chart'&&state.system==='synastry'],['period','时点专项报告',MODULE_ICONS.insights,state.tab==='period'],['report','深度报告',MODULE_ICONS.insights,false],['share','分享长图',MODULE_ICONS.share,false]];
 const tabs=[['cases','案例库',MODULE_ICONS.cases,state.tab==='cases'],['insights','洞见',MODULE_ICONS.insights,state.tab==='insights'],['me','我的',MODULE_ICONS.me,state.tab==='me'],['birth','出生资料',MODULE_ICONS.birth,false]];
 const tools=[['diagnostics','运行诊断',MODULE_ICONS.diagnostics,false],['about','版本',MODULE_ICONS.about,false],['reset','回到首页',MODULE_ICONS.ziwei,false]];
 const group=(title,items)=>`<section class="mod-group"><h4>${esc(title)}</h4><div class="mod-grid">${items.map(([id,label,icon,on])=>`<button type="button" class="mod-item" data-module="${id}" aria-pressed="${on?'true':'false'}"><span class="mod-ico">${icon}</span><span class="mod-name">${esc(label)}</span></button>`).join('')}</div></section>`;
 const d=sheet('moduleSheet','全部模块',group('排盘体系',sys)+group('传统技艺',extra)+group('关系与输出',pair)+group('查阅',tabs)+group('工具',tools)+'<p class="mod-hint">底部轨道只放常用的排盘体系，其余功能都收在这里。</p>');
 for(const item of d.querySelectorAll('[data-module]')){
  item.onclick=()=>{
   const id=item.dataset.module;close(d);
   if(['bazi','ziwei','west','vedic','synastry','qizheng','yijing','calendar'].includes(id)){switchTab('chart',id);return;}
   if(['cases','period','insights','me'].includes(id)){switchTab(id);return;}
   if(id==='birth'){birthSheet(state.profile);return;}
   if(id==='report'){openFullReport();return;}
   if(id==='share'){toolPanel();return;}
   if(id==='diagnostics'){diagnosticsPanel(ctx);return;}
   if(id==='about'){const about=sheet('termSheet','关于与版本',versionCard());about.querySelector('[data-release-history]').onclick=()=>releaseHistory(ctx);return;}
   if(id==='reset'){switchTab('chart');$('#mainScrollView').scrollTo?.({top:0,behavior:'smooth'});}
  };
 }
 return d;
}
function toolPanel(){
 const tool=chartTools[state.system];
 if(state.tab!=='chart'||(!state.reading&&!state.chartState.west?.birthOverride))return;
 const d=sheet('toolSheet',labels[state.system]+' · 功能','<div id="viewTools"></div>');
 if(tool)tool(ctx,$('#viewTools',d));
 const host=$('#viewTools',d);host.insertAdjacentHTML('beforeend',btn('📷 分享长图','data-share-current class="tool-full"')+'<p data-share-status class="thin" role="status"></p>');
 $('[data-share-current]',host).onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await shareChart(root,$('[data-profile-name]').textContent);$('[data-share-status]',host).textContent='长图已生成。';}catch(error){$('[data-share-status]',host).textContent='导出失败：'+error.message;tell(error.message);}finally{b.disabled=false;}};
}
const definitions={
 日主:'出生日的天干，是十神关系和扶助比例的参照。',正官:'克日主且阴阳相异，常用来观察规则、责任和约束。',七杀:'克日主且阴阳相同，常用来观察压力、竞争和行动。',正印:'生日主且阴阳相异，常用来观察正规支持和学习。',偏印:'生日主且阴阳相同，常用来观察非标准的学习和支持。',比肩:'与日主同五行同阴阳，常用来观察同辈和自主性。',劫财:'与日主同五行异阴阳，常用来观察共享与竞争。',食神:'日主所生且阴阳相同，常用来观察输出与创造。',伤官:'日主所生且阴阳相异，常用来观察表达与打破常规。',正财:'日主所克且阴阳相异，常用来观察稳定资源。',偏财:'日主所克且阴阳相同，常用来观察流动资源与机会。',空亡:'以干支十位一旬计，两支未配天干，即为该旬空亡。',天乙贵人:'按年干或日干查出的地支标记，传统用来描述支持与援助。',驿马:'按三合局取对冲的生地，常用来观察移动、变换和外部往来。',咸池桃花:'按年支或日支查表，传统用来观察社交与吸引力。',华盖:'按三合局墓支取，常用来观察独处、专注和技艺。',羊刃:'阳日干的特定旺支，传统用来观察力量集中和张力。',劫煞:'按年支或日支所属三合局查表，传统用来观察竞争或突变。',天医:'以月支前一支取，属于传统辅助标记。',文昌:'按年干或日干查表，传统用来观察学习、书写和表达。',太极贵人:'按年干或日干查表，传统用来观察学习和钻研。'
};
const ctx={state,root,render,request,tell,sheet,close,birthSheet,normalized,switchTab,onSelectTimeNode,download,
 openFullReport,openMomentReport,addPlan:addAlmanacPlan,clockForBranch,almanacPlans,
 get birth(){return state.profile?normalized(state.profile):null;},
 explain(word,text,source){sheet('termSheet',word,termCard(word,text,source,definitions[DICTIONARY[word]?word:word]||definitions[word]));}
};
function render(){
 profileTitle();
 
 const chartClock=$('#chartBasisTime'),chartRow=$('#chartBasisRow'),chartToggle=$('#instantToggle');
 const showBasis=state.tab==='chart';
 if(chartRow)chartRow.hidden=!showBasis;
 chartClock.hidden=!showBasis||!state.profile||!state.reading;
 if(!chartClock.hidden)chartClock.textContent=(state.instantSnapshot?'即刻天象':'本命基准')+' · '+formatLocalDisplayTime(normalized(state.profile));
 if(chartToggle){chartToggle.hidden=!showBasis;const restore=Boolean(state.instantSnapshot);chartToggle.dataset.chartAction=restore?'restore':'instant';chartToggle.textContent=restore?'⟲ 恢复本命':'⏱ 即刻天象';chartToggle.setAttribute('aria-label',chartToggle.textContent);}
 const sysSwitch=$('#chartSystemSwitch');
 if(sysSwitch){
  sysSwitch.hidden=!showBasis||!state.profile||!state.reading;
  for(const b of sysSwitch.querySelectorAll('[data-system-switch]')){
   const active=b.dataset.systemSwitch===state.system;
   b.setAttribute('aria-pressed',String(active));
   b.setAttribute('aria-selected',String(active));
  }
 }
 $('#toolsButton').hidden=true; /* Build 56: 入口统一到右上角配置，这里只保留程序化调用 */
 updateLiquidPill(state.tab);
 for(const b of $('#bottomNav').querySelectorAll('[data-tab]')){const active=b.dataset.tab===state.tab;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 if(state.tab==='cases'){renderCases();return;}
 if(state.tab==='period'){periodDashboard();return;}
 if(state.tab==='insights'){insights();return;}
 forceRefreshAllInsights();
 if(state.tab==='me'){preferences();return;}
 if(!state.reading&&state.system!=='calendar'&&!(state.system==='west'&&state.chartState.west?.birthOverride)){
  // v0.41.0 跳动修复：pending 时用固定高度的骨架占位（近似盘面高度），
  // 避免「一行加载字 → 整页盘面」的高度突变把页面顶一下。真实内容就绪后一次性替换。
  root.innerHTML=state.pending
    ? `<div class="chart-loading" role="status" aria-live="polite"><span class="chart-loading-ring" aria-hidden="true"></span><span>正在排盘，稍候…</span></div>`
    : firstRunHome();
   const retry=$('[data-retry]',root);if(retry)retry.onclick=()=>activate(state.profile);
   // 示例案例：与手建案例同构建档（可编辑可删除），成功后走正常排盘激活流程。
   for(const b of root.querySelectorAll('[data-demo-load]'))b.onclick=async()=>{
    const demo=DEMO_CASES.find(c=>c.key===b.dataset.demoLoad);if(!demo)return;
    const profile={id:'demo-'+demo.key+'-'+Date.now(),name:demo.name,fields:demo.fields,note:demo.note,demo:true};
    b.disabled=true;
    try{
     state.reading=await request('/api/console/reading',{birth:normalized(profile)});
     state.cases=[profile,...state.cases.filter(c=>c.id!==profile.id)];
     state.profile=profile;persist();
     tell('已载入示例案例：'+demo.name);
     render();
    }catch(error){b.disabled=false;tell('示例排盘失败：'+(error.message||error));}
   };
   refreshToday(request);
  return;
 }
 if(state.system==='ziwei')ziweiView(ctx);
 else if(state.system==='bazi')baziView(ctx);
 else if(state.system==='west'){westernView(ctx);if(state.chartState.west?.result)onSelectTimeNode('west');}
 else if(state.system==='vedic'){vedicView(ctx);onSelectTimeNode('vedic');}
 else extraView(ctx);
}
installFeedback();
root.addEventListener('click',e=>{
 const action=e.target.closest('[data-chart-action]');
 // #instantToggle 自带 onclick，冒泡到此委托时跳过，避免 instant/restore 执行两次。
 if(action&&action.id==='instantToggle')return;
 if(action){if(action.dataset.chartAction==='instant')instantChart();else if(action.dataset.chartAction==='restore')restoreOriginal();return;}
 const b=e.target.closest('[data-term]');
 if(b){e.preventDefault();ctx.explain(b.dataset.term,b.dataset.explain,b.dataset.source);}
});
$('#activeProfile').removeAttribute('aria-haspopup');
const editProfile=$('#btnEditProfile');
if(editProfile)editProfile.onclick=e=>{e.stopPropagation();state.instantSnapshot?birthSheet(null,state.profile.fields):birthSheet(state.profile);};
// 点命主胶囊本身即可整理出生资料（与更新说明一致；旧的 btnEditProfile 在当前结构里不存在）。
$('#activeProfile').onclick=e=>{
 if(e.target.closest('[data-profile-edit]'))return;
 if(state.instantSnapshot)birthSheet(null,state.profile?.fields);
 else if(state.profile)birthSheet(state.profile);
 else birthSheet(null);
};
$('#caseDrawerButton').onclick=caseDrawer;
$('#toolsButton').onclick=toolPanel;
$('#configButton').onclick=configPanel;
$('#moduleButton').onclick=modulePanel;
$('#instantToggle').onclick=()=>$('#instantToggle').dataset.chartAction==='restore'?restoreOriginal():instantChart();
$('#chartSystemSwitch').onclick=e=>{
 const b=e.target.closest('[data-system-switch]');
 if(!b||b.dataset.systemSwitch===state.system)return;
 const id=b.dataset.systemSwitch;
 if(!['bazi','ziwei','west','vedic'].includes(id))return;
 window.triggerHaptic?.('light');
 switchTab('chart',id);
};
$('#appTopBar').addEventListener('click',e=>{
 if(e.target!==e.currentTarget&&!e.target.closest('[data-scroll-top-title]'))return;
 $('#mainScrollView').scrollTo?.({top:0,behavior:'smooth'});
 window.triggerHaptic?.('light');
});
$('#bottomNav').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)switchNavTab(b.dataset.tab,[...b.parentNode.querySelectorAll('[data-tab]')].indexOf(b));};
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length)close(dialogs.at(-1));}
});
function pendingReminders(){
 if(window.webkit?.messageHandlers?.caseReminder)return;
 const data=stored('xy_case_space',{reminders:{}});
 let dirty=false;
 for(const group of Object.values(data.reminders||{}))for(const reminder of group){
  if(!reminder.delivered&&Date.parse(reminder.when)<=Date.now()){reminder.delivered=true;dirty=true;tell(reminder.message);}
 }
 if(dirty)save('xy_case_space',data);
}
pendingReminders();setInterval(pendingReminders,30000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/offline.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{});
if(state.profile)activate(state.profile,false);else{render();birthSheet(null);}

window.addEventListener('storage',event=>{
 if(![ACTIVE,CASES,SETTINGS].includes(event.key))return;
 if(event.key===SETTINGS){state.settings=stored(SETTINGS,{});profileMachine.clear();}
 if(event.key===CASES)state.cases=stored(CASES,[]);
 const profile=stored(ACTIVE,null);
 if(profile&&profile.fields&&(event.key===SETTINGS||JSON.stringify(profile)!==JSON.stringify(state.profile)))activate(profile,false);
 else if(!profile&&event.key===ACTIVE){generation++;profileMachine.clear();state.profile=null;state.reading=null;state.chartState={};state.pending=false;render();}
 else if(state.tab==='cases')renderCases();
});

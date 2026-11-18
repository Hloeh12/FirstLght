import {buildBaziKnowledgeReport,buildZiweiKnowledgeReport} from '../../www/js/rules.js';
import {composeFullReport,reportHtml} from './full-report.js';
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
import {$,esc,btn,stored,save,request,labels,splitDate,isoLocal,table} from './ui.js';
import {ziweiView,ziweiTools,ziweiPatterns,ziweiPeriodEvidence} from './ziwei.js';
import {baziView,baziTools,baziQuick} from './bazi.js';
import {westernView,westernTools,astroHouse,houseOptions,houseLabels,setAstroHouse} from './western.js';
import {extraView} from './extras.js';
import {shareChart} from './share.js';
import {exportReportDocument} from './report-export.js';
import {DICTIONARY} from './dictionary-data.js';
import {termCard} from './term-card.js';
import {caseSpace,relationStorageKey,relationships,pairKey,linkedCases,galaxy,soulCard,mergeBackup} from './case-space.js';

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
/* P1 五行配色：默认传统五行色（木绿/火红/土黄/金白/水蓝黑），可切回品牌粉；干支/十神/运势曲线随之联动 */
const applyPalette=()=>{document.documentElement.dataset.palette=state.settings.palette==='pink'?'pink':'traditional';};
applyPalette();
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
function switchTab(tab,system=state.system){
 if(!['chart','insights'].includes(tab))restoreInstant();
 for(const d of document.querySelectorAll('dialog'))close(d);
 state.tab=tab;state.system=system;
 render();
 $('#mainScrollView').scrollTo?.(0,0);
 const screenEl=$('#screen');
 if(screenEl){screenEl.classList.remove('fl-swap');void screenEl.offsetWidth;screenEl.classList.add('fl-swap');}
 const rail=$('#chartSystemSwitch'),active=rail&&rail.querySelector('[data-system-switch][aria-pressed=true]');
 active?.scrollIntoView?.({block:'nearest',inline:'center',behavior:'smooth'});
}
function switchNavTab(tabName,index){
 if(!['cases','chart','insights','me'].includes(tabName))return;
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
 <div class="chips">${summaryItems.map(([k,v])=>`<span class="chip">${k} · ${esc(v)}</span>`).join('')}${btn('详情','data-action="detail"')}</div></article>`;
}
function renderCases(){
 if(!$('[data-case-list]',root))root.innerHTML=`<section class="cases-page" aria-labelledby="casesTitle"><header class="page-head"><div class="page-head-main"><p class="kicker">FIRST LIGHT · 案例</p><h1 id="casesTitle">案例</h1></div><div class="page-head-actions">${btn('关系星系','class="ghost-pill" data-galaxy-open')}${btn('＋','class="ghost-pill ghost-pill-sm" data-create aria-label="新建案例" title="新建案例"')}</div></header>
 <div class="case-search"><label><span class="muted">搜索姓名、生辰、城市或标签</span><input id="caseSearch" class="liquid-glass" type="search" value="${esc(state.query)}"></label>${btn('清除','data-clear-search aria-label="清除案例搜索"')}</div><div class="rail">${btn('同日元','data-cluster="day"')}${btn('同紫微命主','data-cluster="soul"')}${btn('全部特征','data-cluster=""')}</div><p class="thin" data-search-scope role="status"></p>
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
 $('[data-search-scope]',root).textContent=q?'全案例跨组搜索 · '+list.length+' 个结果':'当前分组 · '+state.filter;

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
 <p class="kicker">${esc(type)}</p><p class="relation-score">${score?'契合度 '+score.percent+'%':'合盘暂不可用'}</p>
 ${score?score.insights.map(i=>`<p><b>${esc(i.name)}</b> · ${esc(i.text)}</p>`).join('')+'<small>合盘是传统观察线索。</small>':''}</article>
 ${btn('查看深度双人合盘','class="primary" data-deep-pair')}`);
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
 <div class="stack">${reminders.map(r=>`<div class="spread"><span>${esc(r.when.replace('T',' '))} · ${esc(r.message)}</span>${btn('取消',`data-cancel-reminder="${esc(r.id)}"`)}</div>`).join('')}</div>`);
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
  try{
   const reading=await request('/api/console/reading',{birth:normalized(next)},flight.signal);
   if(token!==generation||!d.open||!form.isConnected)return;
   state.pending=false;installReading(next,reading);switchTab('chart');playSuccessSound();
  }catch(error){if(token===generation)feedback.textContent=error.message;}
  finally{if(token===generation){state.pending=false;submit.disabled=false;}}
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
const PAGE_TITLES={cases:'案例库',chart:'排盘',insights:'洞见',me:'我的'};
const SYSTEM_NAMES={bazi:'八字',ziwei:'紫微',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘',calendar:'历法'};
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
 forceRefreshAllInsights();
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
function openFullReport(){
 const synReady=state.system==='synastry'&&state.chartState.synastry?.result;
 if(!state.reading&&!synReady){tell('请先排盘，再生成报告。');return;}
 const names={bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘'};
 const d=document.getElementById('reportSheet');
 const report=composeFullReport(state,names);
 d.innerHTML=`<div class="dialog-content report-content">
  <div class="rpt-topbar"><button type="button" class="icon" data-rpt-close aria-label="关闭报告">×</button>
   <span class="rpt-topbar-title">深度报告 · ${esc(report.cover.system)}</span>
   <button type="button" class="rpt-act" data-rpt-copy>复制</button>
   <button type="button" class="rpt-act primary" data-rpt-export>导出文档</button></div>
  <div class="sheet-body rpt-body" id="reportBody">${reportHtml(report)}<div class="scroll-clearance" aria-hidden="true"></div></div>
 </div>`;
 d.querySelector('[data-rpt-close]').onclick=()=>close(d);
 d.querySelector('[data-rpt-copy]').onclick=async()=>{
  const doc=d.querySelector('[data-full-report]');
  const text=[doc.querySelector('h2')?.innerText,doc.querySelector('.rpt-owner')?.innerText,
   ...[...doc.querySelectorAll('.rpt-sec')].map(s=>s.innerText)].filter(Boolean).join('\n\n');
  try{await navigator.clipboard.writeText(text);tell('报告文本已复制。');}
  catch{e=>tell('复制失败，请使用导出文档。');}
 };
  d.querySelector('[data-rpt-export]').onclick=async e=>{
  const b=e.currentTarget;b.disabled=true;
  try{tell(exportReportDocument(report));}
  catch(err){tell('导出失败：'+(err.message||err));}
  finally{b.disabled=false;}
 };
 /* 目录交互：锚点跳转 + 滚动进度 */
 const rptBody=d.querySelector('#reportBody');
 const rptDoc=d.querySelector('[data-full-report]');
 rptBody?.addEventListener('click',e=>{
  const t=e.target.closest('[data-toc]');
  if(!t||!rptDoc)return;
  const sec=rptDoc.querySelector(`[data-sec="${t.dataset.toc}"]`);
  sec?.scrollIntoView({behavior:'smooth',block:'start'});
 });
 const rptProg=d.querySelector('[data-rpt-progress]');
 const rptOnScroll=()=>{
  if(!rptBody||!rptDoc)return;
  const total=rptDoc.scrollHeight-rptBody.clientHeight;
  const p=total>0?Math.min(100,Math.round((rptBody.scrollTop/total)*100)):0;
  if(rptProg)rptProg.textContent=p+'%';
  const cur=rptDoc.querySelectorAll('.rpt-sec');
  const at=rptBody.scrollTop;
  let active=0;
  for(let i=0;i<cur.length;i++){if(cur[i].offsetTop-rptBody.offsetTop<=at+80)active=i+1;}
  rptDoc.querySelectorAll('[data-toc]').forEach(b=>b.classList.toggle('on',Number(b.dataset.toc)===active));
 };
 rptBody?.addEventListener('scroll',rptOnScroll,{passive:true});
 rptOnScroll();
 open(d);
}
// FINAL_INSIGHT_REPORT_BUNDLE_CHECK: the report dictionaries are imported by this entry and bundled into js/console.js.
function insights(){
 const r=state.reading;
 if(!r){root.innerHTML='<p class="empty">激活案例后查看专属报告。</p>';return;}
 const current=state.system,names={bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星'};
 const nav=['bazi','ziwei','west','vedic'].map(k=>btn(names[k],`data-insight-system="${k}" aria-pressed="${current===k}"`)).join('');
 const b=r.bazi,z=r.ziwei,w=r.western,v=r.vedic;
 let natal='', lifecycle='';
 if(current==='bazi'){
  natal=`<article class="card liquid-glass"><h2>八字本命专属报告</h2><p><b>日主与承载：</b>${esc(b.dayMaster.stem+b.dayMaster.element)}，${esc(b.strength.kind)}，扶助${b.strength.support.toFixed(1)}%。月令提纲${esc(b.pillars[1].stem+b.pillars[1].branch)}，通根${esc(b.roots.map(x=>x.pillar+x.branch+'藏'+x.stem).join('、')||'未见')}，透干${esc(b.revealed.map(x=>x.stem+'透'+x.visibleAt).join('、')||'未见')}。</p><p><b>结构与取用：</b>${esc(b.strength.method)}；喜用参考${esc(b.strength.useful.join('、')||'未单列')}，忌偏参考${esc(b.strength.caution.join('、')||'未单列')}。这些是盘面权重参考，不用单一百分比替代月令、根气、寒暖燥湿。</p><p><b>实际关系：</b>${esc(b.relationships.map(x=>x.pattern+' '+x.type+'（'+x.meaning+'）').join('；')||'未触发当前规则表内关系')}。应核实具体参与柱位，合冲不自动等于吉凶。</p><p><b>总体运势：</b>宜先选择能长期积累的专长，重大合作把权责和退出条件写清；财务安排以现金流与现实风险为准。此为本命总体观察，不夹带当前流年流月。</p></article>`;
  lifecycle=`<article class="card liquid-glass"><h2>八字大运生命周期</h2><p>起运：${esc(b.info.startAge||b.entry?.local||'以出生资料计算')}；${esc(b.info.forward?'顺行':'逆行')}。以下为大运顺序，点击排盘页时间轴可查看对应岁运专属报告。</p>${table(['阶段','干支','起止','十神'],b.cycles.map(x=>[x.age+'岁',x.stem+x.branch,x.startYear+'–'+x.endYear,x.tenGod]))}</article>`;
 }else if(current==='ziwei'){
  const life=z.palaces.find(x=>x.name==='命宫'), stars=life?.majorStars?.length?life.majorStars:life?.borrowedStars||[],triad=life?z.palaces.filter(x=>life.relatedBranches?.includes(x.branch)):[];
  natal=`<article class="card liquid-glass"><h2>紫微本命专属报告</h2><p><b>命宫主轴：</b>命宫在${esc(life?.earthlyBranch||'待定位')}，${stars.length?'主星为 '+esc(stars.map(x=>x.name).join('、')):'空宫，借对宫主星并参看三方四正'}；${esc(stars.map(x=>x.name+'：'+(x.brightness||'本宫星曜')).join('；')||'星曜待定位')}。</p><p><b>三方四正：</b>${esc(triad.map(x=>x.name+'（'+x.majorStars.map(y=>y.name).join('、')+'）').join('；')||'当前结构未能定位完整三方')}。先看命宫主星如何与事业、资源、迁移互证，不以单星断终身。</p><p><b>本命四化：</b>${esc(z.sihua.map(x=>x.type+'入'+x.palace).join('、')||'待定位')}。化禄看资源入口，化权看责任，化科看名誉与文书，化忌看牵挂与反复；实际作用要看落宫、对宫及会照星。</p><p><b>总体运势：</b>先发挥命宫星曜的组织/思考/执行特质，再以官禄和财帛三方核对适合承担的角色。遇到关系或职业抉择，要比较双方责任与资源，不用一颗化忌替代现实判断。</p></article>`;
  lifecycle=`<article class="card liquid-glass"><h2>紫微全生命周期 · 大限</h2><p>每十年以大限宫为阶段主题，点击排盘页“大限/流年/流月/流日”后，下方当前报告会同步替换。</p>${table(['虚岁','年份','大限宫'],z.decades.map(x=>[x.ageRange.join('–')+'岁',x.yearRange.join('–'),x.palaceName]))}</article>`;
 }else if(current==='vedic'){
  const moon=v.planets.find(x=>x.key==='moon'),sun=v.planets.find(x=>x.key==='sun');
  const planetLines=v.planets.map(x=>x.name+'：'+x.sign+'，第'+x.house+'宫，'+x.nakshatra+' Pada '+x.pada+(x.retro?'，逆行':'')).join('；');
  natal=`<article class="card liquid-glass"><h2>印度占星本命专属报告</h2><p>Lahiri 恒星黄道、整宫制。上升 ${esc(v.lagna)}；太阳 ${esc(sun?.sign||'—')} 第${sun?.house||'—'}宫；月亮 ${esc(moon?.sign||'—')} 第${moon?.house||'—'}宫，${esc(moon?.nakshatra||'—')} Pada ${moon?.pada||'—'}。</p><h3>九曜落宫与星宿</h3><p>${esc(planetLines)}</p><h3>本命判读</h3><p>先以 D1 判断上升、月亮、太阳及宫主星，再以星宿主与相位确认主题；D9 用于关系成熟度，D10 用于事业表达，不能脱离 D1 单独断事。</p></article>`;
  lifecycle=`<article class="card liquid-glass"><h2>印度 Vimshottari 全生命周期</h2>${table(['主运','起始','结束','状态'],v.dashas.map(x=>[x.lord,x.start.slice(0,10),x.end.slice(0,10),x.current?'当前':'—']))}<p>点击印度排盘页四级 Dasha 行，可查看 Maha、Antar、Pratyantar、Sookshma 的当前专属分析。</p></article>`;
 }else{
  const sun=w.planets.find(x=>x.key==='sun'),moon=w.planets.find(x=>x.key==='moon');
  const sunAspects=w.aspects.filter(a=>a.aKey==='sun'||a.bKey==='sun').slice(0,4).map(a=>a.a+' '+a.type+' '+a.b+'（'+a.orb.toFixed(1)+'°）').join('、');
  natal=`<article class="card liquid-glass"><h2>西洋占星本命专属报告</h2><p><b>核心三要素：</b>太阳${esc(sun?.sign||'—')}第${sun?.house||'—'}宫，月亮${esc(moon?.sign||'—')}第${moon?.house||'—'}宫，上升${esc(w.asc.sign)}，天顶${esc(w.mc.sign)}。</p><p><b>表达与需求：</b>太阳位置描述持续投入的领域，月亮位置描述安全感与情绪习惯，上升描述进入环境的方式；三者不一致时代表内在需求与外在策略需要协调，不是互相抵消。</p><p><b>相位证据：</b>${esc(sunAspects||'当前没有可显示的太阳主相位')}。相位须结合行星、容许度和落宫理解，不把单一相位当作事件。</p><p><b>总体建议：</b>把太阳落宫的长期投入转成可检查的目标，同时给月亮需求安排稳定恢复时间；职业选择另核对天顶与六宫日常工作方式。本命总体不夹带当前行运。</p></article>`;
  lifecycle=`<article class="card liquid-glass"><h2>西洋推运生命周期</h2><p>次限一日推一年，行运按当前日期，日返/ 月返按回归时刻；选择排盘页对应推运后，只在下方替换当前专属段落。</p></article>`;
 }
 root.innerHTML=`<section class="insight-page"><header class="page-head"><div class="page-head-main"><p class="kicker">FIRST LIGHT · 总体运势</p><h1>洞见</h1><p class="muted thin">${esc(state.profile.name)} · ${esc(names[current])}</p></div><div class="page-head-actions">${btn('深度报告','class="ghost-pill" data-open-report aria-label="生成完整深度报告"')}${btn('导出','class="ghost-pill" data-share-current aria-label="导出总体报告长图"')}</div></header><div class="insight-system-tabs">${nav}</div><details class="card liquid-glass" data-natal-background open><summary>本命总体分析 · ${esc(names[current])}</summary><div data-natal-report>${natal}</div></details><details class="card liquid-glass" open><summary>全生命周期总览 · ${esc(names[current])}</summary><div data-lifecycle-report>${lifecycle}</div></details><section class="insight-bridges" data-resonance-host></section><article class="card liquid-glass insight-boundary"><h2>应期分析在哪里？</h2><p>流年、流月、流日和大运的专属分析只显示在对应排盘页的时间轴下方；洞见页不混入短期应期。</p></article></section>`;
 for(const x of root.querySelectorAll('[data-insight-system]'))x.onclick=()=>{state.system=x.dataset.insightSystem;render();};
 const or=root.querySelector('[data-open-report]');if(or)or.onclick=()=>openFullReport();
 const ex=root.querySelector('[data-share-current]');if(ex)ex.onclick=async()=>{ex.disabled=true;try{await shareChart(root,`${state.profile.name} · ${names[current]}报告`);tell('当前报告已生成，可在系统分享面板保存。');}catch(e){tell('导出失败：'+e.message);}finally{ex.disabled=false;}};
 forceRefreshAllInsights();
}
function reportTitle(key){
 return {'w-persona':'性格与天赋','w-career':'事业方向','w-wealth':'资源与财富','w-love':'情感关系','w-health':'生活节奏','z-palaces':'紫微十二宫','z-mutagen':'生年四化','w-risks':'长期课题','v-dasha':'印度大运'}[key]||'综合观察';
}
function preferences(){
 root.innerHTML=`<section class="soul-home"><header><p class="kicker">FIRST LIGHT · 个人灵性空间</p><h1>我</h1></header>
 ${soulWidgets()}${soulCard(state.reading,state.profile?.name)}
 <article class="card"><h2>交互反馈</h2><label class="feedback-setting"><span>交互音效与震动</span><input type="checkbox" role="switch" data-feedback ${feedbackEnabled()?'checked':''}></label></article>
 <details class="card liquid-glass maintenance-center" data-maintenance><summary>⚙️ 数据中枢与运维诊断</summary><div class="maintenance-content">
 ${versionCard()}<section><h3>案例备份</h3><div class="tool-grid">${btn('导出全量 JSON','data-export')}${btn('导入 JSON','data-import')}</div><input type="file" accept="application/json" id="importBackup" hidden></section>
 <section><h3>运行维护</h3><div class="tool-grid">${btn('运行诊断与日志','data-diagnostics')}${btn('清除排盘缓存','data-maintenance-cache')}</div><p class="thin" data-maintenance-status role="status"></p></section></div></details>
 <footer class="soul-footer"><p>缘分不过天时地利 承诺不过逝水轻浅</p><a href="/assets/console/credits.html">来源与许可</a></footer></section>`;
 wireSoul(ctx);
 $('[data-release-history]',root).onclick=()=>releaseHistory(ctx);
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
   configRow('report','生成深度报告',state.reading?'生成':'需先排盘'),
   configRow('share','分享当前长图',state.tab==='chart'?'生成':'仅排盘页')
  ]),
  cfgSection('系统',[
   configRow('palette','五行配色',state.settings.palette==='pink'?'品牌粉':'传统五行色'),
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
   if(id==='palette'){const next=state.settings.palette==='pink'?'traditional':'pink';state.settings={...state.settings,palette:next};save(SETTINGS,state.settings);applyPalette();configPanel();tell('五行配色已切换为「'+(next==='pink'?'品牌粉':'传统五行色')+'」，盘面与运势曲线已联动。');return;}
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
 const pair=[['synastry','双人合盘',MODULE_ICONS.pair,state.tab==='chart'&&state.system==='synastry'],['report','深度报告',MODULE_ICONS.insights,false],['share','分享长图',MODULE_ICONS.share,false]];
 const tabs=[['cases','案例库',MODULE_ICONS.cases,state.tab==='cases'],['insights','洞见',MODULE_ICONS.insights,state.tab==='insights'],['me','我的',MODULE_ICONS.me,state.tab==='me'],['birth','出生资料',MODULE_ICONS.birth,false]];
 const tools=[['diagnostics','运行诊断',MODULE_ICONS.diagnostics,false],['about','版本',MODULE_ICONS.about,false],['reset','回到首页',MODULE_ICONS.ziwei,false]];
 const group=(title,items)=>`<section class="mod-group"><h4>${esc(title)}</h4><div class="mod-grid">${items.map(([id,label,icon,on])=>`<button type="button" class="mod-item" data-module="${id}" aria-pressed="${on?'true':'false'}"><span class="mod-ico">${icon}</span><span class="mod-name">${esc(label)}</span></button>`).join('')}</div></section>`;
 const d=sheet('moduleSheet','全部模块',group('排盘体系',sys)+group('传统技艺',extra)+group('关系与输出',pair)+group('查阅',tabs)+group('工具',tools)+'<p class="mod-hint">底部轨道只放常用的排盘体系，其余功能都收在这里。</p>');
 for(const item of d.querySelectorAll('[data-module]')){
  item.onclick=()=>{
   const id=item.dataset.module;close(d);
   if(['bazi','ziwei','west','vedic','synastry','qizheng','yijing','calendar'].includes(id)){switchTab('chart',id);return;}
   if(['cases','insights','me'].includes(id)){switchTab(id);return;}
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
 if(state.tab==='insights'){insights();return;}
 forceRefreshAllInsights();
 if(state.tab==='me'){preferences();return;}
 if(!state.reading&&state.system!=='calendar'&&!(state.system==='west'&&state.chartState.west?.birthOverride)){
  root.innerHTML=`<p class="empty">${esc(state.pending?'正在读取命盘…':state.error||'点按顶部命主气泡开始排盘。')}</p>${state.error&&state.profile?btn('重试','data-retry'):''}`;
  const retry=$('[data-retry]',root);if(retry)retry.onclick=()=>activate(state.profile);
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

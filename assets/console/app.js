import {$,esc,btn,stored,save,request,labels,splitDate,isoLocal,table} from './ui.js';
import {ziweiView,ziweiTools} from './ziwei.js';
import {baziView,baziTools} from './bazi.js';
import {westernView,westernTools} from './western.js';
import {extraView} from './extras.js';
import {shareChart} from './share.js';
import {caseSpace,relationStorageKey,relationships,pairKey,linkedCases,galaxy,soulCard,mergeBackup} from './case-space.js';

const CASES='xy:cases:v2',ACTIVE='xy_active_profile',SETTINGS='xy:settings:v2';
const standardGroups=['我的','亲人','朋友','特别关注'];
const state={
 cases:stored(CASES,[]),profile:stored(ACTIVE,null),groups:stored('xy:case-groups',[]).filter(x=>x!=='客户'),
 recent:stored('xy_recent_cases',[]),settings:stored(SETTINGS,{}),reading:null,tab:'chart',system:'ziwei',
 query:'',filter:'全部',chartState:{},pending:false,error:''
};
const root=$('#screen');
let generation=0,flight,noticeTimer,locationToken=0,locationReply;
window.firstlightLocation=(token,lat,lon)=>{if(token===locationToken)locationReply?.(lat,lon);};
const icons=[
 '<path d="M6 4h13v17H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" fill="#ffe1ef"/><path d="M7 4v17m3-12h6m-6 4h4m4-10 3 3" fill="none" stroke="#935779" stroke-width="1.5"/>',
 '<path d="m4 20 12-12" stroke="#9464b2" stroke-width="4" stroke-linecap="round"/><path d="m17 2 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#ffc4de" stroke="#a26eaa"/>',
 '<circle cx="12" cy="10" r="8" fill="#e9d7fc" stroke="#9b76b1"/><path d="m12 4 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" fill="#fff"/><path d="M8 17h8l3 4H5Z" fill="#edb9d6"/>',
 '<circle cx="5" cy="7" r="3.5" fill="#f2bbd2"/><circle cx="19" cy="7" r="3.5" fill="#f2bbd2"/><path d="M3 14a9 8 0 0 1 18 0c0 8-18 8-18 0Z" fill="#ffe1ee" stroke="#ae7392"/><path d="M8 13h.1m7.9 0h.1m-5 3 1 1 1-1" stroke="#6a4560" stroke-width="1.6" stroke-linecap="round"/>'
];
const tabs={cases:'案例',chart:'排盘',insights:'洞见',me:'我'};
$('#tabBar').innerHTML=Object.entries(tabs).map(([id,label],i)=>`<button type="button" data-tab="${id}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[i]}</svg>${label}</button>`).join('');
function tell(message){
 const node=$('#notice');node.textContent=message;node.hidden=false;
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{node.hidden=true;},3600);
}
window.firstlightReminderStatus=tell;
function close(dialog){
 if(!dialog.hasAttribute('open'))return;
 if(dialog.close)dialog.close();
 else{dialog.removeAttribute('open');dialog.classList.remove('fallback');}
}
function open(dialog){
 if(dialog.hasAttribute('open'))return;
 if(dialog.showModal)dialog.showModal();
 else{dialog.setAttribute('open','');dialog.classList.add('fallback');}
}
for(const d of document.querySelectorAll('dialog')){
 d.addEventListener('click',e=>{if(e.target===d)close(d);});
 d.addEventListener('cancel',e=>{e.preventDefault();close(d);});
}
function sheet(id,title,body){
 const d=$('#'+id),prefix={birthSheet:'birth',caseDrawer:'drawer',toolSheet:'tool',termSheet:'term'}[id];
 d.innerHTML=`<div class="dialog-content"><div class="sheet-grip" aria-hidden="true"></div><header class="sheet-head">
 <h2 id="${prefix}Title">${esc(title)}</h2>${btn('×','class="icon" aria-label="关闭" data-close')}</header>${body}</div>`;
 $('[data-close]',d).onclick=()=>close(d);
 open(d);
 return d;
}
function switchTab(tab,system=state.system){
 for(const d of document.querySelectorAll('dialog'))close(d);
 state.tab=tab;state.system=system;
 render();
 window.scrollTo?.(0,0);
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
  day:result.bazi.dayMaster.stem+result.bazi.dayMaster.element+' '+result.bazi.strength.kind,
  ziwei:(palace.majorStars.length?'':'借')+(stars.map(s=>s.name).join('、')||'空宫')+'在'+palace.earthlyBranch,
  signs:'太阳'+west.planets.find(p=>p.key==='sun').sign+' · 上升'+west.asc.sign,
  solar:result.bazi.info.solar,lunar:result.bazi.info.lunar
 };
}
function installReading(profile,result){
 profile.summary=summary(result);
 profile.tags=Object.values(profile.summary);
 state.reading=result;state.profile=profile;state.chartState={};state.error='';
 state.cases=[profile,...state.cases.filter(c=>c.id!==profile.id)];
 state.recent=[profile.id,...state.recent.filter(id=>id!==profile.id)].slice(0,5);
 persist();
}
async function activate(profile,go=true){
 const token=++generation;
 flight?.abort();flight=new AbortController();
 state.profile=profile;state.reading=null;state.chartState={};state.error='';state.pending=true;
 state.recent=[profile.id,...state.recent.filter(id=>id!==profile.id)].slice(0,5);
 persist();
 if(go)switchTab('chart');else render();
 try{
  const result=await request('/api/console/reading',{birth:normalized(profile)},flight.signal);
  if(token===generation)installReading(profile,result);
 }catch(error){if(token===generation)state.error=error.message;}
 finally{if(token===generation){state.pending=false;render();}}
}
function setGroup(filter){state.filter=filter;renderCases();}
const searchKey=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
function caseCard(c){
 const f=c.fields||{},s=c.summary||{};
 const summaryItems=[
  ['八字',s.pillars||c.pillarSummary],['日元',s.day],['紫微',s.ziwei],['星座',s.signs]
 ].filter(([,v])=>v);
 const dates=[s.solar?'公历 '+s.solar:f.dateStr,s.lunar?'农历 '+s.lunar:null].filter(Boolean).join(' · ');
 return `<article class="case-card card liquid-glass ${state.profile?.id===c.id?'active':''}" data-case="${esc(c.id)}" tabindex="0" aria-label="${esc(c.name)}">
 <div><h3>${esc(c.name)} <small>${f.gender==='男'?'♂':'♀'}</small> ${state.profile?.id===c.id?'<span class="chip">当前案例</span>':''}</h3>
 <p>${esc(dates)} ${esc(f.timeUnknown?'时辰未知':f.timeStr||'')} · ${esc(f.city?.label||'手动坐标')}</p></div>
 <div class="case-actions">${btn('设为全局使用','class="primary" data-action="use"')}${btn('编辑','data-action="edit"')}${btn('删除','data-action="delete"')}</div>
 <div class="chips">${summaryItems.map(([k,v])=>`<span class="chip">${k} · ${esc(v)}</span>`).join('')}${btn('详情','data-action="detail"')}</div></article>`;
}
function renderCases(){
 if(!$('[data-case-list]',root))root.innerHTML=`<section aria-labelledby="casesTitle"><div class="spread"><h1 id="casesTitle">案例</h1>${btn('＋ 新建案例','class="primary" data-create')}</div>${btn('关系星系','data-galaxy-open')}
 <label><span class="muted">搜索姓名或命理标签</span><input id="caseSearch" class="liquid-glass" type="search" value="${esc(state.query)}"></label>
 <div class="rail case-groups" id="caseGroups" aria-label="案例分组"></div><div data-case-list></div></section>`;
 $('#caseSearch').oninput=e=>{state.query=e.target.value;renderCases();};
 $('[data-create]',root).onclick=()=>birthSheet(null);
 $('[data-galaxy-open]',root).onclick=()=>showGalaxy();
 const groups=['全部',...standardGroups,...state.groups];
 const groupRail=$('#caseGroups');
 groupRail.innerHTML=groups.map(g=>btn(g,`data-group="${esc(g)}" aria-pressed="${state.filter===g}"`)).join('')+btn('+ 新建分组','data-add-group');
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
 const q=searchKey(state.query);
 const list=state.cases.filter(c=>(state.filter==='全部'||(c.category==='客户'?'特别关注':c.category||'我的')===state.filter)&&
  [...(c.tags||[]),c.name,c.fields?.dateStr,c.fields?.city?.label].some(v=>searchKey(v).includes(q)));
 const host=$('[data-case-list]',root);
 host.innerHTML=list.map(caseCard).join('')||'<p class="empty">这里还没有匹配的案例。</p>';
 host.onclick=e=>{
  const card=e.target.closest('[data-case]');
  if(!card)return;
  const c=state.cases.find(x=>x.id===card.dataset.case);
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='edit')birthSheet(c);
  else if(action==='detail')caseDetail(c);
  else if(action==='delete')confirmDelete(c);
  else activate(c);
 };
 host.onkeydown=e=>{if(e.target.matches('[data-case]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}};
}
function confirmDelete(c){
 const d=sheet('toolSheet','删除案例',`<p>删除「${esc(c.name)}」及其本机札记和关系？</p>${btn('确认删除','class="primary" data-confirm')}`);
 $('[data-confirm]',d).onclick=()=>{
  state.cases=state.cases.filter(x=>x.id!==c.id);
  const data=stored('xy_case_space',{links:[],notes:{},reminders:{}});
  data.links=data.links.filter(l=>!l.ids.includes(c.id));
  delete data.notes[c.id];
  for(const reminder of data.reminders[c.id]||[])window.webkit?.messageHandlers?.caseReminder?.postMessage({id:reminder.id,cancel:true});
  delete data.reminders[c.id];save('xy_case_space',data);
  if(state.profile?.id===c.id){generation++;flight?.abort();state.profile=null;state.reading=null;state.error='';state.pending=false;}
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
   for(const b of host.querySelectorAll('[data-galaxy-case]'))b.onclick=()=>caseDetail(state.cases.find(c=>c.id===b.dataset.galaxyCase));
  };
  draw(0);
 });
}
function caseDetail(c){
 const data=caseSpace();
 const linked=data.links.filter(l=>l.ids.includes(c.id)).map(l=>({...l,other:state.cases.find(p=>p.id===l.ids.find(id=>id!==c.id))})).filter(x=>x.other);
 const candidates=state.cases.filter(x=>x.id!==c.id);
 const reminders=data.reminders[c.id]||[];
 const d=sheet('toolSheet',c.name+' · 案例空间',`
 <details><summary>查看关系星系</summary><div data-galaxy></div></details>
 <div class="stack">${linked.map((l,i)=>`<div class="spread"><span>${esc(l.other.name)} · ${esc(l.type)}</span>${btn('解除',`data-unlink="${i}"`)}</div>`).join('')}</div>
 ${candidates.length?`<form id="addRelation" class="form-grid"><label>关联案例<select name="other">${candidates.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></label>
 <label>关系类型<select name="kind">${relationships.map(x=>`<option>${x}</option>`).join('')}<option value="custom">＋自定义</option></select></label>
 <label class="wide" data-custom-kind hidden>自定义关系<input name="custom" maxlength="24"></label>
 <label class="wide">亲密自评 <output data-closeness>50</output><input name="closeness" type="range" min="0" max="100" value="50"></label>
 <button class="wide">保存双向关系</button></form>`:''}
 <form id="caseNote"><label>个人札记<textarea name="note" maxlength="8000" rows="4">${esc(data.notes[c.id])}</textarea></label><button>保存札记</button></form>
 <form id="caseReminder" class="form-grid"><label>提醒时间<input name="when" type="datetime-local" required></label><label>提醒内容<input name="message" maxlength="80" required></label><button class="wide">添加提醒</button></form>
 <div class="stack">${reminders.map(r=>`<div class="spread"><span>${esc(r.when.replace('T',' '))} · ${esc(r.message)}</span>${btn('取消',`data-cancel-reminder="${esc(r.id)}"`)}</div>`).join('')}</div>`);
 const store=()=>save(relationStorageKey,data);
 const disclosure=$('details',d);
 disclosure.ontoggle=()=>{if(disclosure.open&&!$('[data-galaxy]',d).hasChildNodes())fillGalaxy(d,c);};
 const rel=$('#addRelation',d);
 if(rel){
  const {other,kind,custom,closeness}=rel.elements;
  const reveal=()=>$('[data-custom-kind]',rel).hidden=kind.value!=='custom';
  const renderCloseness=()=> $('[data-closeness]',rel).value=closeness.value;
  const sync=()=>{
   const l=linked.find(x=>x.other.id===other.value);
   kind.value=l?(relationships.includes(l.type)?l.type:'custom'):relationships[0];
   custom.value=kind.value==='custom'?l.type:'';
   closeness.value=l?.closeness??50;
   reveal();renderCloseness();
  };
  other.onchange=sync;kind.onchange=reveal;closeness.oninput=renderCloseness;sync();
  rel.onsubmit=e=>{
   e.preventDefault();
   const type=kind.value==='custom'?custom.value.trim():kind.value;
   if(!type){tell('请输入自定义关系');return;}
   const ids=[c.id,other.value].sort(),key=pairKey(ids);
   data.links=data.links.filter(l=>pairKey(l.ids)!==key);
   data.links.push({ids,type,closeness:Number(closeness.value)});
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
 const d=sheet('birthSheet',profile?'编辑出生资料':'起盘工作台',`
 <form id="birthForm" class="form-grid" novalidate>
  <label>命主姓名<input name="name" value="${esc(f.name)}" maxlength="40" placeholder="姓名或昵称"></label>
  <label>性别<select name="gender"><option ${f.gender==='男'?'selected':''}>男</option><option ${f.gender!=='男'?'selected':''}>女</option></select></label>
  <label>历法<select name="calendar"><option value="solar">公历</option><option value="lunar" ${f.calendar==='lunar'?'selected':''}>农历</option></select></label>
  <label>出生日期<input name="date" value="${esc(f.dateStr||'')}" placeholder="YYYY-MM-DD"></label>
  <label>出生时刻<input name="clock" type="time" value="${esc(f.timeStr||'12:00')}"></label>
  <label>案例分组<select name="category">${options}</select></label>
  <label class="wide">出生城市<input name="city" value="${esc(city.label)}" placeholder="搜索城市，也可直接填写坐标" autocomplete="off"></label>
  <div id="cityMatches" class="rail wide" aria-label="城市搜索结果"></div>
  <label>纬度<input name="lat" type="number" step="any" value="${Number.isFinite(city.lat)?city.lat:''}" placeholder="−90 到 90"></label>
  <label>经度<input name="lon" type="number" step="any" value="${Number.isFinite(city.lon)?city.lon:''}" placeholder="−180 到 180"></label>
  <label>UTC 偏移<input name="tz" type="number" step="any" value="${esc(city.tz)}"></label>
  ${btn('使用当前位置','data-locate')}
  <div class="checks wide"><label><input name="unknown" type="checkbox" ${f.timeUnknown?'checked':''}>时辰未知</label><label><input name="solar" type="checkbox" ${f.useSolarTime?'checked':''}>真太阳时</label><label data-leap><input name="leap" type="checkbox" ${f.leapMonth?'checked':''}>闰月</label></div>
  <p class="wide muted" id="birthStatus" role="status"></p><button type="submit" class="wide primary">生成命盘</button>
 </form>
 <div class="rail" aria-label="历史案例">${state.cases.slice(0,5).map(c=>btn(c.name,`data-use-case="${esc(c.id)}"`)).join('')}${profile?btn('＋ 起新盘','data-new'):''}</div>`);
 const form=$('form',d),fields=form.elements,feedback=$('#birthStatus',d),matches=$('#cityMatches',d);
 const calendar=()=>{
  const lunar=fields.calendar.value==='lunar',value=fields.date.value;
  fields.date.type=lunar?'text':'date';fields.date.value=value;$('[data-leap]',d).hidden=!lunar;
 };
 fields.calendar.onchange=calendar;calendar();
 fields.unknown.onchange=()=>{fields.clock.disabled=fields.unknown.checked;};fields.unknown.onchange();
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
      fields.city.value=location.label||item.name;fields.lat.value=location.lat;fields.lon.value=location.lon;fields.tz.value=8;
      matches.replaceChildren();
     }catch(error){feedback.textContent=error.message;}
    };matches.append(b);
   }
  }catch{if(id===query)feedback.textContent='城市搜索暂不可用，可直接填写坐标';}
 };
 for(const k of ['lat','lon','tz'])fields[k].oninput=()=>{query++;matches.replaceChildren();};
 $('[data-locate]',d).onclick=()=>{
  const token=++query;
  const reply=(lat,lon)=>{
   if(token!==query||!d.open||!form.isConnected)return;
   if(!Number.isFinite(lat)||!Number.isFinite(lon)){feedback.textContent='定位未完成，可手动填写';return;}
   fields.lat.value=lat.toFixed(6);fields.lon.value=lon.toFixed(6);
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
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)||!/^\d{2}:\d{2}$/.test(timeStr)){feedback.textContent='请填写有效出生日期和时间';return;}
  const [h,mi]=timeStr.split(':').map(Number),name=fields.name.value.trim()||'未命名案例';
  const next={...profile,id:profile?.id??(crypto.randomUUID?.()||Date.now().toString()),name,category:fields.category.value,updatedAt:new Date().toISOString(),
   fields:{...splitDate(dateStr),dateStr,timeStr,h,mi,name,gender:fields.gender.value,calendar:fields.calendar.value,leapMonth:fields.calendar.value==='lunar'&&fields.leap.checked,
    timeUnknown:fields.unknown.checked,useSolarTime:fields.solar.checked,lateZishi:setting.lateZishi||'next-day',city:{lat,lon,tz,label:fields.city.value.trim()||'手动坐标'}}};
  const submit=$('[type=submit]',form);submit.disabled=true;feedback.textContent='正在排盘…';
  const token=++generation;flight?.abort();flight=new AbortController();
  try{
   const reading=await request('/api/console/reading',{birth:normalized(next)},flight.signal);
   if(token!==generation||!d.open||!form.isConnected)return;
   state.pending=false;installReading(next,reading);switchTab('chart');
  }catch(error){if(token===generation)feedback.textContent=error.message;}
  finally{if(token===generation){state.pending=false;submit.disabled=false;}}
 };
}
function caseDrawer(){
 const p=state.profile;
 const entries=[...state.recent.map(id=>state.cases.find(c=>c.id===id)).filter(Boolean),...state.cases.filter(c=>!state.recent.includes(c.id))].slice(0,5);
 const d=sheet('caseDrawer','快捷案例',`<div class="card"><span class="kicker">当前案例</span><h3>${esc(p?.name||'尚未选择案例')}</h3><p>${esc(p?.summary?.pillars||'')}</p><small>${esc(p?.fields?.dateStr||'')} ${esc(p?.fields?.timeStr||'')} ${esc(p?.fields?.city?.label||'')}</small></div>
 <div class="stack">${entries.map(c=>btn(c.name+' · '+(c.summary?.pillars||c.fields?.dateStr||''),`class="drawer-case" data-recent="${esc(c.id)}"`)).join('')}</div>
 <div class="drawer-accordion">${[
  ['天机排盘工坊',[['东方盘',['ziwei','bazi','qizheng']],['西洋盘',['west']]]],
  ['推运时空',[['西洋推运',['transit','secondary','tertiary','solar','lunar','firdaria']],['每日时空',['calendar']]]],
  ['易经古籍',[['卦象与经典',['yijing']]]],
  ['关系星系',[['双向案例',['galaxy','synastry']]]],
 ].map(([title,sections])=>`<details><summary>${title}</summary><div>${sections.map(([name,items])=>`<details><summary>${name}</summary><div class="tool-grid">${items.map(id=>btn(labels[id]||{transit:'行运',secondary:'次限',tertiary:'三限',solar:'日返',lunar:'月返',firdaria:'法达',galaxy:'关系图谱'}[id],`data-destination="${id}"`)).join('')}</div></details>`).join('')}</div></details>`).join('')}</div>
 <div class="rail">${btn('＋ 新建案例','class="primary" data-fresh')}${p?btn('编辑当前资料','data-edit'):''}</div>`);
 for(const b of d.querySelectorAll('[data-recent]'))b.onclick=()=>activate(state.cases.find(c=>c.id===b.dataset.recent));
 for(const b of d.querySelectorAll('[data-destination]'))b.onclick=()=>{
  const id=b.dataset.destination;
  if(id==='galaxy'){close(d);showGalaxy();return;}
  if(labels[id]){switchTab('chart',id);return;}
  state.chartState.west={mode:id,at:new Date(),result:null,token:0,pending:false,error:'',requested:false};
  switchTab('chart','west');
 };
 $('[data-fresh]',d).onclick=()=>{close(d);birthSheet(null);};
 if(p)$('[data-edit]',d).onclick=()=>{close(d);birthSheet(p);};
}

function profileTitle(){
 const p=state.profile,info=state.reading?.bazi.info;
 const late=(info?.correction.corrected?info.correction.hour:Number(p?.fields?.h??p?.fields?.timeStr?.split(':')[0]))===23;
 const badge=late?' · 晚子时'+((info?.lateZishi||p.fields.lateZishi)==='current-day'?'归当日':'归次日'):'';
 $('#activeProfile').textContent=p?'🌸 '+[p.name,p.summary?.yearDay,p.fields?.city?.label].filter(Boolean).join(' · ')+badge+' ▾':'🌸 开始排盘 ▾';
}
function insights(){
 const r=state.reading;
 if(!r){root.innerHTML='<p class="empty">激活案例后查看八字、紫微与西洋占星的综合报告。</p>';return;}
 const {bazi,ziwei,western}=r;
 const active=ziwei.decades.map(d=>[d.ageRange.join('–')+' 岁',d.yearRange.join('–'),d.palaceName]);
 root.innerHTML=`<section><h1>洞见</h1><p class="muted">${esc(state.profile.name)} · 三盘合参</p>
 <article class="card liquid-glass"><h2>性格与行动</h2><p>八字 ${esc(bazi.dayMaster.stem+bazi.dayMaster.element)}日主，扶助 ${bazi.strength.support.toFixed(1)}%，${bazi.strength.kind}；西方太阳 ${esc(western.planets[0].sign)}，第 ${western.planets[0].house} 宫；紫微命宫 ${esc(state.profile.summary.ziwei)}。</p><p>先用太阳落宫观察主要投入领域，再用八字扶助比例辨认资源需求。紫微命宫提供另一条处事风格线索。</p></article>
 <article class="card liquid-glass"><h2>职责、资源与人际</h2><p>官禄与财帛可分别观察职责和资源，西方天顶 ${esc(western.mc.sign)} 可对照事业表达，印度上升 ${esc(r.vedic.lagna)} 采用恒星黄道。</p><p>${esc(bazi.relationships.map(l=>l.pattern+l.type).join('、')||'本命未触发当前规则表中的干支关系')}</p></article>
 <article class="card liquid-glass"><h2>全生命周期 · 紫微大限</h2>${table(['虚岁','年份','大限宫'],active)}</article>
 ${Object.entries(r.report?.sections||{}).map(([name,lines])=>`<article class="card"><h2>${esc(reportTitle(name))}</h2>${lines.map(l=>`<p>${esc(l)}</p>`).join('')}</article>`).join('')}</section>`;
}
function reportTitle(key){
 return {'w-persona':'性格与天赋','w-career':'事业方向','w-wealth':'资源与财富','w-love':'情感关系','w-health':'生活节奏','z-palaces':'紫微十二宫','z-mutagen':'生年四化','w-risks':'长期课题','v-dasha':'印度大运'}[key]||'综合观察';
}
function preferences(){
 const s=state.settings;
 root.innerHTML=`<section><h1>我</h1>${soulCard(state.reading,state.profile?.name)}<article class="card"><h2>排盘口径</h2><form id="prefs" class="form-grid">
 <label class="wide">晚子时（23:00–24:00）<select name="late"><option value="next-day">归次日</option><option value="current-day" ${s.lateZishi==='current-day'?'selected':''}>归当日</option></select></label>
 <label>默认地点<input name="place" value="${esc(s.place)}"></label><label>UTC 偏移<input name="tz" type="number" step="any" value="${esc(s.tz??8)}"></label>
 <label>纬度<input name="lat" type="number" step="any" value="${esc(s.lat)}"></label><label>经度<input name="lon" type="number" step="any" value="${esc(s.lon)}"></label>
 <button class="wide primary">保存设置</button></form></article>
 <article class="card"><h2>本机案例</h2>${btn('导出备份','data-export')}${btn('导入备份','data-import')}<input type="file" accept="application/json" id="importBackup" hidden></article>
 <article class="card"><h2>计算说明</h2><p>紫微使用 Renhuai / iztro。专业西洋盘使用 Astronomy Engine 与 NASA JPL 小行星轨道资料。各模块使用独立规则，术数解读仅供传统文化参考。</p><p>八字、紫微、推运、古籍及案例在本机计算。iOS 版自带资源，网页首次载入后可离线打开。</p><a href="/assets/console/credits.html">来源与许可</a></article></section>`;
 $('#prefs').onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  const vals=['lat','lon','tz'].map(k=>f.get(k)===''?undefined:Number(f.get(k)));
  if(vals.some(v=>v!==undefined&&!Number.isFinite(v))||Math.abs(vals[0])>90||Math.abs(vals[1])>180||vals[2]<-12||vals[2]>14){tell('默认坐标或时区无效');return;}
  state.settings={lateZishi:f.get('late'),place:f.get('place'),lat:vals[0],lon:vals[1],tz:vals[2]??8};save(SETTINGS,state.settings);
  if(state.profile&&state.profile.fields.lateZishi!==state.settings.lateZishi)activate({...state.profile,fields:{...state.profile.fields,lateZishi:state.settings.lateZishi}},false);
  tell('设置已保存');
 };
 $('[data-export]',root).onclick=()=>download(JSON.stringify({format:'firstlight-cases',version:3,cases:state.cases,activeId:state.profile?.id,groups:state.groups,recent:state.recent,space:caseSpace()},null,2),'FirstLight-cases.json','application/json');
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
function toolPanel(){
 const d=sheet('toolSheet',state.tab==='chart'?labels[state.system]+' · 功能':'切换排盘体系',
  '<div id="viewTools"></div>'+(state.tab==='chart'&&state.reading?btn('分享长图','data-share-chart'):'')+'<h3>排盘体系</h3><div class="tool-grid system-picker">'+Object.entries(labels).map(([id,label])=>btn(label,`data-system="${id}" aria-pressed="${state.system===id}"`)).join('')+'</div>');
 for(const b of d.querySelectorAll('[data-system]'))b.onclick=()=>switchTab('chart',b.dataset.system);
 const share=$('[data-share-chart]',d);
 if(share)share.onclick=()=>{close(d);shareChart(root,$('#activeProfile').textContent).catch(e=>tell(e.message));};
 const host=$('#viewTools',d);
 if(state.tab==='chart'&&state.reading){
  if(state.system==='ziwei')ziweiTools(ctx,host);
  if(state.system==='bazi')baziTools(ctx,host);
  if(state.system==='west')westernTools(ctx,host);
 }
}
const definitions={
 日主:'出生日的天干，是十神关系和扶助比例的参照。',正官:'克日主且阴阳相异，常用来观察规则、责任和约束。',七杀:'克日主且阴阳相同，常用来观察压力、竞争和行动。',正印:'生日主且阴阳相异，常用来观察正规支持和学习。',偏印:'生日主且阴阳相同，常用来观察非标准的学习和支持。',比肩:'与日主同五行同阴阳，常用来观察同辈和自主性。',劫财:'与日主同五行异阴阳，常用来观察共享与竞争。',食神:'日主所生且阴阳相同，常用来观察输出与创造。',伤官:'日主所生且阴阳相异，常用来观察表达与打破常规。',正财:'日主所克且阴阳相异，常用来观察稳定资源。',偏财:'日主所克且阴阳相同，常用来观察流动资源与机会。',空亡:'以干支十位一旬计，两支未配天干，即为该旬空亡。',天乙贵人:'按年干或日干查出的地支标记，传统用来描述支持与援助。',驿马:'按三合局取对冲的生地，常用来观察移动、变换和外部往来。',咸池桃花:'按年支或日支查表，传统用来观察社交与吸引力。',华盖:'按三合局墓支取，常用来观察独处、专注和技艺。',羊刃:'阳日干的特定旺支，传统用来观察力量集中和张力。',劫煞:'按年支或日支所属三合局查表，传统用来观察竞争或突变。',天医:'以月支前一支取，属于传统辅助标记。',文昌:'按年干或日干查表，传统用来观察学习、书写和表达。',太极贵人:'按年干或日干查表，传统用来观察学习和钻研。'
};
const ctx={state,root,render,request,tell,sheet,close,birthSheet,normalized,switchTab,download,
 get birth(){return state.profile?normalized(state.profile):null;},
 explain(word,text){sheet('termSheet',word,`<p>${esc(text||definitions[word]||'这是传统术数的辅助标记，需要结合所在宫位、干支及同盘条件理解。')}</p>`);}
};
function render(){
 profileTitle();
 for(const b of $('#tabBar').children){if(b.dataset.tab===state.tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 if(state.tab==='cases'){renderCases();return;}
 if(state.tab==='insights'){insights();return;}
 if(state.tab==='me'){preferences();return;}
 if(!state.reading&&state.system!=='calendar'){
  root.innerHTML=`<p class="empty">${esc(state.pending?'正在读取命盘…':state.error||'点按顶部命主气泡开始排盘。')}</p>${state.error&&state.profile?btn('重试','data-retry'):''}`;
  const retry=$('[data-retry]',root);if(retry)retry.onclick=()=>activate(state.profile);
  return;
 }
 if(state.system==='ziwei')ziweiView(ctx);
 else if(state.system==='bazi')baziView(ctx);
 else if(state.system==='west')westernView(ctx);
 else extraView(ctx);
}
root.addEventListener('click',e=>{
 const b=e.target.closest('[data-term]');
 if(b){e.preventDefault();ctx.explain(b.dataset.term,b.dataset.explain);}
});
$('#activeProfile').onclick=()=>birthSheet(state.profile);
$('#caseDrawerButton').onclick=caseDrawer;
$('#toolsButton').onclick=toolPanel;
$('#tabBar').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)switchTab(b.dataset.tab);};
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
if('serviceWorker' in navigator)navigator.serviceWorker.register('/offline.js').catch(()=>{});
if(state.profile)activate(state.profile,false);else{render();birthSheet(null);}

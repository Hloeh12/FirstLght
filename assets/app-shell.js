(()=>{
'use strict';
const el=id=>document.getElementById(id), safe=esc, CASE_KEY='xy:cases:v2',SETTINGS='xy:settings:v2';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let customGroups=read('xy:case-groups',[]);const groups=()=>['我的','亲人','朋友','特别关注',...customGroups];
let cases=read(CASE_KEY,[]),settings=read(SETTINGS,{}),activeId=null,filter='全部',recent=[],currentTab='chart';
const state={activeProfile:read('xy_active_profile',null)};state.uiMode='input';state.isComputing=false;state.system='west';window.state=state;window.xyState=state;activeId=state.activeProfile?.id||null;
function updateActivePill(){const pill=el('activeProfilePill');pill.hidden=!state.activeProfile||currentTab!=='insights';pill.textContent=state.activeProfile?'🌸 正在查看：'+state.activeProfile.name+' · '+(state.activeProfile.pillarSummary||''):'';}
const inputSheet=el('inputSheet');
const nativeModal=typeof inputSheet.showModal==='function';
const inputBackdrop=el('inputBackdrop');
function setReadingMode(mode){
 state.uiMode=mode;
 const showInput=currentTab==='chart'&&(mode==='input'||mode==='editing');
 inputSheet.classList.toggle('onboarding',mode==='input');
 el('inputTitle').textContent=mode==='input'?'开启你的命盘':'修改生辰';
 el('closeInputSheet').hidden=mode==='input';
 if(showInput&&!inputSheet.hasAttribute('open')){
  document.dispatchEvent(new Event('closeContext'));
  el('halfSheet').hidden=true;el('sheetShade').hidden=true;
  if(nativeModal)inputSheet.showModal();
  else {inputSheet.setAttribute('open','');el('inputTitle').focus();}
 }else if(!showInput&&inputSheet.hasAttribute('open')){
  if(nativeModal)inputSheet.close();else inputSheet.removeAttribute('open');
 }
 document.body.classList.toggle('input-open',showInput);
 inputBackdrop.hidden=nativeModal||!showInput;
 el('btnContextAction').hidden=!chart||currentTab!=='chart';
 el('readingSummary').hidden=!chart;
 el('overviewBtn').hidden=!chart||currentTab!=='chart';
 el('brandTitle').hidden=!el('overviewBtn').hidden;
 el('resultsHost').hidden=!chart;
 el('readingAnalysis').hidden=!chart;
 el('readingSummary').setAttribute('aria-expanded',String(mode==='editing'&&showInput));
 if(chart){
  const p=state.activeProfile,b=chart.bazi;
  const yearDay=b?[b.pillars[0],b.pillars[2]].map((x,i)=>x.stem+x.branch+(i?'日':'年')).join(' '):'';
  el('readingSummary').textContent=['🌸 '+(p?.name||'当前命主'),yearDay,p?.fields.city?.label||'手动坐标'].filter(Boolean).join(' · ')+' ▾';
 }
 el('overviewBtn').textContent=({west:'西方星盘',bazi:'东方八字',ziwei:'天纪紫微',synastry:'双人合盘',energy:'能量脉轮',timeline:'时间轨迹',report:'模板报告',vedic:'印度盘',raw:'原始数据'}[state.system]||'盘面')+' ▾';
}
function restoreProfile(p){
 invalidate('a');
 applyProfile({fields:p.fields,place:p.fields.city?.label});
 el('q').value=p.fields.city?.label||'';
 el('profileName').value=p.name;
 el('time').disabled=!!p.fields.timeUnknown;
 el('solar').checked=!!p.fields.useSolarTime;
}
function closeInput(){
 if(state.uiMode!=='editing')return;
 if(el('castBtn').disabled){
  chartRequest++;
  state.isComputing=false;
  enableCast();
 }
 if(state.activeProfile)restoreProfile(state.activeProfile);
 setReadingMode('viewing');
 el('readingSummary').focus();
}
state.setReadingMode=setReadingMode;
el('readingSummary').onclick=()=>{
 if(state.uiMode==='editing'){closeInput();return;}
 if(state.activeProfile)restoreProfile(state.activeProfile);
 el('inputError').textContent='';
 setReadingMode('editing');
};
el('closeInputSheet').onclick=closeInput;
inputSheet.addEventListener('cancel',e=>{e.preventDefault();closeInput()});
inputSheet.addEventListener('click',e=>{if(e.target===inputSheet)closeInput()});
inputBackdrop.onclick=closeInput;
if(!nativeModal)document.addEventListener('keydown',e=>{
 if(!inputSheet.hasAttribute('open'))return;
 if(e.key==='Escape'){closeInput();return;}
 if(e.key!=='Tab')return;
 const controls=[...inputSheet.querySelectorAll('button,input,select,summary')]
  .filter(node=>!node.disabled&&node.getClientRects().length);
 const first=controls[0],last=controls.at(-1);
 if(!controls.includes(document.activeElement)||(e.shiftKey?document.activeElement===first:document.activeElement===last)){
  e.preventDefault();
  (e.shiftKey?last:first)?.focus();
 }
});
let sheetStart;
const handle=inputSheet.querySelector('.sheet-handle');
handle.addEventListener('touchstart',e=>{sheetStart=e.touches[0].clientY},{passive:true});
handle.addEventListener('touchend',e=>{if(e.changedTouches[0].clientY-sheetStart>60)closeInput()},{passive:true});
el('sheetCases').onclick=()=>rootTab('cases');
function syncReadingAnalysis(){
 el('readingAnalysis').innerHTML='<h3>洞见报告</h3>'+el('insightSummary').innerHTML+el('reportBox').innerHTML;
 el('readingAnalysis').classList.add('card');
}
function enableCast(){el('castBtn').disabled=false;el('castBtn').textContent='生成命盘';}
function setChartStatus(message='',retry=false){
 el('readingMessage').textContent=message;
 el('readingStatus').hidden=!message;
 el('retryChart').hidden=!retry;
}
const persist=()=>{try{localStorage.setItem(CASE_KEY,JSON.stringify(cases));return true}catch{alert('本机存储已满，请先导出备份');return false}};
const casePage=el('pageCases'),chartPage=el('pageChart'),insights=el('pageInsights'),me=el('pageMe');
for(const selector of ['#prov','#citySel','#countySel','#bProv','#bCity','#bCounty','#q','#bSearch']){const node=document.querySelector(selector);if(node)node.required=false;}
const bar=el('tabBar');
function rootTab(id){closeDrawer();const openSheet=document.getElementById('halfSheet');if(openSheet)openSheet.hidden=true;const openShade=document.getElementById('sheetShade');if(openShade)openShade.hidden=true;document.dispatchEvent(new Event('closeContext'));currentTab=id;updateActivePill();[casePage,chartPage,insights,me].forEach(p=>p.classList.toggle('active',p.id===({cases:'pageCases',chart:'pageChart',insights:'pageInsights',me:'pageMe'}[id])));bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.root===id)));setReadingMode(state.uiMode);if(id==='cases')renderCases();if(id==='insights')renderInsights();window.scrollTo?.({top:0,behavior:'smooth'});}
bar.onclick=e=>{const b=e.target.closest('[data-root]');if(b)rootTab(b.dataset.root)};
function showSystem(id){state.system=id;rootTab('chart');setReadingMode(state.uiMode);el('resultsHost').querySelectorAll(':scope > section').forEach(s=>s.classList.toggle('on',s.id===id));}
const oldTabs=el('tabs').onclick;el('tabs').onclick=e=>{oldTabs(e);const b=e.target.closest('[data-t]');if(b)showSystem(b.dataset.t)};
const shade=el('sheetShade'),sheet=el('halfSheet');
function closeSheet(){sheet.hidden=true;shade.hidden=true;el('overviewBtn').focus()};el('overviewBtn').onclick=()=>{sheet.hidden=false;shade.hidden=false;el('closeSheet').focus()};el('closeSheet').onclick=closeSheet;shade.onclick=closeSheet;let sheetY=0;sheet.addEventListener('touchstart',e=>{sheetY=e.touches[0].clientY},{passive:true});sheet.addEventListener('touchend',e=>{if(e.changedTouches[0].clientY-sheetY>90)closeSheet()},{passive:true});
sheet.onclick=e=>{const b=e.target.closest('[data-system]');if(b){showSystem(b.dataset.system);closeSheet();}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)closeSheet();if(e.key==='Tab'&&!sheet.hidden){const items=[...sheet.querySelectorAll('button,input')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
function tags(c){const b=c?.bazi,w=c?.western,z=c?.ziwei;return [b?'日主'+b.dayMaster.stem+b.dayMaster.element+' · '+b.strength.reference:null,w?'日'+w.planets.find(p=>p.name==='太阳')?.sign+' 月'+w.planets.find(p=>p.name==='月亮')?.sign+' 升'+w.asc.sign:null,z?.palaces?.find(p=>p.name==='命宫')?.majorStars.map(s=>s.name).join('、')].filter(Boolean)}
function renderCases(){const q=el('caseSearch').value.trim();el('caseFilters').innerHTML=['全部',...groups(),'+分组'].map(t=>'<button type="button" data-filter="'+safe(t).replace(/"/g,'&quot;')+'" class="group-chip '+(filter===t?'active':'')+'">'+t+'</button>').join('');const list=cases.filter(c=>(filter==='全部'||(c.category||'我的')===filter)&&(!q||[c.name,c.fields.dateStr,...(c.tags||[])].join(' ').includes(q)));el('caseList').replaceChildren();if(!list.length){el('caseList').innerHTML='<div class="empty-state">这里还没有案例<br>去排盘页生成第一张命盘</div>';return;}for(const c of list){const card=document.createElement('article');card.className='card case-card'+(state.activeProfile?.id===c.id?' is-active':'');card.innerHTML='<div class="case-title">'+safe(c.name)+(state.activeProfile?.id===c.id?' <span class="tag">当前使用中</span>':'')+'</div><div class="case-meta">'+safe(c.fields.dateStr)+' · '+safe(c.fields.timeStr)+' · '+safe(c.fields.city?.label||'手动坐标')+'</div><div class="case-tags">'+(c.tags||[]).map(t=>'<span class="tag">'+safe(t)+'</span>').join('')+'</div><select aria-label="案例分类">'+groups().map(t=>'<option'+(t===(c.category||'我的')?' selected':'')+'>'+t+'</option>').join('')+'</select><div class="case-actions"><button type="button" data-load>使用此盘</button><button type="button" class="case-delete" data-delete>删除</button></div>';card.querySelector('.case-title').onclick=()=>loadCase(c);card.onclick=e=>{if(!e.target.closest('button,select,.case-title'))loadCase(c);};card.querySelector('select').onchange=e=>{c.category=e.target.value;persist();renderCases()};card.querySelector('[data-load]').onclick=()=>loadCase(c);card.querySelector('[data-delete]').onclick=()=>deleteCase(c.id);let start=0;card.addEventListener('touchstart',e=>start=e.touches[0].clientX,{passive:true});card.addEventListener('touchend',e=>{if(start-e.changedTouches[0].clientX>90)deleteCase(c.id)},{passive:true});el('caseList').append(card)}}
function deleteCase(id){if(!confirm('删除这个本地案例？建议先导出备份。'))return;cases=cases.filter(c=>c.id!==id);if(activeId===id){chartRequest++;chart=null;state.isComputing=false;activeId=null;state.activeProfile=null;localStorage.removeItem('xy_active_profile');state.uiMode='input';enableCast();el('insightSummary').textContent='生成命盘后，在这里查看跨体系分析。';setReadingMode('input');updateActivePill();setChartStatus();}persist();renderCases();renderDrawer()}
function loadCase(c){
 state.activeProfile=c;
 localStorage.setItem('xy_active_profile',JSON.stringify(c));
 activeId=c.id;
 chart=null;
 restoreProfile(c);
 invalidate('a');
 recent=[c.id,...recent.filter(x=>x!==c.id)].slice(0,8);
 state.uiMode='viewing';
 rootTab('chart');
 renderDrawer();
 castProfile({...inp(),lateZishi:c.fields.lateZishi||settings.lateZishi||'next-day'},true);
}
function newCase(){
 chartRequest++;
 chart=null;
 el('insightSummary').textContent='生成命盘后，在这里查看跨体系分析。';
 state.isComputing=false;
 activeId=null;
 state.activeProfile=null;
 localStorage.removeItem('xy_active_profile');
 el('f').reset();
 syncCalendar();
 el('time').disabled=false;
 el('q').value='';
 lastPlaceLabel='';
 invalidate('a');
 applyDefaults();
 el('inputError').textContent='';
 enableCast();
 setChartStatus();
 state.uiMode='input';
 rootTab('chart');
 renderDrawer();
}
function renderDrawer(){el('appDrawer').innerHTML='<button type="button" id="drawerClose">关闭 ×</button><div class="brand-avatar">'+safe((cases.find(c=>c.id===activeId)?.name||'星')[0])+'</div><h2>'+safe(cases.find(c=>c.id===activeId)?.name||'新的命盘')+'</h2><p class="note">快捷案例</p><div class="recent-cases" id="drawerRecent"></div><button type="button" id="newCase">＋ 新建排盘</button><button type="button" id="drawerImport">导入档案</button>';el('appDrawer').onclick=null;el('drawerClose').onclick=closeDrawer;for(const c of [...cases].sort((a,b)=>{const ai=recent.indexOf(a.id),bi=recent.indexOf(b.id);return (ai<0?99:ai)-(bi<0?99:bi)}).slice(0,8)){const b=document.createElement('button');b.textContent=c.name;b.onclick=()=>loadCase(c);el('drawerRecent').append(b)}el('newCase').onclick=newCase;el('drawerImport').onclick=()=>el('importFile').click()}
const inputOriginal=inp;inp=function(){return {...inputOriginal(),name:el('profileName').value.trim(),lateZishi:settings.lateZishi||'next-day'}};
function saveCurrent(fields){
 const entry={
  id:activeId||Date.now().toString(36),name:fields.name||'未命名 '+fields.dateStr,fields,
  pillarSummary:chart.bazi?.pillars.map(p=>p.stem+p.branch).join(' '),
  tags:tags(chart),category:cases.find(c=>c.id===activeId)?.category||'我的',
  updatedAt:new Date().toISOString()
 };
 cases=[entry,...cases.filter(c=>c.id!==entry.id)];
 activeId=entry.id;
 state.activeProfile=entry;
 localStorage.setItem('xy_active_profile',JSON.stringify(entry));
 persist();
}
async function castProfile(fields,silent){
 const token=++chartRequest;
 state.isComputing=true;
 el('castBtn').disabled=true;
 el('castBtn').textContent='正在起盘…';
 el('inputError').textContent=silent?'':'正在生成命盘…';
 setChartStatus(silent?'正在载入命盘…':'');
 try{
  await calculateReading(fields,token,()=>{
   enableCast();
   if(!silent)saveCurrent(fields);
   updateActivePill();
   renderCases();
   renderDrawer();
   renderInsights();
   syncReadingAnalysis();
   setReadingMode('viewing');
   setChartStatus();
   el('inputError').textContent='';
   window.scrollTo?.(0,0);
  },()=>{
   renderInsights();
   syncReadingAnalysis();
  });
 }catch(error){
  if(token!==chartRequest)return;
  if(silent){
   setChartStatus('命盘载入失败：'+error.message,true);
   el('retryChart').onclick=()=>castProfile(fields,true);
  }else el('inputError').textContent='排盘失败：'+error.message;
 }finally{
  if(token===chartRequest){
   state.isComputing=false;
   enableCast();
  }
 }
}
function renderInsights(){if(!chart)return;const a=chart.analysis,b=chart.bazi,z=chart.ziwei;el('insightSummary').innerHTML='<h3>'+safe(state.activeProfile?.name||'当前命盘')+'</h3><div class="insight-line">西方结构：'+safe(a?.chartRuler?.planet)+' · '+safe((a?.patterns||[]).map(p=>p.type).join('、')||'未识别特殊格局')+'</div><div class="insight-line">八字参考：'+safe(b?.dayMaster?.stem)+' · '+safe(b?.strength?.reference)+'<p class="note">旺衰为简化参考；喜用神尚未推断。</p></div><div class="insight-line">紫微格局：'+safe((z?.patterns||[]).map(p=>p.name).join('、')||'未识别基础格局')+'</div><div class="insight-line">紫微大限：'+safe(z?.palaces?.map(p=>p.decadal?p.name+' '+p.decadal.range.join('–')+'岁':'').filter(Boolean).join('；')||'暂无')+'</div>';}
el('f').onsubmit=e=>{
 e.preventDefault();
 if(el('castBtn').disabled)return;
 for(const id of ['lat','lon']){
  const field=el(id);
  if(field.value.trim()===''||!field.reportValidity()){
   el('inputError').textContent='请输入有效经纬度';
   field.focus();
   return;
  }
 }
 castProfile(inp(),false);
};
el('caseSearch').oninput=renderCases;el('caseFilters').onclick=e=>{const b=e.target.closest('[data-filter]');if(b){if(b.dataset.filter==='+分组'){const name=prompt('新分组名称（最多12字）')?.trim();if(name&&/^[\p{L}\p{N} ·_-]{1,12}$/u.test(name)&&!groups().includes(name)&&name!=='全部'){customGroups.push(name);localStorage.setItem('xy:case-groups',JSON.stringify(customGroups));filter=name;}}else{filter=b.dataset.filter;}renderCases()}};
insights.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>el('questionText').value=b.dataset.question);el('askQuestion').onclick=async()=>{if(!chart){el('questionStatus').textContent='请先生成命盘';return;}if(!el('questionText').value.trim()){el('questionStatus').textContent='请输入问题';return;}try{const r=await fetch('/api/report',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...(chart.birthRequest||inp()),question:el('questionText').value.trim()})});el('questionStatus').textContent=r.status===501?'当前咨询服务尚未接入（HTTP 501），没有生成解读。':r.ok?'请求已提交，请查看服务返回。':'咨询请求失败（'+r.status+'）';}catch{el('questionStatus').textContent='网络不可用，请稍后重试'}};
function applyDefaults(){if(settings.place){el('q').value=settings.place;lastPlaceLabel=settings.place}if(settings.lat!==undefined)el('lat').value=settings.lat;if(settings.lon!==undefined)el('lon').value=settings.lon;if(settings.tz!==undefined)el('tz').value=settings.tz}
for(const [id,key] of [['defaultPlace','place'],['defaultLat','lat'],['defaultLon','lon'],['defaultTz','tz'],['lateZiPreference','lateZishi']])el(id).value=settings[key]??(key==='lateZishi'?'next-day':key==='tz'?8:'');
el('saveSettings').onclick=()=>{for(const id of ['defaultLat','defaultLon','defaultTz'])if(!el(id).reportValidity())return;settings={place:el('defaultPlace').value.trim(),lateZishi:el('lateZiPreference').value};for(const [key,id] of [['lat','defaultLat'],['lon','defaultLon'],['tz','defaultTz']])if(el(id).value!=='')settings[key]=Number(el(id).value);localStorage.setItem(SETTINGS,JSON.stringify(settings));el('settingsStatus').textContent='已保存，新建排盘时生效'};
el('exportCases').onclick=()=>{const blob=new Blob([JSON.stringify({format:'firstlight-cases',version:2,exportedAt:new Date().toISOString(),cases,settings},null,2)],{type:'application/json'});const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='FirstLight-cases.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};el('importCases').onclick=()=>el('importFile').click();
el('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('备份文件超过 5 MB');const data=JSON.parse(await file.text());if(data.format!=='firstlight-cases'||data.version!==2||!Array.isArray(data.cases)||data.cases.length>1000)throw new Error('备份格式不支持');for(const c of data.cases){if(typeof c.id!=='string'||typeof c.name!=='string'||!c.fields||!/^\d{4}-\d{2}-\d{2}$/.test(c.fields.dateStr)||!Number.isFinite(c.fields.city?.lat)||!Number.isFinite(c.fields.city?.lon)||Math.abs(c.fields.city.lat)>90||Math.abs(c.fields.city.lon)>180)throw new Error('案例字段无效');}for(const c of data.cases){c.tags=Array.isArray(c.tags)?c.tags.filter(x=>typeof x==='string').slice(0,12):[];c.category=groups().includes(c.category)?c.category:'我的';}const ids=new Set(cases.map(c=>c.id));cases.push(...data.cases.filter(c=>!ids.has(c.id)));persist();renderCases();renderDrawer();alert('案例已合并导入')}catch(e){alert('导入失败：'+e.message)}finally{e.target.value=''}};
// Migrate existing saved profiles without removing the original backup.
if(!cases.length){cases=getProfiles().filter(p=>p.fields?.city).map(p=>({...p,tags:[],category:'我的'}));if(cases.length)persist()}
for(const id of ['lat','lon','blat','blon']){el(id).step='any';el(id).min=id.includes('lat')?'-90':'-180';el(id).max=id.includes('lat')?'90':'180';el(id).setCustomValidity('')}
el('timing').insertAdjacentHTML('beforebegin','<p id="solarPreview" class="note" style="grid-column:1/-1" aria-live="polite"></p>');let previewTimer,previewSeq=0;el('f').addEventListener('input',()=>{clearTimeout(previewTimer);const seq=++previewSeq;previewTimer=setTimeout(async()=>{if(!el('solar').checked){el('solarPreview').textContent='当前使用钟表时间';return;}try{const r=await post('/api/ziwei',inp());if(seq!==previewSeq)return;const c=r.correction;el('solarPreview').textContent=c?'真太阳时 '+String(c.hour).padStart(2,'0')+':'+String(c.minute).padStart(2,'0')+' · 日期偏移 '+c.dayOffset+' 天（排盘另按子时偏好换日）':'时间校正暂不可用';}catch{if(seq===previewSeq)el('solarPreview').textContent='时间预览暂不可用，不影响手动排盘';}},450)});
for(const c of cases){const old=c.category;c.category=({'家人':'亲人','好友':'朋友','客户':'特别关注','未分类':'我的'})[old]||old||'我的';}applyDefaults();renderCases();renderDrawer();if(state.activeProfile)loadCase(state.activeProfile);else rootTab('chart');
})();



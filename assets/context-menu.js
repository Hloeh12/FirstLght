(()=>{
const el=id=>document.getElementById(id);let active='west',square=false;
const button=el('btnContextAction');
const shade=document.createElement('div');shade.id='contextShade';shade.hidden=true;const menu=document.createElement('div');menu.id='contextMenu';menu.hidden=true;menu.className='shell-glass';menu.setAttribute('role','dialog');menu.setAttribute('aria-label','盘面功能');document.body.append(shade,menu);
const options={bazi:['大运流年速查','五行强弱分布','地支十神藏干'],west:['本命圆盘/方盘切换','相位容许度调节','四元素占比'],synastry:['双人比较盘','中点盘','契合度雷达']};
function close(){menu.hidden=true;shade.hidden=true;button.setAttribute('aria-expanded','false')};document.addEventListener('closeContext',close);shade.onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
button.onclick=()=>{
 active=el('resultsHost').querySelector('section.on')?.id||'ziwei';
 menu.replaceChildren();
 const add=(label,action)=>{
  const item=document.createElement('button');
  item.type='button';
  item.textContent=label;
  item.onclick=action;
  menu.append(item);
  return item;
 };
 add('分享长图',()=>{close();shareChartImage().catch(error=>show('分享失败：'+error.message));});
 if(active==='ziwei'&&chart?.ziwei?.palaces){
  for(const [type,label] of Object.entries({heaven:'天盘',earth:'地盘',human:'人盘'})){
   const item=add(label,()=>{close();changeZiweiType(type);});
   item.setAttribute('aria-pressed',String(chart.ziwei.astroType===type));
  }
 }
 for(const [i,label] of (options[active]||[]).entries()){
  add(label,()=>{close();run(i).catch(e=>show('操作未完成：'+e.message))});
 }
 menu.hidden=false;
 shade.hidden=false;
 button.setAttribute('aria-expanded','true');
 menu.querySelector('button')?.focus();
};
function show(text){let box=el('contextResult');if(!box){box=document.createElement('div');box.id='contextResult';box.className='card'}el(active)?.append(box);box.textContent=text;box.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
function requireChart(){if(!chart)throw new Error('请先生成命盘')}
function squareView(){const box=el('westBox'),svg=box.querySelector('svg');let grid=el('squareWest');if(!grid){grid=document.createElement('div');grid.id='squareWest';grid.className='square-west';for(let h=1;h<=12;h++){const cell=document.createElement('div');cell.textContent=h+' 宫\n'+chart.western.planets.filter(p=>p.house===h).map(p=>p.name+' '+p.sign).join('、');grid.append(cell)}svg?.parentNode.insertBefore(grid,svg)}square=!square;grid.hidden=!square;if(svg)svg.style.display=square?'none':'block'}
async function run(i){requireChart();if(active==='bazi'){const b=chart.bazi;if(i===0)show('起运 '+b.luck.startAge+' 岁\n'+b.luck.cycles.map(c=>c.startYear+' '+c.stem+c.branch+' '+c.age+'岁').join('\n')+'\n流年：'+b.flowYears.map(y=>y.year+' '+y.stem+y.branch).join('、'));if(i===1)show(Object.entries(b.elementPercentages).map(([k,v])=>k+' '+v+'%').join('\n')+'\n'+b.strength.reference+'（简化加权参考）');if(i===2)show(b.pillars.map(p=>p.name+' '+p.stem+p.branch+'：'+b.hiddenStems[p.name].map(s=>s.stem+' '+s.rank+' '+s.tenGod).join('、')).join('\n'));return;}
if(active==='west'){if(i===0)squareView();if(i===2)show(Object.entries(chart.analysis.elements.percentages).map(([k,v])=>k+' '+Math.round(v)+'%').join('\n'));if(i===1){let panel=el('orbSetting');if(panel){panel.remove();return;}panel=document.createElement('div');panel.id='orbSetting';panel.innerHTML='<label>相位最大容许度：<output>6</output>° <input type="range" min="1" max="10" step="0.5" value="6"></label><p class="note">仅调整当前西方盘的相位显示，不改变出生参数。</p>';el('westBox').prepend(panel);panel.querySelector('input').oninput=e=>{const limit=+e.target.value;const ps=chart.western.planets,list=[];for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++){let sep=Math.abs(ps[a].lon-ps[b].lon);sep=Math.min(sep,360-sep);for(const [angle,type] of [[0,'合相'],[60,'六分相'],[90,'四分相'],[120,'三分相'],[180,'对分相']])if(Math.abs(sep-angle)<=limit){list.push({a:ps[a].name,b:ps[b].name,angle,type,orb:Math.abs(sep-angle)});break;}}const west={...chart.western,aspects:list};renderWest(west,chart.analysis);el('westBox').prepend(panel);panel.querySelector('output').textContent=limit;};}return;}
if(active==='synastry'){if(i<2){el('mode').value=i===0?'synastry':'composite';el('btnSyn').click();}else{el('mode').value='synastry';el('btnSyn').click();show('正在计算双人比较盘；评分采用现有印度八科 36 分制，查看下方合盘结果。')}return;}show('当前功能结果已显示。')}
})();

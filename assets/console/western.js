import {localDisplayTime} from './now.js';
import {aspectBrowser,bindAspectBrowser} from './aspects.js';
import {todaySky} from '../../src/today-sky.mjs';
import {bindWheel} from './wheel-gesture.js';
import {$,esc,btn,stored,save,table,bars,symbols,zodiacNames,selectedRails} from './ui.js';

const bodies={
 sun:'太阳',moon:'月亮',mercury:'水星',venus:'金星',mars:'火星',jupiter:'木星',saturn:'土星',uranus:'天王星',neptune:'海王星',pluto:'冥王星',
 asc:'上升 ASC',dsc:'下降 DSC',mc:'天顶 MC',ic:'天底 IC',north:'北交点',south:'南交点',fortune:'福点',vertex:'宿命点',
 chiron:'凯龙星',lilith:'莉莉丝',juno:'婚神星',vesta:'灶神星',pallas:'智神星',ceres:'谷神星'
};
const groups=[['经典十大主星',Object.keys(bodies).slice(0,10)],['轴线与虚点',Object.keys(bodies).slice(10,18)],['半人马与小行星',Object.keys(bodies).slice(18)]];
const houses={placidus:'Placidus 普拉西德',whole:'Whole Sign 整宫',koch:'Koch 柯赫',equal:'Equal 等宫',regiomontanus:'Regiomontanus 芮氏',campanus:'Campanus 坎帕努斯',porphyry:'Porphyry 波菲利'};
const modes={natal:'本命',sky:'天象',transit:'行运',secondary:'次限',tertiary:'三限',solar:'日返',lunar:'月返',firdaria:'法达',profection:'小限'};
const presets={default:'默认标准',strict:'古典严格',custom:'自定义'};
const orbLabels={0:'合相',30:'半六合',45:'半刑',60:'六合',90:'刑相',120:'三合',135:'补八分',150:'梅花相',180:'对冲'};
const defaultOrbs={0:8,30:2,45:2,60:5,90:7,120:7,135:2,150:2,180:8};
const key='xy_astro_config';
const defaultCfg={house:'placidus',zodiac:'tropical',ayan:'lahiri',visible:Object.keys(bodies).slice(0,16),node:'true',preset:'default',orbs:defaultOrbs,phaseWeight:false,nominalAge:false};
const cfg=()=>({...defaultCfg,...stored(key,{})});
const norm=x=>((x%360)+360)%360;
const pad=x=>String(x).padStart(2,'0');
const dms=d=>d.degrees+'°'+pad(d.minutes)+'′'+pad(d.seconds)+'″';
const dateTime=localDisplayTime;
const aspectColors={0:'#d192cd',30:'#cb87ac',45:'#df76a1',60:'#77aa99',90:'#eb5e91',120:'#7aaf9c',135:'#df76a1',150:'#b484bf',180:'#ac376a'};
const stateOf=ctx=>ctx.state.chartState.west??={mode:'natal',at:new Date(),result:null,token:0,pending:false,error:'',requested:false};
function spaced(planets,min){
 const list=planets.map(p=>({...p,plot:norm(p.lon)})).sort((a,b)=>a.plot-b.plot);
 if(list.length<2)return list;
 let cut=0,max=-1;
 for(let i=0;i<list.length;i++){
  const gap=norm(list[(i+1)%list.length].plot-list[i].plot);
  if(gap>max){max=gap;cut=i+1;}
 }
 const rotated=[...list.slice(cut),...list.slice(0,cut)];
 for(let i=1;i<rotated.length;i++){
  if(rotated[i].plot<rotated[0].plot)rotated[i].plot+=360;
  rotated[i].plot=Math.max(rotated[i].plot,rotated[i-1].plot+min);
 }
 const shift=rotated.reduce((sum,p)=>sum+norm(p.plot-p.lon),0)/rotated.length;
 for(const p of rotated)p.plot-=shift;
 return rotated;
}
function radialLayout(inner,outer,xy){
 const placed=spaced(inner,16).map(p=>({...p,radius:117,outer:false}));
 const near=(a,b)=>Math.abs(norm(a-b+180)-180);
 const box=(lon,radius)=>{const [x,y]=xy(lon,radius);return [x,y+4];};
 const overlaps=(p,lon,radius)=>{
  const a=box(p.plot,p.radius),b=box(lon,radius);
  return Math.abs(a[0]-b[0])<34&&Math.abs(a[1]-b[1])<23;
 };
 for(const p of spaced(outer,16)){
  const conjunction=inner.some(n=>near(p.lon,n.lon)<6);
  const radii=conjunction?[151,137]:[137,151];
  let candidate;
  for(const delta of [0,4,-4,8,-8,12,-12,16,-16,20,-20,24,-24,32,-32,40,-40,48,-48,60,-60,75,-75,90,-90]){
   for(const radius of radii){
    const lon=p.plot+delta;
    if(!placed.some(q=>overlaps(q,lon,radius))){candidate={plot:lon,radius};break;}
   }
   if(candidate)break;
  }
  placed.push({...p,...(candidate??{radius:151}),outer:true});
 }
 return placed;
}
const wheelBodies=data=>data.planets.filter(p=>!['asc','dsc','mc','ic'].includes(p.key));
export function wheel(r){
 const a=r.chart,b=r.outer,c=220;
 const angle=lon=>(180-norm(lon-a.axes.asc))*Math.PI/180;
 const xy=(lon,rad)=>[c+rad*Math.cos(angle(lon)),c-rad*Math.sin(angle(lon))];
 const pos=(lon,rad)=>xy(lon,rad).join(',');
 const line=(p,q,style)=>`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" ${style}/>`;
 const label=(lon,rad,text,style='')=>{
  const [x,y]=xy(lon,rad);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ${style}>${esc(text)}</text>`;
 };
 const aspectLayer=(list,outer)=>{
  const from=outer?b.planets:a.planets,to=a.planets;
  return list.filter(x=>[0,60,90,120,180].includes(x.angle)).map(x=>{
   const p=from.find(y=>y.key===x.aKey),q=to.find(y=>y.key===x.bKey);
   return p&&q?line(xy(p.lon,outer?135:107),xy(q.lon,107),`class="wheel-aspect" data-aspect-from="${outer?'outer':'inner'}-${p.key}" data-aspect-to="inner-${q.key}" stroke="${aspectColors[x.angle]}" ${x.angle===180?'stroke-dasharray="4 3"':''}`):'';
  }).join('');
 };
 const ticks=Array.from({length:360},(_,i)=>line(xy(i,202),xy(i,i%30===0?177:i%10===0?194:i%5===0?197:200),`stroke="#b58ba7" stroke-width="${i%30===0?1:.42}"`)).join('');
 const circles=[202,177,161,135,107].map((rad,i)=>`<circle cx="${c}" cy="${c}" r="${rad}" fill="${i%2?'#fffbfd':'#f8ebf3'}" stroke="#d6b3c9" stroke-width="1"/>`).join('');
 const houses=a.cusps.map((lon,i)=>{
  const mid=lon+norm(a.cusps[(i+1)%12]-lon)/2;
  return line(xy(lon,162),xy(lon,0),'stroke="#e2c7d9" stroke-width=".65"')+label(mid,169,'第'+(i+1)+'宫','font-size="7.6" fill="#7e5372"');
 }).join('');
 const axes=Object.entries(a.axes).filter(([k])=>r.mode==='composite'||a.planets.some(p=>p.key===k)).map(([key,lon])=>
  line(xy(lon,161),xy(lon,104),'stroke="#a15781" stroke-width="1.4"')+label(lon,157,({asc:'上升 ASC',dsc:'下降 DSC',mc:'天顶 MC',ic:'天底 IC'})[key],'font-size="7" font-weight="750" fill="#8b315e"')).join('');
 const placements=radialLayout(wheelBodies(a),b?wheelBodies(b):[],xy);
 const stars=placements.map(p=>{
  const anchor=p.outer?135:104,color=p.outer?'#a84575':'#8a4f91';
  const [x,y]=xy(p.lon,anchor),[lx,ly]=xy(p.plot,p.radius);
  const degree=p.degree.degrees+'°'+pad(p.degree.minutes)+'′';
  return `<g data-wheel-body="${p.outer?'outer':'inner'}" data-lon="${p.lon}" data-radius="${p.radius}">
   <title>${esc(p.name+' '+p.sign+' '+dms(p.degree))}</title><circle cx="${x}" cy="${y}" r="1.7" fill="${color}"/>`+
   line([x,y],[lx,ly],`stroke="${color}" stroke-opacity=".5" stroke-width=".65"`)+
   `<g transform="translate(${lx} ${ly})"><g class="wheel-body-glyph" role="button" tabindex="0" aria-pressed="false" data-wheel-focus="${p.outer?'outer':'inner'}-${p.key}" aria-label="${p.outer?'行运':'本盘'} ${esc(p.name)}">
   <g class="wheel-star-visual"><circle class="wheel-star-halo" r="12" cy="2"/><circle class="wheel-star-hit" r="13" cy="2"/>
   <text y="0" text-anchor="middle" dominant-baseline="central" font-size="8.5" font-weight="650" fill="${color}">${esc(p.symbol+' '+p.name)}</text>
   <text y="10" text-anchor="middle" dominant-baseline="central" font-size="7.4" fill="${color}">${degree}</text></g></g></g></g>`;

 }).join('');
 return `<svg id="westernChart" class="wheel" viewBox="0 0 440 440" role="group" aria-label="${b?'本命与行运双圈圆盘':'西洋占星圆盘'}">${circles}<g class="wheel-ring">${ticks}
 ${symbols.map((s,i)=>label(i*30+15,184,s+'\uFE0E','font-size="13" fill="#8b557b"')+label(i*30+15,195,zodiacNames[i],'font-size="7" fill="#8b557b"')).join('')}${houses}
 ${aspectLayer(b?r.cross:a.aspects,!!b)}${axes}
 ${r.profection?`<path d="M220 220 L${pos(r.profection.wholeStart+(r.profection.house-1)*30,161)} A161 161 0 0 1 ${pos(r.profection.wholeStart+r.profection.house*30,161)} Z" fill="#d184b238"/>`:''}${stars}</g></svg>`;
}
function matrix(r){
 const {chart,outer,cross}=r;
 const p=chart.planets;
 const q=outer?outer.planets:p;
 const matching=outer?cross:chart.aspects;
 const cell=(a,b)=>{
  const x=matching.find(x=>x.aKey===a.key&&x.bKey===b.key||!outer&&x.aKey===b.key&&x.bKey===a.key);
  if(!x)return '<td>·</td>';
  const total=Math.round(x.orb*60),offset=Math.floor(total/60)+'°'+pad(total%60)+'′';
  const phase=x.applying===true?'入':x.applying===false?'出':'';
  const type=[90,180,45,135].includes(x.angle)?'hard':[60,120].includes(x.angle)?'soft':'neutral';
  return `<td data-aspect="${type}" title="${esc(x.type+' '+offset+' '+phase)}">${esc(x.symbol)}<br>${phase==='入'?'−':phase==='出'?'+':''}${offset} ${phase}</td>`;
 };
 return `<div class="scroll"><table class="grid-table astro-grid"><thead><tr><th>星体</th>${p.map(x=>'<th>'+esc(x.symbol+' '+x.name)+'</th>').join('')}</tr></thead><tbody>
 ${q.map((a,i)=>'<tr><th>'+esc(a.symbol+' '+a.name)+'</th>'+p.map((b,j)=>outer||j<i?cell(a,b):'<td></td>').join('')+'</tr>').join('')}</tbody></table></div>`;
}
function timeLabel(s){return localDisplayTime(s.at);}
function shift(date,unit,n){
 const out=new Date(date);
 if(unit==='day'){out.setUTCDate(out.getUTCDate()+n);return out;}
 const day=out.getUTCDate();
 out.setUTCDate(1);
 if(unit==='year')out.setUTCFullYear(out.getUTCFullYear()+n);else out.setUTCMonth(out.getUTCMonth()+n);
 const last=new Date(Date.UTC(out.getUTCFullYear(),out.getUTCMonth()+1,0)).getUTCDate();
 out.setUTCDate(Math.min(day,last));return out;
}
const dignityLabels={入庙:'庙',旺相:'旺',入弱:'陷',落陷:'落'};
const degreeMinutes=x=>{
 const n=Math.round(Math.abs(x)*60);
 return Math.floor(n/60)+'°'+pad(n%60)+'′';
};
export function planetList(planets){
 return '<div class="planet-list">'+planets.map(p=>`<div class="planet-row"><b>${esc(p.symbol+' '+p.name)}</b>
 <div class="planet-position"><span class="planet-sign">${esc(p.sign)}</span><span class="planet-degree">${esc(dms(p.degree))}</span>
 <span class="planet-meta">第${p.house}宫 ${p.retro?'逆行 Rx':''} ${dignityLabels[p.dignity]?`<span class="dignity-badge">${dignityLabels[p.dignity]}</span>`:''}${p.approximate?' · 近似位置':''}</span></div></div>`).join('')+'</div>';
}
function facts(r,s){
 const p=r.chart.planets;
 const allPatterns=r.chart.analysis.patterns;
 const sign=s=>zodiacNames[Math.floor(norm(s)/30)]+' '+Math.floor(norm(s)%30)+'°';
 const rulers=['火星','金星','水星','月亮','太阳','水星','金星','火星','木星','土星','土星','木星'];
 const cusp=r.chart.cusps.map((lon,i)=>{
  const name=rulers[Math.floor(norm(lon)/30)];
  return [i+1,sign(lon),name,p.find(s=>s.name===name)?.house||'—'];
 });
 return `<article class="card"><h2>星体与位置</h2>${planetList(p)}</article>
 ${r.outer?`<article class="card"><h2>外圈星体</h2>${planetList(r.outer.planets)}</article>`:''}
 <article class="card"><h2>${r.outer?'跨盘相位':'相位容许度矩阵'}</h2>${aspectBrowser(r,s.aspects??={filter:'main',expanded:false})}<details><summary>查看相位网格</summary>${matrix(r)}</details><small>入相用 −，出相用 +。轴线或没有速度的虚点只显示距离。≈ 表示轨道传播近似。</small></article>
 <article class="card"><h2>宫主星</h2>${table(['宫位','宫头','古典宫主','飞入宫'],cusp)}</article>
 <article class="card"><h2>经典格局</h2>${allPatterns.length?allPatterns.map(x=>`<p><b>${esc(x.type)}</b> · ${esc(x.planets.join('、'))}</p>`).join(''):'<p class="muted">在当前容许度和显示星体下未识别格局。</p>'}</article>`;
}
function firdariaPanel(f){
 const month=iso=>iso.slice(0,7);
 return `<article class="card"><h2>${f.diurnal?'日生':'夜生'}法达</h2><p>主星 ${esc(f.active?.lord)} · 副星 ${esc(f.sub?.lord)}</p>
 <div class="stack">${f.periods.map(p=>`<details class="firdaria-period" ${p===f.active?'open':''}>
 <summary><b>${esc(p.lord)}</b> · ${month(p.from)} 至 ${month(p.to)}</summary>
 <ol>${p.sub.map(q=>`<li ${q===f.sub?'aria-current="true"':''}>${esc(p.lord+'–'+q.lord)} <small title="${dateTime(q.from)} → ${dateTime(q.to)}">${month(q.from)} 至 ${month(q.to)}</small></li>`).join('')}</ol></details>`).join('')}</div>
 <p class="thin">主运按出生周年划界，副运等分实际时长。交点运按本应用规则，以日／夜顺序分配七副星。</p></article>`;
}
export function westernView(ctx){
 const s=stateOf(ctx),r=s.result;
 const sky=r?todaySky({at:(r.outer||r.chart).utc||s.at}):null;
 const step=[['year',-1,'−1年'],['month',-1,'−1月'],['day',-1,'−1日'],['day',1,'＋1日'],['month',1,'＋1月'],['year',1,'＋1年']];
 const effects=r?.firdaria?firdariaPanel(r.firdaria):
  r?.profection?`<article class="card"><h2>古典小限</h2><p>${r.profection.age} ${r.profection.nominal?'虚岁':'周岁'} · 第 ${r.profection.house} 整宫 ${esc(r.profection.sign)} · 年主星 ${esc(r.profection.ruler)} 落本命第 ${r.profection.lordHouse} 宫。</p></article>`:'';
 const display=r?.chart;
 ctx.root.innerHTML=`<section aria-label="西洋占星"><div class="spread"><h1>西洋占星</h1><small>${esc(display?houses[display.houseSystem]:'')}</small></div>
 <div class="rail" aria-label="西洋推运盘类">${Object.entries(modes).filter(([id])=>!s.birthOverride||id==='sky').map(([id,label])=>btn(label,`data-mode="${id}" aria-pressed="${s.mode===id}"`)).join('')}</div>
 ${s.instant?`<p class="thin" data-instant-caption>即刻 ${esc(s.instant.local||localDisplayTime(s.instant.at))} 本地 · ${esc(s.instant.place)}（${esc(s.instant.source)}）</p>`:''}<p id="astroStatus" role="status" class="muted">${esc(s.error||(!r?'正在计算星历…':''))}</p>
 ${display?`<article class="card liquid-glass"><div class="orbit-info"><span>上升<b>${esc(zodiacNames[Math.floor(display.axes.asc/30)])}</b></span><span>天顶<b>${esc(zodiacNames[Math.floor(display.axes.mc/30)])}</b></span><span>黄道<b>${display.zodiac==='tropical'?'回归':'恒星 '+display.ayan}</b></span></div>
 <div class="wheel-stage">${btn('ASC 复位','class="asc-reset" data-asc-reset')}${wheel(r)}<div class="wheel-focus-card" data-wheel-card role="status" aria-live="polite" hidden></div></div>${display.warning?`<p class="house-warning" role="status">${esc(display.warning)}</p>`:''}<small>${esc(s.instant?.local||dateTime((r.outer||display).utc))} · ${esc(display.warning||modes[r.mode])}</small>${r.returnEvent?`<p class="thin">回归黄经 ${r.returnEvent.longitude.toFixed(6)}° · 与本命差 ${r.returnEvent.errorDegrees.toExponential(2)}°</p>`:''}</article>`:''}
 ${s.mode!=='natal'?`<article class="card"><div class="spread"><b>推运时间</b><small>${esc(timeLabel(s))} 本地</small></div><div class="rail">${step.map(([unit,n,title])=>btn(title,`data-unit="${unit}" data-step="${n}"`)).join('')}${btn('选择时间','data-astro-date')}</div></article>`:''}
 ${display?`<article class="card"><h2>四元素与三形态</h2>${bars(Object.fromEntries(Object.entries(display.analysis.elements.percentages).map(([k,v])=>[k,Number.isFinite(v)?v:0])))}
 <p class="thin">${display.analysis.elements.missing.length?'未覆盖 '+display.analysis.elements.missing.join('、'):'四元素均有星体'} · 主导 ${display.analysis.elements.dominant.join('、')}</p>
 ${bars(Object.fromEntries(Object.entries(display.analysis.modalities.percentages).map(([k,v])=>[k==='基本'?'本位':k,Number.isFinite(v)?v:0])))}</article>
 ${sky?`<article class="card"><h2>月相与空亡</h2><p>${esc(sky.phase)} · 照明 ${sky.litPercent}%</p><p>${sky.voc.active?'当前月亮空相中，宜休整沉淀':'当前月亮尚未进入空相区间'}</p><small>${esc(sky.voc.start)} 至 ${esc(sky.voc.end)} UT · ${esc(sky.voc.method)}</small></article>`:''}${effects}${facts(r,s)}`:''}</section>`;
 if(r){
  bindAspectBrowser(ctx.root,r,s.aspects);
  const stage=$('.wheel-stage',ctx.root),card=$('[data-wheel-card]',stage);
  const lookup=new Map([['inner',r.chart],['outer',r.outer]].flatMap(([layer,data])=>(data?.planets||[]).map(p=>[layer+'-'+p.key,p])));
  bindWheel(stage,s,key=>{
   const p=lookup.get(key);
   card.hidden=!p;
   card.innerHTML=p?`<b>${esc(p.symbol+' '+p.name)}${key.startsWith('outer-')?' · 行运':''}</b><span>${esc(p.sign+' '+dms(p.degree))}</span><span>第 ${p.house} 宫 · ${dignityLabels[p.dignity]||'无庙旺陷落'}</span>`:'';
  });
 }
 selectedRails(ctx.root);
 for(const b of ctx.root.querySelectorAll('[data-mode]'))b.onclick=()=>update(ctx,b.dataset.mode,s.at);
 for(const b of ctx.root.querySelectorAll('[data-unit]'))b.onclick=()=>update(ctx,s.mode,shift(s.at,b.dataset.unit,+b.dataset.step));
 const picker=$('[data-astro-date]',ctx.root);
 if(picker)picker.onclick=()=>{
  const d=ctx.sheet('toolSheet','选择推运时间',`<form class="form-grid" data-wheel-submit><label>日期<input type="date" name="date" value="${timeLabel(s).slice(0,10)}" required></label><label>本地时间<input type="time" name="clock" value="${timeLabel(s).slice(11,16)}" required></label></form>`);
  $('form',d).onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);const at=new Date(f.get('date')+'T'+f.get('clock'));ctx.close(d);update(ctx,s.mode,at);};
 };
 if(!s.requested){s.requested=true;update(ctx,s.mode,s.at);}
}
async function update(ctx,mode,at){
 const s=stateOf(ctx),token=++s.token;
 const status=$('#astroStatus',ctx.root);if(status)status.textContent='正在重算星历…';
 if(s.instant&&(mode!=='sky'||at.toISOString()!==s.instant.at))s.instant=null;
 s.mode=mode;s.at=at;
 try{
  const result=await ctx.request('/api/console/western',{birth:s.birthOverride??ctx.birth,config:cfg(),mode,at:at.toISOString()});
  if(token!==s.token||ctx.state.chartState.west!==s)return;
  s.result=result;s.error='';
 }catch(error){if(token===s.token){s.error=error.message;s.result=null;}}
 if(token===s.token&&ctx.state.chartState.west===s&&ctx.state.system==='west'){if(ctx.state.tab==='chart')westernView(ctx);if(!s.error)ctx.onSelectTimeNode('west');}
}
function options(data,value){return Object.entries(data).map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${esc(label)}</option>`).join('');}
export const astroHouse=()=>cfg().house;
export const houseOptions=value=>options(houses,value);
export function setAstroHouse(ctx,value){
 if(!Object.hasOwn(houses,value)||value===astroHouse())return;
 save(key,{...cfg(),house:value});
 if((ctx.birth||ctx.state.chartState.west?.birthOverride)&&ctx.state.chartState.west){
  const s=ctx.state.chartState.west;
  update(ctx,s.mode,s.at);
 }
}
export function westernTools(ctx,host){
 const s=stateOf(ctx);
 host.innerHTML='<h3>推运盘类</h3><div class="tool-grid">'+Object.entries(modes).filter(([id])=>!s.birthOverride&&['transit','secondary','tertiary','solar','lunar'].includes(id)).map(([id,label])=>btn(label,`data-west-tool="${id}" aria-pressed="${s.mode===id}"`)).join('')+'</div>'+
  btn('分宫制与小行星配置','data-astro-config class="tool-full"');
 for(const b of host.querySelectorAll('[data-west-tool]'))b.onclick=()=>{ctx.close($('#toolSheet'));update(ctx,b.dataset.westTool,s.at);};
 $('[data-astro-config]',host).onclick=()=>configSheet(ctx);
}
function configSheet(ctx){
 const config=cfg(),s=stateOf(ctx);
 const d=ctx.sheet('toolSheet','西洋占星 · 高级配置',`<form id="astroConfig" class="form-grid">
 <label>分宫制<select name="house">${options(houses,config.house)}</select></label>
 <label>黄道体系<select name="zodiac">${options({tropical:'回归黄道',sidereal:'恒星黄道'},config.zodiac)}</select></label>
 <label data-ayan ${config.zodiac!=='sidereal'?'hidden':''}>岁差标准<select name="ayan">${options({lahiri:'Lahiri',fagan:'Fagan-Bradley',krishnamurti:'Krishnamurti'},config.ayan)}</select></label>
 <label>月交点<select name="node">${options({true:'真交点',mean:'平交点'},config.node)}</select></label>
 ${groups.map(([label,items])=>`<fieldset class="wide"><legend>${esc(label)}</legend><div class="checks">${items.map(k=>`<label><input name="body" type="checkbox" value="${k}" ${config.visible.includes(k)?'checked':''}>${esc(bodies[k])}</label>`).join('')}</div></fieldset>`).join('')}
 <label>容许度预设<select name="preset">${options(presets,config.preset)}</select></label>
 <label class="checks"><input type="checkbox" name="phase" ${config.phaseWeight?'checked':''}>出相容许度 × 0.8</label>
 <div class="form-grid wide" data-orbs ${config.preset!=='custom'?'hidden':''}>${Object.entries(orbLabels).map(([k,label])=>`<label>${esc(label)} ${k}°<input name="orb-${k}" type="number" min="0" max="15" step="0.1" value="${esc(config.orbs[k]??defaultOrbs[k])}"></label>`).join('')}</div>
 <label class="checks wide"><input type="checkbox" name="nominal" ${config.nominalAge?'checked':''}>小限使用虚岁显示</label>
 <p class="wide muted" role="status" data-config-status>配置保存到此设备。修改后立即重排。</p>
 ${btn('恢复默认设置','data-reset-astro class="wide"')}</form>`);
 const f=$('form',d);
 f.onsubmit=e=>e.preventDefault();
 f.onchange=()=>{
  if(!f.checkValidity()){$('[data-config-status]',d).textContent='容许度须在 0–15°';return;}
  const data=new FormData(f);
  const next={house:data.get('house'),zodiac:data.get('zodiac'),ayan:data.get('ayan'),node:data.get('node'),
   visible:data.getAll('body'),preset:data.get('preset'),phaseWeight:data.has('phase'),nominalAge:data.has('nominal'),
   orbs:Object.fromEntries(Object.keys(orbLabels).map(k=>[k,+data.get('orb-'+k)]))};
  save(key,next);
  $('[data-ayan]',d).hidden=next.zodiac!=='sidereal';$('[data-orbs]',d).hidden=next.preset!=='custom';
  $('[data-config-status]',d).textContent='已保存，正在重排。';
  update(ctx,s.mode,s.at);
 };
 $('[data-reset-astro]',d).onclick=()=>{save(key,defaultCfg);configSheet(ctx);update(ctx,s.mode,s.at);};
}

import {VARGAS,divisional,dashaChildren,planetStates} from '../../src/vargas.mjs';
import {$,esc,btn,term,table,selectedRails} from './ui.js';
const geometry=[
 ['200,0 100,100 200,200 300,100',200,75],['0,0 200,0 100,100',100,18],['0,0 100,100 0,200',35,88],
 ['0,200 100,100 200,200 100,300',100,178],['0,200 100,300 0,400',35,270],['0,400 100,300 200,400',100,348],
 ['200,200 100,300 200,400 300,300',200,275],['200,400 300,300 400,400',300,348],['300,300 400,200 400,400',365,270],
 ['200,200 300,100 400,200 300,300',300,178],['300,100 400,0 400,200',365,88],['200,0 400,0 300,100',300,18]
];
const nakNames=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const pad=n=>String(n).padStart(2,'0'),dms=d=>d.degrees+'°'+pad(d.minutes)+'′'+pad(d.seconds)+'″';
const short=sign=>sign.replace('座','');
export function northIndianChart(data){
 return `<svg class="vedic-chart" viewBox="-3 -3 406 406" role="group" aria-label="北印菱形盘，上方中央为第一宫，宫位逆时针排列">${geometry.map(([points,x,y],i)=>{
  const stars=data.planets.filter(p=>p.house===i+1),visible=stars.slice(0,3);
  return `<g role="button" tabindex="0" data-vedic-house="${i+1}" aria-label="第${i+1}宫 ${esc(data.houseSigns[i])} ${esc(stars.map(p=>p.name).join('、'))}"><polygon class="vedic-house" points="${points}" data-current="${i===0}" data-dasha-lit="${data.highlight?.includes(i+1)||false}"/><text x="${x}" y="${y}" text-anchor="middle" class="vedic-house-label">${i===0?'上升 · ':''}${i+1}宫 · ${(data.lagnaIndex+i)%12+1} ${esc(short(data.houseSigns[i]))}</text>${visible.map((p,j)=>`<text x="${x}" y="${y+18+j*11}" text-anchor="middle" class="vedic-planet">${esc(p.name)}${p.retro?'ᴿ':''}</text>`).join('')}${stars.length>3?`<text x="${x}" y="${y+51}" text-anchor="middle" font-size="7">另${stars.length-3}星 · 点宫</text>`:''}</g>`;
 }).join('')}</svg>`;
}
export function vedicView(ctx){
 const s=ctx.state.chartState.vedic??={data:ctx.state.reading.vedic,pick:null};s.n??=1;s.layout??='north';s.path??=[];const base=s.data,d=base?divisional(base,s.n):null;
 if(!d){ctx.root.innerHTML='<p class="empty">请先激活案例。</p>';return;}
 const at=Date.parse(s.at||base.at),levels=[],chosen=[];let list=base.dashas;
 for(let i=0;i<4;i++){const selected=list.find(p=>p.index===s.path[i])||list.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end))||list[0];levels.push(list);chosen.push(selected);list=dashaChildren(selected);}
 const selected=chosen.at(-1),lord=d.planets.find(p=>p.name===selected.lord),aspects=lord?[7,...(lord.key==='mars'?[4,8]:lord.key==='jupiter'?[5,9]:lord.key==='saturn'?[3,10]:[])].map(n=>(lord.house+n-2)%12+1):[];

 d.highlight=lord?[lord.house,...aspects]:[];
 ctx.root.innerHTML=`<section id="vedic"><h1>印度占星 · Jyotish</h1><p class="thin">Lahiri 恒星黄道 · 整宫制 · 平交点</p>
 <div class="rail">${[1,9,10,7,2,60].map(n=>btn('D'+n+' '+VARGAS[n],`data-varga="${n}" aria-pressed="${s.n===n}"`)).join('')}</div><label>完整分盘<select data-varga-select>${Array.from({length:60},(_,i)=>`<option value="${i+1}" ${s.n===i+1?'selected':''}>D${i+1} ${VARGAS[i+1]||'谐波映射（非经典列示）'}</option>`).join('')}</select></label><div class="rail">${btn('北印菱形盘',`data-layout="north" aria-pressed="${s.layout==='north'}"`)}${btn('南印方格盘',`data-layout="south" aria-pressed="${s.layout==='south'}"`)}</div>
 <article class="card liquid-glass"><h2>${s.layout==='north'?'北印菱形盘':'南印方格盘'} · D${s.n}</h2>${s.layout==='north'?northIndianChart(d):southIndianChart(d)}<p>D${s.n} ${VARGAS[s.n]||'谐波'}：上升${esc(d.lagna)}，主运星${esc(selected.lord)}落第${lord?.house||'—'}宫；专项观察${esc(VARGAS[s.n]||'对应分盘')}中的职责与资源。${esc(d.method)}</p><p class="thin">上升 ${esc(d.lagna)} · 岁差 ${d.ayanamsa.toFixed(6)}° · 出生UT ${esc(d.utc.slice(0,19).replace('T',' '))}</p></article>
 <article class="card"><h2>27 星宿与宿度</h2><p class="thin">以下为 D1 出生恒星黄道；分盘只改变上方宫位映射。宿主落1/5/9宫侧重支持，落6/8/12宫侧重磨练，需合参宫主与相位。</p>${table(['星体','星座 / 宫位','精确度数','星宿 / 宿度','宿主 / 分足'],[{key:'lagna',name:'上升 Lagna',sid:base.ascSid,house:1,nakIndex:Math.floor(base.ascSid/(360/27)),nakshatra:nakNames[Math.floor(base.ascSid/(360/27))],nakDegree:base.ascSid%(360/27),nakLord:base.sequence[Math.floor(base.ascSid/(360/27))%9],pada:Math.floor(base.ascSid/(360/108))%4+1,sign:base.lagna,degree:{degrees:Math.floor(base.ascSid%30),minutes:Math.floor(base.ascSid%1*60),seconds:Math.floor(base.ascSid%1*3600)%60}},...base.planets].map(p=>[p.name+' '+planetStates(p,base.planets).join(' / '),p.sign+' · '+p.house+'宫',dms(p.degree),(nakNames[p.nakIndex]||p.nakshatra)+' '+p.nakDegree.toFixed(4)+'°',p.nakLord+' · Pada '+p.pada+'（本命宿主落'+(base.planets.find(q=>q.name===p.nakLord)?.house||1)+'宫）']))}</article>
 <article class="card liquid-glass vedic-period"><h2>Vimshottari 大运</h2><p>当前大运：${esc(d.active?.lord||'不在所列运限')} · 出生大运余额 ${d.balanceYears.toFixed(4)} 年</p>
 <div class="rail">${btn('−1年','data-v-time="-12"')}${btn('−1月','data-v-time="-1"')}${btn('＋1月','data-v-time="1"')}${btn('＋1年','data-v-time="12"')}</div>
 ${levels.map((items,depth)=>`<p class="thin">${['Maha 主运','Antar 副运','Pratyantar 细运','Sookshma 微运'][depth]}</p><div class="vedic-dasha">${items.map(p=>btn(p.lord,`data-dasha="${p.index}" data-depth="${depth}" aria-pressed="${chosen[depth].index===p.index}" title="${esc(p.start+' → '+p.end)}"`)).join('')}</div>`).join('')}
 <p>四级执政：${chosen.map(p=>esc(p.lord)).join(' → ')} · 照拂宫位 ${aspects.join('、')}（传统照宫规则）</p>
 <div data-dasha-detail aria-live="polite"><h3>${esc(selected.lord)}大运${selected.active?' · 当前':''}</h3><p>${esc(selected.start.slice(0,19).replace('T',' '))} 至 ${esc(selected.end.slice(0,19).replace('T',' '))}（UT）</p><p>此阶段可结合${term(selected.lord+'所在第'+d.planets.find(p=>p.name===selected.lord)?.house+'宫',selected.lord+'是此段大运主星，传统上将其本命所在宫位作为阶段观察主题。大运不等于事件保证。')}与当下行运观察。</p></div>
 <small>顺序：${esc(d.sequence.join(' → '))}；从月亮出生星宿的宿主起排。</small></article><p class="thin">${esc(d.method)}</p></section>`;
 for(const b of ctx.root.querySelectorAll('[data-varga]'))b.onclick=()=>{s.n=+b.dataset.varga;vedicView(ctx);};
 $('[data-varga-select]',ctx.root).onchange=e=>{s.n=+e.target.value;vedicView(ctx);};
 for(const b of ctx.root.querySelectorAll('[data-layout]'))b.onclick=()=>{s.layout=b.dataset.layout;vedicView(ctx);};
 for(const b of ctx.root.querySelectorAll('[data-v-time]'))b.onclick=async()=>{const at=new Date(s.at||base.at);at.setUTCMonth(at.getUTCMonth()+Number(b.dataset.vTime));s.at=at.toISOString();const token=s.timeToken=(s.timeToken||0)+1;const result=await ctx.request('/api/console/vedic',{birth:ctx.birth,at:s.at});if(token!==s.timeToken)return;s.data=result;s.path=[];vedicView(ctx);};
 for(const b of ctx.root.querySelectorAll('[data-dasha]'))b.onclick=()=>{const scroll=$('.vedic-dasha',ctx.root).scrollLeft;const depth=+b.dataset.depth;s.path=s.path.slice(0,depth);s.path[depth]=+b.dataset.dasha;vedicView(ctx);$('.vedic-dasha',ctx.root).scrollLeft=scroll;};
 const show=house=>{const stars=d.planets.filter(p=>p.house===house);ctx.explain('第'+house+'宫 · '+d.houseSigns[house-1],stars.map(p=>p.name+' · '+(nakNames[p.nakIndex]||p.nakshatra)+' '+p.nakDegree.toFixed(4)+'° · '+p.nakLord+'主宿').join('；')||'本宫无本命九曜，可结合宫主星所在宫位观察。');};
 for(const g of ctx.root.querySelectorAll('[data-vedic-house]')){g.onclick=()=>show(+g.dataset.vedicHouse);g.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();show(+g.dataset.vedicHouse);}};}
}

export function southIndianChart(d){
 const cells=[[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1],[0,0]];
 return `<svg class="vedic-chart" viewBox="0 0 400 400" aria-label="南印方格盘，星座位置固定">${cells.map(([x,y],sign)=>{const h=(sign-d.lagnaIndex+12)%12+1,stars=d.planets.filter(p=>p.signIndex===sign);return `<g data-vedic-house="${h}" role="button" tabindex="0"><rect class="vedic-house" x="${x*100}" y="${y*100}" width="100" height="100" data-current="${h===1}" data-dasha-lit="${d.highlight?.includes(h)||false}"/><text x="${x*100+50}" y="${y*100+18}" text-anchor="middle" class="vedic-house-label">${sign+1} · ${h===1?'ASC':h+'宫'}</text>${stars.slice(0,4).map((p,i)=>`<text class="vedic-planet" x="${x*100+50}" y="${y*100+35+i*13}" text-anchor="middle">${esc(p.name)}</text>`).join('')}</g>`;}).join('')}</svg>`;
}

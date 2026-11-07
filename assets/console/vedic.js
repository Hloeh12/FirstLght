import {$,esc,btn,term,table,selectedRails} from './ui.js';
const geometry=[
 ['200,0 100,100 200,200 300,100',200,75],['0,0 200,0 100,100',100,18],['0,0 100,100 0,200',35,88],
 ['0,200 100,100 200,200 100,300',100,178],['0,200 100,300 0,400',35,270],['0,400 100,300 200,400',100,348],
 ['200,200 100,300 200,400 300,300',200,275],['200,400 300,300 400,400',300,348],['300,300 400,200 400,400',365,270],
 ['200,200 300,100 400,200 300,300',300,178],['300,100 400,0 400,200',365,88],['200,0 400,0 300,100',300,18]
];
const pad=n=>String(n).padStart(2,'0'),dms=d=>d.degrees+'°'+pad(d.minutes)+'′'+pad(d.seconds)+'″';
const short=sign=>sign.replace('座','');
export function northIndianChart(data){
 return `<svg class="vedic-chart" viewBox="-3 -3 406 406" role="group" aria-label="北印菱形盘，上方中央为第一宫，宫位逆时针排列">${geometry.map(([points,x,y],i)=>{
  const stars=data.planets.filter(p=>p.house===i+1),visible=stars.slice(0,3);
  return `<g role="button" tabindex="0" data-vedic-house="${i+1}" aria-label="第${i+1}宫 ${esc(data.houseSigns[i])} ${esc(stars.map(p=>p.name).join('、'))}"><polygon class="vedic-house" points="${points}" data-current="${i===0}"/><text x="${x}" y="${y}" text-anchor="middle" class="vedic-house-label">${i===0?'上升 · ':''}${i+1}宫 · ${esc(short(data.houseSigns[i]))}</text>${visible.map((p,j)=>`<text x="${x}" y="${y+18+j*11}" text-anchor="middle" class="vedic-planet">${esc(p.name)}${p.retro?'ᴿ':''}</text>`).join('')}${stars.length>3?`<text x="${x}" y="${y+51}" text-anchor="middle" font-size="7">另${stars.length-3}星 · 点宫</text>`:''}</g>`;
 }).join('')}</svg>`;
}
export function vedicView(ctx){
 const s=ctx.state.chartState.vedic??={data:ctx.state.reading.vedic,pick:null},d=s.data;
 if(!d){ctx.root.innerHTML='<p class="empty">请先激活案例。</p>';return;}
 const selected=d.dashas.find(p=>p.index===s.pick)||d.active||d.dashas[0];
 ctx.root.innerHTML=`<section id="vedic"><h1>印度占星 · Jyotish</h1><p class="thin">Lahiri 恒星黄道 · 整宫制 · 平交点</p>
 <article class="card liquid-glass"><h2>北印菱形盘 · D1</h2>${northIndianChart(d)}<p class="thin">上升 ${esc(d.lagna)} · 岁差 ${d.ayanamsa.toFixed(6)}° · 出生UT ${esc(d.utc.slice(0,19).replace('T',' '))}</p></article>
 <article class="card"><h2>27 星宿与宿度</h2>${table(['星体','星座 / 宫位','精确度数','星宿 / 宿度','宿主 / 分足'],d.planets.map(p=>[p.name+(p.retro?' Rx':''),p.sign+' · '+p.house+'宫',dms(p.degree),p.nakshatra+' '+p.nakDegree.toFixed(4)+'°',p.nakLord+' · 第'+p.pada+'足']))}</article>
 <article class="card liquid-glass vedic-period"><h2>Vimshottari 大运</h2><p>当前大运：${esc(d.active?.lord||'不在所列运限')} · 出生大运余额 ${d.balanceYears.toFixed(4)} 年</p>
 <div class="vedic-dasha" aria-label="印度大运滑轨">${d.dashas.map(p=>btn(p.lord+' · '+p.years+'年',`data-dasha="${p.index}" aria-pressed="${p.index===selected.index}" title="${esc(p.start+' → '+p.end)}"`)).join('')}</div>
 <div data-dasha-detail aria-live="polite"><h3>${esc(selected.lord)}大运${selected.active?' · 当前':''}</h3><p>${esc(selected.start.slice(0,10))} 至 ${esc(selected.end.slice(0,10))}（UT）</p><p>此阶段可结合${term(selected.lord+'所在第'+d.planets.find(p=>p.name===selected.lord)?.house+'宫',selected.lord+'是此段大运主星，传统上将其本命所在宫位作为阶段观察主题。大运不等于事件保证。')}与当下行运观察。</p></div>
 <small>顺序：${esc(d.sequence.join(' → '))}；从月亮出生星宿的宿主起排。</small></article><p class="thin">${esc(d.method)}</p></section>`;
 for(const b of ctx.root.querySelectorAll('[data-dasha]'))b.onclick=()=>{const scroll=$('.vedic-dasha',ctx.root).scrollLeft;s.pick=+b.dataset.dasha;vedicView(ctx);$('.vedic-dasha',ctx.root).scrollLeft=scroll;};
 const show=house=>{const stars=d.planets.filter(p=>p.house===house);ctx.explain('第'+house+'宫 · '+d.houseSigns[house-1],stars.map(p=>p.name+' · '+p.nakshatra+' '+p.nakDegree.toFixed(4)+'° · '+p.nakLord+'主宿').join('；')||'本宫无本命九曜，可结合宫主星所在宫位观察。');};
 for(const g of ctx.root.querySelectorAll('[data-vedic-house]')){g.onclick=()=>show(+g.dataset.vedicHouse);g.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();show(+g.dataset.vedicHouse);}};}
}

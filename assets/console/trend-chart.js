import {esc} from './ui.js';
/* 大运条带 + 十年流年运势曲线：纯 SVG+HTML，点击直接切换大运/流年（复用 period-control 的 data-rail 委托）。
 * 数值全部来自引擎 trend 字段（每个干支单独并入原局重算的日主扶助度），颜色按该干支五行相对
 * 本命用神/忌神的关系着色，不做吉凶断言。 */
const roleOf=(element,natal)=>natal.useful?.includes(element)?'useful':natal.caution?.includes(element)?'caution':'neutral';
const ROLE={useful:'#ff4f8b',caution:'#8b95ad',neutral:'#d9a3c4'};
export function trendChart(d,pick){
 const t=d.trend;
 if(!t||!t.years?.length||!t.cycles?.length)return '';
 const natal=t.natal,nowYear=new Date().getFullYear();
 // ---- 十年流年曲线（SVG）----
 const W=352,H=150,padL=8,padR=8,base=118,top=26;
 const n=t.years.length,step=(W-padL-padR)/n,bw=Math.min(20,step*.62);
 const pts=t.years.map((y,i)=>{
  const x=padL+step*i+step/2,h=Math.max(6,Math.min(92,(y.support/100)*92));
  return {x,y:y.year,h,s:y.support,g:y.ganzhi,role:roleOf(y.element,natal)};
 });
 const line=pts.map((p,i)=>(i?'L ':'M ')+p.x.toFixed(1)+' '+(base-p.h).toFixed(1)).join(' ');
 const bars=pts.map(p=>`
  <g data-rail="流年" data-pick="${p.y}" role="button" tabindex="0" aria-label="${p.y}年 ${p.g} 扶助度 ${p.s.toFixed(1)}%" class="ty${pick.year===p.y?' on':''}">
   <rect class="tb" x="${(p.x-bw/2).toFixed(1)}" y="${(base-p.h).toFixed(1)}" width="${bw.toFixed(1)}" height="${p.h.toFixed(1)}" rx="4" fill="${ROLE[p.role]}"/>
   <circle cx="${p.x.toFixed(1)}" cy="${(base-p.h).toFixed(1)}" r="3.2" fill="#fff" stroke="${ROLE[p.role]}" stroke-width="1.6"/>
   <rect class="thit" x="${(p.x-step/2).toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H}" fill="transparent"/>
  </g>`).join('');
 const labels=pts.map(p=>`<text x="${p.x.toFixed(1)}" y="132" text-anchor="middle" class="tx${p.y===nowYear?' now':''}">${String(p.y).slice(2)}</text>`).join('');
 const marks=pts.map(p=>p.y===nowYear?`<line x1="${p.x.toFixed(1)}" y1="14" x2="${p.x.toFixed(1)}" y2="${base}" class="tnow"/>`:'').join('');
 // ---- 大运条带（等宽分段，按年龄跨度排列）----
 const cyclesHtml=t.cycles.map(c=>{
  const on=pick.luck===c.index,role=roleOf(c.element,natal);
  return `<button type="button" class="cyc-seg${on?' on':''}" data-rail="大运" data-pick="${c.index}" aria-pressed="${on}" style="--role:${ROLE[role]}">
   <span class="cs-gz">${esc(c.ganzhi)}</span><span class="cs-age">${Math.round(c.age)}岁</span>
   <span class="cs-bar" style="width:${Math.max(8,Math.min(100,c.support)).toFixed(0)}%"></span>
   <span class="cs-sup">${c.support.toFixed(0)}%</span>
  </button>`;
 }).join('');
 return `<div class="trend-block" data-trend-block>
  <div class="trend-head"><h3>运势起伏</h3><p class="trend-legend"><i style="background:${ROLE.useful}"></i>生扶用神 <i style="background:${ROLE.caution}"></i>忌神偏重 <i style="background:${ROLE.neutral}"></i>中性</p></div>
  <svg class="trend-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="十年流年扶助度曲线">${marks}<path class="tline" d="${line}"/>${bars}${labels}</svg>
  <p class="trend-cap">柱高＝日主扶助度（本命 ${natal.support.toFixed(1)}% · ${esc(natal.kind||'')}），点击柱体切换流年。${esc(t.method||'')}</p>
  <div class="cyc-band" role="group" aria-label="大运条带">${cyclesHtml}</div>
 </div>`;
}

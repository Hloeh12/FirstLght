import {esc} from './ui.js';
/* 大运条带 + 流年扶助度柱：纯 SVG + HTML，点击直接切换大运/流年（复用 period-control 的 data-rail 委托）。
 * 数值全部来自引擎 trend 字段（每个干支单独并入原局重算的日主扶助度），颜色按该干支与日主喜忌的关系
 * 着色，不做吉凶断言。
 *
 * v0.52.0 重做原因（两条，都在真机截图上可见）：
 * 1) 旧版把 result.trend.years 全量铺进一张 352×150 的 SVG——起运早的盘有 35–42 根柱，柱间距压到
 *    8–9px，而每个年份标签宽 10.7px，x 轴糊成一片数字墙。现在只画「当前生效大运」这十年，柱数恒为
 *    10，年份轴交给 HTML 网格（不随 SVG 拉伸变形、永不重叠）。
 * 2) 旧 roleOf 读 natal.useful/caution，而后端 result.trend.natal 只带 support/kind，于是每根柱恒落
 *    「中性」，图例列三色、实际只有一色。现在补了字段；中和盘本身无喜忌（useful/caution 为空），
 *    改用「相对本命基准的起落」分三档，仍然有信息而不是全灰。
 * 一生八步的强弱改用底部迷你柱条表达，与「流年」轨一一对应而不重复。 */

const ROLE={useful:'var(--fl-useful)',caution:'var(--fl-caution)',neutral:'var(--fl-neutral)'};
const RANGE=1.5; // 相对口径的死区（百分点）：±1.5% 内视为与本命持平

/** 当前生效的大运：显式选择优先，否则取今年所在的那一步（无数据时退回第一步）。 */
export function trendCycle(d,pick){
 const cycles=d?.cycles||[];
 if(!cycles.length)return null;
 const idx=pick?.luck!=null&&cycles[pick.luck]?pick.luck
  :(()=>{const nowYear=new Date().getFullYear();
    const hit=cycles.findIndex(c=>c.startYear<=nowYear&&nowYear<=endOf(c));
    return hit>=0?hit:0;})();
 const c=cycles[idx];
 return {...c,index:idx,endYear:endOf(c)};
}
function endOf(c){
 // 大运按「整年」计：2027-03 交运、2037-03 交运，则覆盖 2027–2036 共十年。
 // 交运日所在年归下一步，所以直接用 startYear+9，不取 endUtc 的年份
 // （直接取会得到 2037，柱数变 11，与「第 N 步 2027–2036」的口径打架）。
 const n=Number(c?.startYear);
 return Number.isFinite(n)?n+9:(c?.endYear??0);
}

/** 该大运覆盖的流年（正常 10 项；交运年不整时按起始年顺延补齐）。 */
export function trendYears(d,pick){
 const cycle=trendCycle(d,pick),all=d?.trend?.years||[];
 if(!cycle)return all.slice(0,10);
 const win=all.filter(y=>y.year>=cycle.startYear&&y.year<=cycle.endYear);
 if(win.length>=6)return win;
 return all.filter(y=>y.year>=cycle.startYear).slice(0,10);
}

/* 着色口径：有明确喜忌时按五行归属；中和盘（喜忌皆空）按相对本命基准的起落。
   后者不是「补一个用神」，而是把「这一步比原局更顺／更耗」如实画出来——中和盘本来就没有单一用神。 */
function roleEngine(natal){
 const graded=!!((natal?.useful||[]).length||(natal?.caution||[]).length);
 const use=natal?.useful||[],avoid=natal?.caution||[];
 const of=(element,branchElement,support)=>{
  if(graded){
   if(use.includes(element)||use.includes(branchElement))return 'useful';
   if(avoid.includes(element)||avoid.includes(branchElement))return 'caution';
   return 'neutral';
  }
  const diff=Number(support)-Number(natal?.support||0);
  return diff>RANGE?'useful':diff<-RANGE?'caution':'neutral';
 };
 return {graded,of};
}

export function trendChart(d,pick){
 const t=d?.trend,cycle=trendCycle(d,pick),years=trendYears(d,pick);
 if(!t?.natal||!cycle||!t.cycles?.length||!years.length)return '';
 const natal=t.natal,nowYear=new Date().getFullYear(),{graded,of}=roleEngine(natal);
 const W=340,H=120,base=106,maxH=82;
 const n=years.length,step=W/n,bw=Math.min(20,step*.52);
 const pts=years.map((y,i)=>{
  const x=step*i+step/2;
  const h=Math.max(4,Math.min(maxH,y.support/100*maxH));
  return {x,h,s:y.support,g:y.ganzhi,year:y.year,role:of(y.element,y.branchElement,y.support)};
 });
 const chosen=pick?.year,picked=pts.find(p=>p.year===chosen),nowPt=pts.find(p=>p.year===nowYear);
 // ---- 柱体 ----
 const bars=pts.map(p=>{
  const on=p.year===chosen;
  return `<g data-rail="流年" data-pick="${p.year}" role="button" tabindex="0" aria-label="${p.year}年 ${p.g} 扶助度 ${p.s.toFixed(1)}%" class="ty${on?' on':''}">
   <rect class="tb" x="${(p.x-bw/2).toFixed(1)}" y="${(base-p.h).toFixed(1)}" width="${bw.toFixed(1)}" height="${p.h.toFixed(1)}" rx="4" style="fill:${ROLE[p.role]}"/>
   <rect class="thit" x="${(p.x-step/2).toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H}" fill="transparent"/>
  </g>`;
 }).join('');
 // ---- 本命基准线：没有它，柱高只是一排半斤八两的方块 ----
 const baseY=+(base-(Number(natal.support)/100)*maxH).toFixed(1);
 const baseline=`<line class="tbase" x1="0" y1="${baseY}" x2="${W}" y2="${baseY}"/>
  <text class="tbase-lab" x="1" y="${(baseY-5).toFixed(1)}">本命 ${Number(natal.support).toFixed(1)}%</text>`;
 const nowMark=nowPt?`<line class="tnow" x1="${nowPt.x.toFixed(1)}" y1="13" x2="${nowPt.x.toFixed(1)}" y2="${base}"/>`:'';
 const pin=picked?`<circle class="tpin" cx="${picked.x.toFixed(1)}" cy="${(base-picked.h).toFixed(1)}" r="3"/>
  <text class="tval" x="${picked.x.toFixed(1)}" y="${(base-picked.h-10).toFixed(1)}" text-anchor="middle">${picked.s.toFixed(0)}%</text>`:'';
 // ---- 年份轴：HTML 网格承载，永不重叠 ----
 const axis=`<div class="trend-axis" style="--n:${n}">${pts.map(p=>
  `<button type="button" class="ta${p.year===nowYear?' now':''}${p.year===chosen?' on':''}" data-rail="流年" data-pick="${p.year}" aria-pressed="${p.year===chosen}">${p.year}</button>`
 ).join('')}</div>`;
 // ---- 一生大运：八格快速索引，替代旧版八张大卡片（与大运轨内容重复且占掉 90px） ----
 // 这里不再画扶助度柱：中和盘八步的差异通常只有 ±2 个百分点，缩到 30px 高的迷你柱上
 // 全退化成 2px 细线（试过绝对值映射与分叉柱，都是断线），既看不清也不该暗示「柱高=好」。
 // 强弱交给上方十年图与正文，这里只承担「八步一览 + 一步跳转」，色点沿用同一套喜忌语义。
 const nowIdx=trendCycle(d,{})?.index;
 const mini=t.cycles.map(c=>{
  const on=pick?.luck===c.index,isNow=!on&&c.index===nowIdx;
  const role=of(c.element,c.branchElement,c.support);
  return `<button type="button" class="cm-seg${on?' on':''}${isNow?' is-now':''}" data-rail="大运" data-pick="${c.index}" aria-pressed="${on}" aria-label="第${c.index+1}步 ${c.ganzhi} ${c.startYear}至${endOf(c)} ${Math.round(c.age)}岁起 扶助度 ${c.support.toFixed(0)}%">
   <i class="cm-dot" style="--c:${ROLE[role]}"></i><b>${esc(c.ganzhi)}</b><em>${Math.round(c.age)}岁</em>
  </button>`;
 }).join('');
 const legend=graded?['生扶用神','忌神偏重','中性']:['高于本命','低于本命','持平'];
 return `<div class="trend-block" data-trend-block>
  <div class="trend-head"><h3>运势起伏</h3><span class="trend-range">${cycle.startYear}–${cycle.endYear} · ${esc(cycle.stem||'')}${esc(cycle.branch||'')}</span></div>
  <p class="trend-legend"><i style="background:${ROLE.useful}"></i>${legend[0]}<i style="background:${ROLE.caution}"></i>${legend[1]}<i style="background:${ROLE.neutral}"></i>${legend[2]}</p>
  <div class="trend-plot">
   <svg class="trend-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="本步十年流年扶助度柱状图">${nowMark}${baseline}${bars}${pin}</svg>
   ${axis}
  </div>
  <p class="trend-cap">柱高＝日主扶助度，虚线为本命；点柱切换。</p>
  <div class="cyc-mini" role="group" aria-label="一生大运强弱概览，点按切换"><div class="cm-track" style="--n:${t.cycles.length}">${mini}</div><span class="cm-foot">一生大运</span></div>
 </div>`;
}

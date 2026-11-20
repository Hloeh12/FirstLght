import {localDisplayTime,formatLocalDisplayTime} from './now.js';
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
const SIGN_LORD=['火星','金星','水星','月亮','太阳','水星','金星','火星','木星','土星','土星','木星'];
const SIGN_LIST=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const HOUSE_THEME={1:'自我与身体',2:'资源与表达',3:'行动与技能',4:'家宅与根基',5:'创造与子女',6:'竞争与服务',7:'关系与合作',8:'变动与共有资源',9:'信念与远行',10:'事业与公开身份',11:'收益与社群',12:'隐私与消耗'};
function vargaReading(base,n){
 const v=divisional(base,n),lordName=SIGN_LORD[SIGN_LIST.indexOf(v.lagna)]||'—';
 const lord=v.planets.find(p=>p.name===lordName)||null;
 const occupied=new Set(v.planets.map(p=>p.house));
 return {n,label:VARGAS[n]||('D'+n),lagna:v.lagna,lordName,lordHouse:lord?.house??null,lordSign:lord?.sign??null,empty:12-occupied.size,planets:v.planets.length};
}
function vargaSentence(r){
 if(!r.lordHouse)return `D${r.n} ${r.label}：上升${short(r.lagna)}，命主${r.lordName}不在本次计算的七曜范围内，只保留宫位映射，不给强弱结论。`;
 const same=r.n===1?'':'';
 return `D${r.n} ${r.label}：上升${short(r.lagna)}，命主${r.lordName}落第${r.lordHouse}宫（${HOUSE_THEME[r.lordHouse]}），十二宫中${r.empty}宫无星。${same}`;
}
function vedicOverview(base,d,chosen){
 const moon=base.planets.find(p=>p.name==='月亮');
 const ascLord=SIGN_LORD[SIGN_LIST.indexOf(d.lagna)]||'—';
 const ascLordP=d.planets.find(p=>p.name===ascLord);
 const counts=Array.from({length:12},(_,i)=>d.planets.filter(p=>p.house===i+1));
 const empty=counts.map((c,i)=>c.length?null:i+1).filter(Boolean);
 const pile=counts.map((c,i)=>[c,i+1]).filter(([c])=>c.length>=2).map(([c,h])=>`第${h}宫 ${c.map(p=>p.name).join('、')}`);
 const vargas=[1,9,10,7,60].map(n=>vargaReading(base,n));
 const d9=vargas[1];
 return `<article class="card liquid-glass vedic-overview" data-vedic-overview>
 <div class="card-head"><h2>整体印占分析</h2><span class="chip">D1 本命 · ${esc(d.lagna)}</span></div>
 <div class="vr-grid">
  <div class="vr-cell"><span class="k">上升 / 命主星</span><b>${esc(d.lagna)} · ${esc(ascLord)}${ascLordP?`（第${ascLordP.house}宫）`:''}</b></div>
  <div class="vr-cell"><span class="k">月亮星宿</span><b>${esc(moon?.nakshatra||'—')} 第 ${moon?.pada||'—'} 步 · 落第${moon?.house||'—'}宫</b></div>
  <div class="vr-cell"><span class="k">当前大运</span><b>${esc(chosen?.[0]?.lord||d.active?.lord||'—')}${chosen?.[1]?` / ${esc(chosen[1].lord)}`:''}</b></div>
  <div class="vr-cell"><span class="k">星曜分布</span><b>${d.planets.length} 曜 · ${empty.length?`空宫 ${empty.slice(0,6).join('、')}${empty.length>6?'…':''}`:'无空宫'}</b></div>
 </div>
 <p class="vr-line"><b>本命结构：</b>命主${esc(ascLord)}${ascLordP?`落第${ascLordP.house}宫，${HOUSE_THEME[ascLordP.house]}是这张盘要持续兑现的主题；月亮在${esc(moon?.nakshatra||'—')}，情绪与安全感按该宿的宿主星节奏展开`:'未落在本次七曜计算范围内'}。</p>
 ${pile.length?`<p class="vr-line"><b>星曜集中：</b>${pile.map(esc).join('；')}。同宫星多时主题互相牵制，先看其中能量最强的一颗，再谈吉凶。</p>`:''}
 ${d9.lordHouse?`<p class="vr-line"><b>关系盘 D9：</b>上升${esc(short(d9.lagna))}，命主${esc(d9.lordName)}落第${d9.lordHouse}宫（${HOUSE_THEME[d9.lordHouse]}）。D9 与 D1 的命主不同宫时，说明对外表现与亲密关系里的自我不一致。</p>`:''}
 <h3 class="vr-title">分盘结论</h3>
 <ul class="vr-vargas">${vargas.map(r=>`<li><b>D${r.n} ${esc(r.label)}</b><span>${esc(vargaSentence(r))}</span></li>`).join('')}</ul>
 <p class="thin muted vr-note">计算范围：宫位按整宫制，分盘由本命度数的整数分割得出；行星力量已按 Shadbala 六力（Sthana、Dig、Kala 月相力、Cheshta、Naisargika、Saptavargaja、Drik）给出分数与位次，另起 Ashtakavarga 八分点（校验位 337）、Yogini 八女神短周期运与 Varshaphala 太阳返照岁运盘。Jaimini 指标详见深度报告第十三章。仍未计算 Kala 其余分项（Nathonnatha、Ayana）——不给无经典依据的分数与吉凶断言。</p>
</article>`;
}

export function vedicView(ctx){
 const s=ctx.state.chartState.vedic??={data:ctx.state.reading.vedic,pick:null};s.n??=1;s.layout??='north';s.path??=[];const base=s.data,d=base?divisional(base,s.n):null;
 if(!d){ctx.root.innerHTML='<p class="empty">请先激活案例。</p>';return;}
 const at=Date.parse(s.at||base.at),levels=[],chosen=[];let list=base.dashas;
 for(let i=0;i<4;i++){const selected=list.find(p=>p.index===s.path[i])||list.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end))||list[0];levels.push(list);chosen.push(selected);list=dashaChildren(selected);}
 const selected=chosen.at(-1),lord=d.planets.find(p=>p.name===selected.lord),aspects=lord?[7,...(lord.key==='mars'?[4,8]:lord.key==='jupiter'?[5,9]:lord.key==='saturn'?[3,10]:[])].map(n=>(lord.house+n-2)%12+1):[];

 d.highlight=lord?[lord.house,...aspects]:[];
 const basisAt=s.path.length?selected.start:s.at||base.at;
 s.activePeriod={at:basisAt,date:localDisplayTime(basisAt),lords:chosen.map(p=>p.lord),lord:selected.lord,house:lord?.house,aspects,varga:s.n};
 ctx.root.innerHTML=`<section id="vedic"><h1>印度占星 · Jyotish</h1><p class="thin">Lahiri 恒星黄道 · 整宫制 · 平交点</p>
 <div class="rail">${[1,9,10,7,2,60].map(n=>btn('D'+n+' '+VARGAS[n],`data-varga="${n}" aria-pressed="${s.n===n}"`)).join('')}</div><label>完整分盘<select data-varga-select>${Array.from({length:60},(_,i)=>`<option value="${i+1}" ${s.n===i+1?'selected':''}>D${i+1} ${VARGAS[i+1]||'谐波映射（非经典列示）'}</option>`).join('')}</select></label><div class="rail">${btn('北印菱形盘',`data-layout="north" aria-pressed="${s.layout==='north'}"`)}${btn('南印方格盘',`data-layout="south" aria-pressed="${s.layout==='south'}"`)}</div>
 <article class="card liquid-glass"><h2>${s.layout==='north'?'北印菱形盘':'南印方格盘'} · D${s.n}</h2>${s.layout==='north'?northIndianChart(d):southIndianChart(d,base)}<p>D${s.n} ${VARGAS[s.n]||'谐波'}：上升${esc(d.lagna)}，主运星${esc(selected.lord)}落第${lord?.house||'—'}宫；专项观察${esc(VARGAS[s.n]||'对应分盘')}中的职责与资源。${esc(d.method)}</p><p class="thin">上升 ${esc(d.lagna)} · 岁差 ${d.ayanamsa.toFixed(6)}° · 盘面基准 ${esc(ctx.state.instantSnapshot?formatLocalDisplayTime(ctx.state.profile.fields):localDisplayTime(d.utc))}</p></article>
 </section>${vedicOverview(base,d,chosen)}<section class="vedic-rest"><article class="card" data-vedic-nakshatra><h2>27 星宿与宿度</h2><p class="thin">以下为 D1 出生恒星黄道；分盘只改变上方宫位映射。宿主落1/5/9宫侧重支持，落6/8/12宫侧重磨练，需合参宫主与相位。</p>${table(['星体','星座 / 宫位','精确度数','星宿 / 宿度','宿主 / 分足'],[{key:'lagna',name:'上升 Lagna',sid:base.ascSid,house:1,nakIndex:Math.floor(base.ascSid/(360/27)),nakshatra:nakNames[Math.floor(base.ascSid/(360/27))],nakDegree:base.ascSid%(360/27),nakLord:base.sequence[Math.floor(base.ascSid/(360/27))%9],pada:Math.floor(base.ascSid/(360/108))%4+1,sign:base.lagna,degree:{degrees:Math.floor(base.ascSid%30),minutes:Math.floor(base.ascSid%1*60),seconds:Math.floor(base.ascSid%1*3600)%60}},...base.planets].map(p=>[p.name+' '+planetStates(p,base.planets).join(' / '),p.sign+' · '+p.house+'宫',dms(p.degree),(nakNames[p.nakIndex]||p.nakshatra)+' '+p.nakDegree.toFixed(4)+'°',p.nakLord+' · Pada '+p.pada+'（本命宿主落'+(base.planets.find(q=>q.name===p.nakLord)?.house||1)+'宫）']))}</article>
 <article class="card liquid-glass" data-vedic-states><h2>行星状态检视</h2><div class="chips">${d.planets.map(p=>term(p.name+' · '+(planetStates(p,d.planets).join(' / ')||'平常'),p.name+'落'+p.sign+'第'+p.house+'宫。'+(planetStates(p,d.planets).join('、')||'本模型未检出特殊状态')+'；仅按所选分盘观察宫位。')).join('')}</div><small>逆行、燃烧、行星战与尊贵状态按当前本地模型计算，传统象意不等于事件保证。</small></article>
 ${base.shadbala?`<article class="card liquid-glass" data-vedic-shadbala><h2>Shadbala 六力审计</h2>
 <p class="thin">七曜分项得分，60 virupa = 1 Rupa。已覆盖位置/方向/时间月相/动势/自然力/七分友谊/相位七项，看<strong>位次与短板</strong>，不设绝对达标线。</p>
 ${table(['行星','位置','方向','时间','动势','自然','七分','相位','Rupas','位次'],base.shadbala.rows.map(r=>[r.name+(r.retro?' ℞':''),String(r.sthana.toFixed(0)),String(r.dig.toFixed(0)),String(r.paksha.toFixed(0)),String(r.cheshta),String(r.naisargika.toFixed(0)),String(r.saptavargaja.toFixed(0)),String(r.drik.toFixed(0)),r.rupas.toFixed(2),r.rank+'/7']))}
 <p>最强 <b>${esc(base.shadbala.strongest)}</b> · 最弱 <b>${esc(base.shadbala.weakest)}</b>；各自短板：${base.shadbala.rows.map(r=>esc(r.name+'='+r.weakestPart[0])).join('、')}</p>
 <small>${esc(base.shadbala.method)}</small></article>`:''}
 ${base.bhavaBala?`<article class="card" data-vedic-bhava><h2>十二宫力量 · Bhava Bala</h2>
 ${table(['宫位','宫主','宫内','宫主力','评分','评级'],base.bhavaBala.rows.map(r=>[r.house+' · '+r.theme,r.lord,r.occupants.join('、')||'—',r.lordPower.toFixed(1),r.score.toFixed(1),r.grade]))}
 <p>最强三宫 ${base.bhavaBala.strongest.join('、')} · 最弱三宫 ${base.bhavaBala.weakest.join('、')}——用强宫的资源去补弱宫的缺口。</p><small>${esc(base.bhavaBala.method)}</small></article>`:''}
 ${base.ashtakavarga?.valid?(()=>{const a=base.ashtakavarga;const themes=['自我与身体','财帛与家人','勇气与同辈','家宅与内心','子女与智慧','竞争与服务','婚姻与合作','转化与他财','运势与师长','事业与名望','收益与人脉','消耗与远行'];
  return `<article class="card liquid-glass" data-vedic-ashtakavarga><h2>Ashtakavarga 八分点 · SAV ${a.total}</h2>
  <p class="thin">七曜按 BPHS 吉宫表给十二星座记分（校验位 337，本盘 ${a.total} 校验通过）。SAV 是结构支撑度，均值约 28，非吉凶断言。</p>
  ${table(['宫位','星座','SAV','结构支撑'],a.byHouse.map(r=>[r.house+' · '+themes[r.house-1],r.sign,String(r.points),r.points>=32?'强':r.points>=30?'较强':r.points>=28?'略高':r.points>=25?'中等':r.points>=22?'偏弱':'弱']))}
  <p>最厚 <b>第${a.strongest.house}宫（${esc(a.strongest.sign)} ${a.strongest.points}）</b> · 最薄 <b>第${a.weakest.house}宫（${esc(a.weakest.sign)} ${a.weakest.points}）</b>——厚宫所主之事结构支撑足，薄宫宜后天补。</p>
  <small>${esc(a.method)}</small></article>`;})():''}
 ${base.yogini?.valid?(()=>{const yg=base.yogini;const cur=yg.current;
  const round=Math.floor(Math.max(0,cur?.i??0)/8),slice=yg.list.slice(round*8,round*8+8);
  return `<article class="card liquid-glass" data-vedic-yogini><h2>Yogini 八女神短周期运 · 36 年一轮</h2>
  <p class="thin">月亮在第 ${yg.nakNo} 宿，宿序 +3 取余 8 定起运为 <b>${esc(yg.start.zh)}（${esc(yg.start.name)}，主${esc(yg.start.lord)}）</b>，出生尚余 ${yg.balanceYears.toFixed(2)} 年。当前：${cur?`<b>${esc(cur.zh)}</b> · ${cur.ageStart}–${cur.ageEnd} 岁`:'不在所列段内'}。与 Vimshottari 交叉验证，不单独断事。</p>
  ${table(['Yogini','主星','年数','年龄区间','当前'],slice.map(s=>[s.zh+' · '+s.name,s.lord,String(s.years),s.ageStart+'–'+s.ageEnd+' 岁',s.active?'●':'']))}
  <p class="thin">当前段八小运：${cur?cur.antardashas.map(a=>`${esc(a.zh)}(${a.years.toFixed(2)}年${a.active?'·当前':''})`).join('、'):'—'}</p>
  <small>${esc(yg.method)}</small></article>`;})():''}
 ${base.varshaphala?`<article class="card liquid-glass" data-vedic-varsha><h2>岁运 Varshaphala · ${base.varshaphala.year}</h2>
 <p>返照起盘 ${esc(localDisplayTime(base.varshaphala.returnUtc))}（本地） · 返照上升 <b>${esc(base.varshaphala.chart.lagna)}</b></p>
 <p>Muntha 落第 ${base.varshaphala.muntha.house} 宫（${esc(base.varshaphala.muntha.theme)}）—— 今年的实质变化多落在这个领域。</p>
 <p>年度主星 <b>${esc(base.varshaphala.yearLord.name)}</b>${base.varshaphala.yearLord.house?` · 返照盘第 ${base.varshaphala.yearLord.house} 宫`:''}${base.varshaphala.yearLord.retro?' · 逆行（内省与延迟兑现）':''}</p>
 <small>${esc(base.varshaphala.method)}</small></article>`:''}
 <article class="card liquid-glass vedic-period"><h2>Vimshottari 大运</h2><p>当前大运：${esc(d.active?.lord||'不在所列运限')} · 出生大运余额 ${d.balanceYears.toFixed(4)} 年</p>
 <div class="rail">${btn('−1年','data-v-time="-12"')}${btn('−1月','data-v-time="-1"')}${btn('＋1月','data-v-time="1"')}${btn('＋1年','data-v-time="12"')}</div>
 ${levels.map((items,depth)=>`<p class="thin">${['Maha 主运','Antar 副运','Pratyantar 细运','Sookshma 微运'][depth]}</p><div class="vedic-dasha">${items.map(p=>btn(p.lord,`data-dasha="${p.index}" data-depth="${depth}" aria-pressed="${chosen[depth].index===p.index}" title="${esc(p.start+' → '+p.end)}"`)).join('')}</div>`).join('')}
 <p>四级执政：${chosen.map(p=>esc(p.lord)).join(' → ')} · 照拂宫位 ${aspects.join('、')}（传统照宫规则）</p>
 <div data-dasha-detail aria-live="polite"><h3>${esc(selected.lord)}大运${selected.active?' · 当前':''}</h3><p>${esc(localDisplayTime(selected.start))} 至 ${esc(localDisplayTime(selected.end))}（本地）</p><p>此阶段可结合${term(selected.lord+'所在第'+d.planets.find(p=>p.name===selected.lord)?.house+'宫',selected.lord+'是此段大运主星，传统上将其本命所在宫位作为阶段观察主题。大运不等于事件保证。')}与当下行运观察。</p></div>
 <small>顺序：${esc(d.sequence.join(' → '))}；从月亮出生星宿的宿主起排。</small></article><section class="period-result"><article class="card liquid-glass period-guidance" data-period-guidance data-vedic-period-report><h3>当前 Dasha 专属时空分析</h3><p><b>选择阶段：</b>${esc(chosen.map(x=>x.lord).join(' → '))} · ${esc(localDisplayTime(selected.start))} 至 ${esc(localDisplayTime(selected.end))}</p><p><b>主星落点：</b>${esc(selected.lord)}在 D${s.n} 第 ${lord?.house||'—'} 宫，${esc(lord?.sign||'星座待考')}，${esc(lord?.nakshatra||'星宿数据待考')}；本命可核对${lord?.house?`第 ${lord.house} 宫所主主题`:'宫位待定位'}。</p><p><b>阶段主轴：</b>以该宫主题为观察范围，再核对副运、细运、微运是否共同触及同一宫主或星宿主；没有重复指向时不叠加判断。</p><p><b>照宫：</b>${esc(aspects.join('、')||'无可用照宫数据')}宫；回到盘面核对其宫主和落星。</p><p><b>分盘参照：</b>D${s.n} ${esc(VARGAS[s.n]||'专项分盘')}，仅回答对应专项问题；D1 本命是前提。</p></article><div data-period-resonance></div></section>
 <p class="thin">${esc(d.method)}</p></section>`;
 for(const b of ctx.root.querySelectorAll('[data-varga]'))b.onclick=()=>{s.n=+b.dataset.varga;vedicView(ctx);ctx.onSelectTimeNode('vedic');};
 $('[data-varga-select]',ctx.root).onchange=e=>{s.n=+e.target.value;vedicView(ctx);ctx.onSelectTimeNode('vedic');};
 for(const b of ctx.root.querySelectorAll('[data-layout]'))b.onclick=()=>{s.layout=b.dataset.layout;vedicView(ctx);ctx.onSelectTimeNode('vedic');};
 for(const b of ctx.root.querySelectorAll('[data-v-time]'))b.onclick=async()=>{const at=new Date(s.at||base.at);at.setUTCMonth(at.getUTCMonth()+Number(b.dataset.vTime));s.at=at.toISOString();const token=s.timeToken=(s.timeToken||0)+1;const result=await ctx.request('/api/console/vedic',{birth:ctx.birth,at:s.at});if(token!==s.timeToken||ctx.state.chartState.vedic!==s)return;s.data=result;s.path=[];if(ctx.state.system==='vedic'&&ctx.state.tab==='chart')vedicView(ctx);if(ctx.state.system==='vedic')ctx.onSelectTimeNode('vedic');};
 for(const b of ctx.root.querySelectorAll('[data-dasha]'))b.onclick=()=>{const scroll=$('.vedic-dasha',ctx.root).scrollLeft;const depth=+b.dataset.depth;s.path=s.path.slice(0,depth);s.path[depth]=+b.dataset.dasha;vedicView(ctx);$('.vedic-dasha',ctx.root).scrollLeft=scroll;ctx.onSelectTimeNode('vedic');};
 const show=house=>{const stars=d.planets.filter(p=>p.house===house);ctx.explain('第'+house+'宫 · '+d.houseSigns[house-1],stars.map(p=>p.name+' · '+(nakNames[p.nakIndex]||p.nakshatra)+' '+p.nakDegree.toFixed(4)+'° · '+p.nakLord+'主宿').join('；')||'本宫无本命九曜，可结合宫主星所在宫位观察。');};
 for(const g of ctx.root.querySelectorAll('[data-vedic-house]')){g.onclick=()=>show(+g.dataset.vedicHouse);g.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();show(+g.dataset.vedicHouse);}};}
}

const statusMark={'庙':'Ex','旺':'Ex','陷':'Deb','逆':'R','焦':'C','战':'W'};
function southPlanet(p, data, natal){
 const states=planetStates(p,data.planets).filter(state=>!['焦','战'].includes(state[0]));
 const physical=natal.planets.find(star=>star.key===p.key);
 if(physical)states.push(...planetStates(physical,natal.planets).filter(state=>['焦','战'].includes(state[0])));
 const marks=[...new Set(states.map(state=>statusMark[state[0]]).filter(Boolean))];
 return `<span title="${esc([p.name,...states].join(' · '))}">${esc(p.name.slice(0,2))}${marks.length?`<sup>${marks.join('/')}</sup>`:''}</span>`;
}
export function southIndianChart(d,natal=d){
 const cells=[[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1],[0,0]];
 return `<div class="south-chart" role="group" aria-label="南印方格盘，星座位置固定">${cells.map(([x,y],sign)=>{const h=(sign-d.lagnaIndex+12)%12+1,stars=d.planets.filter(p=>p.signIndex===sign);return `<button type="button" class="south-house" style="grid-column:${x+1};grid-row:${y+1}" data-vedic-house="${h}" data-current="${h===1}" data-dasha-lit="${d.highlight?.includes(h)||false}" aria-label="第${h}宫 ${esc(d.houseSigns[h-1])} ${esc(stars.map(p=>p.name).join('、'))}"><span class="south-house-label">${sign+1} · ${h===1?'ASC':h+'宫'}</span><span class="south-planets">${stars.map(p=>southPlanet(p,d,natal)).join('')||'·'}</span></button>`;}).join('')}<div class="south-center" aria-hidden="true">南印盘 · D${d.n||1}</div></div>`;
}

export function vedicTools(ctx,host){
 const s=ctx.state.chartState.vedic??={data:ctx.state.reading.vedic,n:1,layout:'north',path:[]};
 const actions=[['分盘切换 D1–D60','varga'],['大运时序 · 四级','dasha'],['Yogini 八女神运','yogini'],['星宿全览 · 27宿/Pada','nakshatra'],['行星状态 · 燃烧/交战','states'],['力量审计 · Shadbala','shadbala'],['宫位力量 · Bhava','bhava'],['八分点 · Ashtakavarga','ashtakavarga'],['岁运 · Varshaphala','varsha']];
 host.innerHTML=`<div class="tool-grid vedic-tools">${actions.map(([name,id])=>btn(name,`data-vedic-action="${id}"`)).join('')}</div><p class="thin">当前 D${s.n||1} · ${s.layout==='south'?'南印方格':'北印菱形'}。只在印度占星页显示本菜单。</p>`;
 for(const b of host.querySelectorAll('[data-vedic-action]'))b.onclick=()=>{
  const id=b.dataset.vedicAction;
  ctx.close(document.querySelector('#toolSheet'));
  const target={varga:'[data-varga-select]',dasha:'.vedic-period',yogini:'[data-vedic-yogini]',nakshatra:'[data-vedic-nakshatra]',states:'[data-vedic-states]',shadbala:'[data-vedic-shadbala]',bhava:'[data-vedic-bhava]',ashtakavarga:'[data-vedic-ashtakavarga]',varsha:'[data-vedic-varsha]'}[id];
  // 这些区块是 #vedic 的兄弟节点（位于 section.vedic-rest 内），不能在 #vedic 内查找，否则永远匹配不到。
  (ctx.root.querySelector(target)||document.querySelector(target))?.scrollIntoView({behavior:'smooth',block:'start'});
 };
}

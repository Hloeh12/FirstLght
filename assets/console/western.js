import {localDisplayTime} from './now.js';
import {aspectBrowser,bindAspectBrowser,aspectMeaning} from './aspects.js';
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
const modes={natal:'本命',sky:'天象',transit:'行运',secondary:'次限',tertiary:'三限',solar:'日返',lunar:'月返',firdaria:'法达',profection:'小限',arc:'太阳弧'};
const presets={default:'默认标准',strict:'古典严格',custom:'自定义'};
const orbLabels={0:'合相',30:'半六合',45:'半刑',60:'六合',90:'刑相',120:'三合',135:'补八分',150:'梅花相',180:'对冲'};
const defaultOrbs={0:8,30:2,45:2,60:5,90:7,120:7,135:2,150:2,180:8};
const key='xy_astro_config';
const defaultCfg={house:'placidus',zodiac:'tropical',ayan:'lahiri',visible:Object.keys(bodies).slice(0,16),node:'true',preset:'default',orbs:defaultOrbs,phaseWeight:false,nominalAge:false,theme:'light'};
const cfg=()=>({...defaultCfg,...stored(key,{})});
/* v0.79.0 测测风格改造：现代/古典盘预设。
   古典盘 = 只留七曜(sun..saturn) + whole 整宫 + 古典严格容许度；
   现代盘 = 十大主星 + placidus + 默认容许度。切换只改 config，盘面/参数/相位全部随之。 */
const CLASSIC_BODIES=Object.keys(bodies).slice(0,7);
const MODERN_CFG={house:'placidus',visible:Object.keys(bodies).slice(0,16),preset:'default'};
const CLASSIC_CFG={house:'whole',visible:CLASSIC_BODIES,preset:'strict'};
const eraOf=c=>(c.house==='whole'&&c.preset==='strict'&&c.visible.length===CLASSIC_BODIES.length)?'classic':'modern';
/* 测测风格：6 种皮肤。每皮肤给盘面注入一套 CSS 变量（--wheel-*），由 .wheel-skin-xxx 消费。 */
const SKINS={degree:{label:'度数',ring:'#3c3c44',bg:'#f7f7f9',panel:'#ffffff',line:'#c9c9d2',tick:'#9d9da8',zodiac:'#55555f',num:'#8a8a95',star:'#2f2f38',accent:'#2f6fed'},
 classic:{label:'经典',ring:'#111318',bg:'#0e1015',panel:'#161920',line:'rgba(255,255,255,.42)',tick:'rgba(255,255,255,.30)',zodiac:'#e8e8ee',num:'#b8b8c2',star:'#ffffff',accent:'#ffd166'},
 cece:{label:'测测',ring:'#2a2a33',bg:'#1b1c24',panel:'#23242e',line:'rgba(255,255,255,.35)',tick:'rgba(255,255,255,.22)',zodiac:'#f0f0f4',num:'#9d9da8',star:'#ffffff',accent:'#4f8cff'},
 fresh:{label:'清爽',ring:'#8ecdf0',bg:'#eaf6fd',panel:'#ffffff',line:'#a8d9f0',tick:'#7db8dd',zodiac:'#2a6a8a',num:'#5a93b3',star:'#1a4a66',accent:'#29a3e0'},
 cute:{label:'可爱',ring:'#ffb7d5',bg:'#fff0f7',panel:'#ffffff',line:'#f6b7d4',tick:'#e98fbc',zodiac:'#b0487e',num:'#c76a9b',star:'#8f2a5f',accent:'#ff4f8b'},
 night:{label:'夜空',ring:'#0d1b4c',bg:'#0a1230',panel:'#12204a',line:'rgba(160,190,255,.40)',tick:'rgba(160,190,255,.28)',zodiac:'#cdd9ff',num:'#8fa3d8',star:'#ffffff',accent:'#7aa8ff'}};
const SKIN_KEYS=Object.keys(SKINS);
const skinOf=()=>stored('xy_wheel_skin','cece');
const styleOf=()=>stored('xy_wheel_style','text');
const norm=x=>((x%360)+360)%360;
const pad=x=>String(x).padStart(2,'0');
const dms=d=>d.degrees+'°'+pad(d.minutes)+'′'+pad(d.seconds)+'″';
const dateTime=localDisplayTime;
/* v0.79.0：相位线改「语义颜色」——紧张红、和谐蓝绿、中性金。
   原来一整片粉色，红蓝绿都看不出，测测风格里相位性质直接由线色表达。 */
const aspectColors={0:'#f2b544',30:'#9d9da8',45:'#e06c75',60:'#4dabf7',90:'#ff5b5b',120:'#49c47c',135:'#e06c75',150:'#9d9da8',180:'#ff4d5e'};
const aspectKind=angle=>[90,180,45,135].includes(angle)?'紧张':[60,120].includes(angle)?'和谐':'中性';
/* 行星语义配色（测测风格：每颗星一个专属色，文字与符号共用） */
const planetColors={sun:'#ffd166',moon:'#c8c8d8',mercury:'#4db6ac',venus:'#ff8fc7',mars:'#ff6b6b',jupiter:'#57cc99',saturn:'#c9a227',uranus:'#59c3e3',neptune:'#7aa8ff',pluto:'#b07af5',
 north:'#9d7be0',south:'#e08f5a',asc:'#ffd166',dsc:'#ffd166',mc:'#ffd166',ic:'#ffd166',fortune:'#7fd1a8',vertex:'#e08fd0',chiron:'#c98fd8',lilith:'#a06ad0',juno:'#e07ab8',vesta:'#e0a060',pallas:'#8fd0e0',ceres:'#b0a060'};
const planetColor=key=>planetColors[key]||'#ffffff';
/* 星座在盘上的单字缩写（测测风格），与 zodiacNames 顺序一一对应 */
const signAbbr=['羊','牛','双','蟹','狮','处','秤','蝎','射','摩','瓶','鱼'];
/* 行星在盘上的单字/符号标记：文字样式用单字，符号样式用天文符号（测测风格）。 */
const shortNames={sun:'日',moon:'月',mercury:'水',venus:'金',mars:'火',jupiter:'木',saturn:'土',uranus:'天',neptune:'海',pluto:'冥',
 north:'北',south:'南',asc:'升',dsc:'降',mc:'顶',ic:'底',fortune:'福',vertex:'宿',chiron:'凯',lilith:'莉',juno:'婚',vesta:'灶',pallas:'智',ceres:'谷'};
const shortOf=key=>shortNames[key]||String(key||'?' ).slice(0,1);
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
export function wheel(r,skin='cece',style='text'){
 const a=r.chart,b=r.outer,c=220;
 const S=SKINS[skin]||SKINS.cece;
 const sym=style==='symbol';
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
   if(!p||!q)return '';
   const [x1,y1]=xy(p.lon,outer?135:107),[x2,y2]=xy(q.lon,107);
   return `<line class="wheel-aspect" data-aspect-angle="${x.angle}" data-aspect-kind="${aspectKind(x.angle)}" data-aspect-from="${outer?'outer':'inner'}-${p.key}" data-aspect-to="inner-${q.key}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${aspectColors[x.angle]}" ${x.angle===180?'stroke-dasharray="5 4"':''}/>`;
  }).join('');
 };
 /* 刻度按 4 档分组（30/10/5/1 度），视觉等价但节点 360 → 4 path。 */
 const tickGroups={major:{w:1,r:177,d:[]},mid:{w:.42,r:194,d:[]},minor:{w:.42,r:197,d:[]},fine:{w:.42,r:200,d:[]}};
 for(let i=0;i<360;i++){
  const g=i%30===0?tickGroups.major:i%10===0?tickGroups.mid:i%5===0?tickGroups.minor:tickGroups.fine;
  const p=xy(i,202),q=xy(i,g.r);
  g.d.push('M'+p[0].toFixed(2)+' '+p[1].toFixed(2)+'L'+q[0].toFixed(2)+' '+q[1].toFixed(2));
 }
 const ticks=Object.values(tickGroups).map(g=>`<path d="${g.d.join('')}" class="wheel-tick" stroke="#b58ba7" stroke-width="${g.w}"/>`).join('');
 /* 同心圆环：由内向外 4 圈，底色由皮肤变量控制。 */
 const rings=[135,161,177,202].map((rad,i)=>`<circle cx="${c}" cy="${c}" r="${rad}" class="wheel-ring-circle" stroke-width="1"/>`).join('');
 /* 星座外圈：单字缩写（文字样式）或符号（符号样式），置于刻度内侧。 */
 const zodiac=symbols.map((s,i)=>label(i*30+15,184,sym?s+'\uFE0E':signAbbr[i],'class="wheel-zodiac-glyph" font-size="13"')+label(i*30+15,195,zodiacNames[i],'class="wheel-zodiac-name" font-size="7"')).join('');
 /* 宫位：12 条径向分界线 + 宫位号。宫位号可点击弹详细说明。 */
 const houses=a.cusps.map((lon,i)=>{
  const mid=lon+norm(a.cusps[(i+1)%12]-lon)/2;
  const [hx,hy]=xy(mid,169);
  return line(xy(lon,162),xy(lon,0),'class="wheel-house-line"')+
   `<g class="wheel-house" role="button" tabindex="0" aria-label="第${i+1}宫" data-wheel-house="${i+1}" data-lon="${mid}"><circle class="wheel-star-hit" cx="${hx}" cy="${hy}" r="12" fill="transparent"/><text class="wheel-house-num" x="${hx}" y="${hy}" text-anchor="middle" dominant-baseline="central" font-size="9">${i+1}</text></g>`;
 }).join('');
 const axisNames={asc:'上升 ASC',dsc:'下降 DSC',mc:'天顶 MC',ic:'天底 IC'};
 const axes=Object.entries(a.axes).filter(([k])=>r.mode==='composite'||a.planets.some(p=>p.key===k)).map(([key,lon])=>{
  const [ax,ay]=xy(lon,161),[bx,by]=xy(lon,104),[lx,ly]=xy(lon,157);
  const [sxp,syp]=xy(lon,170);
  return line([ax,ay],[bx,by],'class="wheel-axis-line"')+
   `<g class="wheel-body-glyph wheel-axis" role="button" tabindex="0" aria-pressed="false" data-wheel-focus="axis-${key}" aria-label="${axisNames[key]||key}"><circle class="wheel-star-hit" cx="${sxp}" cy="${syp}" r="13" fill="transparent"/>`+
   `<text class="wheel-axis-name" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" font-size="7" font-weight="750">${axisNames[key]||key}</text>`+
   `<text class="wheel-axis-short" x="${sxp}" y="${syp}" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="750" fill="${S.accent}">${esc(shortOf(key))}</text></g>`;
 }).join('');
 const placements=radialLayout(wheelBodies(a),b?wheelBodies(b):[],xy);
 const stars=placements.map(p=>{
  const anchor=p.outer?135:104;
  const [x,y]=xy(p.lon,anchor),[lx,ly]=xy(p.plot,p.radius);
  const degree=p.degree.degrees+'°'+pad(p.degree.minutes)+'′';
  const glyph=sym?p.symbol:shortOf(p.key);
  const color=planetColor(p.key);
  return `<g data-wheel-body="${p.outer?'outer':'inner'}" data-star-key="${esc(p.key)}" data-lon="${p.lon}" data-radius="${p.radius}">
   <title>${esc(p.name+' '+p.sign+' '+dms(p.degree))}</title><circle class="wheel-star-dot" cx="${x}" cy="${y}" r="1.6" fill="${color}"/>`+
   line([x,y],[lx,ly],`class="wheel-star-lead" stroke="${color}" stroke-opacity=".5" stroke-width=".6"`)+
   `<g transform="translate(${lx} ${ly})"><g class="wheel-body-glyph" role="button" tabindex="0" aria-pressed="false" data-wheel-focus="${p.outer?'outer':'inner'}-${p.key}" aria-label="${p.outer?'行运':'本盘'} ${esc(p.name)}">
   <g class="wheel-star-visual"><circle class="wheel-star-halo" r="12" cy="2"/><circle class="wheel-star-hit" r="13" cy="2"/>
   <text class="wheel-star-name" y="0" text-anchor="middle" dominant-baseline="central" font-size="${sym?13:11}" font-weight="650" fill="${color}">${esc(glyph)}</text>
   <text class="wheel-star-degree" y="${sym?12:10}" text-anchor="middle" dominant-baseline="central" font-size="6.6" fill="${color}">${degree}</text>
   <text class="wheel-star-short" y="0" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="750" fill="${color}">${esc(shortOf(p.key))}</text></g></g></g></g>`;
 }).join('');
 const vars=`--wheel-bg:${S.bg};--wheel-panel:${S.panel};--wheel-ring:${S.ring};--wheel-line:${S.line};--wheel-tick:${S.tick};--wheel-zodiac:${S.zodiac};--wheel-num:${S.num};--wheel-star:${S.star};--wheel-accent:${S.accent}`;
 return `<svg id="westernChart" class="wheel wheel-skin-${skin}" style="${vars}" viewBox="0 0 440 440" role="group" aria-label="${b?'本命与行运双圈圆盘':'西洋占星圆盘'}"><rect class="wheel-bg" x="0" y="0" width="440" height="440" rx="14"/>${rings}<g class="wheel-ring">${ticks}
 ${zodiac}${houses}
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
// v0.48.0：相位逐条解读不再套同一句「回到盘面核对…」。
// 按角度给「剧情」，按星体给「领域」，再叠加入/出相与容许度松紧——每条都不同。
const ASPECT_STORY={
 0:'两股能量合流，议题被同时点亮——关注它们共同落的宫位，那里是本期最容易被推动的场域。',
 60:'一次轻巧的协作机会，需要你主动发起才成形——适合铺垫、联络与小额尝试，不必等大时机。',
 90:'张力带来摩擦，也带来调整的动力——冲突点往往落在两星所主管的议题之间，宜疏不宜堵。',
 120:'和谐流通的天赋支持，事情较易顺势推进——留意别把顺境当成理所当然，仍要有落地动作。',
 180:'两端拉扯形成关系镜像，容易在对立里看见自己——合作与亲密议题需兼顾双方节奏。'
};
const PLANET_DOMAIN={
 '太阳':'自我意志与存在感','月亮':'情绪与安全需求','水星':'思维沟通与交易','金星':'关系与审美价值',
 '火星':'行动力与竞争','木星':'成长信念与扩张','土星':'责任约束与课题','天王星':'变革与独立',
 '海王星':'灵感想象与边界','冥王星':'深度转化与掌控','北交点':'成长方向','南交点':'惯性来处','上升':'外在姿态','天顶':'事业形象'
};
const domainOf=name=>PLANET_DOMAIN[String(name||'').replace(/^(本命|推运|行运)/,'')]||'该星所主管的议题';
/* v0.49.0：每条相位的收尾也要随角度变化，否则多段文字会用同一句结尾，仍显套壳。
   同一相位类型在一段里可能出现两次（如两条刑相），所以每种角度备两个变体轮换。 */
const ASPECT_TAIL={
 0:['两星合在一处，主题会被放大，先看它们同宫还是跨宫，再定主次。','合相把两件事绑在一起，取舍时要一并考虑，拆开单看容易失真。'],
 60:['六合是可用之助，机会通常出现在两宫主题的交界，需要主动搭桥才接得住。','六合更像顺手的人情：本身不费力，但得有人先开口才成事。'],
 90:['四分相是压力点，摩擦往往先落在最日常的那件事上，宜拆小处理。','四分相制造卡点，常表现为反复拖延或硬碰硬，先减量再提速。'],
 120:['三分相是顺势之利，容易不知不觉就成了，但要防过度依赖、缺少备份。','三分相给的是顺风，行船仍要自己掌舵，别把顺势当成必然。'],
 180:['对分相是两端拉扯，常以他人的形式出现，需在关系里谈清条件与边界。','对分相是镜子：对方的坚持里，往往藏着自己没承认的那部分需求。']
};
function aspectStory(a,cross,idx=0){
 const angle=Number.isFinite(Number(a.angle))?Number(a.angle):null;
 const story=ASPECT_STORY[angle]||'两星形成特定角度，须结合相位性质、星体与落宫综合判读，不单独断事。';
 const aDom=domainOf(a.a),bDom=domainOf(a.b);
 const phase=a.applying===true?'正在入相，效应趋于增强':a.applying===false?'已经出相，效应逐渐回落':'相位阶段待定';
 const tight=Math.abs(a.orb)<=1.5?'容许度极紧，信号清晰':Math.abs(a.orb)<=2.5?'容许度偏紧，值得留意':'容许度尚宽，作辅助参考';
 const pool=ASPECT_TAIL[angle];
 const tail=pool?pool[Math.abs(idx)%pool.length]:'该角度不属主相位，只作盘面细节参考，不撑起独立判断。';
 return `${story} 具体落在${aDom}与${bDom}的交叉处，${phase}；${tight}。${tail}`;
}
function periodAnalysis(r,s){
 const cross=Boolean(r.outer);
 if(r.mode==='arc'&&r.arc){
  const hits=r.arc.hits||[];
  const ANG={0:'合相',45:'梅花相位',90:'刑相',135:'梅花相位',180:'冲相'};
  const evidence=hits.length?hits.slice(0,5).map(h=>`<p><b>弧推 ${esc(h.arc)} \u2192 本命 ${esc(h.natal)} ${ANG[h.angle]||h.angle+'\u00b0'}</b>，容许度 ${h.orb.toFixed(2)}°。太阳弧 ${r.arc.degrees.toFixed(1)}° 前进后触发该硬相位，对应领域压力/转折期观察。</p>`).join(''):'<p>本次太阳弧在 1\u00b0 容差内没有触发硬相位，不做事件推断。</p>';
  return `<div class="period-result"><article class="card liquid-glass period-guidance" data-period-guidance><h2>太阳弧推运 · 弧长 ${r.arc.degrees.toFixed(2)}°（约 ${Math.floor(r.arc.years)} 岁）</h2><p>太阳弧把全盘星体统一推进 ${r.arc.degrees.toFixed(2)}°，与本命星成硬相位处为该年重点观察区。容差统一 1°，只列证据不做演绎。</p>${evidence}</article></div>`;
 }
 const aspects=(cross?r.aspects:r.chart?.aspects)||[];
 const tight=aspects.filter(a=>Number.isFinite(a.orb)&&a.orb<=3).slice(0,4);
 const label=modes[r.mode]||'推运';
 const evidence=tight.length?tight.map((a,i)=>`<p><b>${esc(a.a+' '+a.type+' '+(cross?'本命':'')+a.b)}</b>，容许度 ${a.orb.toFixed(2)}°。${esc(aspectStory(a,cross,i))}</p>`).join(''):'<p>本次盘面在 3° 内没有主相位，不补造个人事件推断。</p>';
 return `<div class="period-result"><article class="card liquid-glass period-guidance" data-period-guidance><h2>当前推运专属分析</h2><p><b>${esc(label)} · ${esc(timeLabel(s))} 本地</b>。本次以${cross?'外行星与本命星位的紧密主相位':'本盘星体之间的紧密主相位'}为证据，不把天象直接等同个人事件。</p>${evidence}</article><div data-period-resonance></div></div>`;
}
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
const dignityTerm={'庙':'入庙','旺':'旺相','陷':'入弱','落':'落陷'};
const degreeMinutes=x=>{
 const n=Math.round(Math.abs(x)*60);
 return Math.floor(n/60)+'°'+pad(n%60)+'′';
};
export function planetList(planets){
 return '<div class="planet-list">'+planets.map(p=>`<div class="planet-row"><b>${esc(p.symbol+' '+p.name)}</b>
 <div class="planet-position"><span class="planet-sign term-hit" data-term="${esc(p.sign.replace('座',''))}" role="button" tabindex="0">${esc(p.sign)}</span><span class="planet-degree">${esc(dms(p.degree))}</span>
 <span class="planet-meta"><span class="term-hit" data-term="宫位" data-explain="第 ${p.house} 宫，是本命后天十二宫之一。">第${p.house}宫</span> ${p.retro?'逆行 Rx':''} ${dignityLabels[p.dignity]?`<span class="dignity-badge term-hit" data-term="${esc(dignityTerm[dignityLabels[p.dignity]]||'入庙')}" role="button" tabindex="0">${dignityLabels[p.dignity]}</span>`:''}${p.approximate?' · 近似位置':''}</span></div></div>`).join('')+'</div>';
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
 const config=cfg(),era=eraOf(config),skin=skinOf(),style=styleOf();
 const step=[['year',-1,'−1年'],['month',-1,'−1月'],['day',-1,'−1日'],['day',1,'＋1日'],['month',1,'＋1月'],['year',1,'＋1年']];
 const effects=r?.firdaria?firdariaPanel(r.firdaria):
  r?.profection?`<article class="card"><h2>古典小限</h2><p>${r.profection.age} ${r.profection.nominal?'虚岁':'周岁'} · 第 ${r.profection.house} 整宫 ${esc(r.profection.sign)} · 年主星 ${esc(r.profection.ruler)} 落本命第 ${r.profection.lordHouse} 宫。</p></article>`:'';
 const display=r?.chart;
 ctx.root.innerHTML=`<section aria-label="西洋占星"><div class="spread"><h1>西洋占星</h1><small>${esc(display?houses[display.houseSystem]:'')}</small></div>
 <div class="rail west-mode-rail" aria-label="西洋推运盘类">${Object.entries(modes).filter(([id])=>!s.birthOverride||id==='sky').map(([id,label])=>btn(label,`data-mode="${id}" aria-pressed="${s.mode===id}"`)).join('')}</div>
 ${s.instant?`<p class="thin" data-instant-caption>即刻 ${esc(s.instant.local||localDisplayTime(s.instant.at))} 本地 · ${esc(s.instant.place)}（${esc(s.instant.source)}）</p>`:''}<p id="astroStatus" role="status" class="muted">${esc(s.error||(!r?'正在计算星历…':''))}</p>
 ${display?`<article class="card liquid-glass"><div class="orbit-info"><span>上升<b>${esc(zodiacNames[Math.floor(display.axes.asc/30)])}</b></span><span>天顶<b>${esc(zodiacNames[Math.floor(display.axes.mc/30)])}</b></span><span>黄道<b>${display.zodiac==='tropical'?'回归':'恒星 '+display.ayan}</b></span></div>
 <div class="fl-wheel-toolbar" role="toolbar" aria-label="西洋盘工具">
  <div class="fl-toolbar-left">
   <button type="button" class="fl-icon-btn" data-wheel-skin aria-label="切换皮肤" title="皮肤">🎨</button>
   <button type="button" class="fl-icon-btn" data-wheel-style aria-label="切换文字/符号样式" title="文字/符号">${style==='symbol'?'符':'文'}</button>
  </div>
  <div class="fl-era-switch" role="group" aria-label="盘式">${btn('现代盘',`data-era="modern" aria-pressed="${era==='modern'}"`)}${btn('古典盘',`data-era="classic" aria-pressed="${era==='classic'}"`)}</div>
  <div class="fl-toolbar-right">
   <button type="button" class="fl-icon-btn" data-wheel-param aria-label="查看参数" title="参数">☰</button>
  </div>
 </div>
 <div class="wheel-stage">${btn('ASC 复位','class="asc-reset" data-asc-reset')}${wheel(r,skin,style)}<div class="wheel-focus-card" data-wheel-card role="status" aria-live="polite" hidden></div></div>${display.warning?`<p class="house-warning" role="status">${esc(display.warning)}</p>`:''}<small>${esc(s.instant?.local||dateTime((r.outer||display).utc))} · ${esc(display.warning||modes[r.mode])}</small>${r.returnEvent?`<p class="thin">回归黄经 ${r.returnEvent.longitude.toFixed(6)}° · 与本命差 ${r.returnEvent.errorDegrees.toExponential(2)}°</p>`:''}
 </article>`:''}
 <article class="card west-time-strip" aria-label="推运时间联动">
  <div class="wts-head"><span class="wts-label">推运时刻</span><strong data-wts-display>${esc(timeLabel(s))}</strong><span class="wts-unit">本地</span></div>
  <div class="wts-controls">
   <button type="button" class="wts-nav" data-time-step="-1" aria-label="前一天">‹</button>
   <button type="button" class="wts-date" data-astro-date aria-label="选择日期时间">${esc(s.mode==='natal'?'选日期起运':'📅 改期')}</button>
   <button type="button" class="wts-nav" data-time-step="1" aria-label="后一天">›</button>
  </div>
  <div class="rail wts-step-rail" aria-label="时间步进">${step.map(([unit,n,title])=>btn(title,`data-unit="${unit}" data-step="${n}"`)).join('')}</div>
 </article>
 ${display?periodAnalysis(r,s):''}
 ${display?`<article class="card"><h2>四元素与三形态</h2>${bars(Object.fromEntries(Object.entries(display.analysis.elements.percentages).map(([k,v])=>[k,Number.isFinite(v)?v:0])))}
 <p class="thin">${display.analysis.elements.missing.length?'未覆盖 '+display.analysis.elements.missing.join('、'):'四元素均有星体'} · 主导 ${display.analysis.elements.dominant.join('、')}</p>
 ${bars(Object.fromEntries(Object.entries(display.analysis.modalities.percentages).map(([k,v])=>[k==='基本'?'本位':k,Number.isFinite(v)?v:0])))}</article>
 ${sky?`<article class="card"><h2>月相与空亡</h2><p>${esc(sky.phase)} · 照明 ${sky.litPercent}%</p><p>${sky.voc.active?'当前月亮空相中，宜休整沉淀':'当前月亮尚未进入空相区间'}</p><small>${esc(sky.voc.start)} 至 ${esc(sky.voc.end)} UT · ${esc(sky.voc.method)}</small></article>`:''}${effects}${facts(r,s)}`:''}</section>`;
 if(r){
  bindAspectBrowser(ctx.root,r,s.aspects);
  const stage=$('.wheel-stage',ctx.root),card=$('[data-wheel-card]',stage);
  const layers=[['inner',r.chart],['outer',r.outer]];
  const lookup=new Map(layers.flatMap(([layer,data])=>(data?.planets||[]).map(p=>[layer+'-'+p.key,p])));
  // 四轴虚点：引擎把它们放在 axes（黄经数值）而非 planets，补成可点击的伪行星对象。
  const axisNames={asc:'上升 ASC',dsc:'下降 DSC',mc:'天顶 MC',ic:'天底 IC'};
  const axisSymbols={asc:'Asc',dsc:'Desc',mc:'MC',ic:'IC'};
  for(const [layer,data] of layers){
   if(!data?.axes)continue;
   for(const [key,lon] of Object.entries(data.axes)){
    if(!axisNames[key])continue;
    const deg=norm(lon),sign=zodiacNames[Math.floor(deg/30)],d={degrees:Math.floor(deg%30),minutes:Math.floor(deg%1*60),seconds:Math.floor(deg%1*3600)%60};
    lookup.set(layer+'-axis-'+key,{key:'axis-'+key,name:axisNames[key],symbol:axisSymbols[key],sign,degree:d,house:'轴线',dignity:null});
   }
  }
  // 相位列表：本命双盘相位 + 行运跨盘相位；按容许度排序，取最紧密的若干条展示在中宫卡片。
  const aspectPool=[...(r.chart?.aspects||[]),...(r.cross||[])];
  bindWheel(stage,s,key=>{
   const p=lookup.get(key);
   card.hidden=!p;
   if(!p){card.innerHTML='';return;}
   const layer=key.split('-')[0];
   const related=aspectPool.filter(x=>x.aKey===p.key||x.bKey===p.key)
    .sort((a,b)=>a.orb-b.orb).slice(0,3);
   const nameOf=k=>k==='asc'||k==='mc'||k==='dsc'||k==='ic'
    ? ({asc:'上升',mc:'天顶',dsc:'下降',ic:'天底'}[k]||k)
    : (lookup.get(layer+'-'+k)?.name||k);
   const aspectLines=related.length?`<div class="wheel-card-aspects"><span class="wca-title">主要相位</span>${related.map(x=>{
     const other=nameOf(x.aKey===p.key?x.bKey:x.aKey),m=aspectMeaning(x.angle);
     return `<span class="wca-row">${esc(x.symbol||orbLabels[x.angle]||'相位')} ${esc(other)} <em>${esc(m.tag)}</em></span>`;
    }).join('')}</div>`:'';
   const isAxis=String(p.key).startsWith('axis-');
   const houseLine=isAxis?`<span>轴点 · ${esc(p.sign)}</span>`:`<span>第 ${esc(p.house)} 宫 · ${dignityLabels[p.dignity]||'无庙旺陷落'}</span>`;
   const axisHint=isAxis?`<span class="wca-title">上升定宫 · 天顶定事业，为整张盘的定位锚点</span>`:'';
   card.innerHTML=`<b>${esc(p.symbol+' '+p.name)}${layer==='outer'?' · 行运':''}</b><span>${esc(p.sign+' '+dms(p.degree))}</span>${houseLine}${axisHint}${aspectLines}`;
  });
  // v0.79.0：宫位点击 → 详细说明卡（弹出式 sheet）。行星仍走中宫卡片。
  for(const h of stage.querySelectorAll('[data-wheel-house]')){
   const open=()=>houseSheet(ctx,r,h);
   h.onclick=open;
   h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
  }
 }
 selectedRails(ctx.root);
 for(const b of ctx.root.querySelectorAll('[data-mode]'))b.onclick=()=>update(ctx,b.dataset.mode,s.at);
 for(const b of ctx.root.querySelectorAll('[data-unit]'))b.onclick=()=>update(ctx,s.mode==='natal'?'transit':s.mode,shift(s.at,b.dataset.unit,+b.dataset.step));
 // 底部时间条：按天翻页。本命态下翻页自动进入行运，与测测「选时刻看盘」一致。
 for(const b of ctx.root.querySelectorAll('[data-time-step]'))b.onclick=()=>{
  const mode=s.mode==='natal'?'transit':s.mode;
  update(ctx,mode,shift(s.at,'day',+b.dataset.timeStep));
 };
 // v0.79.0：盘面工具条——皮肤 / 文字-符号 / 现代古典 / 参数。
 const toolbar=$('.fl-wheel-toolbar',ctx.root);
 if(toolbar){
  $('[data-wheel-skin]',toolbar)?.addEventListener('click',()=>skinSheet(ctx));
  $('[data-wheel-style]',toolbar)?.addEventListener('click',()=>{
   save('xy_wheel_style',styleOf()==='text'?'symbol':'text');westernView(ctx);if(s.result)ctx.onSelectTimeNode('west');
  });
  $('[data-wheel-param]',toolbar)?.addEventListener('click',()=>paramSheet(ctx,s));
 }
 for(const b of ctx.root.querySelectorAll('[data-era]'))b.onclick=()=>setEra(ctx,b.dataset.era);
 const picker=$('[data-astro-date]',ctx.root);
 if(picker)picker.onclick=()=>{
  const d=ctx.sheet('toolSheet','选择推运时间',`<form class="form-grid" data-wheel-submit><label>日期<input type="date" name="date" value="${timeLabel(s).slice(0,10)}" required></label><label>本地时间<input type="time" name="clock" value="${timeLabel(s).slice(11,16)}" required></label></form>`);
  $('form',d).onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);const at=new Date(f.get('date')+'T'+f.get('clock'));ctx.close(d);update(ctx,s.mode,at);};
 };
 if(!s.requested){s.requested=true;update(ctx,s.mode,s.at);}
}
/* v0.79.0：现代/古典盘切换。只改 config（宫位制+显示行星+容许度预设），
   再走原 update() 重拉 /api/console/western，后端 westernPro→settings() 会真正重排。 */
function setEra(ctx,era){
 const next={...cfg()};
 if(era==='classic'){next.house=CLASSIC_CFG.house;next.visible=CLASSIC_CFG.visible;next.preset=CLASSIC_CFG.preset;}
 else{next.house=MODERN_CFG.house;next.visible=MODERN_CFG.visible;next.preset=MODERN_CFG.preset;}
 save(key,next);
 const s=stateOf(ctx);
 update(ctx,s.mode,s.at);
}
/* v0.79.0：皮肤面板——6 种皮肤 + 文字/符号样式。 */
function skinSheet(ctx){
 const d=ctx.sheet('toolSheet','盘面皮肤',`<div class="wheel-skin-grid">${SKIN_KEYS.map(k=>`<button type="button" class="wheel-skin-card" data-skin="${k}" aria-pressed="${skinOf()===k}">
  <span class="wheel-skin-swatch" style="background:${SKINS[k].bg};--sk-ring:${SKINS[k].ring};--sk-line:${SKINS[k].line}"><i></i></span><small>${SKINS[k].label}</small></button>`).join('')}</div>
  <div class="wheel-style-row"><span>样式</span><div class="rail">${btn('文字',`data-style="text" aria-pressed="${styleOf()==='text'}"`)}${btn('符号',`data-style="symbol" aria-pressed="${styleOf()==='symbol'}"`)}</div></div>`);
 const apply=()=>{westernView(ctx);if(ctx.state.chartState.west?.result)ctx.onSelectTimeNode('west');};
 for(const b of d.querySelectorAll('[data-skin]'))b.onclick=()=>{save('xy_wheel_skin',b.dataset.skin);ctx.close(d);apply();};
 for(const b of d.querySelectorAll('[data-style]'))b.onclick=()=>{save('xy_wheel_style',b.dataset.style);ctx.close(d);apply();};
}
/* v0.79.0：参数面板——行星符号+星座度分+宫位列表，附相位矩阵表。 */
function paramSheet(ctx,s){
 const r=s?.result;if(!r)return;
 const display=r.chart,era=eraOf(cfg()),eraLabel=era==='classic'?'古典参数':'现代参数';
 const rows=display.planets.map(x=>`<div class="param-row"><span class="param-planet"><b style="color:${planetColor(x.key)}">${esc(x.symbol)}</b> ${esc(x.name)}</span>
  <span class="param-sign">${esc(x.sign)} <b style="color:${planetColor(x.key)}">${esc(x.symbol)}</b> ${esc(dms(x.degree))}</span>
  <span class="param-house">${x.house}宫</span></div>`).join('');
 ctx.sheet('toolSheet',eraLabel+' · '+houses[display.houseSystem],`<div class="param-legend">${era==='classic'?'仅七曜 · 整宫制':'十大主星 · Placidus'}</div>
  <div class="param-table">${rows}</div>
  <details class="param-aspects"><summary>相位矩阵</summary>${matrix(r)}</details>`);
}
/* v0.79.0：宫位详细说明卡——宫头度数、宫主星、宫内星体。 */
function houseSheet(ctx,r,h){
 const idx=Number(h.dataset.wheelHouse)-1,display=r.chart;
 const cusp=norm(display.cusps[idx]);
 const sign=zodiacNames[Math.floor(cusp/30)];
 const deg=Math.floor(cusp%30),min=pad(Math.floor(cusp%1*60));
 const occupants=display.planets.filter(x=>x.house===idx+1);
 const rulers=['火星','金星','水星','月亮','太阳','水星','金星','火星','木星','土星','土星','木星'];
 const ruler=rulers[Math.floor(cusp/30)];
 const rulerPlanet=display.planets.find(x=>x.name===ruler);
 const occ=occupants.length?occupants.map(x=>`<span class="chip" style="color:${planetColor(x.key)}">${esc(x.symbol+' '+x.name)}</span>`).join(''):'<span class="muted">空宫</span>';
 ctx.sheet('termSheet','第'+(idx+1)+'宫 · '+sign,`<article class="card"><h2>第 ${idx+1} 宫（${esc(sign)}）</h2>
  <p>宫头 ${sign} ${deg}°${min}′ · 宫主星 <b>${esc(ruler)}</b>${rulerPlanet?`（飞入本命第 ${esc(rulerPlanet.house)} 宫）`:''}</p>
  <div class="stack"><span class="thin">宫内星体</span>${occ}</div>
  <p class="thin">宫位代表该生活领域，宫内星体与宫主星共同决定该领域的主色调。</p></article>`);
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
export const houseLabels=houses;
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
 host.innerHTML='<h3>推运盘类</h3><div class="tool-grid">'+Object.entries(modes).filter(([id])=>!s.birthOverride&&['transit','secondary','tertiary','solar','lunar','arc'].includes(id)).map(([id,label])=>btn(label,`data-west-tool="${id}" aria-pressed="${s.mode===id}"`)).join('')+'</div>'+
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

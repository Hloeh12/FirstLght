/* 西方盘结构分析：庙旺落陷、命主星、元素/模式统计、相位格局。
 * 规则为古典占星常见定义，仅作结构化描述，不是预测。 */
const SIGN=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const ELEMENT=['火','土','风','水','火','土','风','水','火','土','风','水'];
const MODE=['基本','固定','变动','基本','固定','变动','基本','固定','变动','基本','固定','变动'];
const RULER=['火星','金星','水星','月亮','太阳','水星','金星','火星','木星','土星','土星','木星'];
const DOMICILE={太阳:[4],月亮:[3],水星:[2,5],金星:[1,6],火星:[0,7],木星:[8,11],土星:[9,10],天王星:[10],海王星:[11],冥王星:[7]};
const EXALT={太阳:0,月亮:1,水星:5,金星:11,火星:9,木星:3,土星:6};
const DETRIMENT={'太阳':[10],'月亮':[9],'水星':[8,11],'金星':[0,7],'火星':[1,6],'木星':[2,5],'土星':[3,4],'天王星':[4],'海王星':[5],'冥王星':[1]};
const FALL={太阳:6,月亮:7,水星:11,金星:5,火星:3,木星:9,土星:0};
export function analyze(w){
 const signIdx=p=>SIGN.indexOf(p.sign);
 const dignity=p=>{const s=signIdx(p);
  if(DOMICILE[p.name]?.includes(s))return '入庙';
  if(EXALT[p.name]===s)return '旺相';
  if(DETRIMENT[p.name]?.includes(s))return '入弱';
  if(FALL[p.name]===s)return '落陷';
  return '中性';};
 const planets=w.planets.map(p=>({name:p.name,sign:p.sign,house:p.house,retro:p.retro,dignity:dignity(p),dignitySystem:["天王星","海王星","冥王星"].includes(p.name)?"modern-domicile-only":"classical"}));
 const counts={element:{火:0,土:0,风:0,水:0},mode:{基本:0,固定:0,变动:0}};
 for(const p of w.planets){const i=signIdx(p);counts.element[ELEMENT[i]]++;counts.mode[MODE[i]]++;}
 const ruler=RULER[SIGN.indexOf(w.asc.sign)];
 const rulerPlanet=w.planets.find(p=>p.name===ruler)||null;
 const patterns=[];
 const byName=Object.fromEntries(w.planets.map(p=>[p.name,p]));
 const asp=(a,b,angle)=>w.aspects.find(x=>((x.a===a&&x.b===b)||(x.a===b&&x.b===a))&&x.angle===angle);
 // 大三角：三颗行星互成 120°
 const names=w.planets.map(p=>p.name);
 for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)for(let k=j+1;k<names.length;k++){
  const [a,b,c]=[names[i],names[j],names[k]];
  if(asp(a,b,120)&&asp(b,c,120)&&asp(a,c,120))patterns.push({type:'大三角',planets:[a,b,c]});
 }
 // T 三角：一对对冲 + 同时四分第三颗
 for(const opp of w.aspects.filter(x=>x.angle===180))for(const n of names){
  if(n===opp.a||n===opp.b)continue;
  if(asp(opp.a,n,90)&&asp(opp.b,n,90))patterns.push({type:'T 三角',planets:[opp.a,opp.b,n],note:'张力集中在 '+n});
 }
 // 星群：同一星座 3 颗以上行星
 const bySign={};for(const p of w.planets)(bySign[p.sign]=bySign[p.sign]||[]).push(p.name);
 for(const [s,list] of Object.entries(bySign))if(list.length>=3)patterns.push({type:'星群',planets:list,sign:s});
 const seen=new Set(),uniq=patterns.filter(p=>{const k=p.type+'|'+p.planets.slice().sort().join(',');if(seen.has(k))return false;seen.add(k);return true;});
 const distribution=c=>{const total=Object.values(c).reduce((a,b)=>a+b,0);return {percentages:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,100*v/total])),dominant:Object.keys(c).filter(k=>c[k]===Math.max(...Object.values(c))),missing:Object.keys(c).filter(k=>!c[k])};};
 return {elements:distribution(counts.element),modalities:distribution(counts.mode),planets,dignitiesSummary:{入庙:planets.filter(p=>p.dignity==='入庙').length,旺相:planets.filter(p=>p.dignity==='旺相').length,入弱:planets.filter(p=>p.dignity==='入弱').length,落陷:planets.filter(p=>p.dignity==='落陷').length},chartRuler:{planet:ruler,ascendantSign:w.asc.sign,sign:rulerPlanet?.sign,dignity:rulerPlanet?dignity(rulerPlanet):null,house:rulerPlanet?rulerPlanet.house:null,retro:rulerPlanet?rulerPlanet.retro:null},counts,patterns:uniq,receptions:findReceptions(w.planets),notice:'庙旺落陷与格局为古典占星常见定义的结构化标注，不构成预测。'};
}

/* 宫主星互融（Reception）：A 落在 B 守护的星座＝B 在家里接待 A（A 被 B 接收）。
 * 双方互落对方守护星座＝互融(mutual)；仅一方＝单方接收(single)。
 * 采用古典七政守护表 RULER；天海冥无古典守护星，只可能被接收、不充当接收方。
 * 仅列有相位关系的星对才判读互动，无相位则列本盘结构互融供参考。 */
export function findReceptions(planets,aspects){
 const out=[];
 const list=(planets||[]).filter(p=>p&&p.name&&p.sign);
 const lordOf=p=>RULER[SIGN.indexOf(p.sign)];
 for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
  const a=list[i],b=list[j];
  if(a.name===b.name)continue;                       // 排除同名（如南北交点）
  const la=lordOf(a),lb=lordOf(b);
  if(!la||!lb||la===lb)continue;                     // 无守护或同守一星，不构成互融判定
  // A 落在 B 守护的星座 ⟺ A 所在星座的守护星是 B（lordOf(A)===B.name）
  const aInBHouse=(la===b.name);                     // a 在 b 守护的星座 → a 被 b 接收（b 是主人）
  const bInAHouse=(lb===a.name);                     // b 在 a 守护的星座 → b 被 a 接收（a 是主人）
  if(!aInBHouse&&!bInAHouse)continue;
  const asp=(aspects||[]).find(x=>((x.a===a.name&&x.b===b.name)||(x.a===b.name&&x.b===a.name)));
  const mutual=aInBHouse&&bInAHouse;
  const kind=mutual?'mutual':'single';
  // single：客人落在主人守护的星座（客人自己的星座即被主人守护的那个）
  const guest=mutual?null:aInBHouse?a:b;
  const host=mutual?null:aInBHouse?b:a;
  out.push({a:a.name,b:b.name,kind,
   aSign:a.sign,bSign:b.sign,
   aspect:asp?{angle:asp.angle,type:asp.type,orb:asp.orb}:null,
   guest:guest?.name||null,host:host?.name||null,
   text:mutual
    ?`${a.name}在${a.sign}（${b.name}守护），${b.name}在${b.sign}（${a.name}守护）——两星互在对方「家」中，古典称互融(mutual reception)：彼此给力、遇事互相援手，是行星关系里最稳的良性结构${asp?`，且两星成${asp.angle}°相位，这份支援会被相位「接通」而更明显`:'（本盘无相位接通，属结构性的互相支撑）'}。`
    :`${guest.name}落在${host.name}守护的${guest.sign}——${host.name}在自己家里接待${guest.name}，古典称单方接收：${guest.name}较容易得到${host.name}的资源与配合，但回报不对等，宜主动回馈以免关系失衡${asp?`（两星成${asp.angle}°相位，互动被接通）`:''}。`});
 }
 return out;
}



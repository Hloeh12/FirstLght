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
 const planets=w.planets.map(p=>({name:p.name,sign:p.sign,house:p.house,retro:p.retro,dignity:dignity(p)}));
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
 return {planets,dignitiesSummary:{入庙:planets.filter(p=>p.dignity==='入庙').length,旺相:planets.filter(p=>p.dignity==='旺相').length,入弱:planets.filter(p=>p.dignity==='入弱').length,落陷:planets.filter(p=>p.dignity==='落陷').length},chartRuler:{planet:ruler,sign:w.asc.sign,house:rulerPlanet?rulerPlanet.house:null,retro:rulerPlanet?rulerPlanet.retro:null},counts,patterns:uniq,notice:'庙旺落陷与格局为古典占星常见定义的结构化标注，不构成预测。'};
}

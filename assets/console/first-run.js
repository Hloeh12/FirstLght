// v0.64.0 首启体验：排盘空态不再只有一句提示——「今日卡」把本地星历与黄历直接端到首屏，
// 三个示例案例各演示一个易错时间口径，点一下即按普通案例建档排盘。
// 示例不是只读特例：与手建案例同构（可编辑、可删除、可提醒），避免为 demo 维护第二套逻辑。
// 今日卡只调 /api/console/today-sky 与 /api/console/calendar（本地星历/黄历），无需先建案例、零网络。
import {esc} from './ui.js';

export const DEMO_CASES=[
 {key:'dst-1988',name:'示例 · 夏令时首日',note:'1988-04-17 02:30 北京 · 演示 1986–91 夏令时双口径',
  fields:{Y:1988,M:4,D:17,h:2,mi:30,gender:'女',calendar:'solar',timeUnknown:false,useSolarTime:true,lateZishi:'next-day',
   city:{label:'北京',lat:39.9042,lon:116.4074,tz:8}}},
 {key:'late-zi-1995',name:'示例 · 子夜出生',note:'1995-11-02 23:40 上海 · 演示晚子时换日',
  fields:{Y:1995,M:11,D:2,h:23,mi:40,gender:'男',calendar:'solar',timeUnknown:false,useSolarTime:true,lateZishi:'next-day',
   city:{label:'上海',lat:31.2304,lon:121.4737,tz:8}}},
 {key:'far-west-1970',name:'示例 · 远经度真太阳时',note:'1970-08-15 12:00 乌鲁木齐 · 演示约 -2 小时的均时差+经度修正',
  fields:{Y:1970,M:8,D:15,h:12,mi:0,gender:'女',calendar:'solar',timeUnknown:false,useSolarTime:true,lateZishi:'next-day',
   city:{label:'乌鲁木齐',lat:43.8256,lon:87.6168,tz:8}}}
];

export function firstRunHome(){
 const demos=DEMO_CASES.map(c=>`<button type="button" class="fr-demo-item" data-demo-load="${esc(c.key)}"><b>${esc(c.name)}</b><small>${esc(c.note)}</small></button>`).join('');
 return `<section class="first-run">
  <p class="empty">点按顶部命主气泡开始排盘，或从下方示例一键体验。</p>
  <article class="card liquid-glass fr-today" data-today-card>
   <h2>今日</h2>
   <p class="fr-today-status" role="status">正在读取本地星历与黄历…</p>
  </article>
  <article class="card fr-demo-card">
   <h2>示例案例 · 一键体验</h2>
   <p class="thin">三个示范盘各演示一个易错口径：1988 夏令时首日凌晨、23 点后的晚子时、真太阳时大偏移。点一下即建档排盘，与其他案例一样可编辑、可删除。</p>
   <div class="fr-demo">${demos}</div>
  </article>
 </section>`;
}

const hm=t=>{
 const d=new Date(t),p=n=>String(n).padStart(2,'0');
 return `${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

function todayHtml(sky,alm){
 const rows=[];
 if(sky?.sun)rows.push(`<li><b>太阳</b><span>${esc(sky.sun.sign)} ${sky.sun.degree}°</span></li>`);
 if(sky?.moon)rows.push(`<li><b>月亮</b><span>${esc(sky.moon.sign)} · ${esc(sky.phase)}（照亮 ${sky.litPercent}%）</span></li>`);
 const voc=sky?.voc;
 if(voc?.active)rows.push(`<li><b>月空亡</b><span>${voc.last?esc(voc.last.planet)+'最后相位后，':''}至 ${esc(hm(voc.end))}</span></li>`);
 const d=alm?.dates?.[0];
 if(d){
  rows.push(`<li><b>黄历</b><span>${esc(d.gz)}日 · ${esc(d.lunar)}${d.term?' · '+esc(d.term):''} · 建除${esc(d.zhiXing)} · 值神${esc(d.tianShen)}（${esc(d.tianShenLuck)}）</span></li>`);
  if(d.yi?.length)rows.push(`<li><b>宜</b><span>${esc(d.yi.slice(0,6).join('、'))}</span></li>`);
  if(d.ji?.length)rows.push(`<li><b>忌</b><span>${esc(d.ji.slice(0,4).join('、'))}</span></li>`);
 }
 return `<ul class="fr-today-list">${rows.join('')}</ul>${sky?.hint?`<p class="thin">${esc(sky.hint)}</p>`:''}`;
}

export async function refreshToday(request){
 const host=document.querySelector('[data-today-card]');
 if(!host)return;
 try{
  const at=new Date().toISOString();
  const [sky,alm]=await Promise.all([
   request('/api/console/today-sky',{at}),
   request('/api/console/calendar',{date:at.slice(0,10)})
  ]);
  if(!host.isConnected)return;
  host.innerHTML=`<h2>今日 · ${esc(sky?.day||'')}</h2>${todayHtml(sky,alm)}`;
 }catch(error){
  if(!host.isConnected)return;
  host.innerHTML=`<h2>今日</h2><p class="fr-today-status">今日数据暂时不可用：${esc(error.message||String(error))}</p>`;
 }
}

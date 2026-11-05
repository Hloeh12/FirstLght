import { localTemplateReport } from './report-template.mjs';
import { energy } from './energy.mjs';
const S=x=>String(x??'');
export function toMarkdown(chart){
 const w=chart.western,v=chart.vedic,z=chart.ziwei,rep=localTemplateReport(chart),en=energy(w,JSON.stringify(chart.meta.input));
 const md=[];
 md.push(`# 星谕排盘报告（本地复刻）\n`, `生成时间：${new Date().toISOString()}\n`);
 md.push(`> ${rep.notice}\n`);
 md.push(`## 一、西方本命盘（${w.houseSystem}）\n`);
 md.push(`- 上升：${w.asc.sign} ${w.asc.degree.degrees}°${String(w.asc.degree.minutes).padStart(2,'0')}′`);
 md.push(`- 中天：${w.mc.sign} ${w.mc.degree.degrees}°${String(w.mc.degree.minutes).padStart(2,'0')}′\n`);
 md.push(`| 星体 | 星座 | 宫位 | 逆行 |`,`|---|---|---|---|`);
 for(const p of w.planets)md.push(`| ${p.name} | ${p.sign} ${p.degree.degrees}°${String(p.degree.minutes).padStart(2,'0')}′ | ${p.house} | ${p.retro?'是':'—'} |`);
 md.push(`\n主要相位：\n`);
 for(const a of w.aspects.slice(0,20))md.push(`- ${a.a} × ${a.b}：${a.type}（容许度 ${a.orb.toFixed(1)}°）`);
 md.push(`\n## 二、印度恒星盘（Lahiri / 整宫）\n`);
 md.push(`- 上升：${v.lagna}`,`- 岁差：${v.ayanamsa.toFixed(4)}°\n`);
 md.push(`| 星体 | 恒星星座 | 星宿 | Pada | 宫位 |`,`|---|---|---|---|---|`);
 for(const p of v.planets)md.push(`| ${p.name} | ${p.sign} ${p.degree.degrees}° | ${p.nakshatra} | ${p.pada} | ${p.house} |`);
 md.push(`\n### Vimshottari 大运\n`,`| 主星 | 年数 | 起 | 止 |`,`|---|---|---|---|`);
 for(const d of v.dashas)md.push(`| ${d.lord} | ${d.years} | ${d.start.slice(0,10)} | ${d.end.slice(0,10)} |`);
 if(z&&!z.error){
  md.push(`\n## 三、紫微斗数（iztro 公开库）\n`);
  md.push(`- 命主：${z.soul}　身主：${z.body}`,`- 五行局：${z.fiveElementsClass}`,`- 农历：${z.lunarDate}\n`);
  md.push(`| 宫位 | 干支 | 主星 | 辅星 | 大限 |`,`|---|---|---|---|---|`);
  for(const p of z.palaces){
   const major=p.majorStars.map(s=>s.name+(s.mutagen?`(化${s.mutagen})`:'')).join('、')||'空宫';
   const minor=p.minorStars.map(s=>s.name).join('、');
   const dec=p.decadal&&p.decadal.range?`${p.decadal.range[0]}-${p.decadal.range[1]} 岁`:'';
   md.push(`| ${p.name}${p.isBodyPalace?'（身）':''} | ${p.heavenlyStem}${p.earthlyBranch} | ${major} | ${minor} | ${dec} |`);
  }
 }
 md.push(`\n## 四、模板解读（固定文案，非 AI）\n`);
 const names={'w-persona':'性格与天赋','w-career':'事业方向','w-wealth':'财富潜力','w-love':'感情模式','w-health':'健康与养生','z-palaces':'紫微十二宫','z-mutagen':'生年四化','w-risks':'人生功课','v-dasha':'印度大运'};
 for(const [k,arr] of Object.entries(rep.sections)){md.push(`### ${names[k]||k}`);for(const line of arr)md.push(`- ${line}`);md.push(``);}
 md.push(`## 五、能量场（娱乐化建模）\n`);
 for(const c of en.chakras)md.push(`- ${c.zh}：${c.score}（${c.status}）`);
 md.push(`\n磁场强度 ${en.fieldStrength}/100 · 极性 ${en.polarity} · 主导元素 ${en.dominant}\n`);
 md.push(`---\n排盘与解读属传统文化与娱乐用途，非科学结论，不构成医疗、投资、法律或婚姻建议。`);
 return md.join('\n');
}
const esc=s=>String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
export function toHtml(chart){
 const md=toMarkdown(chart).split('\n');
 const out=[];let i=0;
 const cell=l=>l.replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
 while(i<md.length){
  const line=md[i];
  if(line.startsWith('|')){
   const head=cell(line);i++;
   if(i<md.length&&/^\|[\s:-]+\|/.test(md[i]))i++;
   const rows=[];
   while(i<md.length&&md[i].startsWith('|')){rows.push(cell(md[i]));i++;}
   out.push('<table><thead><tr>'+head.map(h=>`<th>${esc(h)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>').join('')+'</tbody></table>');
   continue;
  }
  if(line.startsWith('# '))out.push(`<h1>${esc(line.slice(2))}</h1>`);
  else if(line.startsWith('## '))out.push(`<h2>${esc(line.slice(3))}</h2>`);
  else if(line.startsWith('### '))out.push(`<h3>${esc(line.slice(4))}</h3>`);
  else if(line.startsWith('- '))out.push(`<li>${esc(line.slice(2))}</li>`);
  else if(line.startsWith('> '))out.push(`<blockquote>${esc(line.slice(2))}</blockquote>`);
  else if(line.trim())out.push(`<p>${esc(line)}</p>`);
  i++;
 }
 return `<!doctype html><meta charset="utf-8"><title>星谕排盘报告</title>
<style>body{max-width:820px;margin:40px auto;padding:0 20px;font:15px/1.8 -apple-system,system-ui,sans-serif;color:#3a1322;background:#fff8fb}
h1{font-size:24px;color:#c2275f}h2{margin-top:28px;border-bottom:2px solid #ffd0e2;padding-bottom:6px;font-size:19px;color:#d13a6e}h3{font-size:16px;margin-top:18px;color:#b62e63}
li{margin:3px 0}blockquote{background:#fff0f6;border-left:3px solid #ff77aa;padding:8px 12px;margin:12px 0;color:#8a4360}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}th,td{border-bottom:1px solid #f3d4e0;padding:6px 8px;text-align:left}th{background:#ffe6f0;color:#a8265a}
@media print{body{margin:0}}</style>${out.join('\n')}`;
}

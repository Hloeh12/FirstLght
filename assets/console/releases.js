import release from '../../app-release.json' with {type:'json'};
import {esc,btn} from './ui.js';
const revision=typeof __FIRSTLIGHT_COMMIT__==='string'?__FIRSTLIGHT_COMMIT__:'local';
export const appBuild={name:release.name,version:release.version,build:release.build,revision:revision.slice(0,7)};
const items=list=>'<ul class="release-notes">'+list.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';
export function versionCard(){
 const latest=release.releases[0];
 return `<article class="card liquid-glass release-card" aria-label="版本与更新"><h2>版本与更新</h2>
 <p class="release-version" data-app-version>${esc(appBuild.name+' '+appBuild.version+'（'+appBuild.build+'）')}</p>
 <p class="thin build-id" data-app-build>构建标识 ${esc(appBuild.revision)} · ${esc(latest.date)}</p>
 <h3>本次更新 · ${esc(latest.title)}</h3>${items(latest.items)}
 ${btn('查看历次更新与修复','data-release-history class="tool-full"')}</article>`;
}
export function releaseHistory(ctx){
 const d=ctx.sheet('toolSheet','历次更新与修复',release.releases.map((entry,i)=>`<details class="release-entry" ${i===0?'open':''}>
 <summary>${esc(entry.version+'（'+entry.build+'） · '+entry.title)}</summary><p class="thin">${esc(entry.date)}</p>${items(entry.items)}
 ${(entry.builds||[]).map(b=>`<section class="release-legacy"><h3>${esc(b.title)}</h3><p class="thin build-id">构建 ${esc(b.revision)}</p>${items(b.items)}</section>`).join('')}</details>`).join(''));
 return d;
}

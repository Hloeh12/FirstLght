import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
export function checkRelease(){
 const r=json('app-release.json'),p=json('package.json'),lock=json('package-lock.json');
 assert(/^\d+\.\d+\.\d+$/.test(r.version),'版本必须使用 x.y.z');
 assert(Number.isInteger(r.build)&&r.build>1,'构建号必须递增');
 const latest=r.releases[0];
 assert.equal(latest.version,r.version);assert.equal(latest.build,r.build);
 assert(latest.items.length>0&&latest.items.every(x=>typeof x==='string'&&x.trim()),'必须逐项填写本次更新');
 const keys=r.releases.map(x=>x.version+':'+x.build);assert.equal(new Set(keys).size,keys.length);
 for(let i=1;i<r.releases.length;i++)assert(r.releases[i-1].build>r.releases[i].build,'更新记录构建号必须倒序且不可重复');
 assert.equal(p.version,r.version);assert.equal(lock.version,r.version);assert.equal(lock.packages[''].version,r.version);
 const info=readFileSync('ios-src/Info.plist','utf8');
 const value=key=>info.match(new RegExp('<key>'+key+'</key>\\s*<string>([^<]+)</string>'))?.[1];
 assert.equal(value('CFBundleShortVersionString'),r.version);assert.equal(value('CFBundleVersion'),String(r.build));
 const project=readFileSync('project.yml','utf8');
 assert(project.includes('MARKETING_VERSION: "'+r.version+'"'));
 assert(project.includes('CURRENT_PROJECT_VERSION: "'+r.build+'"'));
 return r;
}
export function checkPreviousRelease(previous,current,paths){
 const facing=/^(assets\/console\/|src\/|ios-src\/|index\.html$|project\.yml$|package(?:-lock)?\.json$|app-release\.json$|scripts\/build-console\.mjs$)/;
 if(!paths.some(path=>facing.test(path)))return;
 assert(current.build>previous.build,'用户可见代码有修改：必须递增构建号并填写更新记录');
 const compared=current.version.split('.').map((n,i)=>Number(n)-Number(previous.version.split('.')[i])).find(n=>n!==0)||0;
 assert(compared>0,'用户可见代码有修改：必须递增应用版本号');
 assert(current.releases.some(r=>r.version===previous.version&&r.build===previous.build),'必须保留上一版更新记录');
}
if(process.argv[1]?.endsWith('check-release.mjs')){
 const r=checkRelease();
 if(process.argv.includes('--previous')){
  let previous;
  try{previous=JSON.parse(execFileSync('git',['show','HEAD^:app-release.json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));}catch{}
  if(previous){
   const paths=execFileSync('git',['diff','--name-only','HEAD^','HEAD'],{encoding:'utf8'}).trim().split('\n');
   checkPreviousRelease(previous,r,paths);
  }
 }
 console.log(`Release verified: ${r.version} (${r.build})`);
}

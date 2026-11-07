import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRelease,checkPreviousRelease} from '../scripts/check-release.mjs';
test('release manifest, package, iOS plist and Xcode settings agree',()=>{
 const r=checkRelease();assert.match(r.version,/^\d+\.\d+\.\d+$/);assert(r.build>1);
 assert(r.releases[0].items.every(x=>x.length>5));
});
test('a user-visible fix requires a new version and build while retaining previous release notes',()=>{
 const current=checkRelease(),previous={version:'0.15.0',build:1};
 assert.doesNotThrow(()=>checkPreviousRelease(previous,current,['assets/console/app.js']));
 assert.throws(()=>checkPreviousRelease(current,current,['assets/console/design.css']),/递增构建号/);
 assert.throws(()=>checkPreviousRelease(current,{...current,build:current.build+1},['src/bazi.mjs']),/递增应用版本号/);
 assert.doesNotThrow(()=>checkPreviousRelease(current,current,['test/shell.test.mjs']));
});

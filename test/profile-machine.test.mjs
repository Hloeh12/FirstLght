import test from 'node:test';
import assert from 'node:assert/strict';
import {ProfileMachine} from '../assets/console/profile-machine.js';
test('profile activation deduplicates identical work and stale completion cannot win',async()=>{
 const gates=new Map();let calls=0;const m=new ProfileMachine(b=>{calls++;return new Promise(r=>gates.set(b.id,r));});
 const a=m.activate({id:'A'},{id:'A'}),b=m.activate({id:'B'},{id:'B'});await Promise.resolve();gates.get('B')('B-chart');assert.equal(await b,'B-chart');gates.get('A')('A-chart');assert.equal(await a,null);assert.equal(m.profile.id,'B');assert.equal(m.status,'ready');assert.equal(calls,2);
 assert.equal(await m.activate({id:'A'},{id:'A'}),'A-chart');assert.equal(calls,2);
 const x=m.resolve({id:'C'}),y=m.resolve({id:'C'});await Promise.resolve();gates.get('C')('C-chart');assert.equal(await x,await y);assert.equal(calls,3);
});
test('profile cache includes algorithm settings, expires, bounds memory and retries failures',async()=>{
 let now=0,calls=0;const m=new ProfileMachine(b=>{calls++;if(b.fail)throw Error('failure');return b;},{capacity:2,ttl:10,clock:()=>now});
 await m.resolve({id:1,school:'a'});await m.resolve({id:1,school:'b'});assert.equal(calls,2);await m.resolve({id:2});assert.equal(m.cache.size,2);assert.equal(m.peek({id:1,school:'a'}),null);now=11;assert.equal(m.peek({id:2}),null);
 await assert.rejects(m.activate({id:3},{fail:true}));assert.equal(m.status,'error');assert.equal(m.pending.size,0);m.clear();assert.equal(m.status,'idle');assert.equal(m.cache.size,0);
});

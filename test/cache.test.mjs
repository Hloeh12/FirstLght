import test from 'node:test';
import assert from 'node:assert/strict';
import { memoTTL, clearMemo, cacheKey } from '../src/store.mjs';
test('memoTTL returns cached value',()=>{clearMemo();let n=0;const k=cacheKey({x:1});assert.equal(memoTTL(k,10000,()=>++n),1);assert.equal(memoTTL(k,10000,()=>++n),1);});
test('memoTTL expires',async()=>{clearMemo();let n=0;const k=cacheKey({x:2});memoTTL(k,5,()=>++n);await new Promise(r=>setTimeout(r,15));assert.equal(memoTTL(k,5,()=>++n),2);});
test('cacheKey stable and distinct',()=>{assert.equal(cacheKey({a:1,b:2}),cacheKey({a:1,b:2}));assert.notEqual(cacheKey({a:1}),cacheKey({a:2}));});
test('clearMemo drops entries',()=>{let n=0;const k=cacheKey({y:1});memoTTL(k,10000,()=>++n);clearMemo();assert.equal(memoTTL(k,10000,()=>++n),2);});

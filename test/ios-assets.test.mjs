import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('iOS icon slots are complete and backed by opaque RGB PNGs',()=>{
 const root=new URL('../ios-src/Assets.xcassets/AppIcon.appiconset/',import.meta.url);
 const {images}=JSON.parse(readFileSync(new URL('Contents.json',root),'utf8'));
 for(const [idiom,scale,pixels] of [['universal',undefined,1024],['iphone','2x',120],['iphone','3x',180]]){
  const slot=images.find(x=>x.idiom===idiom&&x.scale===scale);
  assert.equal(slot.size,scale?'60x60':'1024x1024');
  const png=readFileSync(new URL(slot.filename,root));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),pixels);
  assert.equal(png.readUInt32BE(20),pixels);
  assert.equal(png[25],2,'RGB PNG must have no alpha channel');
 }
});

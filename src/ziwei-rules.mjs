import {util} from 'iztro';
export const ZIWEI_SCHOOLS={
 quanshu:{label:'全书/中州',description:'庚：日武阴同 · 辛：巨日曲昌'},
 quanjiTong:{label:'全集/北派·同相',description:'庚：日武同相 · 辛：巨日昌曲'},
 quanjiYin:{label:'全集/北派·阴相',description:'庚：日武阴相 · 辛：巨日昌曲'}
};
export function ziweiSchool(id='quanshu'){
 if(!Object.hasOwn(ZIWEI_SCHOOLS,id))throw Error('未知四化口径');
 return {id,...ZIWEI_SCHOOLS[id]};
}
export function mutagensFor(stem,school='quanshu'){
 ziweiSchool(school);
 if(!'甲乙丙丁戊己庚辛壬癸'.includes(stem)||stem.length!==1)throw Error('无效四化天干');
 if(school!=='quanshu'){
  if(stem==='庚')return ['太阳','武曲',school==='quanjiTong'?'天同':'太阴','天相'];
  if(stem==='辛')return ['巨门','太阳','文昌','文曲'];
 }
 return [...util.getMutagensByHeavenlyStem(stem)];
}

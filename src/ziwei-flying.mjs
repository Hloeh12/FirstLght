/**
 * 紫微飞宫四化增强（v0.67.0）
 * - laiYinPalace：来因宫（生年天干所落之宫）
 * - ziHua：自化（宫干四化落回本宫：自化禄/权/科/忌；离心/向心）
 * - flyingEnriched：每宫飞出四化 → 落宫名 + 自化标记
 * - borrowing：空宫借对宫实装（无主星宫位取对宫主星为 borrowedStars，标注来源）
 */
import {mutagensFor} from './ziwei-rules.mjs';

const BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const TYPES='禄权科忌';

export function enrichFlying(palaces,natalYearStem,school){
  const byBranch=p=>palaces.find(q=>q.branch===p.branch);
  const nameOf=branch=>palaces.find(p=>p.branch===branch)?.name||'?';

  // 来因宫：生年干所在宫
  const laiYin=palaces.find(p=>p.heavenlyStem===natalYearStem)?.name||null;

  const enriched=palaces.map(p=>{
    const muts=mutagensFor(p.heavenlyStem,school.id);
    const flying=muts.map((star,i)=>{
      const type=TYPES[i];
      const target=palaces.find(q=>q.stars.some(s=>s.name===star));
      const self=target&&target.branch===p.branch;
      return {star,type,from:p.name,to:self?p.name:nameOf(target?.branch),branch:target?.branch??null,self:!!self};
    });
    // 自化细分：向心自化（宫干化出落本宫）按四化直接标注
    const ziHua=flying.filter(f=>f.self).map(f=>({star:f.star,type:`自化${f.type}`,palace:p.name}));
    return {...p,flyingEnriched:flying,ziHua};
  });

  return {palaces:enriched,laiYinPalace:laiYin};
}

/** 空宫借对宫：本宫无主星时，取对宫主星为 borrowedStars（对宫=branch±6） */
export function borrowForEmpty(palaces){
  return palaces.map(p=>{
    if(p.majorStars.length>0)return p;
    const opp=palaces.find(q=>q.branch===((p.branch+6)%12));
    if(!opp)return p;
    return {...p,borrowedStars:opp.majorStars.map(s=>({...s,borrowedFrom:opp.name})),borrowedFrom:opp.name};
  });
}

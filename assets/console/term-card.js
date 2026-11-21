import {DICTIONARY} from './dictionary-data.js';
import {MORE_DICTIONARY} from './dictionary-more.js';

const ALL={...DICTIONARY,...MORE_DICTIONARY};
const ALIAS={桃花:'咸池桃花',咸池:'咸池桃花',咸池桃花:'咸池桃花',文昌贵人:'文昌',天乙:'天乙贵人',太极:'太极贵人',华盖星:'华盖',驿马星:'驿马',羊刃星:'羊刃',
 // 西占相位/尊贵度别名
 刑:'四分相',冲:'对相',拱:'三分相',hex:'六分相',六合:'合相',trine:'三分相',square:'四分相',opposition:'对相',conjunction:'合相',
 exaltation:'旺相',domicile:'入庙',fall:'落陷',detriment:'入弱',orb:'容许度',
 // 印占别名
 rahu:'罗睺',ketu:'计都',navamsha:'分盘',dasha:'大运',nakshatra:'纳克沙特',
 // 紫微别名
 紫微星:'紫微',天机星:'天机',廉贞星:'廉贞',贪狼星:'贪狼',破军星:'破军'};
const DISCLAIMER='无任何科学依据，仅供传统文化学习与生活哲学参考，不构成现实预测或专业建议。';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const stageNotes={
 长生:'力量刚刚生发，宜开始、宜积累。',沐浴:'处于变化期，宜适应与转换，不宜定形。',冠带:'逐渐成形、开始显露，宜整理对外形象。',
 临官:'条件齐备、开始承担职责。',帝旺:'力量处在高点，宜守成，忌过刚。',衰:'达到高点后开始回落，宜收敛。',
 病:'力量受到牵制，适合观察与休整。',死:'一个阶段结束，宜清理旧事。',墓:'力量归藏、暂未显露，宜储藏积累。',
 绝:'旧阶段与新阶段的转折点。',胎:'新阶段开始孕育，宜养不宜发。',养:'积累条件，准备进入下一阶段。'
};
const elementNotes={木:'生发、条达、仁与计划',火:'炎上、明亮、礼与表达',土:'承载、守中、信与稳定',金:'收敛、肃杀、义与决断',水:'流动、润下、智与变通'};

function section(title,body){
 return body?`<section class="tc-block"><h4>${esc(title)}</h4><p>${esc(body)}</p></section>`:'';
}
function listBlock(title,body){
 return body?`<section class="tc-block"><h4>${esc(title)}</h4><p>${esc(body)}</p></section>`:'';
}

export function termCard(word,text='',source='',fallback=''){
 const key=ALL[word]?word:ALIAS[word];
 const entry=key?ALL[key]:null;
 if(entry){
  return `<article class="term-card">
   <p class="tc-kicker">${esc(entry.category||'术语')}</p>
   <h3 class="tc-title">${esc(entry.title||word)}</h3>
   ${text?`<section class="tc-block tc-own"><h4>在你的命盘里</h4><p>${esc(text)}</p></section>`:''}
   ${entry.nature?`<p class="tc-nature">${esc(entry.nature)}</p>`:''}
   ${listBlock('为喜用时',entry.pros)}
   ${listBlock('为忌偏时',entry.cons)}
   ${listBlock('取用提示',entry.advice)}
   ${entry.origin?`<blockquote class="tc-quote">${esc(entry.origin)}</blockquote>`:''}
   <div class="tc-facts">${source?`<p><b>出处</b>${esc(source)}</p>`:''}</div>
   <p class="tc-disclaimer">${DISCLAIMER}</p>
  </article>`;
 }
 const body=text||fallback||'这是传统术数的辅助标记，需要结合所在宫位、干支以及同盘的其他条件一起理解，不能单独断吉凶。';
 return `<article class="term-card">
  <p class="tc-kicker">术语</p>
  <h3 class="tc-title">${esc(word)}</h3>
  <section class="tc-block tc-own"><h4>在你的命盘里</h4><p>${esc(body)}</p></section>
  ${source?`<blockquote class="tc-quote">${esc(source)}</blockquote>`:''}
  <p class="tc-disclaimer">${DISCLAIMER}</p>
 </article>`;
}

export function stageCard(name,context=''){
 return `<article class="term-card"><p class="tc-kicker">十二长生</p><h3 class="tc-title">${esc(name)}</h3>
 <p class="tc-nature">${esc(stageNotes[name]||'该阶段描述的是气势强弱，不表示寿命或吉凶。')}</p>
 ${context?`<section class="tc-block"><h4>本盘</h4><p>${esc(context)}</p></section>`:''}
 <p class="tc-disclaimer">${DISCLAIMER}</p></article>`;
}

export function elementCard(name,context=''){
 return `<article class="term-card"><p class="tc-kicker">五行</p><h3 class="tc-title">${esc(name)}</h3>
 <p class="tc-nature">${esc(elementNotes[name]||'五行是传统对事物属性的分类方式。')}</p>
 ${context?`<section class="tc-block"><h4>本盘</h4><p>${esc(context)}</p></section>`:''}
 <p class="tc-disclaimer">${DISCLAIMER}</p></article>`;
}

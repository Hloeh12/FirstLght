/* Ashtakoota（印度婚配八科，36 分制）的独立实现。
 * 采用北印八科公开评分表；这是传统规则的程序化复现，不是关系质量实证量表。 */
const YONI_OF_NAK=[0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
const YONI_ZH=['马','象','羊','蛇','犬','猫','鼠','牛','水牛','虎','鹿','猴','獴','狮'];
// 14兽传统亲疏评分（0–4）；行列顺序见YONI_ZH。
const YONI_ROWS=['42232221011321','24332222312320','23421213312031','33242111122202','22124212210211','22212402213321','22111042222212','12312224303221','03312223412221','11121120141121','12220323214221','33022322112432','22301212222342','10121121111224'];
const GANA_OF_NAK=Array.from({length:27},(_,i)=>[1,5,7,8,13,15,17,22,27].includes(i+1)?'deva':[2,4,6,11,12,20,21,25,26].includes(i+1)?'manushya':'rakshasa');
const GANA_ZH={deva:'天神',manushya:'人类',rakshasa:'阿修罗'};
const NADI_OF_NAK=Array.from({length:27},(_,i)=>[1,6,7,12,13,18,19,24,25].includes(i+1)?0:[2,5,8,11,14,17,20,23,26].includes(i+1)?1:2);
const NADI_ZH=['初脉','中脉','末脉'];
const SIGN_LORD=['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter'];
const LORD_ZH={mars:'火星',venus:'金星',mercury:'水星',moon:'月亮',sun:'太阳',jupiter:'木星',saturn:'土星'};
const LORD_REL={
 sun:{friend:['moon','mars','jupiter'],neutral:['mercury'],enemy:['venus','saturn']},
 moon:{friend:['sun','mercury'],neutral:['mars','jupiter','venus','saturn'],enemy:[]},
 mars:{friend:['sun','moon','jupiter'],neutral:['venus','saturn'],enemy:['mercury']},
 mercury:{friend:['sun','venus'],neutral:['mars','jupiter','saturn'],enemy:['moon']},
 jupiter:{friend:['sun','moon','mars'],neutral:['saturn'],enemy:['mercury','venus']},
 venus:{friend:['mercury','saturn'],neutral:['mars','jupiter'],enemy:['sun','moon']},
 saturn:{friend:['mercury','venus'],neutral:['jupiter'],enemy:['sun','moon','mars']}
};
const VASHYA_GROUP=['quad','quad','manava','water','wild','manava','water','insect','manava','quad','manava','water'];
const VASHYA_ZH={manava:'人属',insect:'虫属',wild:'兽属',water:'水属',quad:'四足'};
const VARNA_RANK={brahmin:4,kshatriya:3,vaishya:2,shudra:1};
const VARNA_ZH={brahmin:'慧位',kshatriya:'勇位',vaishya:'创位',shudra:'勤位'};
const ELEMENT=['火','土','风','水','火','土','风','水','火','土','风','水'];
const TARA_GOOD=new Set([2,4,6,8,9]);
const varnaOf=sign=>[ 'kshatriya','vaishya','shudra','brahmin'][['火','土','风','水'].indexOf(ELEMENT[sign])];
function lordRel(a,b){if(LORD_REL[a].friend.includes(b))return 1;if(LORD_REL[a].enemy.includes(b))return -1;return 0;}
export function ashtakoota(aVedic,bVedic){
 const am=aVedic.planets.find(p=>p.name==='月亮'),bm=bVedic.planets.find(p=>p.name==='月亮');
 if(!am||!bm)return null;
 const bN=bm.nakIndex,gN=am.nakIndex,bS=bm.signIndex,gS=am.signIndex;
 const items=[];const add=(key,zh,max,score,note)=>items.push({key,zh,max,score,note});
 const bV=varnaOf(bS),gV=varnaOf(gS);
 add('varna','心性层级',1,VARNA_RANK[bV]>=VARNA_RANK[gV]?1:0,`${VARNA_ZH[bV]} × ${VARNA_ZH[gV]}`);
 const vash=p=>p.signIndex===8?(p.sid%30<15?'manava':'quad'):p.signIndex===9?(p.sid%30<15?'quad':'water'):p.signIndex===6?'manava':VASHYA_GROUP[p.signIndex];
 const bG=vash(bm),gG=vash(am),order=['quad','manava','water','wild','insect'],vashScores=[[2,.5,1,0,2],[.5,2,0,0,0],[1,0,2,2,2],[0,0,2,2,0],[1,0,1,0,2]];
 add('vashya','相处引力',2,vashScores[order.indexOf(gG)][order.indexOf(bG)],`${VASHYA_ZH[bG]} × ${VASHYA_ZH[gG]}；射手/摩羯按15°分界`);
 const tara=(from,to)=>{const n=((to-from)%27+27)%27+1;return TARA_GOOD.has(((n-1)%9)+1);};
 const bGood=tara(gN,bN),gGood=tara(bN,gN);
 add('tara','命星',3,bGood&&gGood?3:bGood||gGood?1.5:0,`${bGood?'吉':'需留意'} / ${gGood?'吉':'需留意'}`);
 const bY=YONI_OF_NAK[bN],gY=YONI_OF_NAK[gN];
 add('yoni','本能契合',4,Number(YONI_ROWS[bY][gY]),`${YONI_ZH[bY]} × ${YONI_ZH[gY]}`);
 const bl=SIGN_LORD[bS],gl=SIGN_LORD[gS],r1=lordRel(bl,gl),r2=lordRel(gl,bl);
 let m;if(bl===gl||r1===1&&r2===1)m=5;else if(r1===1&&r2===0||r1===0&&r2===1)m=4;else if(r1===0&&r2===0)m=3;else if(r1===1&&r2===-1||r1===-1&&r2===1)m=1;else if(r1===0&&r2===-1||r1===-1&&r2===0)m=.5;else m=0;
 add('maitri','星谊',5,m,`${LORD_ZH[bl]} × ${LORD_ZH[gl]}`);
 const bGa=GANA_OF_NAK[bN],gGa=GANA_OF_NAK[gN];
 const go=['deva','manushya','rakshasa'],gs=[[6,6,0],[5,6,0],[1,0,6]][go.indexOf(gGa)][go.indexOf(bGa)];
 add('gana','天性',6,gs,`${GANA_ZH[bGa]} × ${GANA_ZH[gGa]}`);
 const diff=((bS-gS)%12+12)%12,bd=[1,11,4,8,5,7].includes(diff);
 add('bhakoot','情位',7,bd?0:7,bd?`相隔 ${diff===0?12:diff} 位`:'相对位置吉利');
 const bNd=NADI_OF_NAK[bN],gNd=NADI_OF_NAK[gN];
 const nd=bNd===gNd;
 add('nadi','命脉',8,nd?0:8,nd?`同${NADI_ZH[bNd]}`:`${NADI_ZH[bNd]} × ${NADI_ZH[gNd]}`);
 const total=Math.round(items.reduce((s,x)=>s+x.score,0)*10)/10;
 return {total,max:36,items,moon:{a:{sign:bS,nak:bN,pada:am.pada},b:{sign:gS,nak:gN,pada:bm.pada}},percent:Math.round(total/36*100),guidance:items.filter(x=>x.score<x.max/2).map(x=>x.zh+'分偏低：适合在日常沟通中核对双方需求，不以分数代替相处体验。').join(' '),note:'北印八科有向评分表：A方参照传统女方栏、B方参照男方栏；非医学或关系实证，不自动套用流派化解例外。可交换双方查看反向分数。' };
}

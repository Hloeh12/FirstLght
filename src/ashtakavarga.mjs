/* Ashtakavarga 八分点（BPHS 古典口径）
 * 七曜 + 上升(Lagna) 八个参照点，按固定「吉宫表」给十二星座各记 1 个 bindu。
 * 每颗行星的 Bhinnashtakavarga(BAV) 总分固定，七曜相加的 Sarvashtakavarga(SAV) 恒为 337，
 * 这两个总数是自检校验位——对不上即查表有误，宁可不显示也不给错分。
 *
 * 数据来源：Brihat Parashara Hora Shastra 吉宫表，与 jyotishganit/components/ashtakavarga.py
 * 及多家独立实现交叉核对一致。宫位从「给予者所在星座」起算 1。
 *
 * 口径边界（写进 method，供报告/面板披露）：
 * - 只用 D1 星座位置，不含罗睺/计都（BPHS 正统 SAV 只计七曜）。
 * - 只算 BAV 与 SAV，不做 Prastara/Trikona/Ekadhipati 的逐点还原与还原后加减。
 * - SAV 是「结构支撑度」而非吉凶断言：高分宫位表示承载该宫主题的结构较厚，低分需后天补。
 */
export const SIGNS_ZH=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];

// key 用项目行星英文键（vedic-pro planet.key），Lagna 单列
const GRAHA=['sun','moon','mars','mercury','jupiter','venus','saturn'];
export const GRAHA_ZH={sun:'太阳',moon:'月亮',mars:'火星',mercury:'水星',jupiter:'木星',venus:'金星',saturn:'土星'};

// BPHS 吉宫表：目标行星(行) 收到 给予者(列) 在其所在星座起算的这些宫位时，得 1 bindu。
const BENEFIC={
 sun:{sun:[1,2,4,7,8,9,10,11],moon:[3,6,10,11],mars:[1,2,4,7,8,9,10,11],mercury:[3,5,6,9,10,11,12],jupiter:[5,6,9,11],venus:[6,7,12],saturn:[1,2,4,7,8,9,10,11],lagna:[3,4,6,10,11,12]},
 moon:{sun:[3,6,7,8,10,11],moon:[1,3,6,7,10,11],mars:[2,3,5,6,9,10,11],mercury:[1,3,4,5,7,8,10,11],jupiter:[1,4,7,8,10,11,12],venus:[3,4,5,7,9,10,11],saturn:[3,5,6,11],lagna:[3,6,10,11]},
 mars:{sun:[3,5,6,10,11],moon:[3,6,11],mars:[1,2,4,7,8,10,11],mercury:[3,5,6,11],jupiter:[6,10,11,12],venus:[6,8,11,12],saturn:[1,4,7,8,9,10,11],lagna:[1,3,6,10,11]},
 mercury:{sun:[5,6,9,11,12],moon:[2,4,6,8,10,11],mars:[1,2,4,7,8,9,10,11],mercury:[1,3,5,6,9,10,11,12],jupiter:[6,8,11,12],venus:[1,2,3,4,5,8,9,11],saturn:[1,2,4,7,8,9,10,11],lagna:[1,2,4,6,8,10,11]},
 jupiter:{sun:[1,2,3,4,7,8,9,10,11],moon:[2,5,7,9,11],mars:[1,2,4,7,8,10,11],mercury:[1,2,4,5,6,9,10,11],jupiter:[1,2,3,4,7,8,10,11],venus:[2,5,6,9,10,11],saturn:[3,5,6,12],lagna:[1,2,4,5,6,7,9,10,11]},
 venus:{sun:[8,11,12],moon:[1,2,3,4,5,8,9,11,12],mars:[3,5,6,9,11,12],mercury:[3,5,6,9,11],jupiter:[5,8,9,10,11],venus:[1,2,3,4,5,8,9,10,11],saturn:[3,4,5,8,9,10,11],lagna:[1,2,3,4,5,8,9,11]},
 saturn:{sun:[1,2,4,7,8,10,11],moon:[3,6,11],mars:[3,5,6,10,11,12],mercury:[6,8,9,10,11,12],jupiter:[5,6,11,12],venus:[6,11,12],saturn:[3,5,6,11],lagna:[1,3,4,6,10,11]}
};
// 古典固定总分（校验位）
export const FIXED_TOTAL={sun:48,moon:49,mars:39,mercury:54,jupiter:56,venus:52,saturn:39};
export const SAV_TOTAL=337;

const mod12=n=>((n%12)+12)%12;

/* 计算单颗目标行星的 BAV（12 星座 bindu 数）。
 * natal = {sun:moon:...:signIndex(0-11), lagna:signIndex} */
export function bhav(chart,target){
 const houses=BENEFIC[target];
 if(!houses)throw Error('未知 BAV 目标行星: '+target);
 const bav=new Array(12).fill(0);
 for(const g of [...GRAHA,'lagna']){
  const from=natalSign(chart,g);
  if(from==null)continue;
  for(const h of houses[g]||[])bav[mod12(from+h-1)]+=1;
 }
 return bav;
}

function natalSign(chart,g){
 if(g==='lagna')return Number.isInteger(chart.lagnaIndex)?chart.lagnaIndex:null;
 const p=(chart.planets||[]).find(x=>x.key===g);
 return p&&Number.isInteger(p.signIndex)?p.signIndex:null;
}

/* 从 vedicPro() 结果计算完整 Ashtakavarga。
 * 返回 {rows, sav, total, valid, method}
 * rows: [{key,name,bav:[12],total}]  sav:[12]  total:sum(sav)  valid:total===337且各行总分吻合 */
export function ashtakavarga(v){
 const chart={lagnaIndex:v?.lagnaIndex,planets:v?.planets||[]};
 const rows=GRAHA.map(key=>{
  const bavArr=bhav(chart,key);
  return {key,name:GRAHA_ZH[key],bav:bavArr,total:bavArr.reduce((a,b)=>a+b,0),expected:FIXED_TOTAL[key]};
 });
 const sav=new Array(12).fill(0);
 for(const r of rows)for(let i=0;i<12;i++)sav[i]+=r.bav[i];
 const total=sav.reduce((a,b)=>a+b,0);
 const valid=total===SAV_TOTAL&&rows.every(r=>r.total===r.expected);
 // 上升/下降：按星座 SAV 与宫位主题映射（宫 = 星座，整宫制下 lagnaIndex 即第1宫）
 const lagnaIdx=Number.isInteger(v?.lagnaIndex)?v.lagnaIndex:0;
 const byHouse=sav.map((points,i)=>({house:mod12(i-lagnaIdx)+1,sign:SIGNS_ZH[i],points}));
 const strongest=[...byHouse].sort((a,b)=>b.points-a.points)[0];
 const weakest=[...byHouse].sort((a,b)=>a.points-b.points)[0];
 return {
  rows,sav,total,valid,byHouse,strongest,weakest,
  method:'BPHS 古典 Ashtakavarga：七曜+上升按固定吉宫表给十二星座记 bindu，逐曜成 Bhinnashtakavarga(BAV)，相加为 Sarvashtakavarga(SAV)。固定校验位：日48/月49/火39/水54/木56/金52/土39，SAV=337；校验不通过则 valid=false，前端不显示分数。只用 D1 星座位置，不计罗睺计都，不做 Prastara 逐点还原。SAV 是结构支撑度（均值约28），高分宫承载该主题的结构较厚，低分需后天补，非吉凶断言。'
 };
}

// 供测试：仅校验 BPHS 表在任意一组位置下总分恒为校验位
export function selfCheck(sample){
 const a=ashtakavarga(sample);
 return {total:a.total,valid:a.valid,rowTotals:a.rows.map(r=>r.total)};
}

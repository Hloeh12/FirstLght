/* Yogini Dasha 八女神大运（纯函数，无副作用）。
 * 与 Vimshottari（120 年 / 27 宿 / 9 主）并行的一套短周期宿曜大运：
 *   - 八位 Yogini 各有主星与固定年数（1–8 年），一循环 36 年，终身反复轮转。
 *   - 起运：月亮出生宿序号（Ashwini=1）加 3 除以 8 取余，余 0 当第 8 位 Sankata。
 *   - 出生余额：月亮在该宿内尚余度数 / 13°20′ × 起运 Yogini 年数。
 *   - 每个大运内再分八段 Antardasha，时长 = 大运年 × 小运年 / 36（360 日年近似）。
 * 流派口径（Ketu 无独立 Yogini、附于 Rahu 的 Sankata 段；年数表取自 BPHS 通行本）
 * 一律在 method 字段写明，不把流派差异伪装成定论。仅作传统术数文化参考。 */

import {TROPICAL_YEAR_MS} from './time-constants.mjs';

const MANSION = 360 / 27; // 13°20′

// 八位 Yogini，顺序固定，主星与年数取自 Brihat Parashara Hora Shastra 通行表。
export const YOGINIS = [
  {name:'Mangala',  zh:'曼加拉',  lord:'月亮', years:1, theme:'情绪、直觉与新的开始——感受力被放大，宜顺势起步，勿被情绪牵着走'},
  {name:'Pingala',  zh:'平加拉',  lord:'太阳', years:2, theme:'自我、权威与声名——存在感与主导欲上升，利争取认可，忌独断'},
  {name:'Dhanya',   zh:'达尼亚',  lord:'木星', years:3, theme:'财富、智慧与福报——求学、扩张与贵人运走强，宜投资长远'},
  {name:'Bhramari', zh:'布拉玛丽', lord:'火星', years:4, theme:'行动、竞争与淬炼——冲劲与阻力并至，靠执行破局，防急躁伤身'},
  {name:'Bhadrika', zh:'巴德里卡', lord:'水星', years:5, theme:'智力、表达与商业——学习、谈判与技艺的丰收段，宜主动经营人脉'},
  {name:'Ulka',     zh:'乌尔卡',  lord:'土星', years:6, theme:'纪律、延迟与业力功课——慢工出细活，扛得住压力者后期兑现'},
  {name:'Siddha',   zh:'悉达',    lord:'金星', years:7, theme:'成就、关系与享受——感情、艺术与财富顺境，宜经营关系，忌沉溺'},
  {name:'Sankata',  zh:'桑卡塔',  lord:'罗睺', years:8, theme:'剧变、迷雾与转化——突发与非常规机遇并存，宜守正，忌冒进投机'}
];

const norm = x => ((x % 360) + 360) % 360;
const iso = t => new Date(Math.round(t)).toISOString();

/** 八 Yogini 大运序列。
 *  @returns {{valid:boolean, list:Array, current:Object|null}} */
export function yoginiDasha(v, at = new Date().toISOString()) {
  const planets = v?.planets || [];
  const moon = planets.find(p => p.key === 'moon' || p.name === '月亮');
  const born = +new Date(v?.utc || Date.now());
  const target = +new Date(at);
  if (!moon || !Number.isFinite(target) || !Number.isFinite(+born) || !Number.isFinite(moon.sid))
    return {valid:false, list:[], current:null, method:'缺月亮宿位或时间无效，Yogini 大运不计算。'};

  const sid = norm(moon.sid);
  const nakIndex = Math.floor(sid / MANSION) % 27;   // 0–26，Ashwini=0
  const nakNo = nakIndex + 1;                        // 1–27，Ashwini=1
  const nakDegree = sid - nakIndex * MANSION;        // 宿内已行度数 0–13°20′
  const elapsed = nakDegree / MANSION;               // 已行比例
  const remainRatio = 1 - elapsed;

  // 起运：宿序 +3 取余 8，余 0 当第 8 位 Sankata。
  const mod = (nakNo + 3) % 8;
  const startIndex = mod === 0 ? 7 : mod - 1;
  const first = YOGINIS[startIndex];
  const balanceYears = +(first.years * remainRatio).toFixed(4); // 出生后所余

  // 与 vedic-pro 的 Vimshottari 同口径：从出生按已行比例回推首段起点，首段走满整年数。
  // 这样 target 落在哪一段是确定的、跨时刻自洽的；balanceYears 只是「出生时尚余几年」的读数。
  let cursor = born - elapsed * first.years * TROPICAL_YEAR_MS;
  let idx = startIndex;
  const ageOf = t => +((t - born) / TROPICAL_YEAR_MS).toFixed(2);
  const list = [];
  const ageTarget = Math.max(0, ageOf(target));
  const rounds = Math.max(5, Math.ceil((ageTarget + 40) / 36) + 1);
  for (let i = 0; i < rounds * 8; i++) {
    const y = YOGINIS[idx];
    const yrs = y.years;
    const end = cursor + yrs * TROPICAL_YEAR_MS;
    const active = target >= cursor && target < end;
    // 段内八小运：本段主运起、按 Yogini 顺序，时长 = 大运年×小运年/36（合计恰为大运年）。
    const antardashas = [];
    let aCursor = cursor;
    for (let k = 0; k < 8; k++) {
      const aIdx = (idx + k) % 8;
      const s = YOGINIS[aIdx];
      const aYears = yrs * s.years / 36;
      const aEnd = aCursor + aYears * TROPICAL_YEAR_MS;
      antardashas.push({name:s.name, zh:s.zh, lord:s.lord, years:+aYears.toFixed(4),
        ageStart:ageOf(aCursor), ageEnd:ageOf(aEnd), start:iso(aCursor), end:iso(aEnd),
        active:target >= aCursor && target < aEnd});
      aCursor = aEnd;
    }
    list.push({i, name:y.name, zh:y.zh, lord:y.lord, years:yrs, theme:y.theme,
      ageStart:ageOf(cursor), ageEnd:ageOf(end), start:iso(cursor), end:iso(end),
      active, antardashas});
    cursor = end;
    idx = (idx + 1) % 8;
  }
  const current = list.find(x => x.active) || null;
  return {
    valid:true, list, current,
    start:{name:first.name, zh:first.zh, lord:first.lord, index:startIndex},
    nakNo, nakDegree:+nakDegree.toFixed(2), remainRatio:+remainRatio.toFixed(4),
    balanceYears, cycleYears:36,
    method:'Yogini Dasha（BPHS 通行八女神体系）：八位 Yogini 固定顺序，年数 1–8 合计 36 年，终身循环。起运按月亮出生宿序号（Ashwini=1）加 3 除以 8 取余，余 0 当第 8 位 Sankata；出生余额按该宿内已行比例反推首段起点，尚余年数记于 balanceYears。每段 Antardasha 时长＝大运年×小运年/36（360 日年近似，与精确 365.2422 日年可有数日差）。Ketu 无独立 Yogini，传统并入 Rahu 的 Sankata 段合看。此为短周期参考运，须与 Vimshottari 互参，不单独据此断事。'
  };
}

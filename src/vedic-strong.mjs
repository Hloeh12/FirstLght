// 印占力量审计：Shadbala（六力）、Bhava Bala（宫位力量）、Varshaphala（岁运盘）。
// 口径说明写在每个函数的 method 字段里——哪些项算了、哪些项没算，都在结果里说清楚，
// 不用「结构位置」代替分数，也不给没有经典依据的断言。
import {bodyAt} from './ephemeris.mjs';
import {ayanamsa} from './ephemeris.mjs';

const d2r = Math.PI / 180;
const norm = x => ((x % 360) + 360) % 360;
const shortest = (a, b) => { const d = Math.abs(norm(a) - norm(b)) % 360; return d > 180 ? 360 - d : d; };

// 庙旺点（恒星黄经，0° 白羊起算）。最深陷点＝庙旺点 + 180°。
export const EXALTATION = {太阳:10, 月亮:33, 火星:298, 水星:165, 木星:95, 金星:357, 土星:200};
// Naisargika Bala（自然力）固定值，单位为 virupa。
const NATURAL = {太阳:60, 月亮:51.43, 金星:42.86, 木星:34.29, 水星:25.71, 火星:17.14, 土星:8.57};
// 经典最低 Shadbala 要求（Rupas），低于此值传统判为「力量不足」。
const MINIMUM = {太阳:5, 月亮:6, 火星:5, 水星:7, 木星:6.5, 金星:5.5, 土星:5};
const BENEFIC = new Set(['月亮', '木星', '金星', '水星']);
const MALE = new Set(['太阳', '火星', '木星']);
const FEMALE = new Set(['月亮', '金星']);
const NEUTRAL = new Set(['水星', '土星']);
const SEVEN = ['太阳', '月亮', '火星', '水星', '木星', '金星', '土星'];

export const HOUSE_THEME = {
 1:'自我、身体与人生方向', 2:'财帛、家人与言语', 3:'兄弟、勇气与技能', 4:'家宅、母亲与内心',
 5:'子女、智慧与创造力', 6:'竞争、疾病与服务', 7:'婚姻、合作与公众', 8:'危机、转化与他财',
 9:'运势、父亲与师长', 10:'事业、名望与行动', 11:'收益、人脉与愿望', 12:'消耗、远行与解脱'
};
export const SIGN_ROLE = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];

/* ---------- 一、Shadbala 六力 ---------- */
export function shadbala(v) {
  const asc = norm(v.ascSid);
  // 整宫制下的四个方向强点：东=1宫起点，南=10宫起点，西=7宫起点，北=4宫起点
  const EAST = asc, SOUTH = norm(asc + 270), WEST = norm(asc + 180), NORTH = norm(asc + 90);
  const when = new Date(v.utc || Date.now());
  const IDX = {太阳:0, 月亮:1, 火星:2, 水星:3, 木星:4, 金星:5, 土星:6};
  const MEAN = {太阳:.9856, 月亮:13.176, 火星:.524, 水星:1.383, 木星:.083, 金星:1.2, 土星:.033};
  const rows = v.planets.filter(p => SEVEN.includes(p.name)).map(p => {
    const lon = norm(p.sid), dwad = norm(lon) % 30;
    const exalt = EXALTATION[p.name];
    const uchcha = exalt === undefined ? 0 : shortest(lon, norm(exalt + 180)) / 3;
    const kendra = [1, 4, 7, 10].includes(p.house) ? 60 : [2, 5, 8, 11].includes(p.house) ? 30 : 15;
    const drek = MALE.has(p.name) ? (dwad < 10 ? 60 : 0)
      : FEMALE.has(p.name) ? (dwad >= 10 && dwad < 20 ? 60 : 0)
      : (dwad >= 20 ? 60 : 0);
    const strongPoint = ['木星', '水星'].includes(p.name) ? EAST
      : ['太阳', '火星'].includes(p.name) ? SOUTH
      : p.name === '土星' ? WEST : NORTH;
    const dig = 60 - shortest(lon, strongPoint) / 3;
    const moonSun = shortest(v.planets.find(x => x.name === '月亮')?.sid ?? 0, v.planets.find(x => x.name === '太阳')?.sid ?? 0);
    const paksha = BENEFIC.has(p.name) ? moonSun / 180 * 60 : (180 - moonSun) / 180 * 60;
    // 动势力：逆行最强（60）；顺行按实际速度与平均速度之比递减，停驻接近满分
    let speed = 0;
    try { speed = bodyAt(when, IDX[p.name] ?? 0, 'lahiri').longitudeSpeed; } catch { speed = 0; }
    const cheshta = ['太阳', '月亮'].includes(p.name) ? 30
      : speed < 0 ? 60
      : Math.round(Math.max(15, 60 * (1 - speed / (2 * (MEAN[p.name] || 1)))));
    const naisargika = NATURAL[p.name] ?? 0;
    const sthana = uchcha + kendra + drek;
    const total = sthana + dig + paksha + cheshta + naisargika;
    const rupas = total / 60;
    const min = MINIMUM[p.name] ?? 5;
    return {
      name: p.name, house: p.house, sign: p.sign, retro: !!p.retro, speed: +speed.toFixed(3),
      uchcha: +uchcha.toFixed(2), kendra, drek, sthana: +sthana.toFixed(2),
      dig: +dig.toFixed(2), paksha: +paksha.toFixed(2), cheshta, naisargika,
      total: +total.toFixed(2), rupas: +rupas.toFixed(2), minimum: min,
      meets: rupas >= min, shortfall: +(min - rupas).toFixed(2), rank: 0,
      weakestPart: [['庙旺度', uchcha], ['方向力', dig], ['月相力', paksha], ['动势力', cheshta], ['自然力', naisargika]]
        .sort((a, b) => a[1] - b[1])[0],
      verdict: rupas >= min
        ? `力量充足（${rupas.toFixed(2)} Rupas）——这颗星在本命能「办得成事」`
        : `分项合计 ${rupas.toFixed(2)} Rupas，短板在${[['庙旺度', uchcha], ['方向力', dig], ['月相力', paksha], ['动势力', cheshta], ['自然力', naisargika]].sort((a, b) => a[1] - b[1])[0][0]}——所主领域须借力或后补`
    };
  });
  const sorted = [...rows].sort((a, b) => b.rupas - a.rupas);
  sorted.forEach((r, i) => { r.rank = i + 1; });
  return {
    rows, ranked: sorted.map(x => x.name),
    strongest: sorted[0]?.name || '', weakest: sorted[sorted.length - 1]?.name || '',
    method: '本实现覆盖六力中的五项：Sthana Bala（Uchcha 庙旺度 + Kendradi 角宫 + Drekkana 三分位）、Dig Bala（方向力）、Kala Bala 的 Paksha（月相力）、Cheshta Bala（动势力，按实际速度推算）、Naisargika Bala（自然力固定值）。未计入 Saptavargaja（最多 2.5 Rupas）、Drik Bala（最多 ±1.5 Rupas）与 Kala Bala 的其余分项（Nathonnatha、Ayana 等合计 2–4 Rupas）——因此本表总分系统性偏低 2–5 Rupas，不设绝对达标线，请按「相对位次 + 分项短板」读取；不同命盘之间横向比较同样有效。'
  };
}

/* ---------- 二、Bhava Bala 宫位力量 ---------- */
export function bhavaBala(v, shad) {
  const strong = Object.fromEntries((shad?.rows || []).map(r => [r.name, r.rupas]));
  const lordOf = signIndex => {
    // 宫主星：白羊/天蝎→火星，金牛/天秤→金星，双子/处女→水星，巨蟹→月亮，狮子→太阳，射手/双鱼→木星，摩羯/水瓶→土星
    const l = {0:'火星',1:'金星',2:'水星',3:'月亮',4:'太阳',5:'水星',6:'金星',7:'火星',8:'木星',9:'土星',10:'土星',11:'木星'};
    return l[signIndex];
  };
  const lagna = v.lagnaIndex ?? 0;
  const rows = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1, signIndex = (lagna + i) % 12;
    const lord = lordOf(signIndex);
    const occupants = v.planets.filter(p => p.house === house);
    const benefics = occupants.filter(p => BENEFIC.has(p.name)).length;
    const malefics = occupants.filter(p => !BENEFIC.has(p.name) && !['罗睺', '计都'].includes(p.name)).length;
    const nodes = occupants.filter(p => ['罗睺', '计都'].includes(p.name)).length;
    const lordPower = strong[lord] ?? 4;
    // 宫位力量 = 宫主星力量（权重最高）+ 落宫吉凶星 + 节点扰动
    const score = lordPower * 1.4 + benefics * 1.2 - malefics * 0.8 - nodes * 0.4 + (house === 1 || house === 4 || house === 7 || house === 10 ? 0.5 : 0);
    return {
      house, theme: HOUSE_THEME[house], sign: SIGN_ROLE[signIndex], lord,
      occupants: occupants.map(p => p.name), benefics, malefics, nodes,
      lordPower: +lordPower.toFixed(2), score: +score.toFixed(2),
      grade: score >= 7 ? '强' : score >= 5 ? '中上' : score >= 3.5 ? '中' : '弱'
    };
  });
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  return {
    rows, strongest: sorted.slice(0, 3).map(x => x.house), weakest: sorted.slice(-3).map(x => x.house),
    method: '宫位力量＝宫主星 Shadbala 折合分（×1.4）＋宫内吉星（×1.2）－宫内凶星（×0.8）－罗计干扰（×0.4）＋四正宫加权 0.5。这是 Bhava Bala 的简化模型，用于比较十二宫的相对强弱与资源投放顺序，不等同于传统 Bhava Bala 的六项完整算法。'
  };
}

/* ---------- 三、Varshaphala 岁运盘 ---------- */
export function solarReturnUtc(natalSunSid, aroundDate) {
  const f = t => {
    const sid = bodyAt(new Date(t), 0, 'lahiri').longitude;
    let d = norm(sid - natalSunSid);
    return d > 180 ? d - 360 : d;
  };
  // 从生日前 5 天起找一个由负转正的过零点
  let a = +aroundDate - 5 * 86400000, b = a + 2 * 86400000;
  let guard = 0;
  while (f(a) > 0 && guard++ < 10) { a -= 86400000; b -= 86400000; }
  guard = 0;
  while (f(b) < 0 && guard++ < 10) { b += 86400000; }
  for (let i = 0; i < 48; i++) { const m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; }
  return new Date(Math.round((a + b) / 2));
}

export function varshaphala({natal, birth, year, buildChart, tz = 8}) {
  const natalSun = natal.planets.find(p => p.name === '太阳');
  if (!natalSun) return null;
  const birthDate = new Date(natal.utc || Date.UTC(birth.Y, birth.M - 1, birth.D, 12));
  const probe = new Date(Date.UTC(year, birthDate.getUTCMonth(), birthDate.getUTCDate(), 6));
  const returnUtc = solarReturnUtc(norm(natalSun.sid), probe);
  const chart = buildChart(returnUtc);
  if (!chart) return null;
  const age = year - Number(birth.Y);
  // Muntha：本命上升起算，每年进一宫
  const munthaHouse = ((age % 12) + 12) % 12 + 1;
  const munthaSign = SIGN_ROLE[(natal.lagnaIndex + munthaHouse - 1) % 12];
  const lordOf = s => ({0:'火星',1:'金星',2:'水星',3:'月亮',4:'太阳',5:'水星',6:'金星',7:'火星',8:'木星',9:'土星',10:'土星',11:'木星'})[s];
  const yearLord = lordOf(chart.lagnaIndex ?? 0);
  const yearLordPlanet = chart.planets.find(p => p.name === yearLord);
  return {
    year, returnUtc: returnUtc.toISOString(), age, tz,
    chart: { lagna: chart.lagna, lagnaIndex: chart.lagnaIndex, planets: chart.planets.map(p => ({ name: p.name, sign: p.sign, house: p.house, retro: !!p.retro })) },
    muntha: { house: munthaHouse, sign: munthaSign, theme: HOUSE_THEME[munthaHouse] },
    yearLord: { name: yearLord, house: yearLordPlanet?.house ?? null, sign: yearLordPlanet?.sign ?? '', retro: !!yearLordPlanet?.retro },
    method: '太阳返照岁运盘：以太阳回到本命恒星黄经的精确时刻起盘（Lahiri 恒星黄道、整宫制）。Muntha 自本命上升每年进一宫，指示该年的关注领域；年主星取返照盘上升星座的宫主星，代表这一年的主导力量。Varshaphala 的完整体系（Year Lord 的五种候选、Panchavargeeya Bala、Sahams）未全部实现。'
  };
}

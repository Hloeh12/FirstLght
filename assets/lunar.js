/* ============================================================
 * lunar.js — 农历 ↔ 公历转换（1900–2100，无依赖）
 *
 * 采用经典压缩农历表（每年一个十六进制数编码：闰月序号 +
 * 12/13 个月的大小月位），与紫微斗数排盘所需的中文日期文案。
 * 对外接口：
 *   Lunar.solarToLunar(y, m, d)  → { y, m, d, leap, text } | null
 *   Lunar.lunarToSolar(y, m, d, leap) → 'YYYY-MM-DD' | null
 *   Lunar.leapMonth(y)           → 0(无闰) | 1..12
 *   Lunar.lunarMonths(y)         → [{ value, label }]（含闰月项）
 *   Lunar.lunarDays(y, m, leap)  → 29 | 30
 * ============================================================ */
(function (root) {
  'use strict';

  /* 农历压缩表 1900-2100：格式 0x04bd8 等，位含义见 parseYear */
  var LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];
  var BASE_YEAR = 1900;

  var MONTH_ZH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  var DAY_ZH = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

  /* 某农历年的信息：闰月序号 + 每月大小。
   * 标准压缩表编码：低 4 位 = 闰月序号（0 为无闰）；
   * 第 m 个常规月（1..12）大小位 = 0x10000 >> m（1 置 30 天）；
   * 闰月大小位 = 0x10000。 */
  function yearInfo(y) {
    var d = LUNAR_INFO[y - BASE_YEAR];
    var leap = d & 0xf;
    var months = [];
    for (var m = 1; m <= 12; m++) months.push((d & (0x10000 >> m)) ? 30 : 29);
    if (leap) months.splice(leap, 0, (d & 0x10000) ? 30 : 29);
    return { leap: leap, months: months };
  }
  /* 槽位数：无闰月 12 个，有闰月 13 个 */
  function slotCount(info) { return info.leap ? 13 : 12; }
  /* 第 i 个槽位对应哪个月：返回 { m: 1..12, leap: bool } */
  function slotMonth(info, i) {
    if (info.leap && i === info.leap) return { m: info.leap, leap: true };
    return { m: (info.leap && i > info.leap) ? i : i + 1, leap: false };
  }
  /* 该农历年全年总天数 */
  function yearDays(y) {
    var info = yearInfo(y), sum = 0;
    for (var i = 0; i < slotCount(info); i++) sum += info.months[i];
    return sum;
  }
  /* 某农历月的天数；month 为 1..12，leap 为布尔 */
  function monthDays(y, m, leap) {
    var info = yearInfo(y);
    for (var i = 0; i < slotCount(info); i++) {
      var s = slotMonth(info, i);
      if (s.m === m && s.leap === !!leap) return info.months[i];
    }
    return 0;
  }

  function leapMonth(y) { return yearInfo(y).leap; }

  /* 农历年的月列表（供下拉框）：正常 12 个月 + 闰月项（若有） */
  function lunarMonths(y) {
    if (!y || y < BASE_YEAR || y > BASE_YEAR + LUNAR_INFO.length - 1) return [];
    var info = yearInfo(y);
    var list = [];
    for (var m = 1; m <= 12; m++) {
      list.push({ value: String(m), label: MONTH_ZH[m - 1] + '月' });
      if (info.leap === m) list.push({ value: m + '|leap', label: '闰' + MONTH_ZH[m - 1] + '月' });
    }
    return list;
  }

  function lunarDays(y, m, leap) {
    if (!y || !m) return 30;
    return monthDays(y, m, !!leap) || 30;
  }

  /* 公历 → 农历。入参为公历年月日，返回 { y, m, d, leap, text } 或 null */
  function solarToLunar(sy, sm, sd) {
    sy = Number(sy); sm = Number(sm); sd = Number(sd);
    if (!sy || !sm || !sd || sy < BASE_YEAR || sy > BASE_YEAR + LUNAR_INFO.length - 1) return null;
    // 基准日：1900-01-31 = 农历正月初一
    var base = Date.UTC(1900, 0, 31);
    var offset = Math.floor((Date.UTC(sy, sm - 1, sd) - base) / 86400000);
    if (offset < 0) return null;

    var y = BASE_YEAR, days = yearDays(y);
    while (offset >= days) { offset -= days; y++; days = yearDays(y); }

    var info = yearInfo(y);
    var m = 0, d = 0, isLeap = false;
    for (var i = 0; i < slotCount(info); i++) {
      var s = slotMonth(info, i);
      var len = info.months[i];
      if (offset < len) {
        m = s.m; isLeap = s.leap; d = offset + 1;
        break;
      }
      offset -= len;
    }
    if (!m) return null;

    var gz = '（' + GAN[(y - 4) % 10] + ZHI[(y - 4) % 12] + ZODIAC[(y - 4) % 12] + '年）';
    var text = (isLeap ? '闰' : '') + MONTH_ZH[m - 1] + '月' + DAY_ZH[d - 1];
    return { y: y, m: m, d: d, leap: isLeap, text: text + ' ' + gz };
  }

  /* 农历 → 公历。leap 传 true 表示闰月。返回 'YYYY-MM-DD' 或 null */
  function lunarToSolar(y, m, d, leap) {
    y = Number(y); m = Number(m); d = Number(d);
    if (!y || !m || !d || y < BASE_YEAR || y > BASE_YEAR + LUNAR_INFO.length - 1) return null;
    leap = !!leap;
    if (leap && leapMonth(y) !== m) return null;
    if (d > monthDays(y, m, leap)) return null;

    var info = yearInfo(y);
    var offset = 0;
    for (var yy = BASE_YEAR; yy < y; yy++) offset += yearDays(yy);
    for (var i = 0; i < slotCount(info); i++) {
      var s = slotMonth(info, i);
      if (s.m === m && s.leap === leap) { offset += d - 1; break; }
      offset += info.months[i];
    }
    var date = new Date(Date.UTC(1900, 0, 31) + offset * 86400000);
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
  }

  var Lunar = { solarToLunar: solarToLunar, lunarToSolar: lunarToSolar, leapMonth: leapMonth, lunarMonths: lunarMonths, lunarDays: lunarDays };
  if (typeof module !== 'undefined' && module.exports) module.exports = Lunar;
  root.Lunar = Lunar;
})(typeof window !== 'undefined' ? window : globalThis);

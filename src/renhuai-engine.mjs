// src/renhuai/algorithm.ts
import { astro } from "iztro";
import { Solar, LunarMonth } from "lunar-javascript";

// src/renhuai/constants.ts
var STEMS = ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"];
var BRANCHES = ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"];

// src/renhuai/school-tables.generated.ts
var SCHOOL_AX = {
  WXJS: [[0, 0, 0, 0, 0, 0, 0], [0, 2, 6, 3, 5, 4, 6], [0, 6, 5, 4, 3, 2, 5], [0, 5, 3, 2, 4, 6, 3], [0, 3, 4, 6, 2, 5, 4], [0, 4, 2, 5, 6, 3, 2]],
  // 五行局
  SHB: [[0, 0, 0, 0, 0], [0, 6, 14, 4, 3], [0, 2, 12, 1, 8], [0, 5, 2, 15, 6], [0, 8, 5, 2, 10], [0, 9, 8, 18, 2], [0, 4, 9, 12, 16], [0, 3, 4, 8, 5], [0, 10, 3, 16, 15], [0, 12, 1, 17, 4], [0, 14, 10, 8, 9]],
  // 生年四化
  SHB_ARR_JLPWY: [0, 6, 14, 4, 3],
  SHB_ARR_JLPQY: [0, 6, 14, 16, 3],
  SHB_ARR_WTYYOUJ: [0, 9, 8, 18, 2],
  SHB_ARR_WTYYANGJ: [0, 9, 8, 3, 2],
  SHB_ARR_GYWYT: [0, 3, 4, 8, 5],
  SHB_ARR_GYWTY: [0, 3, 4, 5, 8],
  SHB_ARR_GYWFT: [0, 3, 4, 7, 5],
  SHB_ARR_GYWFX: [0, 3, 4, 7, 11],
  SHB_ARR_GYWTX: [0, 3, 4, 5, 11],
  SHB_ARR_XJYQC: [0, 10, 3, 16, 15],
  SHB_ARR_XJYWC: [0, 10, 3, 4, 15],
  SHB_ARR_RLZFW: [0, 12, 1, 17, 4],
  SHB_ARR_RLZFW2: [0, 12, 1, 7, 4],
  SHB_ARR_RLZXW: [0, 12, 1, 11, 4],
  SHB_ARR_GPJYT1: [0, 14, 10, 8, 9],
  SHB_ARR_GPJYT2: [0, 14, 10, 3, 9],
  CQ: [[0, 0], [11, 5], [10, 6], [9, 7], [8, 8], [7, 9], [6, 10], [5, 11], [4, 12], [3, 1], [2, 2], [1, 3], [12, 4]],
  // 文昌文曲(生时, [昌,曲])
  ZY: [[0, 0], [5, 11], [6, 10], [7, 9], [8, 8], [9, 7], [10, 6], [11, 5], [12, 4], [1, 3], [2, 2], [3, 1], [4, 12]],
  // 左辅右弼(生月, [辅,弼])
  KY_ARR1: [[0, 0], [2, 8], [1, 9], [12, 10], [12, 10], [2, 8], [1, 9], [2, 8], [3, 7], [4, 6], [4, 6]],
  // 天魁天钺·默认派(生年干, [魁,钺])
  KY_ARR2: [[0, 0], [2, 8], [1, 9], [12, 10], [12, 10], [2, 8], [1, 9], [7, 3], [7, 3], [6, 4], [6, 4]],
  // 天魁天钺·派2
  KY_ARR3: [[0, 0], [2, 8], [1, 9], [12, 10], [12, 10], [2, 8], [1, 9], [3, 7], [3, 7], [6, 4], [6, 4]],
  // 天魁天钺·派3
  KY_ARR4: [[0, 0], [2, 8], [1, 9], [12, 10], [12, 10], [2, 8], [1, 9], [2, 8], [7, 3], [4, 6], [4, 6]],
  // 天魁天钺·派4
  HL: [[0, 0], [3, 11], [4, 11], [2, 4], [10, 11], [3, 11], [4, 11], [2, 4], [10, 11], [3, 11], [4, 11], [2, 4], [10, 11]],
  // 火铃起点表(年支三合定起点 + 生时顺数;火/铃 26/26 验证。⚠️ 曾误标「红鸾天喜」—— 真红鸾天喜默认口径无表、走标准公式 卯/酉起年支逆)
  GG: [[0, 0], [3, 11], [3, 11], [6, 2], [6, 2], [6, 2], [9, 5], [9, 5], [9, 5], [12, 8], [12, 8], [12, 8], [3, 11]],
  // 孤辰寡宿(生年支, [孤,寡])
  FG: [[0, 0], [8, 10], [5, 9], [6, 1], [3, 12], [4, 4], [10, 3], [12, 7], [10, 6], [11, 7], [7, 6]],
  // 封诰类(生月? 待引擎核)
  JK_ARR1: [0, 9, 7, 5, 3, 1, 10, 8, 6, 4, 2],
  // 截空·派1(单星)
  JK_ARR2: [[0, 0], [9, 10], [8, 7], [5, 6], [4, 3], [1, 2], [10, 9], [7, 8], [6, 5], [3, 4], [2, 1]],
  // 截空·派2(正副双星, 默认)
  JK_ARR3: [0, 9, 7, 5, 3, 11, 10, 8, 6, 4, 12],
  // 截空·派3(占验派)
  YS: [0, 3, 1, 11, 9, 7, 5, 3, 1, 11, 9, 7, 5],
  // 旬空(生年干)
  TY: [0, 11, 6, 5, 3, 8, 4, 12, 8, 3, 7, 11, 3],
  // ⚠️ 非天姚(star35,按生月落宫不连续=戌巳辰寅未卯亥未寅午戌寅,不符任何古法天姚;真天姚我们用「丑起正月顺」标准古法。身份待考,勿当天姚用)
  TW: [0, 6, 9, 3, 12, 6, 9, 3, 12, 6, 9, 3, 12],
  // 天巫(生月)
  JS: [0, 9, 9, 11, 11, 1, 1, 3, 3, 5, 5, 7, 7],
  // 解神(生月)
  FL: [0, 9, 10, 11, 6, 7, 8, 3, 4, 5, 12, 1, 2],
  // 蜚廉(生年支) ← 注意:旧 school-data 误标为封诰
  PS: [0, 6, 2, 10, 6, 2, 10, 6, 2, 10, 6, 2, 10],
  // 破碎(生年支)
  HG: [0, 5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8],
  // 华盖(生年支)
  XC: [0, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7, 4, 1],
  // 咸池(生年支)
  TC: [0, 6, 7, 1, 6, 7, 9, 3, 7, 10, 12],
  // 天厨(生年干)
  SB_QS: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 1, 2, 2, 3, 2, 1, 1, 2, 2, 3, 2], [0, 1, 7, 3, 2, 4, 5, 1, 7, 3, 2, 4, 5], [0, 7, 6, 2, 1, 2, 2, 2, 3, 3, 5, 6, 7], [0, 2, 1, 3, 4, 1, 5, 2, 1, 3, 4, 1, 5], [0, 2, 6, 4, 5, 5, 1, 7, 6, 2, 5, 5, 1], [0, 5, 4, 1, 5, 4, 7, 5, 4, 1, 5, 4, 7], [0, 1, 1, 1, 3, 1, 3, 2, 1, 3, 2, 1, 3], [0, 1, 1, 2, 7, 7, 7, 6, 6, 4, 2, 2, 1], [0, 2, 1, 5, 4, 1, 7, 2, 1, 5, 4, 1, 7], [0, 2, 6, 1, 1, 7, 2, 2, 6, 1, 1, 7, 2], [0, 1, 1, 1, 7, 3, 3, 1, 3, 1, 7, 3, 3], [0, 1, 2, 1, 1, 1, 3, 1, 2, 7, 3, 1, 7], [0, 2, 1, 1, 2, 1, 5, 2, 1, 1, 2, 1, 5], [0, 1, 2, 3, 7, 2, 5, 1, 2, 3, 7, 2, 5], [0, 3, 1, 7, 4, 3, 1, 7, 4, 3, 1, 7, 4], [0, 3, 1, 5, 2, 3, 1, 7, 2, 3, 1, 7, 2], [0, 2, 1, 1, 7, 1, 5, 2, 1, 5, 7, 1, 6], [0, 1, 1, 2, 7, 1, 5, 2, 1, 6, 7, 1, 5], [0, 2, 2, 0, 1, 0, 0, 1, 0, 0, 0, 0, 2], [0, 0, 0, 2, 0, 0, 2, 0, 2, 1, 1, 0, 0], [0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1], [0, 0, 0, 2, 0, 0, 5, 0, 0, 2, 0, 0, 5], [0, 7, 3, 1, 4, 7, 3, 1, 4, 7, 3, 1, 4], [0, 7, 3, 1, 4, 7, 3, 1, 4, 7, 3, 1, 4], [0, 7, 1, 0, 7, 1, 0, 7, 1, 0, 7, 1, 0], [0, 0, 1, 7, 0, 1, 7, 0, 1, 7, 0, 1, 7], [0, 5, 7, 7, 5, 7, 1, 1, 5, 1, 1, 7, 7], [0, 7, 7, 5, 5, 7, 6, 1, 5, 1, 5, 5, 7], [0, 5, 0, 2, 5, 0, 2, 5, 0, 1, 1, 0, 1], [0, 0, 0, 5, 2, 2, 2, 1, 1, 0, 5, 5, 2], [0, 5, 7, 1, 1, 5, 7, 5, 7, 7, 1, 1, 7], [0, 7, 1, 1, 5, 2, 1, 2, 5, 1, 1, 5, 1], [0, 5, 1, 5, 7, 1, 5, 2, 1, 2, 1, 2, 5], [0, 2, 5, 1, 2, 7, 1, 2, 5, 1, 2, 7, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 5, 7, 5, 1, 1, 1, 7, 2, 2, 7, 5], [0, 7, 5, 2, 1, 7, 5, 5, 2, 7, 1, 1, 7], [0, 5, 1, 5, 1, 5, 6, 7, 5, 1, 6, 5, 5], [0, 2, 7, 1, 2, 7, 1, 1, 7, 2, 1, 7, 2], [0, 7, 1, 2, 1, 7, 2, 5, 7, 1, 2, 7, 5], [0, 1, 2, 5, 2, 2, 5, 1, 2, 7, 1, 2, 5], [0, 5, 1, 2, 7, 1, 5, 5, 2, 2, 5, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 5, 5, 1, 2, 2, 1, 5, 6, 1, 5], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 5, 0, 0, 7, 0, 0, 5, 0, 0, 7], [0, 7, 0, 0, 5, 0, 0, 7, 0, 0, 5, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 7, 2, 1, 1, 2, 2, 7, 1, 2, 7, 1], [0, 5, 1, 5, 1, 1, 5, 1, 2, 5, 7, 1, 6], [0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 7, 0, 0, 1, 0, 0, 7, 0, 0, 5, 0], [0, 1, 5, 1, 1, 1, 2, 1, 5, 6, 2, 1, 5], [0, 0, 5, 0, 0, 7, 0, 0, 6, 0, 0, 7, 0], [0, 1, 5, 1, 2, 7, 1, 5, 7, 6, 1, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 5, 5, 1, 1, 7, 6, 1, 5, 1, 7, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 5, 7, 6, 5, 7, 2, 5, 7, 6, 5, 7], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 7, 5, 5, 7, 5, 5, 5, 5, 7, 7, 2], [0, 7, 5, 5, 7, 5, 5, 7, 7, 5, 5, 5, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 6, 7, 5, 7, 1, 1, 1, 1, 1, 0, 0], [0, 7, 5, 7, 5, 7, 1, 1, 7, 1, 1, 7, 5], [0, 1, 3, 1, 1, 1, 2, 1, 3, 4, 2, 1, 3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 0, 0, 5, 0, 0, 7, 0, 0, 5, 0, 0]],
  // 全星亮度·全书派(85星×12宫)
  SB_XD1: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 1, 1, 2, 3, 2, 1, 1, 2, 2, 3, 2], [0, 1, 7, 3, 2, 4, 5, 1, 7, 3, 2, 4, 5], [0, 7, 6, 2, 1, 2, 2, 1, 3, 4, 5, 7, 7], [0, 2, 1, 3, 4, 1, 5, 2, 1, 3, 4, 1, 5], [0, 2, 6, 4, 1, 5, 1, 7, 6, 2, 5, 5, 1], [0, 5, 4, 1, 5, 4, 7, 5, 4, 1, 5, 4, 7], [0, 1, 1, 1, 3, 2, 3, 2, 1, 3, 2, 2, 3], [0, 1, 1, 6, 7, 7, 7, 7, 5, 4, 2, 2, 1], [0, 2, 1, 5, 3, 1, 7, 2, 1, 5, 4, 1, 7], [0, 2, 6, 1, 1, 5, 5, 2, 5, 1, 1, 5, 2], [0, 1, 1, 1, 7, 5, 3, 3, 3, 1, 7, 3, 3], [0, 1, 2, 1, 2, 1, 7, 1, 2, 7, 3, 1, 7], [0, 2, 1, 1, 2, 3, 5, 2, 1, 1, 2, 1, 5], [0, 1, 2, 3, 7, 2, 5, 1, 2, 3, 7, 2, 5], [0, 3, 1, 7, 2, 3, 1, 7, 4, 3, 1, 7, 4], [0, 3, 1, 5, 2, 3, 1, 7, 2, 3, 1, 7, 2], [0, 2, 1, 1, 7, 1, 5, 2, 1, 5, 7, 1, 6], [0, 1, 1, 2, 7, 1, 5, 2, 1, 6, 7, 1, 5], [0, 2, 2, 0, 1, 0, 0, 1, 0, 0, 0, 0, 2], [0, 0, 0, 2, 0, 0, 2, 0, 2, 1, 1, 0, 0], [0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1], [0, 0, 0, 2, 0, 0, 5, 0, 0, 2, 0, 0, 5], [0, 7, 3, 1, 4, 7, 3, 1, 4, 7, 3, 1, 4], [0, 7, 3, 1, 4, 7, 3, 1, 4, 7, 3, 1, 4], [0, 2, 1, 4, 7, 1, 4, 7, 1, 4, 2, 1, 4], [0, 4, 1, 7, 4, 1, 7, 4, 1, 7, 4, 1, 7], [0, 5, 7, 7, 5, 7, 1, 1, 5, 1, 1, 7, 7], [0, 7, 7, 5, 5, 7, 6, 1, 5, 1, 5, 5, 7], [0, 5, 0, 2, 5, 0, 2, 5, 0, 1, 1, 0, 1], [0, 0, 0, 5, 2, 2, 2, 1, 1, 0, 5, 5, 2], [0, 5, 7, 1, 1, 5, 7, 5, 7, 7, 1, 1, 7], [0, 7, 1, 1, 5, 2, 1, 2, 5, 1, 1, 5, 1], [0, 5, 1, 5, 7, 1, 5, 2, 1, 2, 1, 2, 5], [0, 2, 5, 1, 2, 7, 1, 2, 5, 1, 2, 7, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 5, 7, 5, 1, 1, 1, 7, 2, 2, 7, 5], [0, 7, 5, 2, 1, 7, 5, 5, 2, 7, 1, 1, 7], [0, 5, 1, 5, 1, 5, 6, 7, 5, 1, 6, 5, 5], [0, 2, 7, 1, 2, 7, 1, 1, 7, 2, 1, 7, 2], [0, 7, 1, 2, 1, 7, 2, 5, 7, 1, 2, 7, 5], [0, 1, 2, 5, 2, 2, 5, 1, 2, 7, 1, 2, 5], [0, 5, 1, 2, 7, 1, 5, 5, 2, 2, 5, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 5, 5, 1, 2, 2, 1, 5, 6, 1, 5], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 5, 0, 0, 7, 0, 0, 5, 0, 0, 7], [0, 7, 0, 0, 5, 0, 0, 7, 0, 0, 5, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 7, 2, 1, 1, 2, 2, 7, 1, 2, 7, 1], [0, 5, 1, 5, 1, 1, 5, 1, 2, 5, 7, 1, 6], [0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 7, 0, 0, 1, 0, 0, 7, 0, 0, 5, 0], [0, 1, 5, 1, 1, 1, 2, 1, 5, 6, 2, 1, 5], [0, 0, 5, 0, 0, 7, 0, 0, 6, 0, 0, 7, 0], [0, 1, 5, 1, 2, 7, 1, 5, 7, 6, 1, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 5, 5, 1, 1, 7, 6, 1, 5, 1, 7, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 5, 7, 6, 5, 7, 2, 5, 7, 6, 5, 7], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 7, 5, 5, 7, 5, 5, 5, 5, 7, 7, 2], [0, 7, 5, 5, 7, 5, 5, 7, 7, 5, 5, 5, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 6, 7, 5, 7, 1, 1, 1, 1, 1, 0, 0], [0, 7, 5, 7, 5, 7, 1, 1, 7, 1, 1, 7, 5], [0, 1, 3, 1, 1, 1, 2, 1, 3, 4, 2, 1, 3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 7, 0, 0, 5, 0, 0, 7, 0, 0, 5, 0, 0]],
  // 全星亮度·现代修正1(默认)
  SB_ZZ: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 3, 1, 1, 2, 5, 2, 1, 1, 2, 3, 4, 2], [0, 1, 5, 2, 2, 1, 3, 1, 5, 3, 2, 1, 3], [0, 5, 5, 2, 1, 2, 2, 1, 3, 4, 4, 5, 5], [0, 2, 1, 4, 5, 1, 3, 2, 1, 3, 2, 1, 3], [0, 2, 5, 4, 1, 3, 1, 5, 5, 2, 3, 3, 1], [0, 3, 2, 1, 4, 2, 5, 3, 1, 1, 3, 2, 5], [0, 1, 1, 1, 3, 1, 3, 2, 1, 3, 5, 1, 2], [0, 1, 1, 4, 5, 4, 5, 5, 3, 3, 2, 2, 1], [0, 2, 1, 3, 4, 1, 5, 2, 1, 3, 3, 1, 5], [0, 2, 2, 1, 1, 3, 3, 2, 5, 1, 1, 2, 2], [0, 1, 1, 1, 5, 2, 3, 2, 4, 1, 5, 4, 3], [0, 1, 2, 1, 1, 2, 5, 1, 2, 5, 4, 2, 5], [0, 2, 1, 1, 5, 2, 3, 2, 2, 1, 4, 1, 3], [0, 1, 2, 5, 2, 2, 4, 1, 1, 5, 5, 2, 3], [0, 2, 1, 5, 3, 2, 1, 5, 3, 2, 1, 5, 2], [0, 1, 1, 3, 2, 1, 1, 5, 2, 3, 1, 5, 2], [0, 2, 1, 1, 5, 1, 3, 2, 1, 3, 5, 1, 4], [0, 1, 1, 2, 5, 1, 3, 2, 1, 4, 5, 1, 3], [0, 2, 2, 0, 1, 0, 0, 1, 0, 0, 0, 0, 2], [0, 0, 0, 2, 0, 0, 2, 0, 2, 1, 1, 0, 0], [0, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1], [0, 0, 0, 2, 0, 0, 3, 0, 0, 2, 0, 0, 3], [0, 3, 2, 1, 3, 4, 2, 1, 4, 5, 5, 1, 3], [0, 5, 5, 1, 1, 2, 2, 1, 2, 2, 5, 1, 1], [0, 5, 1, 0, 5, 1, 0, 3, 1, 0, 5, 1, 0], [0, 0, 1, 5, 0, 1, 5, 0, 1, 5, 0, 1, 5], [0, 3, 5, 5, 3, 5, 1, 1, 3, 1, 1, 5, 5], [0, 5, 5, 3, 3, 5, 4, 1, 3, 1, 3, 3, 2], [0, 3, 0, 2, 3, 0, 2, 3, 0, 1, 1, 0, 1], [0, 0, 0, 3, 2, 2, 2, 1, 1, 0, 3, 3, 2], [0, 3, 5, 1, 1, 3, 5, 3, 5, 5, 1, 1, 5], [0, 5, 1, 1, 3, 2, 1, 2, 3, 1, 1, 3, 1], [0, 3, 1, 3, 5, 1, 3, 2, 1, 2, 1, 2, 3], [0, 2, 3, 1, 2, 5, 1, 2, 3, 1, 2, 5, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 3, 5, 3, 1, 1, 1, 5, 2, 2, 5, 3], [0, 5, 3, 2, 1, 5, 3, 3, 2, 5, 1, 1, 5], [0, 3, 1, 3, 1, 3, 4, 5, 3, 1, 4, 3, 3], [0, 2, 5, 1, 2, 5, 1, 1, 5, 2, 1, 5, 2], [0, 5, 1, 2, 1, 5, 2, 3, 5, 1, 2, 5, 3], [0, 1, 2, 3, 2, 2, 3, 1, 2, 5, 1, 2, 3], [0, 3, 1, 2, 5, 1, 3, 3, 2, 2, 3, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 3, 3, 1, 2, 2, 1, 3, 4, 1, 3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 3, 0, 0, 5, 0, 0, 3, 0, 0, 5], [0, 5, 0, 0, 3, 0, 0, 5, 0, 0, 3, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 5, 2, 1, 1, 2, 2, 5, 1, 2, 5, 1], [0, 3, 1, 3, 1, 1, 3, 1, 2, 3, 5, 1, 4], [0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 5, 0, 0, 1, 0, 0, 5, 0, 0, 3, 0], [0, 1, 3, 1, 1, 1, 2, 1, 3, 4, 2, 1, 3], [0, 0, 3, 0, 0, 5, 0, 0, 4, 0, 0, 5, 0], [0, 1, 3, 1, 2, 5, 1, 3, 5, 4, 1, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 3, 3, 1, 1, 5, 4, 1, 3, 1, 5, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 3, 5, 4, 3, 5, 2, 3, 5, 4, 3, 5], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 5, 3, 3, 5, 3, 3, 3, 3, 5, 5, 2], [0, 5, 3, 3, 5, 3, 3, 5, 5, 3, 3, 3, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 4, 5, 3, 5, 1, 1, 1, 1, 1, 0, 0], [0, 5, 3, 5, 3, 5, 1, 1, 5, 1, 1, 5, 3], [0, 1, 3, 1, 1, 1, 2, 1, 3, 4, 2, 1, 3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 0, 0, 3, 0, 0, 5, 0, 0, 3, 0, 0]],
  // 全星亮度·中州派
  SB_XD2: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 4, 1, 1, 2, 4, 2, 1, 1, 2, 3, 5, 2], [0, 1, 5, 2, 2, 2, 3, 1, 5, 2, 2, 2, 3], [0, 5, 5, 2, 1, 2, 2, 1, 2, 3, 3, 5, 5], [0, 2, 1, 3, 5, 1, 3, 2, 1, 3, 2, 1, 3], [0, 2, 5, 3, 1, 2, 1, 5, 5, 2, 3, 3, 1], [0, 3, 2, 1, 4, 2, 5, 3, 1, 1, 3, 2, 5], [0, 2, 1, 1, 3, 1, 2, 2, 1, 2, 3, 1, 2], [0, 1, 1, 5, 5, 5, 5, 5, 5, 2, 2, 1, 1], [0, 2, 1, 3, 2, 1, 5, 2, 1, 3, 2, 1, 5], [0, 2, 5, 1, 2, 5, 1, 2, 5, 1, 2, 5, 1], [0, 1, 1, 1, 5, 2, 3, 2, 3, 1, 5, 5, 3], [0, 1, 2, 1, 1, 2, 5, 1, 2, 5, 3, 2, 5], [0, 2, 2, 1, 5, 1, 3, 2, 2, 1, 3, 1, 3], [0, 1, 1, 5, 2, 2, 3, 1, 1, 5, 5, 2, 3], [0, 2, 1, 5, 3, 2, 1, 4, 3, 2, 1, 5, 3], [0, 1, 2, 5, 3, 2, 1, 3, 2, 2, 1, 5, 3], [0, 2, 1, 2, 1, 1, 2, 2, 1, 2, 2, 1, 2], [0, 2, 1, 2, 1, 1, 2, 2, 1, 2, 2, 1, 2], [0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1], [0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1], [0, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1], [0, 0, 0, 2, 0, 0, 3, 0, 0, 2, 0, 0, 3], [0, 5, 3, 1, 2, 5, 3, 1, 2, 5, 3, 1, 2], [0, 5, 3, 1, 2, 5, 3, 1, 2, 5, 3, 1, 2], [0, 5, 1, 0, 5, 1, 0, 5, 1, 0, 5, 1, 0], [0, 0, 1, 5, 0, 1, 5, 0, 1, 5, 0, 1, 5], [0, 3, 5, 5, 3, 5, 1, 1, 3, 1, 1, 5, 5], [0, 5, 5, 3, 3, 5, 4, 1, 3, 1, 3, 3, 2], [0, 3, 0, 2, 3, 0, 2, 3, 0, 1, 1, 0, 1], [0, 0, 0, 3, 2, 2, 2, 1, 1, 0, 3, 3, 2], [0, 3, 5, 1, 1, 3, 5, 3, 5, 5, 1, 1, 5], [0, 5, 1, 1, 3, 2, 1, 2, 3, 1, 1, 3, 1], [0, 3, 1, 3, 5, 1, 3, 2, 1, 2, 1, 2, 3], [0, 2, 3, 1, 2, 5, 1, 2, 3, 1, 2, 5, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 3, 5, 3, 1, 1, 1, 5, 2, 2, 5, 3], [0, 5, 3, 2, 1, 5, 3, 3, 2, 5, 1, 1, 5], [0, 3, 1, 3, 1, 3, 4, 5, 3, 1, 4, 3, 3], [0, 2, 5, 1, 2, 5, 1, 1, 5, 2, 1, 5, 2], [0, 5, 1, 2, 1, 5, 2, 3, 5, 1, 2, 5, 3], [0, 1, 2, 3, 2, 2, 3, 1, 2, 5, 1, 2, 3], [0, 3, 1, 2, 5, 1, 3, 3, 2, 2, 3, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 3, 3, 1, 2, 2, 1, 3, 4, 1, 3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 3, 0, 0, 5, 0, 0, 3, 0, 0, 5], [0, 5, 0, 0, 3, 0, 0, 5, 0, 0, 3, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 5, 2, 1, 1, 2, 2, 5, 1, 2, 5, 1], [0, 3, 1, 3, 1, 1, 3, 1, 2, 3, 5, 1, 4], [0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 5, 0, 0, 1, 0, 0, 5, 0, 0, 3, 0], [0, 1, 3, 1, 1, 1, 2, 1, 3, 4, 2, 1, 3], [0, 0, 3, 0, 0, 5, 0, 0, 4, 0, 0, 5, 0], [0, 1, 3, 1, 2, 5, 1, 3, 5, 4, 1, 1, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 3, 3, 1, 1, 5, 4, 1, 3, 1, 5, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 3, 5, 4, 3, 5, 2, 3, 5, 4, 3, 5], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 5, 3, 3, 5, 3, 3, 3, 3, 5, 5, 2], [0, 5, 3, 3, 5, 3, 3, 5, 5, 3, 3, 3, 2], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 4, 5, 3, 5, 1, 1, 1, 1, 1, 0, 0], [0, 5, 3, 5, 3, 5, 1, 1, 5, 1, 1, 5, 3], [0, 1, 3, 1, 1, 1, 2, 1, 3, 4, 2, 1, 3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 5, 0, 0, 3, 0, 0, 5, 0, 0, 3, 0, 0]],
  // 全星亮度·现代修正2
  SECS: [[[], []], [[], []], [[0, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8], [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 12, 11, 10]], [[0, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [0, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]], [[0, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5], [0, 6, 5, 4, 3, 2, 1, 12, 11, 10, 9, 8, 7]], [[0, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8], [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 12, 11, 10]], [[0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2], [0, 3, 2, 1, 12, 11, 10, 9, 8, 7, 6, 5, 4]]],
  // 长生十二神/起点(按五行局, 顺逆, 待引擎核)
  LNSQX: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1], [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2], [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3], [0, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4], [0, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5], [0, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6], [0, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7], [0, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8], [0, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [0, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
  // 岁前十二神 LNSQX[神序1..12][地支1..12]→宫(★2026-08-12 二次更正: 本表确实 0 调用,但不等于默认口径不排——默认口径走等价公式 gong[i].lnSQX=13-支+i。已实现→lib/ziwei/shier-shen.ts)
  LNJQX: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7, 4], [0, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5], [0, 3, 12, 9, 6, 3, 12, 9, 6, 3, 12, 9, 6], [0, 4, 1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7], [0, 5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8], [0, 6, 3, 12, 9, 6, 3, 12, 9, 6, 3, 12, 9], [0, 7, 4, 1, 10, 7, 4, 1, 10, 7, 4, 1, 10], [0, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11], [0, 9, 6, 3, 12, 9, 6, 3, 12, 9, 6, 3, 12], [0, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7, 4, 1], [0, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5, 2], [0, 12, 9, 6, 3, 12, 9, 6, 3, 12, 9, 6, 3]],
  // 将前十二神 LNJQX[神序1..12][地支1..12]→宫(实有调用: gong[LNJQX[神序][运限支]].lnJQX=神序。已实现→lib/ziwei/shier-shen.ts)
  ZNDJ: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [0, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [0, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [0, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8], [0, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7], [0, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6], [0, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5], [0, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4], [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3], [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2], [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]],
  // 子年斗君(实有此表, 推翻"默认口径无斗君"旧判断)
  LC: [0, 3, 4, 6, 7, 6, 7, 9, 10, 12, 1],
  // 禄存(生年干) → 羊陀夹禄
  TM: [0, 3, 12, 9, 6, 3, 12, 9, 6, 3, 12, 9, 6],
  // 天马(生年支)
  LIUCHANG: [0, 6, 7, 9, 10, 9, 10, 12, 1, 3, 4],
  // 流昌·运限文昌(★按【该运限的天干】起,非生年干——2026-08-12 追调用点更正: 大限传大限命宫 gong.tg,流年及以下传该期年/月/日/时干; param2 分层 1/2/3/4/5/22。已实现→lib/ziwei/liu-changqu.ts)
  LIUQU: [0, 10, 9, 7, 6, 7, 6, 4, 3, 1, 12],
  // 流曲·运限文曲(★同流昌,与流昌在同一函数内成对安放)
  XIAOXIAN: [0, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5, 2]
  // 小限起宫(生年支,子起一编码;走法见调用点: 男顺女逆一岁一宫。已实现→lib/ziwei/xiaoxian.ts)
};

// src/renhuai/school-data.ts
var SCHOOL_STAR_ID_TO_NAME = {
  // 14 主星（紫微系 6 + 天府系 8）
  1: "\u7D2B\u5FAE",
  2: "\u5929\u673A",
  3: "\u592A\u9633",
  4: "\u6B66\u66F2",
  5: "\u5929\u540C",
  6: "\u5EC9\u8D1E",
  7: "\u5929\u5E9C",
  8: "\u592A\u9634",
  9: "\u8D2A\u72FC",
  10: "\u5DE8\u95E8",
  11: "\u5929\u76F8",
  12: "\u5929\u6881",
  13: "\u4E03\u6740",
  14: "\u7834\u519B",
  // 六吉
  15: "\u6587\u660C",
  16: "\u6587\u66F2",
  17: "\u5DE6\u8F85",
  18: "\u53F3\u5F3C",
  19: "\u5929\u9B41",
  20: "\u5929\u94BA",
  // 禄马 + 六煞
  21: "\u7984\u5B58",
  22: "\u5929\u9A6C",
  23: "\u706B\u661F",
  24: "\u94C3\u661F",
  25: "\u64CE\u7F8A",
  26: "\u9640\u7F57",
  27: "\u5730\u7A7A",
  28: "\u5730\u52AB",
  // 杂曜（2026-06-20 按通行口径整理：行号 = SB 亮度表 ID；落宫仍用 iztro，金标准盘 24/24 验证）
  29: "\u5929\u798F",
  30: "\u5929\u5B98",
  31: "\u5929\u5211",
  32: "\u516B\u5EA7",
  33: "\u4E09\u53F0",
  34: "\u5929\u624D",
  37: "\u5929\u7A7A",
  38: "\u5929\u59DA",
  39: "\u5929\u54ED",
  40: "\u5929\u559C",
  41: "\u5929\u865A",
  42: "\u5929\u8D35",
  43: "\u5929\u5BFF",
  45: "\u5929\u5FB7",
  48: "\u5B64\u8FB0",
  51: "\u7EA2\u9E3E",
  52: "\u6069\u5149",
  53: "\u7834\u788E",
  55: "\u534E\u76D6",
  56: "\u89E3\u795E",
  57: "\u5BE1\u5BBF",
  58: "\u51E4\u9601",
  59: "\u871A\u5EC9",
  60: "\u9F99\u6C60",
  62: "\u5927\u8017",
  64: "\u5929\u4F7F",
  65: "\u5929\u4F24",
  77: "\u622A\u7A7A",
  78: "\u526F\u65EC",
  79: "\u5E74\u89E3",
  80: "\u9634\u715E",
  81: "\u9F99\u5FB7",
  82: "\u54B8\u6C60"
  // ★ 2026-10-20 主流排盘默认口径 5 张金标准盘逐宫反推（会员提供 1 张 + 站长手机 4 张，每颗星 5 格观测、唯一解）：
  //   31天刑、38天姚、40天喜 补收；大耗 46→62（46 整行全零，大耗一直没亮度；62 原被当成月德，月德因此多出亮度）；
  //   解神 50→56（50 整行全零）；月德不收（5 张金标准盘都留白，对应行全零）。副截 / 旬空 借截空 77 / 副旬 78 的行，见 SCHOOL_NAME_ALIAS。
  // ✅ 2026-06-20 午宫高清复核:三台33=旺/天空37=庙/天使64=平 已确认补上(之前 agent 误判午宫无此3颗)。
  // ⚠️ 剔除项(真盘 full diff 对不上,留白比贴错好)：
  //   38天厨(金标准盘午宫留白·38给平=错已删)、64原误标封诰已纠为天使。
  //   （10-20：38 实为天姚，5 张真盘 5/5；天厨金标准盘始终留白、不收。）
  // ★ 2026-08-14：46大耗按金标准盘核实的公式落宫；77截空/副截阴干对调；78副旬随旬空成对。
};
var BRIGHTNESS_NUM_TO_CN = {
  1: "\u5E99",
  2: "\u65FA",
  3: "\u5F97",
  4: "\u5229",
  5: "\u5E73",
  6: "\u4E0D",
  7: "\u9677"
};
var BRIGHTNESS_NUM_TO_CN_5 = {
  1: "\u5E99",
  2: "\u65FA",
  3: "\u5E73",
  4: "\u95F2",
  5: "\u9677"
};
var BRIGHTNESS_NUM_TO_CN_BY_SCHOOL = {
  QS: BRIGHTNESS_NUM_TO_CN,
  XD1: BRIGHTNESS_NUM_TO_CN,
  ZZ: BRIGHTNESS_NUM_TO_CN_5,
  XD2: BRIGHTNESS_NUM_TO_CN_5
};
var SCHOOL_NAME_TO_ID = {};
for (const k in SCHOOL_STAR_ID_TO_NAME) SCHOOL_NAME_TO_ID[SCHOOL_STAR_ID_TO_NAME[Number(k)]] = Number(k);
var SCHOOL_NAME_ALIAS = { \u526F\u622A: 77, \u65EC\u7A7A: 78 };
for (const [n, id] of Object.entries(SCHOOL_NAME_ALIAS)) SCHOOL_NAME_TO_ID[n] = id;
var SB_BY_SCHOOL = {
  QS: SCHOOL_AX.SB_QS,
  XD1: SCHOOL_AX.SB_XD1,
  ZZ: SCHOOL_AX.SB_ZZ,
  XD2: SCHOOL_AX.SB_XD2
};
function schoolStarBrightness(starName, branchIdx, school = "QS") {
  const id = SCHOOL_NAME_TO_ID[starName];
  if (id == null) return void 0;
  const v = SB_BY_SCHOOL[school]?.[id]?.[branchIdx + 1];
  if (v == null || v === 0) return void 0;
  return BRIGHTNESS_NUM_TO_CN_BY_SCHOOL[school][v];
}

// src/renhuai/school-config.ts
var DEFAULT_LEAP_MONTH = "split";

// src/renhuai/algorithm.ts
var DEFAULT_BRIGHTNESS = {
  //            寅     卯     辰     巳     午     未     申     酉     戌     亥     子     丑
  // ── 紫微系六星 ──────────────────────────────────────────
  // 紫微：寅宫 旺→庙（全书：庙于寅午丑未）
  "\u7D2B\u5FAE": ["\u5E99", "\u65FA", "\u5F97", "\u65FA", "\u5E99", "\u5E99", "\u65FA", "\u65FA", "\u5F97", "\u65FA", "\u5E73", "\u5E99"],
  // 天机：辰宫 利→庙、戌宫 利→庙（依「天机庙于子午辰戌」通行庙旺总诀；善本《全书》天机条无逐宫原文，此句系后世总诀转述，非善本直证）
  "\u5929\u673A": ["\u5F97", "\u65FA", "\u5E99", "\u5E73", "\u5E99", "\u9677", "\u5F97", "\u65FA", "\u5E99", "\u5E73", "\u5E99", "\u9677"],
  // 太阳：午宫 旺→庙（全书：庙于卯午）
  "\u592A\u9633": ["\u65FA", "\u5E99", "\u65FA", "\u65FA", "\u5E99", "\u5F97", "\u5F97", "\u9677", "\u4E0D", "\u9677", "\u9677", "\u4E0D"],
  // 武曲：iztro 默认与全书一致 ✓
  // 天同：寅宫 利→旺（全书：旺于子寅申）、午宫 陷→不（全书：不得地于午丑未）
  "\u5929\u540C": ["\u65FA", "\u5E73", "\u5E73", "\u5E99", "\u4E0D", "\u4E0D", "\u65FA", "\u5E73", "\u5E73", "\u5E99", "\u65FA", "\u4E0D"],
  // 廉贞：iztro 默认与全书一致 ✓
  // ── 天府系八星 ──────────────────────────────────────────
  // 天府：辰宫 庙→旺、戌宫 庙→旺（全书：旺于辰戌午酉）
  "\u5929\u5E9C": ["\u5E99", "\u5F97", "\u65FA", "\u5F97", "\u65FA", "\u5E99", "\u5F97", "\u65FA", "\u65FA", "\u5F97", "\u5E99", "\u5E99"],
  // 太阴：寅宫 旺→陷、酉宫 不→旺（全书：庙于亥子丑，旺于酉戌，陷于寅卯辰巳午）★ 重大修正
  // ★ 2026-06-10 doctrine 复核（用户留言「太阳太阴庙旺有误」触发，详见 docs/audits/taiyin-brightness-review.md）：
  //   善本《全书·诸星问答论·太阴》逐字（quanshu-juan1-source.ts）：「以卯辰巳午未为陷地，以酉戌亥子丑为得垣」
  //   → 午宫原值'不'与上行自引出处及善本两源皆抵触，系 05 月校订漏网，校订为'陷'。
  //   存疑保留：未宫善本作陷地、此表沿用'不'（通行庙旺表多不入陷，流派分歧）；寅宫善本未提，沿用 05 月校订'陷'。
  "\u592A\u9634": ["\u9677", "\u9677", "\u9677", "\u9677", "\u9677", "\u4E0D", "\u5229", "\u65FA", "\u65FA", "\u5E99", "\u5E99", "\u5E99"],
  // 贪狼：iztro 原始表为 6 位对称构造（平利庙陷旺庙重复），与古籍差异显著，按通行 XD1 表修正
  // ★ 2026-06-11 复核（二次）：XD1 巳宫=地（表内数值 3），iztro Brightness 无'地'，映射为'平'（同属 normal 区，与金标准盘显示一致）
  "\u8D2A\u72FC": ["\u4E0D", "\u5E73", "\u5F97", "\u5E73", "\u5E73", "\u5E99", "\u4E0D", "\u5E73", "\u5F97", "\u5229", "\u5E73", "\u5E99"],
  // 巨门：iztro 默认与全书一致 ✓（全书各源分歧已复核，iztro 取值合理）
  // 天相：卯宫 陷→平、酉宫 陷→平（依「天相平于卯酉」通行庙旺总诀；善本《全书》天相条无逐宫原文，且通行四派亮度表此处亦全作「平」，故「平」站得住）
  "\u5929\u76F8": ["\u5E99", "\u5E73", "\u5F97", "\u5F97", "\u5E99", "\u5F97", "\u5E99", "\u5E73", "\u5F97", "\u5F97", "\u5E99", "\u5E99"],
  // 天梁：卯宫 庙→得、戌宫 庙→得（全书：得地于卯戌）
  "\u5929\u6881": ["\u5E99", "\u5F97", "\u5E99", "\u9677", "\u5E99", "\u65FA", "\u9677", "\u5F97", "\u5F97", "\u9677", "\u5E99", "\u65FA"],
  // 七杀：酉宫 庙→旺（全书：旺于子午卯酉）
  "\u4E03\u6740": ["\u5E99", "\u65FA", "\u5E99", "\u5E73", "\u65FA", "\u5E99", "\u5E99", "\u65FA", "\u5E99", "\u5E73", "\u65FA", "\u5E99"],
  // 破军：iztro 默认与全书一致 ✓
  // ── 辅星（六吉六煞）────────────────────────────────────
  // 文昌：iztro 默认与全书一致 ✓
  // 文曲：辰宫 得→庙、子宫 得→庙（全书：庙于巳酉丑子辰，共五庙位）
  "\u6587\u66F2": ["\u5E73", "\u65FA", "\u5E99", "\u5E99", "\u9677", "\u65FA", "\u5F97", "\u5E99", "\u9677", "\u65FA", "\u5E99", "\u5E99"],
  // 火星：iztro 默认与全书一致 ✓
  // 铃星：iztro 错误地复制了火星亮度！全书铃星与火星不同 ★ 重大修正
  //   辰申 陷→得、未 利→得、丑 得→陷、亥 利→陷（全书：庙寅午戌，地辰巳未申，陷丑亥子）
  //   酉宫：iztro/主流排盘软件/元亨利贞 均为"得"，从众修正
  "\u94C3\u661F": ["\u5E99", "\u5229", "\u5F97", "\u5F97", "\u5E99", "\u5F97", "\u5F97", "\u5F97", "\u5E99", "\u9677", "\u9677", "\u9677"],
  // 擎羊：酉宫 陷→旺、子宫 陷→旺（全书：庙辰戌丑未，旺酉子，陷卯午）
  "\u64CE\u7F8A": ["", "\u9677", "\u5E99", "", "\u9677", "\u5E99", "", "\u65FA", "\u5E99", "", "\u65FA", "\u5E99"],
  // 陀罗：iztro 默认与全书一致 ✓
  // ── 武曲 / 廉贞 / 巨门 / 破军 ───────────────────────────────
  // 这 4 颗主星 iztro 原生值与《全书》一致，原先未显式覆写（靠 iztro 内置 fallback）。
  // ★ 2026-06-11 补入原生值（探针 scripts 实测，寅起）：使 DEFAULT 表完整含 14 主星，
  //   流派切换后 setBrightnessSchool('default') 才能全量盖回、还原默认。
  "\u6B66\u66F2": ["\u5F97", "\u5229", "\u5E99", "\u5E73", "\u65FA", "\u5E99", "\u5F97", "\u5229", "\u5E99", "\u5E73", "\u65FA", "\u5E99"],
  "\u5EC9\u8D1E": ["\u5E99", "\u5E73", "\u5229", "\u9677", "\u5E73", "\u5229", "\u5E99", "\u5E73", "\u5229", "\u9677", "\u5E73", "\u5229"],
  "\u5DE8\u95E8": ["\u5E99", "\u5E99", "\u9677", "\u65FA", "\u65FA", "\u4E0D", "\u5E99", "\u5E99", "\u9677", "\u65FA", "\u65FA", "\u4E0D"],
  "\u7834\u519B": ["\u5F97", "\u9677", "\u65FA", "\u5E73", "\u5E99", "\u65FA", "\u5F97", "\u9677", "\u65FA", "\u5E73", "\u5E99", "\u65FA"]
};
astro.config({
  yearDivide: "normal",
  brightness: DEFAULT_BRIGHTNESS
});
var currentBrightSchool = "QS";
function resolveEffectiveLunarDate(year, month, day, policy = "prev-month") {
  if (policy !== "split" && policy !== "next-month" && policy !== "prev-month" && policy !== "origin-month") {
    throw new RangeError(
      `leapMonth policy must be one of 'split' | 'next-month' | 'prev-month' | 'origin-month'; received ${String(policy)}`
    );
  }
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const rawLunarMonth = Number(lunar.getMonth());
  const rawLunarDay = Number(lunar.getDay());
  const isRawLeapMonth = rawLunarMonth < 0;
  const absoluteMonth = Math.abs(rawLunarMonth);
  if (!isRawLeapMonth) {
    return {
      lunarYear: Number(lunar.getYear()),
      lunarMonth: absoluteMonth,
      lunarDay: rawLunarDay,
      isLeapMonth: false,
      rawLunarMonth,
      rawLunarDay
    };
  }
  let lunarYear = Number(lunar.getYear());
  let lunarMonth = absoluteMonth;
  let isLeapMonth = false;
  if (policy === "split") {
    if (rawLunarDay > 15) lunarMonth = absoluteMonth + 1;
  } else if (policy === "next-month") {
    lunarMonth = absoluteMonth + 1;
  } else if (policy === "origin-month") {
    isLeapMonth = true;
  }
  if (lunarMonth > 12) {
    lunarMonth = 1;
    lunarYear += 1;
  }
  let lunarDay = rawLunarDay;
  try {
    const monthKey = isLeapMonth ? -lunarMonth : lunarMonth;
    const dayCount = LunarMonth.fromYm(lunarYear, monthKey)?.getDayCount?.();
    if (typeof dayCount === "number" && dayCount > 0 && lunarDay > dayCount) lunarDay = dayCount;
  } catch {
  }
  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    rawLunarMonth,
    rawLunarDay
  };
}
function getLunarInfo(year, month, day, hour, policy = "prev-month") {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const effective = resolveEffectiveLunarDate(year, month, day, policy);
  const lu = lunar;
  const yearStem = STEMS.indexOf(lu.getYearGan());
  const yearBranch = BRANCHES.indexOf(lu.getYearZhi());
  let fourPillars;
  let fourPillarsLunar;
  try {
    const effHour = hour !== void 0 && hour >= 0 && hour <= 11 ? hour * 2 : 0;
    const ec = Solar.fromYmdHms(year, month, day, effHour, 0, 0).getLunar().getEightChar();
    const yearGZ = ec.getYear();
    const monthGZ = ec.getMonth();
    const dayGZ = `${lu.getDayGan()}${lu.getDayZhi()}`;
    const dayStem = STEMS.indexOf(lu.getDayGan());
    const branchIdx = hour !== void 0 && hour >= 0 && hour <= 11 ? hour : 0;
    const timeStemBase = dayStem % 5 * 2;
    const timeStemIdx = (timeStemBase + branchIdx) % 10;
    const timeGZ = `${STEMS[timeStemIdx]}${BRANCHES[branchIdx]}`;
    fourPillars = [yearGZ, monthGZ, dayGZ, timeGZ];
    const absM = effective.lunarMonth;
    const yearGZLunar = `${STEMS[yearStem]}${BRANCHES[yearBranch]}`;
    const monthBranchIdx = (absM + 1) % 12;
    const monthStemBase = (yearStem % 5 * 2 + 2) % 10;
    const monthStemIdx = (monthStemBase + (absM - 1)) % 10;
    const monthGZLunar = `${STEMS[monthStemIdx]}${BRANCHES[monthBranchIdx]}`;
    fourPillarsLunar = [yearGZLunar, monthGZLunar, dayGZ, timeGZ];
  } catch {
  }
  return {
    lunarYear: effective.lunarYear,
    lunarMonth: effective.lunarMonth,
    lunarDay: effective.lunarDay,
    yearStem: yearStem >= 0 ? yearStem : 0,
    yearBranch: yearBranch >= 0 ? yearBranch : 0,
    isLeapMonth: effective.isLeapMonth,
    fourPillars,
    fourPillarsLunar
  };
}
var MING_ZHU_TABLE = {
  0: "\u8D2A\u72FC",
  1: "\u5DE8\u95E8",
  2: "\u7984\u5B58",
  3: "\u6587\u66F2",
  4: "\u5EC9\u8D1E",
  5: "\u6B66\u66F2",
  6: "\u7834\u519B",
  7: "\u6B66\u66F2",
  8: "\u5EC9\u8D1E",
  9: "\u6587\u66F2",
  10: "\u7984\u5B58",
  11: "\u5DE8\u95E8"
};
var SHEN_ZHU_TABLE = {
  0: "\u706B\u661F",
  6: "\u706B\u661F",
  1: "\u5929\u76F8",
  7: "\u5929\u76F8",
  2: "\u5929\u6881",
  8: "\u5929\u6881",
  3: "\u5929\u540C",
  9: "\u5929\u540C",
  4: "\u6587\u660C",
  10: "\u6587\u660C",
  5: "\u5929\u673A",
  11: "\u5929\u673A"
};
function calcMingZhu(branch) {
  return MING_ZHU_TABLE[branch] ?? "";
}
function calcShenZhu(branch) {
  return SHEN_ZHU_TABLE[branch] ?? "";
}
function calcYinYangGender(yearStem, gender) {
  return `${yearStem % 2 === 0 ? "\u9633" : "\u9634"}${gender === "male" ? "\u7537" : "\u5973"}`;
}
function mapBrightness(b) {
  if (!b) return "normal";
  if (b === "\u5E99" || b === "\u65FA") return "bright";
  if (b === "\u9677" || b === "\u4E0D" || b === "\u95F2") return "dim";
  return "normal";
}
function extractRawBrightness(b) {
  if (!b) return void 0;
  const valid = ["\u5E99", "\u65FA", "\u5F97", "\u5229", "\u5E73", "\u4E0D", "\u95F2", "\u9677", "\u5730"];
  for (const x of valid) {
    if (b.includes(x)) return x;
  }
  return void 0;
}
var SHA_STARS = /* @__PURE__ */ new Set([
  "\u64CE\u7F8A",
  "\u9640\u7F57",
  "\u706B\u661F",
  "\u94C3\u661F",
  "\u5730\u7A7A",
  "\u5730\u52AB",
  "\u5929\u7A7A",
  "\u65EC\u7A7A",
  "\u526F\u65EC",
  "\u622A\u8DEF",
  "\u622A\u7A7A",
  "\u526F\u622A",
  "\u5927\u8017",
  "\u5929\u4F7F",
  "\u5929\u4F24",
  // ★ 扩充（之前只判主煞，半凶杂耀漏判）
  "\u5929\u5211",
  "\u5929\u54ED",
  "\u5929\u865A",
  "\u5929\u6708",
  "\u9634\u715E",
  "\u871A\u5EC9",
  "\u7A7A\u4EA1",
  "\u5B64\u8FB0",
  "\u5BE1\u5BBF"
]);
var LUCKY_STARS = /* @__PURE__ */ new Set([
  "\u6587\u660C",
  "\u6587\u66F2",
  "\u5DE6\u8F85",
  "\u53F3\u5F3C",
  "\u5929\u9B41",
  "\u5929\u94BA",
  "\u7984\u5B58",
  "\u5929\u9A6C",
  "\u5929\u5B98",
  "\u5929\u798F",
  "\u5929\u624D",
  "\u5929\u5BFF",
  "\u4E09\u53F0",
  "\u516B\u5EA7",
  "\u6069\u5149",
  "\u5929\u8D35",
  "\u53F0\u8F85",
  "\u9F99\u6C60",
  "\u51E4\u9601",
  "\u7EA2\u9E3E",
  "\u5929\u559C",
  // ★ 扩充：吉杂耀
  "\u89E3\u795E",
  "\u5929\u5FB7",
  "\u6708\u5FB7",
  "\u5E74\u89E3",
  "\u5929\u5DEB",
  "\u534E\u76D6",
  "\u5C01\u8BF0"
]);
function mapStarType(starName, iztroType) {
  if (SHA_STARS.has(starName)) return "sha";
  if (LUCKY_STARS.has(starName)) return "lucky";
  const t = (iztroType ?? "").toLowerCase();
  if (t === "\u4E3B\u661F" || t === "major") return "major";
  if (t === "\u715E\u661F" || t === "tough") return "sha";
  if (t === "\u5409\u661F" || t === "soft" || t === "\u7984\u5B58" || t === "\u5929\u9A6C") return "lucky";
  return "minor";
}
function parseWuxingJu(name) {
  if (name.includes("\u4E8C")) return 2;
  if (name.includes("\u4E09")) return 3;
  if (name.includes("\u56DB")) return 4;
  if (name.includes("\u4E94")) return 5;
  if (name.includes("\u516D")) return 6;
  return 3;
}
function relocateStar(palaces, name, targetBranch) {
  let moved;
  for (const p of palaces) {
    const i = p.stars.findIndex((s) => s.name === name);
    if (i >= 0) {
      if (p.branch === targetBranch) return;
      moved = p.stars[i];
      p.stars.splice(i, 1);
      break;
    }
  }
  if (!moved) return;
  const target = palaces.find((p) => p.branch === targetBranch);
  if (target) {
    target.stars.push(moved);
    const rb = schoolStarBrightness(moved.name, targetBranch, currentBrightSchool);
    moved.brightnessRaw = extractRawBrightness(rb);
    moved.brightness = rb ? mapBrightness(rb) : void 0;
  }
}
function applySchoolKuiyue(palaces, yearStemCn) {
  const gan = STEMS.indexOf(yearStemCn);
  if (gan < 0) return;
  const row = SCHOOL_AX.KY_ARR1[gan + 1];
  if (!row) return;
  relocateStar(palaces, "\u5929\u9B41", row[0] - 1);
  relocateStar(palaces, "\u5929\u94BA", row[1] - 1);
}
function schoolDahaoBranch(yearBranch) {
  const suiPo = (yearBranch + 6) % 12;
  return yearBranch % 2 === 0 ? (suiPo + 1) % 12 : (suiPo + 11) % 12;
}
function pushNatalStar(palaces, branch, name) {
  const target = palaces.find((p) => p.branch === branch);
  if (!target || target.stars.some((s) => s.name === name)) return;
  const rb = schoolStarBrightness(name, branch, currentBrightSchool);
  target.stars.push({
    name,
    type: mapStarType(name, ""),
    brightness: rb ? mapBrightness(rb) : void 0,
    brightnessRaw: extractRawBrightness(rb)
  });
}
function applySchoolDahao(palaces, yearBranch) {
  pushNatalStar(palaces, schoolDahaoBranch(yearBranch), "\u5927\u8017");
}
function applySchoolJiekong(palaces, yearStem) {
  for (const p of palaces) {
    for (const s of p.stars) {
      if (s.name === "\u622A\u8DEF") s.name = "\u622A\u7A7A";
      else if (s.name === "\u7A7A\u4EA1") s.name = "\u526F\u622A";
      else continue;
      const rb = schoolStarBrightness(s.name, p.branch, currentBrightSchool);
      s.brightness = rb ? mapBrightness(rb) : void 0;
      s.brightnessRaw = extractRawBrightness(rb);
    }
  }
  if (yearStem % 2 === 0) return;
  const jie = palaces.find((p) => p.stars.some((s) => s.name === "\u622A\u7A7A"));
  const fu = palaces.find((p) => p.stars.some((s) => s.name === "\u526F\u622A"));
  if (!jie || !fu || jie === fu) return;
  const jieStar = jie.stars.find((s) => s.name === "\u622A\u7A7A");
  const fuStar = fu.stars.find((s) => s.name === "\u526F\u622A");
  if (!jieStar || !fuStar) return;
  jie.stars = jie.stars.filter((s) => s !== jieStar);
  fu.stars = fu.stars.filter((s) => s !== fuStar);
  const rbJ = schoolStarBrightness("\u622A\u7A7A", fu.branch, currentBrightSchool);
  const rbF = schoolStarBrightness("\u526F\u622A", jie.branch, currentBrightSchool);
  jieStar.brightness = rbJ ? mapBrightness(rbJ) : void 0;
  jieStar.brightnessRaw = extractRawBrightness(rbJ);
  fuStar.brightness = rbF ? mapBrightness(rbF) : void 0;
  fuStar.brightnessRaw = extractRawBrightness(rbF);
  fu.stars.push(jieStar);
  jie.stars.push(fuStar);
}
function applySchoolFuxun(palaces) {
  const xun = palaces.find((p) => p.stars.some((s) => s.name === "\u65EC\u7A7A"));
  if (!xun) return;
  const fu = xun.branch % 2 === 0 ? (xun.branch + 1) % 12 : (xun.branch + 11) % 12;
  pushNatalStar(palaces, fu, "\u526F\u65EC");
}
function generateChart(birthInfo, opts) {
  const { year, month, day, hour, gender } = birthInfo;
  if (!Number.isInteger(hour) || hour < 0 || hour > 11) {
    throw new RangeError(`hour must be an integer branch index from 0 to 11; received ${hour}`);
  }
  if (gender !== "male" && gender !== "female") {
    throw new RangeError(`gender must be 'male' or 'female'; received ${String(gender)}`);
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new RangeError(`solar date does not exist: ${year}-${month}-${day}`);
  }
  const iztroGender = gender === "male" ? "\u7537" : "\u5973";
  const leapMode = opts?.leapMonth ?? DEFAULT_LEAP_MONTH;
  const effectiveLunar = resolveEffectiveLunarDate(year, month, day, leapMode);
  let astrolabe;
  if (leapMode !== "split" && effectiveLunar.rawLunarMonth < 0) {
    const lunarDateStr = `${effectiveLunar.lunarYear}-${effectiveLunar.lunarMonth}-${effectiveLunar.lunarDay}`;
    astrolabe = astro.byLunar(
      lunarDateStr,
      hour,
      iztroGender,
      effectiveLunar.isLeapMonth,
      false,
      "zh-CN"
    );
  } else if (opts?.astroType && opts.astroType !== "heaven") {
    astrolabe = astro.withOptions({
      dateStr: `${year}-${month}-${day}`,
      timeIndex: hour,
      gender: iztroGender,
      fixLeap: true,
      language: "zh-CN",
      astroType: opts.astroType
    });
  } else {
    astrolabe = astro.bySolar(`${year}-${month}-${day}`, hour, iztroGender, true, "zh-CN");
  }
  const chartBirthInfo = {
    ...birthInfo,
    leapMonthPolicy: leapMode
  };
  const palaces = astrolabe.palaces.map((p) => {
    const branch = BRANCHES.indexOf(p.earthlyBranch);
    const stem = STEMS.indexOf(p.heavenlyStem);
    const allStars = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.majorStars ?? []).map((s) => {
        const rb = schoolStarBrightness(s.name, branch, currentBrightSchool);
        return {
          name: s.name,
          type: "major",
          brightness: rb ? mapBrightness(rb) : void 0,
          brightnessRaw: extractRawBrightness(rb),
          siHua: s.mutagen
        };
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.minorStars ?? []).map((s) => {
        const rb = schoolStarBrightness(s.name, branch, currentBrightSchool);
        return {
          name: s.name,
          type: mapStarType(s.name, s.type),
          brightness: rb ? mapBrightness(rb) : void 0,
          brightnessRaw: extractRawBrightness(rb),
          siHua: s.mutagen
        };
      }),
      // ★ 之前 adjectiveStars 全部强制 type='minor'，绕过了 mapStarType，
      //   导致红鸾/天喜（lucky）、天刑/天哭（sha）等被错分类。改成走映射函数，
      //   让所有星正确按性质分到 lucky / sha / minor 三类，UI 也能正常分区显示
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.adjectiveStars ?? []).map((s) => {
        const rb = schoolStarBrightness(s.name, branch, currentBrightSchool);
        return {
          name: s.name,
          type: mapStarType(s.name, s.type ?? ""),
          brightness: rb ? mapBrightness(rb) : void 0,
          brightnessRaw: extractRawBrightness(rb),
          siHua: s.mutagen
        };
      })
    ];
    for (const sname of [p.suiqian12, p.jiangqian12]) {
      if (sname === "\u52AB\u715E" || sname === "\u9F99\u5FB7") {
        allStars.push({ name: sname, type: mapStarType(sname, "") });
      }
    }
    const range = p.decadal?.range;
    return {
      branch: branch >= 0 ? branch : 0,
      stem: stem >= 0 ? stem : 0,
      name: p.name,
      stars: allStars,
      daXianAge: range ? [range[0], range[1]] : void 0,
      isMingGong: p.name === "\u547D\u5BAB",
      isShenGong: p.isBodyPalace ?? false,
      isCurrentDaXian: false
    };
  });
  const yearStemCn = astrolabe.rawDates?.chineseDate?.yearly?.[0];
  if (yearStemCn) applySchoolKuiyue(palaces, yearStemCn);
  let currentAge;
  try {
    const horo = astrolabe.horoscope();
    currentAge = horo.age.nominalAge;
  } catch {
    currentAge = (/* @__PURE__ */ new Date()).getFullYear() - year + 1;
  }
  palaces.forEach((p) => {
    if (p.daXianAge && currentAge >= p.daXianAge[0] && currentAge <= p.daXianAge[1]) {
      p.isCurrentDaXian = true;
    }
  });
  palaces.forEach((p) => {
    p.oppositeBranch = (p.branch + 6) % 12;
    const mainStars = p.stars.filter((s) => s.type === "major");
    p.isEmpty = mainStars.length === 0;
    if (p.isEmpty) {
      const oppPalace = palaces.find((q) => q.branch === p.oppositeBranch);
      if (oppPalace) {
        p.borrowedFromBranch = oppPalace.branch;
        p.borrowedFromName = oppPalace.name;
        p.borrowedStars = oppPalace.stars.filter((s) => s.type === "major").map((s) => s.name);
      }
    }
  });
  const mingGongBranch = BRANCHES.indexOf(astrolabe.earthlyBranchOfSoulPalace);
  const shenGongBranch = BRANCHES.indexOf(astrolabe.earthlyBranchOfBodyPalace);
  const wuxingJuName = astrolabe.fiveElementsClass;
  const wuxingJu = parseWuxingJu(wuxingJuName);
  const ziweiPalace = palaces.find((p) => p.stars.some((s) => s.name === "\u7D2B\u5FAE" && s.type === "major"));
  const ziweiPos = ziweiPalace?.branch ?? 0;
  const daXians = palaces.filter((p) => p.daXianAge).sort((a, b) => a.daXianAge[0] - b.daXianAge[0]).map((p) => ({
    startAge: p.daXianAge[0],
    endAge: p.daXianAge[1],
    palaceBranch: p.branch,
    palaceName: p.name
  }));
  const currentDaXianIndex = daXians.findIndex(
    (dx) => currentAge >= dx.startAge && currentAge <= dx.endAge
  );
  const lunarInfo = getLunarInfo(year, month, day, hour, leapMode);
  applySchoolJiekong(palaces, lunarInfo.yearStem);
  applySchoolDahao(palaces, lunarInfo.yearBranch);
  applySchoolFuxun(palaces);
  const mingZhu = calcMingZhu(mingGongBranch >= 0 ? mingGongBranch : 0);
  const shenZhu = calcShenZhu(lunarInfo.yearBranch);
  const yinYangGender = calcYinYangGender(lunarInfo.yearStem, gender);
  return {
    birthInfo: chartBirthInfo,
    lunarInfo,
    mingGongBranch: mingGongBranch >= 0 ? mingGongBranch : 0,
    shenGongBranch: shenGongBranch >= 0 ? shenGongBranch : 0,
    wuxingJu,
    wuxingJuName,
    ziweiPos,
    palaces,
    daXians,
    currentAge,
    currentDaXianIndex,
    mingZhu,
    shenZhu,
    yinYangGender
  };
}

// src/renhuai/patterns.ts
var SHA_NAMES = ["\u64CE\u7F8A", "\u9640\u7F57", "\u706B\u661F", "\u94C3\u661F", "\u5730\u7A7A", "\u5730\u52AB"];
var SHA_HARD = ["\u64CE\u7F8A", "\u9640\u7F57", "\u706B\u661F", "\u94C3\u661F"];
var SHA_KONG = ["\u5730\u7A7A", "\u5730\u52AB"];
function getMajorStarNames(palace) {
  return palace.stars.filter((s) => s.type === "major").map((s) => s.name);
}
function findStar(palace, name) {
  return palace.stars.find((s) => s.name === name);
}
function hasStar(palace, name) {
  return palace.stars.some((s) => s.name === name);
}
function findStarPalace(chart, name) {
  return chart.palaces.find((p) => p.stars.some((s) => s.name === name));
}
function getPalaceByBranch(chart, branch) {
  return chart.palaces.find((p) => p.branch === (branch % 12 + 12) % 12);
}
function shaCountInPalace(palace, list = SHA_HARD) {
  return palace.stars.filter((s) => list.includes(s.name)).length;
}
function hasShaInPalace(palace, list = SHA_NAMES) {
  return palace.stars.some((s) => list.includes(s.name));
}
function getSanFangPalaces(chart) {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.filter((p) => branches.includes(p.branch));
}
function isInSanFang(chart, branch) {
  const m = chart.mingGongBranch;
  return [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12].includes(branch);
}
function getDuiGong(chart, branch) {
  return getPalaceByBranch(chart, (branch + 6) % 12);
}
function getJiaPalaces(chart, branch) {
  return {
    prev: getPalaceByBranch(chart, (branch + 11) % 12),
    next: getPalaceByBranch(chart, (branch + 1) % 12)
  };
}
function sanFangAllStars(chart) {
  return new Set(getSanFangPalaces(chart).flatMap((p) => p.stars.map((s) => s.name)));
}
function sanFangShaCount(chart, list = SHA_HARD) {
  return getSanFangPalaces(chart).reduce((sum, p) => sum + shaCountInPalace(p, list), 0);
}
function isBright(palace, starName) {
  const s = findStar(palace, starName);
  return s?.brightness === "bright";
}
function isDim(palace, starName) {
  const s = findStar(palace, starName);
  return s?.brightness === "dim";
}
function getStarSiHua(palace, starName) {
  return findStar(palace, starName)?.siHua;
}
function palaceHasSiHua(palace, hua) {
  return palace.stars.some((s) => s.siHua === hua);
}
function sanFangHasSiHua(chart, hua) {
  return getSanFangPalaces(chart).some((p) => palaceHasSiHua(p, hua));
}
var BRANCH_NAMES = ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"];
function detectJunChenQingHui(chart, ming, patterns) {
  if (!hasStar(ming, "\u7D2B\u5FAE")) return;
  const sanFangSet = sanFangAllStars(chart);
  const hasZuo = sanFangSet.has("\u5DE6\u8F85");
  const hasYou = sanFangSet.has("\u53F3\u5F3C");
  if (!hasZuo || !hasYou) return;
  const required = ["\u7D2B\u5FAE\u5165\u547D", "\u5DE6\u8F85\u53F3\u5F3C\u540C\u4F1A\u4E09\u65B9\u56DB\u6B63"];
  const bonus = [];
  const breaking = [];
  if (sanFangSet.has("\u6587\u660C") || sanFangSet.has("\u6587\u66F2")) bonus.push("\u518D\u4F1A\u6587\u660C\u6216\u6587\u66F2");
  if (sanFangSet.has("\u5929\u9B41") || sanFangSet.has("\u5929\u94BA")) bonus.push("\u9B41\u94BA\u8D35\u4EBA\u52A0\u7167");
  if (getStarSiHua(ming, "\u7D2B\u5FAE") === "\u6743") bonus.push("\u7D2B\u5FAE\u5316\u6743");
  if (sanFangShaCount(chart, SHA_KONG) >= 2) breaking.push("\u5730\u7A7A\u5730\u52AB\u53CC\u5939\u4F1A\u7167\uFF08\u7D2B\u5FAE\u5FCC\u7A7A\u52AB\uFF09");
  patterns.push({
    name: "\u541B\u81E3\u5E86\u4F1A",
    level: breaking.length ? "good" : "excellent",
    description: "\u7D2B\u5FAE\u5165\u547D\uFF0C\u5DE6\u8F85\u53F3\u5F3C\u540C\u4F1A\uFF0C\u5E1D\u738B\u5F97\u8D24\u81E3\u8F85\u4F50\uFF0C\u4E3B\u5927\u5BCC\u5927\u8D35\u3001\u7EDF\u5FA1\u4E4B\u547D\u3002\u4E00\u751F\u8D35\u4EBA\u4E0D\u7EDD\uFF0C\u5B9C\u8D70\u653F\u5546\u9AD8\u4F4D\u3001\u8DE8\u754C\u9886\u8896\u4E4B\u9014\u3002",
    palaces: ["\u547D\u5BAB"],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u541B\u81E3\u5E86\u4F1A\u683C\u300B"
  });
}
function detectZiFu(chart, ming, patterns) {
  const ziwei = findStarPalace(chart, "\u7D2B\u5FAE");
  const tianfu = findStarPalace(chart, "\u5929\u5E9C");
  if (!ziwei || !tianfu || ziwei.branch !== tianfu.branch) return;
  const inMing = ziwei.branch === chart.mingGongBranch;
  const required = inMing ? ["\u7D2B\u5FAE\u5929\u5E9C\u540C\u5165\u547D\u5BAB"] : ["\u7D2B\u5FAE\u5929\u5E9C\u540C\u5BAB\uFF08\u4E0D\u5728\u547D\u5BAB\uFF0C\u4F1A\u7167\u51CF\u529B\uFF09"];
  const bonus = [];
  const breaking = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has("\u5DE6\u8F85") && sanFangSet.has("\u53F3\u5F3C")) bonus.push("\u5DE6\u8F85\u53F3\u5F3C\u540C\u4F1A");
  if (sanFangSet.has("\u6587\u660C") || sanFangSet.has("\u6587\u66F2")) bonus.push("\u518D\u4F1A\u660C\u66F2");
  if (hasShaInPalace(ziwei, SHA_KONG)) breaking.push("\u7D2B\u5E9C\u5BAB\u5750\u7A7A\u52AB\uFF08\u7834\u7D2B\u5E9C\u4E4B\u8D35\u6C14\uFF09");
  if (shaCountInPalace(ziwei, SHA_HARD) >= 2) breaking.push("\u7D2B\u5E9C\u5BAB\u89C1\u53CC\u715E\u540C\u5750");
  patterns.push({
    name: "\u7D2B\u5E9C\u540C\u5BAB",
    level: inMing && !breaking.length ? "excellent" : "good",
    description: inMing ? "\u7D2B\u5FAE\u5929\u5E9C\u540C\u5165\u547D\u5BAB\uFF0C\u5E1D\u76F8\u5E76\u4E34\uFF0C\u5C0A\u8D35\u4E4B\u547D\u3002\u4E3B\u54C1\u884C\u7AEF\u6B63\u3001\u8863\u98DF\u65E0\u5FE7\u3001\u6709\u9886\u5BFC\u624D\u80FD\uFF0C\u5B9C\u62C5\u4EFB\u8981\u804C\u3002\u9700\u8981\u5DE6\u53F3\u8F85\u5F3C\u6765\u914D\u5408\u65B9\u4E3A\u5B8C\u6574\u5927\u683C\u3002" : "\u7D2B\u5FAE\u5929\u5E9C\u540C\u5BAB\u4F46\u672A\u5750\u547D\uFF0C\u4E3B\u4E00\u751F\u6709\u8D35\u4EBA\u8D35\u6C14\u4F9D\u6258\uFF0C\u4F46\u672C\u8EAB\u4E0D\u4E00\u5B9A\u5927\u5BCC\u8D35\uFF0C\u9700\u770B\u4F1A\u7167\u5409\u715E\u800C\u5B9A\u3002",
    palaces: [ziwei.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u7D2B\u5E9C\u540C\u5BAB\u683C\u300B"
  });
}
function detectFuXiangChaoYuan(chart, ming, patterns) {
  const tianfu = findStarPalace(chart, "\u5929\u5E9C");
  const tianxiang = findStarPalace(chart, "\u5929\u76F8");
  if (!tianfu || !tianxiang) return;
  if (!isInSanFang(chart, tianfu.branch) || !isInSanFang(chart, tianxiang.branch)) return;
  if (tianfu.branch === chart.mingGongBranch && tianxiang.branch === chart.mingGongBranch) return;
  if (tianfu.branch === tianxiang.branch) return;
  const required = ["\u5929\u5E9C\u5750\u547D\u4E09\u65B9", "\u5929\u76F8\u5750\u547D\u4E09\u65B9", "\u4E24\u661F\u4E0D\u540C\u5BAB"];
  const bonus = [];
  const breaking = [];
  if (hasStar(ming, "\u7984\u5B58") || palaceHasSiHua(ming, "\u7984")) bonus.push("\u547D\u5BAB\u89C1\u7984");
  if (sanFangAllStars(chart).has("\u5DE6\u8F85")) bonus.push("\u518D\u4F1A\u5DE6\u8F85");
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push("\u547D\u5BAB\u5750\u715E\u661F");
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push("\u4E09\u65B9\u56DB\u6B63\u715E\u661F\u8FC7\u591A");
  patterns.push({
    name: "\u5E9C\u76F8\u671D\u57A3",
    level: breaking.length ? "good" : "excellent",
    description: '\u5929\u5E9C\u5929\u76F8\u5206\u5B88\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63\uFF0C\u6587\u6B66\u5E76\u6D4E\u3001\u6743\u5370\u53CC\u8F89\uFF0C\u4E3B\u4E00\u751F\u8863\u98DF\u4E30\u8DB3\u3001\u5730\u4F4D\u5D07\u9AD8\u3002\u53E4\u4E66\u4E91"\u5E9C\u76F8\u671D\u57A3\u5343\u949F\u98DF\u7984"\uFF0C\u5E38\u89C1\u4E8E\u653F\u754C\u3001\u4F01\u4E1A\u7BA1\u7406\u8005\u3002',
    palaces: [tianfu.name, tianxiang.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u5E9C\u76F8\u671D\u57A3\u683C\u300B"
  });
}
function detectYangLiangChangLu(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has("\u592A\u9633") || !sanFangSet.has("\u5929\u6881") || !sanFangSet.has("\u6587\u660C") || !sanFangSet.has("\u7984\u5B58")) return;
  const sun = findStarPalace(chart, "\u592A\u9633");
  const liang = findStarPalace(chart, "\u5929\u6881");
  const required = [
    "\u592A\u9633\u4F1A\u547D\u5BAB\u4E09\u65B9",
    "\u5929\u6881\u4F1A\u547D\u5BAB\u4E09\u65B9",
    "\u6587\u660C\u4F1A\u547D\u5BAB\u4E09\u65B9",
    "\u7984\u5B58\u4F1A\u547D\u5BAB\u4E09\u65B9"
  ];
  const bonus = [];
  const breaking = [];
  if (isBright(sun, "\u592A\u9633")) bonus.push("\u592A\u9633\u5E99\u65FA");
  if (isBright(liang, "\u5929\u6881")) bonus.push("\u5929\u6881\u5E99\u65FA");
  if (sanFangHasSiHua(chart, "\u79D1")) bonus.push("\u518D\u4F1A\u5316\u79D1");
  if (isDim(sun, "\u592A\u9633")) breaking.push("\u592A\u9633\u843D\u9677\uFF08\u9633\u6881\u5931\u8F89\uFF09");
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push("\u4E09\u65B9\u715E\u91CD");
  patterns.push({
    name: "\u9633\u6881\u660C\u7984",
    level: breaking.length ? "good" : "excellent",
    description: '\u592A\u9633\u3001\u5929\u6881\u3001\u6587\u660C\u3001\u7984\u5B58\u56DB\u661F\u9F50\u4F1A\u547D\u5BAB\u4E09\u65B9\uFF0C\u53F7\u79F0"\u79D1\u4E3E\u4E4B\u661F"\uFF0C\u4E3B\u6E05\u8D35\u663E\u8FBE\u3001\u8003\u8FD0\u6781\u4F73\uFF0C\u5B9C\u8D70\u5B66\u672F\u3001\u6587\u6559\u3001\u7814\u7A76\u3001\u4E13\u4E1A\u8BA4\u8BC1\u4E4B\u8DEF\uFF0C\u4E00\u751F\u529F\u540D\u6613\u5C31\u3002',
    palaces: [sun.name, liang.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u9633\u6881\u660C\u7984\u683C\u300B"
  });
}
function detectHuoTanLingTan(chart, ming, patterns) {
  const tan = findStarPalace(chart, "\u8D2A\u72FC");
  if (!tan) return;
  const huo = findStarPalace(chart, "\u706B\u661F");
  const ling = findStarPalace(chart, "\u94C3\u661F");
  for (const [shaName, shaPalace] of [["\u706B\u661F", huo], ["\u94C3\u661F", ling]]) {
    if (!shaPalace) continue;
    const sameOrTrine = tan.branch === shaPalace.branch || (tan.branch + 4) % 12 === shaPalace.branch || (tan.branch + 8) % 12 === shaPalace.branch || (tan.branch + 6) % 12 === shaPalace.branch;
    if (!sameOrTrine) continue;
    if (!isInSanFang(chart, tan.branch)) continue;
    const required = [`\u8D2A\u72FC${tan.branch === shaPalace.branch ? "\u540C\u5BAB" : "\u4F1A\u7167"}${shaName}`, "\u8D2A\u72FC\u4F1A\u7167\u547D\u5BAB\u4E09\u65B9"];
    const bonus = [];
    const breaking = [];
    if (isBright(tan, "\u8D2A\u72FC")) bonus.push("\u8D2A\u72FC\u5E99\u65FA");
    if (getStarSiHua(tan, "\u8D2A\u72FC") === "\u7984" || getStarSiHua(tan, "\u8D2A\u72FC") === "\u6743") bonus.push("\u8D2A\u72FC\u5316\u7984/\u5316\u6743");
    if (hasShaInPalace(tan, ["\u64CE\u7F8A", "\u9640\u7F57"])) breaking.push("\u8D2A\u72FC\u5BAB\u53C8\u89C1\u7F8A\u9640\uFF08\u7834\u6A2A\u53D1\u4E4B\u529B\uFF09");
    if (hasShaInPalace(tan, SHA_KONG)) breaking.push("\u8D2A\u72FC\u9047\u7A7A\u52AB\uFF08\u8D22\u6765\u8D22\u53BB\uFF09");
    patterns.push({
      name: shaName === "\u706B\u661F" ? "\u706B\u8D2A\u683C" : "\u94C3\u8D2A\u683C",
      level: breaking.length ? "good" : "excellent",
      description: `\u8D2A\u72FC\u9047${shaName}${tan.branch === shaPalace.branch ? "\u540C\u5BAB" : "\u4E09\u65B9\u4F1A\u7167"}\uFF0C\u4E3B\u7A81\u53D1\u6A2A\u8D22\u3001\u7A81\u5982\u5176\u6765\u7684\u673A\u9047\u3002\u53E4\u4E66\u4E91\u201C\u8D2A\u72FC\u9047\u706B\u94C3\uFF0C\u5FC5\u53D1\u6A2A\u8D22\u201D\uFF0C\u4F46\u6765\u5F97\u5FEB\u53BB\u5F97\u4E5F\u5FEB\uFF0C\u5B9C\u89C1\u597D\u5C31\u6536\u3002${breaking.length ? "\u672C\u76D8\u7834\u683C\u6761\u4EF6\u5DF2\u89E6\u53D1\uFF0C\u53D1\u529B\u6253\u6298\u3002" : ""}`,
      palaces: [tan.name, shaPalace.name],
      conditions: { required, bonus, breaking },
      source: "\u300A\u7D2B\u5FAE\u6597\u6570\u9AA8\u9AD3\u8D4B\u300B"
    });
  }
}
function detectWuTan(chart, ming, patterns) {
  const wu = findStarPalace(chart, "\u6B66\u66F2");
  const tan = findStarPalace(chart, "\u8D2A\u72FC");
  if (!wu || !tan) return;
  const sameOrOppose = wu.branch === tan.branch || (wu.branch + 6) % 12 === tan.branch;
  if (!sameOrOppose) return;
  if (!isInSanFang(chart, wu.branch) && !isInSanFang(chart, tan.branch)) return;
  const required = [
    wu.branch === tan.branch ? "\u6B66\u66F2\u8D2A\u72FC\u540C\u5BAB\uFF08\u4E11/\u672A\uFF09" : "\u6B66\u66F2\u8D2A\u72FC\u5BF9\u5BAB\u62F1\u7167",
    "\u4F1A\u7167\u547D\u5BAB\u4E09\u65B9"
  ];
  const bonus = [];
  const breaking = [];
  if (sanFangAllStars(chart).has("\u706B\u661F") || sanFangAllStars(chart).has("\u94C3\u661F"))
    bonus.push("\u518D\u9047\u706B\u661F/\u94C3\u661F\uFF08\u706B\u8D2A/\u94C3\u8D2A\u53E0\u52A0\uFF09");
  if (getStarSiHua(wu, "\u6B66\u66F2") === "\u7984") bonus.push("\u6B66\u66F2\u5316\u7984");
  if (hasShaInPalace(wu, ["\u64CE\u7F8A", "\u9640\u7F57"])) breaking.push("\u6B66\u8D2A\u5BAB\u89C1\u7F8A\u9640");
  if (hasShaInPalace(wu, SHA_KONG)) breaking.push("\u6B66\u8D2A\u5BAB\u9047\u7A7A\u52AB");
  patterns.push({
    name: "\u6B66\u8D2A\u683C",
    level: breaking.length ? "good" : "excellent",
    description: '\u6B66\u66F2\u8D2A\u72FC\u4F1A\u547D\uFF0C\u8D22\u661F\u4E0E\u6843\u82B1\u6B32\u671B\u661F\u4EA4\u8F89\uFF0C\u53E4\u4E66\u4E91"\u6B66\u8D2A\u4E0D\u53D1\u5C11\u5E74\u4EBA"\u2014\u2014\u4E09\u5341\u5C81\u540E\u65B9\u80FD\u539A\u79EF\u8584\u53D1\u3002\u4E3B\u4E2D\u5E74\u4EE5\u540E\u5927\u5BCC\u5927\u8D35\uFF0C\u8D22\u6E90\u7531\u4EBA\u8109\u3001\u5E94\u916C\u3001\u6B32\u671B\u7BA1\u7406\u800C\u6765\uFF0C\u9002\u5408\u91D1\u878D\u3001\u6295\u673A\u3001\u9500\u552E\u3001\u5A31\u4E50\u4E1A\u3002',
    palaces: [wu.name, tan.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u9AA8\u9AD3\u8D4B\u300B"
  });
}
function detectShaPoLang(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ["\u4E03\u6740", "\u7834\u519B", "\u8D2A\u72FC"].filter((s) => sanFangSet.has(s));
  if (has.length < 3) return;
  const required = ["\u4E03\u6740\u3001\u7834\u519B\u3001\u8D2A\u72FC\u4E09\u661F\u9F50\u5165\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63"];
  const bonus = [];
  const breaking = [];
  if (sanFangHasSiHua(chart, "\u7984") || sanFangHasSiHua(chart, "\u6743")) bonus.push("\u4E09\u65B9\u6709\u5316\u7984\u6216\u5316\u6743\uFF08\u52A8\u5F97\u6709\u529B\uFF09");
  if (sanFangSet.has("\u5DE6\u8F85") && sanFangSet.has("\u53F3\u5F3C")) bonus.push("\u8F85\u5F3C\u540C\u4F1A\uFF08\u53D8\u52A8\u4E2D\u5F97\u8D35\u4EBA\uFF09");
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push("\u715E\u661F\u8FC7\u91CD\uFF08\u52A8\u800C\u65E0\u6210\uFF09");
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push("\u547D\u5750\u7A7A\u52AB\uFF08\u52A8\u5F97\u8F9B\u82E6\uFF09");
  patterns.push({
    name: "\u6740\u7834\u72FC",
    level: breaking.length ? "caution" : "good",
    description: "\u4E03\u6740\u3001\u7834\u519B\u3001\u8D2A\u72FC\u4E09\u661F\u4F1A\u547D\uFF0C\u5F00\u521B\u95EF\u8361\u4E4B\u547D\u683C\u3002\u4E00\u751F\u53D8\u52A8\u591A\u3001\u4E0D\u7518\u5E73\u51E1\uFF0C\u5B9C\u521B\u4E1A\u3001\u519B\u8B66\u3001\u4E1A\u52A1\u3001\u9500\u552E\u3002\u4E2D\u5E74\u540E\u624D\u80FD\u7A33\u5B9A\u5B88\u6210\uFF0C\u5E74\u8F7B\u65F6\u6613\u56E0\u51B2\u52A8\u5931\u5229\u3002",
    palaces: getSanFangPalaces(chart).filter((p) => has.includes(getMajorStarNames(p)[0])).map((p) => p.name),
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u6740\u7834\u72FC\u300B"
  });
}
function detectJiYueTongLiang(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ["\u5929\u673A", "\u592A\u9634", "\u5929\u540C", "\u5929\u6881"].filter((s) => sanFangSet.has(s));
  if (has.length < 4) return;
  const required = ["\u5929\u673A\u3001\u592A\u9634\u3001\u5929\u540C\u3001\u5929\u6881\u56DB\u661F\u9F50\u5165\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63"];
  const bonus = [];
  const breaking = [];
  if (sanFangSet.has("\u6587\u660C") || sanFangSet.has("\u6587\u66F2")) bonus.push("\u518D\u4F1A\u660C\u66F2");
  if (sanFangHasSiHua(chart, "\u79D1")) bonus.push("\u518D\u4F1A\u5316\u79D1");
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push("\u715E\u661F\u8FC7\u591A\uFF08\u673A\u6708\u540C\u6881\u5FCC\u715E\uFF09");
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push("\u547D\u5BAB\u5750\u715E");
  patterns.push({
    name: "\u673A\u6708\u540C\u6881",
    level: breaking.length ? "good" : "excellent",
    description: "\u5929\u673A\u592A\u9634\u5929\u540C\u5929\u6881\u56DB\u661F\u9F50\u5165\u547D\u8FC1\u8D22\u5B98\uFF0C\u6587\u8D28\u5F6C\u5F6C\u3001\u806A\u6167\u5584\u8C0B\u3002\u6700\u9002\u5408\u516C\u804C\u3001\u5B66\u672F\u3001\u6587\u827A\u3001\u533B\u7597\u3001\u670D\u52A1\u7B49\u9700\u7A33\u5B9A\u7D2F\u79EF\u7684\u884C\u4E1A\uFF0C\u4E0D\u5B9C\u5927\u5192\u9669\u5927\u6295\u673A\u3002",
    palaces: getSanFangPalaces(chart).filter((p) => has.some((s) => getMajorStarNames(p).includes(s))).map((p) => p.name),
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u673A\u6708\u540C\u6881\u683C\u300B"
  });
}
function detectLianXiang(chart, patterns) {
  const lian = findStarPalace(chart, "\u5EC9\u8D1E");
  const xiang = findStarPalace(chart, "\u5929\u76F8");
  if (!lian || !xiang || lian.branch !== xiang.branch) return;
  const inMing = lian.branch === chart.mingGongBranch;
  const required = ["\u5EC9\u8D1E\u5929\u76F8\u540C\u5BAB"];
  const bonus = [];
  const breaking = [];
  if (hasStar(lian, "\u7984\u5B58") || getStarSiHua(lian, "\u5EC9\u8D1E") === "\u7984") bonus.push("\u89C1\u7984\u5B58\u6216\u5EC9\u8D1E\u5316\u7984");
  if (sanFangAllStars(chart).has("\u5DE6\u8F85")) bonus.push("\u5DE6\u8F85\u4F1A\u7167");
  if (hasShaInPalace(lian, ["\u64CE\u7F8A"])) breaking.push("\u5EC9\u76F8\u5BAB\u5750\u64CE\u7F8A\uFF08\u5EC9\u6740\u7F8A\u503E\u5411\uFF09");
  if (getStarSiHua(lian, "\u5EC9\u8D1E") === "\u5FCC") breaking.push("\u5EC9\u8D1E\u5316\u5FCC");
  patterns.push({
    name: "\u5EC9\u8D1E\u5929\u76F8\u683C",
    level: breaking.length ? "caution" : inMing ? "good" : "neutral",
    description: "\u5EC9\u8D1E\u5929\u76F8\u540C\u5BAB\uFF0C\u5370\u7EF6\u683C\u5C40\uFF0C\u4E3B\u79C9\u516C\u5904\u4E8B\u3001\u6E05\u5EC9\u4E4B\u540D\uFF0C\u5B9C\u4EFB\u516C\u804C\u3001\u884C\u653F\u7BA1\u7406\u3001\u6CD5\u52A1\u3001\u4F01\u5212\u3002\u6015\u89C1\u64CE\u7F8A\u5316\u5FCC\uFF0C\u5219\u53CD\u4E3B\u5B98\u975E\u3002",
    palaces: [lian.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectWuQiSha(chart, patterns) {
  const wu = findStarPalace(chart, "\u6B66\u66F2");
  const qi = findStarPalace(chart, "\u4E03\u6740");
  if (!wu || !qi || wu.branch !== qi.branch) return;
  const inMing = wu.branch === chart.mingGongBranch;
  const required = ["\u6B66\u66F2\u4E03\u6740\u540C\u5BAB"];
  const bonus = [];
  const breaking = [];
  if (getStarSiHua(wu, "\u6B66\u66F2") === "\u6743") bonus.push("\u6B66\u66F2\u5316\u6743");
  if (getStarSiHua(wu, "\u6B66\u66F2") === "\u7984") bonus.push("\u6B66\u66F2\u5316\u7984");
  if (getStarSiHua(wu, "\u6B66\u66F2") === "\u5FCC") breaking.push("\u6B66\u66F2\u5316\u5FCC\uFF08\u6B66\u66F2\u5316\u5FCC\u4E3A\u8D22\u52AB\u4E4B\u5146\uFF09");
  if (hasShaInPalace(wu, ["\u64CE\u7F8A", "\u9640\u7F57", "\u706B\u661F", "\u94C3\u661F"])) breaking.push("\u6B66\u6740\u5BAB\u715E\u661F\u8FC7\u591A");
  patterns.push({
    name: "\u6B66\u66F2\u4E03\u6740",
    level: breaking.length ? "caution" : inMing ? "excellent" : "good",
    description: "\u6B66\u66F2\u4E03\u6740\u540C\u5BAB\uFF0C\u5C06\u661F\u914D\u8D22\u661F\uFF0C\u4E3B\u679C\u51B3\u521A\u6BC5\u3001\u7406\u8D22\u80FD\u529B\u5F3A\uFF0C\u9002\u5408\u91D1\u878D\u3001\u519B\u8B66\u3001\u521B\u4E1A\u3002\u4F46\u5FCC\u89C1\u5316\u5FCC\u715E\u661F\uFF0C\u5426\u5219\u51F6\u9669\u3002\u4E00\u751F\u594B\u6597\u3001\u79EF\u8D22\u4F46\u64CD\u5FC3\u3002",
    palaces: [wu.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectTongLiang(chart, patterns) {
  const tong = findStarPalace(chart, "\u5929\u540C");
  const liang = findStarPalace(chart, "\u5929\u6881");
  if (!tong || !liang || tong.branch !== liang.branch) return;
  const required = ["\u5929\u540C\u5929\u6881\u540C\u5BAB"];
  const bonus = [];
  const breaking = [];
  if (sanFangAllStars(chart).has("\u6587\u660C")) bonus.push("\u6587\u660C\u4F1A\u7167");
  if (getStarSiHua(tong, "\u5929\u540C") === "\u7984") bonus.push("\u5929\u540C\u5316\u7984");
  if (hasShaInPalace(tong, SHA_HARD)) breaking.push("\u715E\u661F\u540C\u5750");
  patterns.push({
    name: "\u5929\u540C\u5929\u6881\u683C",
    level: breaking.length ? "neutral" : "good",
    description: "\u5929\u540C\u5929\u6881\u540C\u5BAB\uFF0C\u798F\u661F\u4E0E\u836B\u661F\u5171\u4F1A\uFF0C\u4E3B\u5BBD\u539A\u548C\u5584\u3001\u4E50\u4E8E\u52A9\u4EBA\uFF0C\u5B9C\u533B\u7597\u3001\u6559\u80B2\u3001\u5B97\u6559\u3001\u793E\u4F1A\u516C\u76CA\u3002\u4F46\u504F\u6E29\u548C\u4FDD\u5B88\uFF0C\u96BE\u6210\u5927\u5BCC\u5927\u8D35\u4E4B\u5C40\u3002",
    palaces: [tong.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectRiYueTongGong(chart, patterns) {
  const sun = findStarPalace(chart, "\u592A\u9633");
  const moon = findStarPalace(chart, "\u592A\u9634");
  if (!sun || !moon || sun.branch !== moon.branch) return;
  if (sun.branch !== 1 && sun.branch !== 7) return;
  const inMing = sun.branch === chart.mingGongBranch;
  const required = [`\u592A\u9633\u592A\u9634\u540C\u5165${BRANCH_NAMES[sun.branch]}\u5BAB`];
  const bonus = [];
  const breaking = [];
  if (sun.branch === 7) bonus.push("\u672A\u5BAB\u65E5\u6708\u540C\u8F89\uFF08\u53E4\u4E66\u4E91\u672A\u5BAB\u65E5\u6708\u53CC\u7F8E\uFF09");
  if (sanFangAllStars(chart).has("\u6587\u660C") && sanFangAllStars(chart).has("\u6587\u66F2")) bonus.push("\u660C\u66F2\u4F1A\u7167");
  if (hasShaInPalace(sun, SHA_HARD)) breaking.push("\u65E5\u6708\u5BAB\u715E\u661F\u540C\u5750");
  patterns.push({
    name: "\u65E5\u6708\u540C\u5BAB",
    level: breaking.length ? "good" : inMing ? "excellent" : "good",
    description: `\u592A\u9633\u592A\u9634\u4E8E${BRANCH_NAMES[sun.branch]}\u5BAB\u540C\u5BAB\uFF0C\u9634\u9633\u5E73\u8861\uFF0C\u6587\u6B66\u517C\u5907\u3002\u4E3B\u5F02\u6027\u7F18\u4F73\u3001\u4E8B\u4E1A\u987A\u9042\u3001\u540D\u58F0\u8FDC\u64AD\u3002${sun.branch === 7 ? "\u672A\u5BAB\u65E5\u6708\u53CC\u7F8E\u5C24\u4F73\u3002" : "\u4E11\u5BAB\u65E5\u6708\u540C\u5BAB\u529B\u91CF\u8F83\u5E73\u3002"}`,
    palaces: [sun.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectRiYueJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasSun = hasStar(prev, "\u592A\u9633");
  const prevHasMoon = hasStar(prev, "\u592A\u9634");
  const nextHasSun = hasStar(next, "\u592A\u9633");
  const nextHasMoon = hasStar(next, "\u592A\u9634");
  const ok = prevHasSun && nextHasMoon || prevHasMoon && nextHasSun;
  if (!ok) return;
  const sunPalace = prevHasSun ? prev : next;
  const moonPalace = prevHasMoon ? prev : next;
  const required = ["\u592A\u9633\u592A\u9634\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB"];
  const bonus = [];
  const breaking = [];
  if (isBright(sunPalace, "\u592A\u9633")) bonus.push("\u592A\u9633\u5E99\u65FA");
  if (isBright(moonPalace, "\u592A\u9634")) bonus.push("\u592A\u9634\u5E99\u65FA");
  if (isDim(sunPalace, "\u592A\u9633") || isDim(moonPalace, "\u592A\u9634")) breaking.push("\u65E5\u6708\u843D\u9677\uFF08\u5939\u547D\u65E0\u5149\uFF09");
  patterns.push({
    name: "\u65E5\u6708\u5939\u547D",
    level: breaking.length ? "good" : "excellent",
    description: "\u592A\u9633\u592A\u9634\u5206\u5C45\u547D\u5BAB\u4E24\u4FA7\u5939\u7167\uFF0C\u5149\u660E\u78CA\u843D\uFF0C\u4E00\u751F\u8D35\u4EBA\u76F8\u52A9\uFF0C\u4E8B\u4E1A\u84EC\u52C3\u3002\u7537\u4E3B\u5B98\u8D35\uFF0C\u5973\u4E3B\u65FA\u592B\u5174\u5BB6\u3002\u65E5\u6708\u987B\u4E0D\u843D\u9677\u65B9\u4E3A\u771F\u5939\u3002",
    palaces: [sunPalace.name, moonPalace.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u65E5\u6708\u5939\u547D\u300B"
  });
}
function detectJuRiTongGong(chart, patterns) {
  const ju = findStarPalace(chart, "\u5DE8\u95E8");
  const sun = findStarPalace(chart, "\u592A\u9633");
  if (!ju || !sun || ju.branch !== sun.branch) return;
  if (ju.branch !== 2 && ju.branch !== 8) return;
  const inMing = ju.branch === chart.mingGongBranch;
  const required = [`\u5DE8\u95E8\u592A\u9633\u540C\u5165${BRANCH_NAMES[ju.branch]}\u5BAB`];
  const bonus = [];
  const breaking = [];
  if (ju.branch === 2) bonus.push("\u5BC5\u5BAB\u592A\u9633\u5E99\u65FA\uFF0C\u5DE8\u95E8\u5F97\u65E5\u5149\u5316\u89E3\u662F\u975E");
  if (getStarSiHua(ju, "\u5DE8\u95E8") === "\u7984" || getStarSiHua(ju, "\u5DE8\u95E8") === "\u6743") bonus.push("\u5DE8\u95E8\u5316\u7984/\u5316\u6743\uFF08\u53E3\u624D\u751F\u8D22\uFF09");
  if (getStarSiHua(ju, "\u5DE8\u95E8") === "\u5FCC") breaking.push("\u5DE8\u95E8\u5316\u5FCC\uFF08\u53E3\u820C\u5B98\u975E\uFF09");
  if (ju.branch === 8) breaking.push("\u7533\u5BAB\u592A\u9633\u504F\u897F\uFF0C\u5DE8\u95E8\u6697\u66DC\u66F4\u663E");
  patterns.push({
    name: "\u5DE8\u65E5\u540C\u5BAB",
    level: breaking.length ? "caution" : inMing && ju.branch === 2 ? "excellent" : "good",
    description: `\u5DE8\u95E8\u592A\u9633\u540C${BRANCH_NAMES[ju.branch]}\u5BAB\uFF0C\u592A\u9633\u5316\u89E3\u5DE8\u95E8\u6697\u66DC\uFF0C\u4E3B\u4EE5\u53E3\u624D\u3001\u4F20\u5A92\u3001\u5916\u8BED\u3001\u4E13\u4E1A\u7ACB\u4E1A\u3002\u5BC5\u5BAB\u4E3A\u4F73\uFF0C\u7533\u5BAB\u529B\u51CF\u3002\u6015\u5DE8\u95E8\u5316\u5FCC\u5219\u5B98\u975E\u3002`,
    palaces: [ju.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u5DE8\u65E5\u540C\u5BAB\u300B"
  });
}
function detectShiZhongYinYu(chart, ming, patterns) {
  if (!hasStar(ming, "\u5DE8\u95E8")) return;
  if (ming.branch !== 0 && ming.branch !== 6) return;
  const required = [`\u5DE8\u95E8\u5165\u547D\u4E8E${BRANCH_NAMES[ming.branch]}\u5BAB`];
  const bonus = [];
  const breaking = [];
  if (getStarSiHua(ming, "\u5DE8\u95E8") === "\u7984" || getStarSiHua(ming, "\u5DE8\u95E8") === "\u6743") bonus.push("\u5DE8\u95E8\u5316\u7984/\u5316\u6743");
  if (sanFangAllStars(chart).has("\u6587\u660C")) bonus.push("\u6587\u660C\u4F1A\u7167\uFF08\u77F3\u4E2D\u9690\u7389\u5F97\u660E\uFF09");
  if (getStarSiHua(ming, "\u5DE8\u95E8") === "\u5FCC") breaking.push("\u5DE8\u95E8\u5316\u5FCC\uFF08\u7389\u85CF\u6DF1\u6CE5\uFF09");
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push("\u547D\u5750\u715E\u661F");
  patterns.push({
    name: "\u77F3\u4E2D\u9690\u7389",
    level: breaking.length ? "caution" : "excellent",
    description: '\u5DE8\u95E8\u5750\u547D\u5B50\u5348\uFF0C\u5916\u8868\u5E73\u51E1\u800C\u5185\u8574\u624D\u5B66\u3002\u65E9\u5E74\u9ED8\u9ED8\u65E0\u95FB\u3001\u4E2D\u5E74\u65B9\u663E\u8D35\u6C14\uFF0C\u5B9C\u8D70\u4E13\u4E1A\u3001\u7814\u7A76\u3001\u53E3\u624D\u3001\u4F20\u5A92\u3002\u9700\u6709\u7984\u6743\u6216\u6587\u660C\u76F8\u52A9\u65B9\u80FD"\u51FF\u77F3\u89C1\u7389"\u3002',
    palaces: ["\u547D\u5BAB"],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u9AA8\u9AD3\u8D4B\xB7\u77F3\u4E2D\u9690\u7389\u300B"
  });
}
function detectMingZhuChuHai(chart, ming, patterns) {
  if (ming.branch !== 7) return;
  if (getMajorStarNames(ming).length > 0) return;
  const dui = getDuiGong(chart, ming.branch);
  if (!dui) return;
  if (!hasStar(dui, "\u592A\u9633") || !hasStar(dui, "\u592A\u9634")) return;
  const required = ["\u547D\u5BAB\u5728\u672A\u4E3A\u7A7A\u5BAB", "\u5BF9\u5BAB\u4E11\u5BAB\u4E3A\u592A\u9633\u592A\u9634\u540C\u5EA6"];
  const bonus = [];
  const breaking = [];
  if (sanFangAllStars(chart).has("\u6587\u660C") || sanFangAllStars(chart).has("\u6587\u66F2")) bonus.push("\u518D\u4F1A\u660C\u66F2");
  if (sanFangAllStars(chart).has("\u5DE6\u8F85") || sanFangAllStars(chart).has("\u53F3\u5F3C")) bonus.push("\u8F85\u5F3C\u76F8\u52A9");
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push("\u715E\u661F\u4F1A\u7167\uFF08\u73E0\u5149\u9EEF\u6DE1\uFF09");
  patterns.push({
    name: "\u660E\u73E0\u51FA\u6D77",
    level: breaking.length ? "good" : "excellent",
    description: '\u547D\u672A\u7A7A\u5BAB\uFF0C\u5BF9\u5BAB\u4E11\u5BAB\u65E5\u6708\u540C\u8F89\u62F1\u7167\uFF0C\u53F7"\u660E\u73E0\u51FA\u6D77"\u3002\u4E3B\u51FA\u751F\u5E73\u51E1\u3001\u540E\u5929\u52AA\u529B\u51FA\u5934\uFF0C\u5B9C\u8FDC\u8D74\u4ED6\u4E61\u3001\u5B66\u672F\u7814\u7A76\u6216\u5927\u516C\u53F8\u9AD8\u4F4D\uFF0C\u4E3B\u5927\u5BCC\u5927\u8D35\u3002',
    palaces: ["\u547D\u5BAB", dui.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u96C6\xB7\u660E\u73E0\u51FA\u6D77\u300B"
  });
}
function detectZiWeiInMing(chart, ming, patterns) {
  if (!hasStar(ming, "\u7D2B\u5FAE") || hasStar(ming, "\u5929\u5E9C")) return;
  const required = ["\u7D2B\u5FAE\u72EC\u5750\u547D\u5BAB\uFF08\u65E0\u5929\u5E9C\u540C\u5750\uFF09"];
  const bonus = [];
  const breaking = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has("\u5DE6\u8F85") && sanFangSet.has("\u53F3\u5F3C")) bonus.push("\u5DE6\u8F85\u53F3\u5F3C\u540C\u4F1A");
  if (sanFangSet.has("\u6587\u660C") && sanFangSet.has("\u6587\u66F2")) bonus.push("\u6587\u660C\u6587\u66F2\u540C\u4F1A");
  if (!sanFangSet.has("\u5DE6\u8F85") && !sanFangSet.has("\u53F3\u5F3C")) breaking.push("\u65E0\u8F85\u5F3C\uFF08\u5B64\u541B\u65E0\u81E3\uFF09");
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push("\u7D2B\u5FAE\u9047\u7A7A\u52AB\uFF08\u53E4\u4E66\u6700\u5FCC\uFF09");
  patterns.push({
    name: "\u7D2B\u5FAE\u5165\u547D",
    level: breaking.length ? "caution" : bonus.length ? "excellent" : "good",
    description: '\u7D2B\u5FAE\u72EC\u5750\u547D\u5BAB\uFF0C\u5E1D\u738B\u4E4B\u661F\uFF0C\u81EA\u5C0A\u5FC3\u5F3A\u3001\u6709\u9886\u5BFC\u9B45\u529B\u3002\u4F46\u7D2B\u5FAE\u6700\u5FCC"\u5728\u91CE\u5B64\u541B"\u2014\u2014\u82E5\u65E0\u5DE6\u53F3\u8F85\u5F3C\u76F8\u4F1A\uFF0C\u53CD\u6210\u5B64\u9AD8\u81EA\u50B2\u3001\u6613\u62DB\u6BC1\u8C24\u3002',
    palaces: ["\u547D\u5BAB"],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectFuBiJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasZuo = hasStar(prev, "\u5DE6\u8F85");
  const prevHasYou = hasStar(prev, "\u53F3\u5F3C");
  const nextHasZuo = hasStar(next, "\u5DE6\u8F85");
  const nextHasYou = hasStar(next, "\u53F3\u5F3C");
  if (!(prevHasZuo && nextHasYou || prevHasYou && nextHasZuo)) return;
  const required = ["\u5DE6\u8F85\u53F3\u5F3C\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB"];
  const bonus = [];
  const breaking = [];
  if (sanFangAllStars(chart).has("\u5929\u9B41") || sanFangAllStars(chart).has("\u5929\u94BA")) bonus.push("\u518D\u4F1A\u9B41\u94BA");
  patterns.push({
    name: "\u8F85\u5F3C\u5939\u547D",
    level: "excellent",
    description: '\u5DE6\u8F85\u53F3\u5F3C\u5939\u547D\uFF0C\u4F20\u7EDF\u8BBA\u8FF0\u8BA4\u4E3A\u6B64\u683C\u8C61\u5F81\u8D35\u4EBA\u76F8\u52A9\u4E0E\u798F\u539A\u7279\u8D28\u3002\u9002\u5408\u8D70\u4ED5\u9014\u3001\u5927\u4F01\u4E1A\u7BA1\u7406\u7B49\u80FD\u53D1\u6325\u7EC4\u7EC7\u624D\u80FD\u7684\u65B9\u5411\u3002\u53E4\u4E66\u4E91"\u5DE6\u8F85\u53F3\u5F3C\uFF0C\u7EC8\u8EAB\u798F\u539A"\u2014\u2014\u5F3A\u8C03\u6B64\u683C\u5728\u7EC4\u7EC7\u534F\u8C03\u4E2D\u7684\u4F18\u52BF\u3002',
    palaces: ["\u547D\u5BAB", prev.name, next.name],
    conditions: { required, bonus, breaking },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u8F85\u5F3C\u5939\u547D\u300B"
  });
}
function detectChangQuJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasChang = hasStar(prev, "\u6587\u660C");
  const prevHasQu = hasStar(prev, "\u6587\u66F2");
  const nextHasChang = hasStar(next, "\u6587\u660C");
  const nextHasQu = hasStar(next, "\u6587\u66F2");
  if (!(prevHasChang && nextHasQu || prevHasQu && nextHasChang)) return;
  patterns.push({
    name: "\u660C\u66F2\u5939\u547D",
    level: "excellent",
    description: '\u6587\u660C\u6587\u66F2\u5939\u547D\u5BAB\uFF0C\u4E3B\u806A\u660E\u4FCA\u79C0\u3001\u6587\u91C7\u6590\u7136\uFF0C\u5B9C\u8D70\u6587\u6559\u3001\u5B66\u672F\u3001\u827A\u672F\u3001\u5199\u4F5C\u3002\u53E4\u4E66\u4E91"\u660C\u66F2\u5939\u547D\u4E3B\u79D1\u7532"\uFF0C\u6700\u5229\u8003\u8FD0\u3002',
    palaces: ["\u547D\u5BAB", prev.name, next.name],
    conditions: { required: ["\u6587\u660C\u6587\u66F2\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectKuiYueJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, "\u5929\u9B41") && hasStar(next, "\u5929\u94BA");
  const okB = hasStar(prev, "\u5929\u94BA") && hasStar(next, "\u5929\u9B41");
  if (!okA && !okB) return;
  patterns.push({
    name: "\u9B41\u94BA\u5939\u547D",
    level: "good",
    description: "\u5929\u9B41\u5929\u94BA\u5939\u547D\uFF0C\u7537\u79F0\u5929\u4E59\u3001\u5973\u79F0\u7389\u5802\uFF0C\u4E00\u751F\u8D35\u4EBA\u63D0\u643A\u3002\u8003\u8BD5\u3001\u6C42\u804C\u3001\u5173\u952E\u65F6\u523B\u5E38\u6709\u610F\u5916\u8D35\u4EBA\u76F8\u52A9\u3002",
    palaces: ["\u547D\u5BAB", prev.name, next.name],
    conditions: { required: ["\u5929\u9B41\u5929\u94BA\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectShuangLuChaoYuan(chart, ming, patterns) {
  const sanFang = getSanFangPalaces(chart);
  let huaLuFound = false;
  let luCunFound = false;
  for (const p of sanFang) {
    if (p.stars.some((s) => s.siHua === "\u7984")) huaLuFound = true;
    if (hasStar(p, "\u7984\u5B58")) luCunFound = true;
  }
  if (!huaLuFound || !luCunFound) return;
  patterns.push({
    name: "\u53CC\u7984\u671D\u57A3",
    level: "excellent",
    description: '\u5316\u7984\u3001\u7984\u5B58\u540C\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63\uFF0C\u8D22\u6E90\u6D8C\u52A8\u3001\u8863\u98DF\u4E30\u8DB3\u3002\u53E4\u4E66\u4E91"\u53CC\u7984\u671D\u57A3\uFF0C\u5BCC\u6BD4\u9676\u6731"\uFF0C\u4E3B\u4E00\u751F\u4E0D\u6101\u8D22\uFF0C\u591A\u6709\u6B63\u8D22\u6A2A\u8D22\u517C\u5F97\u3002',
    palaces: sanFang.map((p) => p.name),
    conditions: {
      required: ["\u5316\u7984\u4F1A\u7167\u4E09\u65B9\u56DB\u6B63", "\u7984\u5B58\u4F1A\u7167\u4E09\u65B9\u56DB\u6B63"],
      breaking: hasShaInPalace(ming, SHA_KONG) ? ["\u547D\u5750\u7A7A\u52AB\uFF08\u53CC\u7984\u9047\u7A7A\uFF0C\u8D22\u6765\u8D22\u53BB\uFF09"] : void 0
    },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u53CC\u7984\u671D\u57A3\u300B"
  });
}
function detectSanQiJiaHui(chart, patterns) {
  const sanFangPalaces = getSanFangPalaces(chart);
  let lu = false, quan = false, ke = false;
  for (const p of sanFangPalaces) {
    for (const s of p.stars) {
      if (s.siHua === "\u7984") lu = true;
      if (s.siHua === "\u6743") quan = true;
      if (s.siHua === "\u79D1") ke = true;
    }
  }
  if (!(lu && quan && ke)) return;
  patterns.push({
    name: "\u4E09\u5947\u52A0\u4F1A",
    level: "excellent",
    description: '\u5316\u7984\u3001\u5316\u6743\u3001\u5316\u79D1\u4E09\u5409\u5316\u9F50\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63\uFF0C\u53F7\u79F0"\u4E09\u5947\u52A0\u4F1A"\u3002\u4E3B\u4E00\u751F\u529F\u540D\u3001\u8D22\u5BCC\u3001\u8D35\u4EBA\u4E09\u5168\uFF0C\u662F\u7D2B\u5FAE\u6597\u6570\u6700\u9AD8\u5409\u683C\u4E4B\u4E00\u3002',
    palaces: sanFangPalaces.map((p) => p.name),
    conditions: { required: ["\u5316\u7984\u3001\u5316\u6743\u3001\u5316\u79D1\u4E09\u5409\u5316\u9F50\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u4E09\u5947\u52A0\u4F1A\u300B"
  });
}
function detectHuaLuRuMing(chart, ming, patterns) {
  const huaLuStar = ming.stars.find((s) => s.siHua === "\u7984" && s.type === "major");
  if (!huaLuStar) return;
  patterns.push({
    name: `${huaLuStar.name}\u5316\u7984\u5165\u547D`,
    level: "good",
    description: `${huaLuStar.name}\u5316\u7984\u5750\u547D\uFF0C\u4E3B\u751F\u8D22\u987A\u5229\u3001\u4EBA\u7F18\u4F73\u3001\u673A\u7F18\u591A\u3002${huaLuStar.name === "\u6B66\u66F2" ? "\u6B66\u66F2\u5316\u7984\u5C5E\u6B63\u8D22\uFF0C\u5B9C\u5B9E\u4E1A\u3001\u91D1\u878D\u3002" : huaLuStar.name === "\u592A\u9634" ? "\u592A\u9634\u5316\u7984\u5C5E\u9634\u8D22\u3001\u4E0D\u52A8\u4EA7\u3002" : huaLuStar.name === "\u8D2A\u72FC" ? "\u8D2A\u72FC\u5316\u7984\u5C5E\u4EBA\u8109\u8D22\u3001\u6843\u82B1\u8D22\u3002" : ""}`,
    palaces: ["\u547D\u5BAB"],
    conditions: { required: [`${huaLuStar.name}\u5316\u7984\u5750\u547D\u5BAB`] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectHuaJiRuMingQian(chart, patterns) {
  const qianBranch = (chart.mingGongBranch + 6) % 12;
  for (const palace of chart.palaces) {
    if (palace.branch !== chart.mingGongBranch && palace.branch !== qianBranch) continue;
    const jiStar = palace.stars.find((s) => s.siHua === "\u5FCC" && s.type === "major");
    if (!jiStar) continue;
    const inMing = palace.branch === chart.mingGongBranch;
    patterns.push({
      name: `${jiStar.name}\u5316\u5FCC\u5165${inMing ? "\u547D" : "\u8FC1"}`,
      level: "caution",
      description: inMing ? `${jiStar.name}\u5316\u5FCC\u5750\u547D\u5BAB\uFF0C\u9700\u7559\u610F\u81EA\u8EAB\u56FA\u6267\u3001\u5FC3\u7406\u969C\u788D\u6216\u5065\u5EB7\u9690\u60A3\uFF0C\u51E1\u4E8B\u9000\u4E00\u6B65\u601D\u8003\u3002\u5316\u5FCC\u4E0D\u4E00\u5B9A\u574F\uFF0C\u4EE3\u8868\u6B64\u661F\u80FD\u91CF\u9700\u8981\u7279\u522B\u5173\u6CE8\u3002` : `${jiStar.name}\u5316\u5FCC\u5750\u8FC1\u79FB\u5BAB\uFF0C\u5916\u51FA\u3001\u8FDC\u884C\u3001\u4EBA\u9645\u5173\u7CFB\u6613\u6709\u6CE2\u6298\uFF0C\u5B9C\u5B88\u4E0D\u5B9C\u52A8\u3002`,
      palaces: [palace.name],
      conditions: { required: [`${jiStar.name}\u5316\u5FCC\u5750${inMing ? "\u547D" : "\u8FC1"}\u5BAB`] },
      source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
    });
  }
}
function detectYangTuoJiaJi(chart, patterns) {
  for (const palace of chart.palaces) {
    const jiStar = palace.stars.find((s) => s.siHua === "\u5FCC");
    if (!jiStar) continue;
    if (palace.branch !== chart.mingGongBranch) continue;
    const { prev, next } = getJiaPalaces(chart, palace.branch);
    if (!prev || !next) continue;
    const aPrev = hasStar(prev, "\u64CE\u7F8A") && hasStar(next, "\u9640\u7F57");
    const aNext = hasStar(prev, "\u9640\u7F57") && hasStar(next, "\u64CE\u7F8A");
    if (!aPrev && !aNext) continue;
    patterns.push({
      name: "\u7F8A\u9640\u5939\u5FCC",
      level: "caution",
      description: '\u5316\u5FCC\u5750\u547D\uFF0C\u5DE6\u53F3\u64CE\u7F8A\u9640\u7F57\u5939\u547D\uFF0C\u53E4\u4E66\u4E91"\u7F8A\u9640\u5939\u5FCC\u4E3A\u8D25\u5C40"\uFF0C\u4E3B\u4E00\u751F\u52B3\u788C\u5954\u6CE2\u3001\u574E\u5777\u4E0D\u987A\u3001\u8EAB\u5FC3\u4FF1\u75B2\u3002\u9700\u4EE5\u5FB7\u884C\u4FEE\u517B\u4E0E\u79EF\u6781\u505A\u4E8B\u5316\u89E3\uFF0C\u51E1\u4E8B\u8C28\u614E\u4E3A\u4E0A\u3002',
      palaces: ["\u547D\u5BAB", prev.name, next.name],
      conditions: { required: ["\u5316\u5FCC\u5750\u547D", "\u64CE\u7F8A\u9640\u7F57\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB"] },
      source: "\u300A\u7D2B\u5FAE\u6597\u6570\u9AA8\u9AD3\u8D4B\xB7\u7F8A\u9640\u5939\u5FCC\u300B"
    });
    return;
  }
}
function detectHuoLingJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, "\u706B\u661F") && hasStar(next, "\u94C3\u661F");
  const okB = hasStar(prev, "\u94C3\u661F") && hasStar(next, "\u706B\u661F");
  if (!okA && !okB) return;
  patterns.push({
    name: "\u706B\u94C3\u5939\u547D",
    level: "caution",
    description: "\u706B\u661F\u94C3\u661F\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB\u5939\u547D\uFF0C\u4E3B\u6027\u6025\u3001\u6613\u51B2\u52A8\u3001\u7A81\u53D1\u610F\u5916\u6216\u7EA0\u7EB7\u3002\u9700\u57F9\u517B\u8010\u6027\u3001\u907F\u514D\u51B2\u52A8\u51B3\u7B56\u3002",
    palaces: ["\u547D\u5BAB", prev.name, next.name],
    conditions: { required: ["\u706B\u661F\u94C3\u661F\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectKongJieJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, "\u5730\u7A7A") && hasStar(next, "\u5730\u52AB");
  const okB = hasStar(prev, "\u5730\u52AB") && hasStar(next, "\u5730\u7A7A");
  if (!okA && !okB) return;
  patterns.push({
    name: "\u7A7A\u52AB\u5939\u547D",
    level: "caution",
    description: '\u5730\u7A7A\u5730\u52AB\u5939\u547D\uFF0C\u4E3B\u8D22\u6765\u8D22\u53BB\u3001\u601D\u60F3\u8131\u4FD7\u3001\u6613\u9041\u5165\u5B97\u6559\u54F2\u5B66\u3002\u53E4\u4E66\u4E91"\u7A7A\u52AB\u5939\u547D\uFF0C\u8D22\u4E0D\u805A"\u3002\u5B9C\u6280\u827A\u3001\u5B97\u6559\u3001\u7814\u7A76\u7B49\u4E0D\u91CD\u7269\u8D28\u4E4B\u4E1A\u3002',
    palaces: ["\u547D\u5BAB", prev.name, next.name],
    conditions: { required: ["\u5730\u7A7A\u5730\u52AB\u5206\u5C45\u547D\u5BAB\u524D\u540E\u4E24\u5BAB"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\u300B"
  });
}
function detectLianShaYang(chart, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has("\u5EC9\u8D1E") && sanFangSet.has("\u4E03\u6740") && sanFangSet.has("\u64CE\u7F8A"))) return;
  patterns.push({
    name: "\u5EC9\u6740\u7F8A",
    level: "caution",
    description: "\u5EC9\u8D1E\u3001\u4E03\u6740\u3001\u64CE\u7F8A\u4E09\u661F\u4F1A\u7167\u547D\u5BAB\u4E09\u65B9\uFF0C\u4F20\u7EDF\u8BBA\u8FF0\u4E2D\u6807\u8BB0\u4E3A\u9700\u8981\u7279\u522B\u5173\u6CE8\u7684\u7EC4\u5408\u3002\u6B64\u683C\u5728\u5927\u9650\u6D41\u5E74\u89E6\u53D1\u65F6\u63D0\u9192\u4FDD\u6301\u8C28\u614E\u6001\u5EA6\uFF1A\u9A7E\u9A76\u5B89\u5168\u3001\u4EBA\u9645\u548C\u5E73\u3001\u533B\u7597\u51B3\u7B56\u9700\u7406\u6027\u2014\u2014\u5F3A\u8C03\u4E3B\u52A8\u7BA1\u7406\u800C\u975E\u6D88\u6781\u5BBF\u547D\u3002",
    palaces: ["\u547D\u5BAB"],
    conditions: { required: ["\u5EC9\u8D1E\u3001\u4E03\u6740\u3001\u64CE\u7F8A\u4E09\u661F\u4F1A\u7167\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u5EC9\u6740\u7F8A\u300B"
  });
}
function detectJuHuoYang(chart, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has("\u5DE8\u95E8") && sanFangSet.has("\u706B\u661F") && sanFangSet.has("\u64CE\u7F8A"))) return;
  patterns.push({
    name: "\u5DE8\u706B\u7F8A",
    level: "caution",
    description: '\u5DE8\u95E8\u3001\u706B\u661F\u3001\u64CE\u7F8A\u4E09\u661F\u4F1A\u7167\uFF0C\u4F20\u7EDF\u53E4\u7C4D\u8BB0\u8F7D\u6B64\u683C\u4E3A\u9700\u8981\u8B66\u60D5\u4E4B\u7EC4\u5408\uFF08\u53E4\u6587"\u7EC8\u8EAB\u7F22\u6B7B"\u4E3A\u5BBF\u547D\u8BBA\u8868\u8FF0\uFF0C\u4ECA\u5DF2\u4E0D\u9002\u7528\uFF09\u3002\u73B0\u4EE3\u7406\u89E3\u4E3A\uFF1A\u6B64\u7EC4\u5408\u8C61\u5F81\u76F4\u8A00\u6613\u89E6\u53D1\u51B2\u7A81\u3001\u60C5\u7EEA\u6FC0\u70C8\u65F6\u9700\u8981\u81EA\u6211\u89C9\u5BDF\u3002\u4FEE\u517B\u65B9\u5411\u662F\uFF1A\u7EC3\u4E60\u6E29\u548C\u8868\u8FBE\u3001\u4E3B\u52A8\u5316\u89E3\u5BF9\u7ACB\u3001\u57F9\u517B\u60C5\u7EEA\u7BA1\u7406\u3002',
    palaces: ["\u547D\u5BAB"],
    conditions: { required: ["\u5DE8\u95E8\u3001\u706B\u661F\u3001\u64CE\u7F8A\u4E09\u661F\u4F1A\u7167\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u9AA8\u9AD3\u8D4B\xB7\u5DE8\u706B\u7F8A\u300B"
  });
}
function detectLingChangTuoWu(chart, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has("\u94C3\u661F") && sanFangSet.has("\u6587\u660C") && sanFangSet.has("\u9640\u7F57") && sanFangSet.has("\u6B66\u66F2"))) return;
  patterns.push({
    name: "\u94C3\u660C\u9640\u6B66",
    level: "caution",
    description: '\u94C3\u661F\u3001\u6587\u660C\u3001\u9640\u7F57\u3001\u6B66\u66F2\u56DB\u661F\u9F50\u4F1A\uFF0C\u4F20\u7EDF\u53E4\u7C4D\u8BB0\u8F7D\u6B64\u4E3A\u9700\u8981\u7279\u522B\u5173\u6CE8\u4E4B\u7EC4\u5408\uFF08\u53E4\u6587"\u9650\u81F3\u6295\u6CB3"\u4E3A\u5BBF\u547D\u8BBA\u8868\u8FF0\uFF0C\u975E\u73B0\u4EE3\u7406\u89E3\uFF09\u3002\u73B0\u4EE3\u5EFA\u8BAE\u4E3A\uFF1A\u6B64\u7EC4\u5408\u5728\u5927\u9650\u6D41\u5E74\u89E6\u53D1\u65F6\uFF0C\u63D0\u9192\u7406\u6027\u5904\u7406\u91CD\u5927\u51B3\u7B56\u3001\u5173\u6CE8\u60C5\u7EEA\u6CE2\u52A8\u3001\u7EF4\u6301\u751F\u6D3B\u7684\u7A33\u5B9A\u6027\u2014\u2014\u5F3A\u8C03\u4E3B\u52A8\u7BA1\u7406\u800C\u975E\u6D88\u6781\u7B49\u5F85\u3002',
    palaces: ["\u547D\u5BAB"],
    conditions: { required: ["\u94C3\u661F\u3001\u6587\u660C\u3001\u9640\u7F57\u3001\u6B66\u66F2\u56DB\u661F\u4F1A\u7167\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u9AA8\u9AD3\u8D4B\xB7\u94C3\u660C\u9640\u6B66\u300B"
  });
}
function detectMaTouDaiJian(chart, ming, patterns) {
  if (ming.branch !== 6) return;
  if (!hasStar(ming, "\u64CE\u7F8A")) return;
  const required = ["\u64CE\u7F8A\u4E8E\u5348\u5BAB\u5750\u547D"];
  const bonus = [];
  const breaking = [];
  if (sanFangAllStars(chart).has("\u4E03\u6740") || sanFangAllStars(chart).has("\u7834\u519B")) bonus.push("\u518D\u4F1A\u4E03\u6740\u6216\u7834\u519B\uFF08\u6B66\u804C\u5927\u8D35\uFF09");
  if (sanFangAllStars(chart).has("\u5929\u9B41") || sanFangAllStars(chart).has("\u5929\u94BA")) bonus.push("\u9B41\u94BA\u52A0\u7167");
  patterns.push({
    name: "\u9A6C\u5934\u5E26\u7BAD",
    level: bonus.length ? "good" : "caution",
    description: '\u64CE\u7F8A\u4E8E\u5348\u5BAB\u5750\u547D\uFF0C\u53F7"\u9A6C\u5934\u5E26\u7BAD"\uFF0C\u53E4\u4E66\u4E91"\u5A01\u9547\u8FB9\u7586"\u3002\u6B64\u683C\u8C61\u5F81\u679C\u51B3\u884C\u52A8\u529B\u4E0E\u7ADE\u4E89\u7CBE\u795E\uFF0C\u9002\u5408\u9700\u8981\u6267\u884C\u529B\u4E0E\u679C\u6562\u51B3\u7B56\u7684\u804C\u4E1A\u65B9\u5411\u3002\u4F20\u7EDF\u8BBA\u8FF0\u540C\u65F6\u63D0\u9192\u6B64\u683C\u9700\u8981\u914D\u5408\u5409\u5229\u661F\u66DC\u624D\u80FD\u6700\u4F18\u53D1\u6325\u2014\u2014\u5F3A\u8C03\u7EC4\u5408\u5F71\u54CD\u800C\u975E\u5355\u661F\u72EC\u8BBA\u3002',
    palaces: ["\u547D\u5BAB"],
    conditions: { required, bonus },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u9AA8\u9AD3\u8D4B\xB7\u9A6C\u5934\u5E26\u7BAD\u300B"
  });
}
function detectLuCunShouShen(chart, patterns) {
  const luCunPalace = findStarPalace(chart, "\u7984\u5B58");
  if (!luCunPalace) return;
  const inMing = luCunPalace.branch === chart.mingGongBranch;
  const inShen = luCunPalace.branch === chart.shenGongBranch;
  if (!inMing && !inShen) return;
  patterns.push({
    name: inMing ? "\u7984\u5B58\u5B88\u547D" : "\u7984\u5B58\u5B88\u8EAB",
    level: "good",
    description: inMing ? "\u7984\u5B58\u5750\u547D\uFF0C\u4E3B\u4E00\u751F\u8863\u98DF\u65E0\u5FE7\u3001\u8D22\u7984\u7A33\u5B9A\u3002\u6027\u683C\u4FDD\u5B88\uFF0C\u5584\u79EF\u7D2F\uFF0C\u4F46\u7F8A\u9640\u5939\u7984\u987B\u9632\u5C0F\u4EBA\u3002\u6700\u5B9C\u914D\u5316\u7984\u3001\u5DE6\u8F85\u53F3\u5F3C\u65B9\u4E3A\u5927\u683C\u3002" : "\u7984\u5B58\u5165\u8EAB\u5BAB\uFF0C\u4E3B\u4E2D\u5E74\u540E\u8D22\u6E90\u7A33\u5B9A\u3001\u5F97\u7984\u81EA\u4EAB\u3002\u502A\u5E08\u8BF4\u300C\u7984\u5B58\u5165\u8EAB\uFF0C\u8D22\u6C14\u8FD1\u8EAB\u300D\u2014\u2014\u914D\u5076\u6216\u4E8B\u4E1A\u65B9\u5411\u80FD\u5E26\u6765\u7A33\u5B9A\u8D22\u7984\u3002",
    palaces: [inMing ? "\u547D\u5BAB" : "\u8EAB\u5BAB"],
    conditions: { required: [inMing ? "\u7984\u5B58\u5165\u547D\u5BAB" : "\u7984\u5B58\u5165\u8EAB\u5BAB"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u7984\u5B58\u661F\u300B"
  });
}
function detectTianMaRuMing(chart, patterns) {
  const tianMaPalace = findStarPalace(chart, "\u5929\u9A6C");
  if (!tianMaPalace) return;
  const inMing = tianMaPalace.branch === chart.mingGongBranch;
  const inQian = tianMaPalace.branch === (chart.mingGongBranch + 6) % 12;
  if (!inMing && !inQian) return;
  patterns.push({
    name: inMing ? "\u5929\u9A6C\u5165\u547D" : "\u5929\u9A6C\u5728\u8FC1",
    level: "neutral",
    description: inMing ? "\u5929\u9A6C\u5750\u547D\uFF0C\u4E3B\u4E00\u751F\u5954\u6CE2\u3001\u52A8\u4E2D\u5F97\u8D22\uFF0C\u5B9C\u8D70\u5546\u65C5\u3001\u5916\u52E4\u3001\u8DE8\u754C\u53D1\u5C55\u3002\u502A\u5E08\u8BF4\u300C\u5929\u9A6C\u5165\u547D\uFF0C\u65E0\u7984\u4E0D\u53D1\u300D\u2014\u2014\u82E5\u518D\u4F1A\u7984\u5B58\u6216\u5316\u7984\u5373\u300C\u7984\u9A6C\u4EA4\u9A70\u300D\u4E4B\u5BCC\u683C\u3002" : "\u5929\u9A6C\u5728\u8FC1\u79FB\u5BAB\uFF0C\u4E3B\u5916\u51FA\u6709\u5229\u3001\u8FDC\u884C\u5F97\u8D22\uFF0C\u5B9C\u5F02\u4E61\u53D1\u5C55\u3002\u914D\u5316\u7984\u4E3B\u5F02\u5730\u751F\u8D22\uFF0C\u914D\u715E\u661F\u5219\u65C5\u9014\u591A\u6CE2\u6298\u3002",
    palaces: [tianMaPalace.name],
    conditions: { required: [inMing ? "\u5929\u9A6C\u5165\u547D\u5BAB" : "\u5929\u9A6C\u5165\u8FC1\u79FB\u5BAB"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u5929\u9A6C\u661F\u300B"
  });
}
function detectHuaLuRuCai(chart, patterns) {
  const cai = chart.palaces.find((p) => p.name === "\u8D22\u5E1B");
  if (!cai) return;
  const luStar = cai.stars.find((s) => s.type === "major" && s.siHua === "\u7984");
  if (!luStar) return;
  patterns.push({
    name: "\u5316\u7984\u5165\u8D22",
    level: "good",
    description: `${luStar.name}\u5316\u7984\u5165\u8D22\u5E1B\u5BAB\uFF0C\u4E3B\u8D22\u6E90\u7545\u901A\u3001\u6536\u5165\u7A33\u5B9A\u3002\u502A\u5E08\u8BB2\u5316\u7984\u662F\u300C\u6B63\u8D22\u300D\u8C61\u5F81\u2014\u2014\u8FD9\u4E2A\u5316\u7984\u661F\u6240\u4EE3\u8868\u7684\u80FD\u529B\uFF08${luStar.name}\u7684\u6838\u5FC3\u7279\u8D28\uFF09\u662F\u4F60\u8D5A\u94B1\u7684\u4E3B\u8F74\u3002\u914D\u7984\u5B58\u6216\u5929\u9A6C\u5219\u8D22\u6E90\u66F4\u5E7F\u3002`,
    palaces: ["\u8D22\u5E1B"],
    conditions: { required: [`${luStar.name}\u5316\u7984\u5165\u8D22\u5E1B\u5BAB`] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u56DB\u5316\u8BBA\u300B"
  });
}
function detectHuaQuanRuGuan(chart, patterns) {
  const guan = chart.palaces.find((p) => p.name === "\u5B98\u7984");
  if (!guan) return;
  const quanStar = guan.stars.find((s) => s.type === "major" && s.siHua === "\u6743");
  if (!quanStar) return;
  patterns.push({
    name: "\u5316\u6743\u5165\u5B98",
    level: "good",
    description: `${quanStar.name}\u5316\u6743\u5165\u5B98\u7984\u5BAB\uFF0C\u4E3B\u4E8B\u4E1A\u6709\u638C\u63A7\u529B\u3001\u80FD\u62C5\u5F53\u72EC\u5F53\u4E00\u9762\u7684\u804C\u4F4D\u3002\u5316\u6743\u4EE3\u8868\u6743\u529B\u4E0E\u6267\u884C\u529B\u2014\u2014${quanStar.name}\u5316\u6743\u8BF4\u660E\u4F60\u5728\u4E8B\u4E1A\u4E0A\u80FD\u6210\u4E3A\u51B3\u7B56\u8005\u6216\u6838\u5FC3\u6267\u884C\u8005\uFF0C\u5B9C\u8D70\u7BA1\u7406\u6216\u6280\u672F\u6743\u5A01\u8DEF\u7EBF\u3002`,
    palaces: ["\u5B98\u7984"],
    conditions: { required: [`${quanStar.name}\u5316\u6743\u5165\u5B98\u7984\u5BAB`] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u56DB\u5316\u8BBA\u300B"
  });
}
function detectHuaKeRuMingShen(chart, patterns) {
  const ming = chart.palaces.find((p) => p.branch === chart.mingGongBranch);
  const shen = chart.palaces.find((p) => p.branch === chart.shenGongBranch);
  const target = [ming, shen].filter((p) => Boolean(p));
  for (const p of target) {
    const keStar = p.stars.find((s) => s.type === "major" && s.siHua === "\u79D1");
    if (!keStar) continue;
    const isMing = p.branch === chart.mingGongBranch;
    patterns.push({
      name: isMing ? "\u5316\u79D1\u5165\u547D" : "\u5316\u79D1\u5165\u8EAB",
      level: "good",
      description: `${keStar.name}\u5316\u79D1\u5165${isMing ? "\u547D" : "\u8EAB"}\u5BAB\uFF0C\u4E3B\u540D\u58F0\u3001\u6587\u4E66\u3001\u5B66\u672F\u8FD0\u3002\u502A\u5E08\u8BB2\u5316\u79D1\u662F\u300C\u8D35\u4EBA\u661F\u300D\u2014\u2014${keStar.name}\u5316\u79D1\u5E26\u6765\u7684\u662F\u88AB\u4EBA\u770B\u91CD\u7684\u7279\u8D28\uFF0C\u5B9C\u4ECE\u4E8B\u6587\u4E66\u3001\u6559\u80B2\u3001\u7814\u7A76\u3001\u54A8\u8BE2\u3001\u6587\u521B\u7B49\u201C\u4EE5\u540D\u53D6\u5229\u201D\u7684\u65B9\u5411\u3002`,
      palaces: [isMing ? "\u547D\u5BAB" : "\u8EAB\u5BAB"],
      conditions: { required: [`${keStar.name}\u5316\u79D1\u5165${isMing ? "\u547D" : "\u8EAB"}\u5BAB`] },
      source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u56DB\u5316\u8BBA\u300B"
    });
    return;
  }
}
function detectJiYueTongLiangPartial(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ["\u5929\u673A", "\u592A\u9634", "\u5929\u540C", "\u5929\u6881"].filter((s) => sanFangSet.has(s));
  if (has.length !== 3) return;
  const missing = ["\u5929\u673A", "\u592A\u9634", "\u5929\u540C", "\u5929\u6881"].filter((s) => !sanFangSet.has(s));
  patterns.push({
    name: "\u673A\u6708\u540C\u6881\u4E09\u661F\u4F1A",
    level: "neutral",
    description: `\u673A\u6708\u540C\u6881\u9700\u5929\u673A\u3001\u592A\u9634\u3001\u5929\u540C\u3001\u5929\u6881\u56DB\u661F\u9F50\u4F1A\u4E09\u65B9\u56DB\u6B63\u65B9\u4E3A\u5B8C\u6574\u771F\u683C\uFF1B\u672C\u76D8\u53EA\u4F1A\u9F50\u5176\u4E2D 3 \u9897\uFF08${has.join("\u3001")}\uFF09\uFF0C\u7F3A${missing.join("\u3001")}\u672A\u4F1A\uFF0C\u5E76\u975E\u5B8C\u6574\u771F\u683C\uFF0C\u529B\u91CF\u51CF\u4E00\u6863\u3002\u6587\u8D28\u5E26\u8C0B\uFF0C\u5B9C\u516C\u804C\u3001\u6559\u7814\u3001\u533B\u7597\u3001\u670D\u52A1\u7B49\u9760\u79EF\u7D2F\u4E0E\u7A33\u5B9A\u7684\u884C\u4E1A\uFF0C\u5173\u952E\u770B\u7F3A\u4F4D\u661F\u4E0E\u56DB\u5316\u7684\u914D\u5408\u3002`,
    palaces: getSanFangPalaces(chart).filter((p) => has.some((s) => getMajorStarNames(p).includes(s))).map((p) => p.name),
    conditions: { required: [`\u4E09\u65B9\u56DB\u6B63\u4F1A${has.join("\u3001")}\uFF08\u673A\u6708\u540C\u6881\u7F3A${missing.join("\u3001")}\uFF09`] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u673A\u6708\u540C\u6881\u683C\u300B"
  });
  void ming;
}
function detectChangQuTongHui(chart, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has("\u6587\u660C") || !sanFangSet.has("\u6587\u66F2")) return;
  const ming = chart.palaces.find((p) => p.branch === chart.mingGongBranch);
  if (!ming) return;
  const inMing = hasStar(ming, "\u6587\u660C") && hasStar(ming, "\u6587\u66F2");
  patterns.push({
    name: inMing ? "\u660C\u66F2\u5750\u547D" : "\u660C\u66F2\u540C\u4F1A",
    level: "good",
    description: inMing ? "\u6587\u660C\u6587\u66F2\u540C\u5165\u547D\u5BAB\uFF0C\u4E3B\u806A\u660E\u4FCA\u79C0\u3001\u6587\u91C7\u6590\u7136\uFF0C\u5B9C\u6587\u5B66\u3001\u6559\u80B2\u3001\u5199\u4F5C\u3001\u54A8\u8BE2\u3002\u6700\u5FCC\u5316\u5FCC\u2014\u2014\u660C\u66F2\u5316\u5FCC\u4E3B\u6587\u4E66\u5951\u7EA6\u6697\u4E8F\u3002" : "\u6587\u660C\u6587\u66F2\u540C\u4F1A\u4E09\u65B9\u56DB\u6B63\uFF0C\u4E3B\u624D\u534E\u6A2A\u6EA2\u3001\u53E3\u624D\u6587\u7B14\u4FF1\u4F73\u3002\u5B9C\u8D70\u9700\u8981\u8868\u8FBE\u4E0E\u6587\u91C7\u7684\u884C\u4E1A\uFF0C\u5316\u79D1\u52A0\u6301\u5219\u540D\u58F0\u5927\u663E\u3002",
    palaces: ["\u547D\u5BAB"],
    conditions: { required: ["\u6587\u660C\u3001\u6587\u66F2\u540C\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u6587\u661F\u8BBA\u300B"
  });
}
function detectFuBiTongHui(chart, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has("\u5DE6\u8F85") || !sanFangSet.has("\u53F3\u5F3C")) return;
  patterns.push({
    name: "\u8F85\u5F3C\u540C\u4F1A",
    level: "good",
    description: "\u5DE6\u8F85\u53F3\u5F3C\u540C\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63\uFF0C\u4E3B\u4E00\u751F\u8D35\u4EBA\u4E0D\u7EDD\u3001\u4EBA\u7F18\u6781\u4F73\u3002\u6700\u5B9C\u9886\u5BFC\u5C97\u4F4D\u4E0E\u56E2\u961F\u5408\u4F5C\u578B\u5DE5\u4F5C\u3002\u502A\u5E08\u8BF4\u300C\u8F85\u5F3C\u5939\u547D\uFF0C\u5E73\u751F\u8D35\u4EBA\u591A\u300D\u2014\u2014\u4F60\u4E0D\u662F\u5355\u6253\u72EC\u6597\u7684\u547D\uFF0C\u8981\u5584\u7528\u4EBA\u9645\u7F51\u7EDC\u3002",
    palaces: ["\u547D\u5BAB"],
    conditions: { required: ["\u5DE6\u8F85\u3001\u53F3\u5F3C\u540C\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u8F85\u5F3C\u8BBA\u300B"
  });
}
function detectKuiYueTongHui(chart, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has("\u5929\u9B41") || !sanFangSet.has("\u5929\u94BA")) return;
  patterns.push({
    name: "\u9B41\u94BA\u540C\u4F1A",
    level: "good",
    description: '\u5929\u9B41\u5929\u94BA\u540C\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63\uFF0C\u4E3B"\u5929\u4E59\u8D35\u4EBA"\u52A0\u6301\uFF0C\u5173\u952E\u65F6\u523B\u603B\u6709\u8D35\u4EBA\u63D0\u643A\u3002\u502A\u5E08\u8BF4\u300C\u9B41\u94BA\u5939\u547D\uFF0C\u5FC5\u4E3A\u8D35\u4EBA\u300D\u2014\u2014\u9047\u5230\u56F0\u96BE\u65F6\u8EAB\u8FB9\u4F1A\u51FA\u73B0\u5F97\u529B\u76F8\u52A9\u8005\uFF0C\u5B9C\u4E3B\u52A8\u7EF4\u62A4\u4EBA\u8109\u3002',
    palaces: ["\u547D\u5BAB"],
    conditions: { required: ["\u5929\u9B41\u3001\u5929\u94BA\u540C\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u9B41\u94BA\u8BBA\u300B"
  });
}
function detectKeQuanShuangHui(chart, patterns) {
  const sfPalaces = getSanFangPalaces(chart);
  let hasKe = false, hasQuan = false;
  for (const p of sfPalaces) {
    for (const s of p.stars) {
      if (s.type === "major" && s.siHua === "\u79D1") hasKe = true;
      if (s.type === "major" && s.siHua === "\u6743") hasQuan = true;
    }
  }
  if (!hasKe || !hasQuan) return;
  patterns.push({
    name: "\u79D1\u6743\u53CC\u4F1A",
    level: "good",
    description: '\u5316\u79D1 + \u5316\u6743 \u540C\u4F1A\u4E09\u65B9\u56DB\u6B63\uFF0C\u4E3B\u540D\u6743\u53CC\u7F8E\u2014\u2014\u65E2\u6709\u5B66\u8BC6/\u540D\u58F0\uFF08\u79D1\uFF09\uFF0C\u53C8\u6709\u638C\u63A7\u529B\uFF08\u6743\uFF09\uFF0C\u5B9C\u8D70"\u4E13\u4E1A\u6743\u5A01"\u8DEF\u7EBF\uFF08\u5982\u533B\u751F\u3001\u5F8B\u5E08\u3001\u6559\u6388\u3001\u6280\u672F\u9AA8\u5E72\uFF09\uFF0C\u540D\u5229\u53CC\u6536\u4E14\u6839\u57FA\u624E\u5B9E\u3002',
    palaces: ["\u547D\u5BAB"],
    conditions: { required: ["\u5316\u79D1\u3001\u5316\u6743\u540C\u4F1A\u547D\u5BAB\u4E09\u65B9\u56DB\u6B63"] },
    source: "\u300A\u7D2B\u5FAE\u6597\u6570\u5168\u4E66\xB7\u56DB\u5316\u4F1A\u7167\u300B"
  });
}
function detectPatterns(chart) {
  const patterns = [];
  const ming = chart.palaces.find((p) => p.branch === chart.mingGongBranch);
  if (!ming) return patterns;
  detectJunChenQingHui(chart, ming, patterns);
  detectZiFu(chart, ming, patterns);
  detectFuXiangChaoYuan(chart, ming, patterns);
  detectYangLiangChangLu(chart, ming, patterns);
  detectHuoTanLingTan(chart, ming, patterns);
  detectWuTan(chart, ming, patterns);
  detectShaPoLang(chart, ming, patterns);
  detectJiYueTongLiang(chart, ming, patterns);
  detectLianXiang(chart, patterns);
  detectWuQiSha(chart, patterns);
  detectTongLiang(chart, patterns);
  detectRiYueTongGong(chart, patterns);
  detectRiYueJiaMing(chart, patterns);
  detectJuRiTongGong(chart, patterns);
  detectShiZhongYinYu(chart, ming, patterns);
  detectMingZhuChuHai(chart, ming, patterns);
  detectZiWeiInMing(chart, ming, patterns);
  detectFuBiJiaMing(chart, patterns);
  detectChangQuJiaMing(chart, patterns);
  detectKuiYueJiaMing(chart, patterns);
  detectShuangLuChaoYuan(chart, ming, patterns);
  detectSanQiJiaHui(chart, patterns);
  detectHuaLuRuMing(chart, ming, patterns);
  detectHuaJiRuMingQian(chart, patterns);
  detectYangTuoJiaJi(chart, patterns);
  detectHuoLingJiaMing(chart, patterns);
  detectKongJieJiaMing(chart, patterns);
  detectLianShaYang(chart, patterns);
  detectJuHuoYang(chart, patterns);
  detectLingChangTuoWu(chart, patterns);
  detectMaTouDaiJian(chart, ming, patterns);
  detectLuCunShouShen(chart, patterns);
  detectTianMaRuMing(chart, patterns);
  detectHuaLuRuCai(chart, patterns);
  detectHuaQuanRuGuan(chart, patterns);
  detectHuaKeRuMingShen(chart, patterns);
  detectJiYueTongLiangPartial(chart, ming, patterns);
  detectChangQuTongHui(chart, patterns);
  detectFuBiTongHui(chart, patterns);
  detectKuiYueTongHui(chart, patterns);
  detectKeQuanShuangHui(chart, patterns);
  return patterns;
}

// src/renhuai/true-solar-time.ts
var SECONDS_PER_DAY = 86400;
var mod = (value, base) => (value % base + base) % base;
function isValidGregorianDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function shiftGregorianDate(date, dayOffset) {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + dayOffset));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  };
}
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function dayOfYear(year, month, day) {
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 864e5);
}
function equationOfTimeMinutes(year, month, day, clockHour = 12, clockMinute = 0) {
  if (!isValidGregorianDate(year, month, day)) return 0;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const fractionalHour = clockHour + clockMinute / 60;
  const gamma = 2 * Math.PI / daysInYear * (dayOfYear(year, month, day) - 1 + (fractionalHour - 12) / 24);
  return 229.18 * (75e-6 + 1868e-6 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
}
function branchFromSolarMinutes(normalizedMinutes) {
  if (normalizedMinutes >= 1380 || normalizedMinutes < 60) return 0;
  return Math.floor((normalizedMinutes - 60) / 120) + 1;
}
function calculateTrueSolarTime(input) {
  const dateValid = isValidGregorianDate(input.year, input.month, input.day);
  const corrected = input.longitude !== void 0 && Number.isFinite(input.longitude);
  const meridian = input.utcOffsetMinutes !== void 0 && Number.isFinite(input.utcOffsetMinutes) ? input.utcOffsetMinutes / 4 : 120;
  const longitudeCorrectionMinutes = corrected ? (input.longitude - meridian) * 4 : 0;
  const eot = corrected && dateValid ? equationOfTimeMinutes(input.year, input.month, input.day, input.clockHour, input.clockMinute) : 0;
  const totalCorrectionMinutes = longitudeCorrectionMinutes + eot;
  const rawMinutes = input.clockHour * 60 + input.clockMinute + totalCorrectionMinutes;
  const roundedTotalSeconds = Math.round(rawMinutes * 60);
  const dayOffset = Math.floor(roundedTotalSeconds / SECONDS_PER_DAY);
  const secondOfDay = mod(roundedTotalSeconds, SECONDS_PER_DAY);
  const hour = Math.floor(secondOfDay / 3600);
  const minute = Math.floor(secondOfDay % 3600 / 60);
  const second = secondOfDay % 60;
  const normalizedMinutes = secondOfDay / 60;
  return {
    dateValid,
    corrected,
    longitudeCorrectionMinutes,
    equationOfTimeMinutes: eot,
    totalCorrectionMinutes,
    rawMinutes,
    normalizedMinutes,
    dayOffset,
    hour,
    minute,
    second,
    branch: branchFromSolarMinutes(normalizedMinutes)
  };
}
function resolveZiweiDayOffset(solar, lateZishi = "next-day") {
  const nextDayRule = lateZishi === "next-day";
  const isLateZishi = solar.branch === 0 && solar.normalizedMinutes >= 1380;
  if (solar.dayOffset < 0 && isLateZishi) {
    return nextDayRule ? solar.dayOffset + 1 : solar.dayOffset;
  }
  if (solar.dayOffset !== 0) return solar.dayOffset;
  if (isLateZishi) return nextDayRule ? 1 : 0;
  return 0;
}
export {
  calculateTrueSolarTime,
  detectPatterns,
  generateChart,
  resolveZiweiDayOffset,
  shiftGregorianDate
};

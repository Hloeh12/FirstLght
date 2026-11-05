# API 参考（本地复刻 v0.4）

服务地址默认 `http://127.0.0.1:8765`。全部 POST 使用 `Content-Type: application/json`，请求体上限 100 KB，返回 JSON，开启 CORS。

## 通用出生输入对象

```json
{
  "Y": 2000, "M": 8, "D": 16, "h": 12, "mi": 0,
  "gender": "女",
  "dateStr": "2000-08-16", "timeStr": "12:00",
  "timeUnknown": false,
  "useSolarTime": false,
  "city": { "label": "上海", "lat": 31.2304, "lon": 121.4737, "tz": 8 }
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| Y/M/D | 是 | 公历年月日 |
| h/mi | 否 | 默认 12:00；`timeUnknown` 为真时请自行传 12:00 |
| gender | 紫微必填 | `男` / `女` |
| useSolarTime | 否 | 真太阳时，仅影响紫微时辰索引 |
| city.lat/lon/tz | 是 | 十进制度；tz 为 UTC 偏移（如东八区 8） |
| city.label | 否 | 仅回显 |
| city.tzName | 否 | IANA 时区名（如 `Asia/Shanghai`）。**优先于 city.tz**，自动读取历史夏令时（例如 1988-07 上海为 UTC+09:00） |
| houseSystem | 否 | `placidus`（默认）/`whole`/`equal`/`porphyry` |
| calendar | 否 | `solar`（默认）或 `lunar`；为 lunar 时 Y/M/D 按农历解释 |
| timeUnknown | 否 | true 时强制按正午 12:00 排盘，并在 `meta.input.reliability` 标注上升/宫位仅供参考 |
| leapMonth | 否 | 农历闰月标记，仅 `calendar=lunar` 时生效 |

校验：月 1–12、日 1–31、时 0–23、分 0–59、纬度 ±90、经度 ±180；失败返回 400。

---

## POST /api/chart

返回完整三盘。

```json
{
  "ok": true,
  "raw": {
    "western": {
      "utc": "2000-08-16T04:00:00.000Z",
      "houseSystem": "placidus",
      "asc": { "lon": 227.98, "sign": "天蝎座", "degree": {"degrees":17,"minutes":59} },
      "mc":  { "lon": 144.02, "sign": "狮子座", "degree": {"degrees":24,"minutes":1} },
      "cusps": [12 个宫头黄经],
      "planets": [
        { "key":"sun","name":"太阳","lon":143.6,"sign":"狮子座",
          "degree":{"degrees":23,"minutes":36},"house":9,"retro":false }
      ],
      "nodes": { "north": {...}, "south": {...} },
      "aspects": [ { "a":"太阳","b":"月亮","type":"对分相","angle":180,"orb":2.4 } ]
    },
    "vedic": {
      "ayanamsa": 23.86,
      "lagna": "天秤座",
      "ascSid": 204.1,
      "planets": [
        { "key":"moon","name":"月亮","sid":334.2,"sign":"双鱼座","signIndex":11,
          "degree":{"degrees":4,"minutes":14},"nakshatra":"列瓦蒂","nakIndex":26,
          "pada":2,"house":6,"retro":false }
      ],
      "dashas": [ { "lord":"罗睺","years":18,"start":"...","end":"..." } ]
    },
    "vedicD9": { "id":"D9","lagna":"...","planets":[...] },
    "vedicVargas": { "D2":{...},"D3":{...},"D4":{...},"D7":{...},
                     "D9":{...},"D10":{...},"D12":{...},"D60":{...} },
    "westernHarmonics": { "H1":{...}, ... "H12":{...} },
    "ziwei": {
      "soul":"禄存","body":"文昌","fiveElementsClass":"土五局",
      "lunarDate":"...","chineseDate":"...",
      "palaces":[
        { "name":"命宫","heavenlyStem":"甲","earthlyBranch":"寅","isBodyPalace":false,
          "decadal":{"range":[5,14],"heavenlyStem":"戊","earthlyBranch":"寅"},
          "majorStars":[{"name":"紫微","brightness":"旺","mutagen":""}],
          "minorStars":[...], "adjectiveStars":["..."] }
      ]
    },
    "analysis": { "planets":[{"name":"太阳","dignity":"入庙"}], "chartRuler":{"planet":"火星","house":9}, "counts":{"element":{"火":4}},"patterns":[{"type":"T 三角","planets":["月亮","金星","木星"]}], "notice":"..." },
    "meta": {
      "utc":"...",
      "input": { "...": "回显", "corrections": {...}, "ziweiTimeIndex": 6, "ziweiSolarClock":"12:05" }
    }
  },
  "notice": "Independent implementation ..."
}
```

要点：
- `houseSystem` 可选 `placidus`（默认）、`porphyry`（|lat|>66° 或迭代失败时自动回退）、`whole`（整宫）、`equal`（等宫）。
- `analysis` 为结构分析：每颗行星的庙旺落陷、命主星、元素/模式计数、大三角/T 三角/星群格局。
- `aspects` 只含五类主相位，容许度 8/5/6/6/8。
- `ziwei` 失败时返回 `{ "error": "紫微排盘失败: ..." }`，不影响其他盘。
- `vedicD9` 与 `vedicVargas.D9` 相同对象。

---

## POST /api/synastry/chart

```json
{ "a": <出生输入>, "b": <出生输入>, "mode": "synastry" }
```

`mode`: `synastry` | `composite` | `davison` | `midpoint`（当前 midpoint 降级为 composite，并在 `limitations` 标注）。

返回：

```json
{
  "ok": true,
  "mode": "synastry",
  "persons": { "a": { "western": {...}, "vedic": {...}, "ziwei": null }, "b": {...} },
  "western": {
    "interAspects": [ { "a":"太阳","b":"月亮","type":"三分相","angle":120,"orb":1.2 } ],
    "chart": { ... },        // 按 mode 选择的盘
    "composite": { ... }     // 始终附带组合盘
  },
  "vedic": {
    "a": { "d1": {...}, "d9": {...} },
    "b": { "d1": {...}, "d9": {...} },
    "koota": {
      "total": 14.5, "max": 36,
      "items": [ { "key":"varna","zh":"心性层级","max":1,"score":1,"note":"..." } ],
      "moon": { "a": {...}, "b": {...} },
      "note": "八科为传统配对规则；..."
    }
  },
  "ziwei": null,
  "limitations": "..."
}
```

八科顺序固定：Varna(1)、Vashya(2)、Tara(3)、Yoni(4)、Graha Maitri(5)、Gana(6)、Bhakoot(7)、Nadi(8)。`Tara`、`Graha Maitri` 可能出现 0.5 分，`total` 保留一位小数。

---

## POST /api/daily

请求体为出生输入 + 可选 `date: "YYYY-MM-DD"`（缺省取 UTC 当天）。

```json
{ "date":"2026-10-28","sub":{"career":68,"wealth":71,"love":52,"health":80},
  "overall":68,"card":"木星·丰饶轮","position":1,"color":"竹青","number":7,
  "yi":"整理与断舍离","ji":"旧事重提","summary":"稳中有进" }
```

同一 `dateStr|timeStr|timeUnknown|useSolarTime|gender|lat|lon|tz` 与同一天 → 结果固定（FNV-1a + mulberry32）。

---

## POST /api/energy

```json
{ "chakras":[{"key":"root","zh":"海底轮","theme":"安全感与生存根基","score":61,"status":"平衡"}],
  "fieldStrength":58,"polarity":"阴阳均衡","dominant":"火",
  "interference":"太阳刑冲月亮","weakest":"眉心轮",
  "notice":"公开公式的娱乐化建模，不构成健康建议。" }
```

评分：基础 55；星座内度数 +0~8；角宫 +10、续宫 +4、其他 −2；逆行 −9；和谐相位 +5/个、张力 −5/个；再加 `hash32(输入串+脉轮键)%13-6` 的确定性扰动；夹在 22–96。

---

## POST /api/local-report

返回 `structure`：

```json
{ "kind":"local-template",
  "notice":"此报告由公开客户端兜底模板复现，非原站服务端 AI 输出。",
  "sections": {
    "w-persona": ["..."], "w-career": ["..."], "w-wealth": ["..."],
    "w-love": ["..."], "w-health": ["..."], "z-palaces": ["..."],
    "z-mutagen": ["..."], "w-risks": ["..."], "v-dasha": ["..."]
  } }
```

章节 ID 与原站前端 `LOCKED_SECTIONS` 对齐，便于对照。

---

## POST /api/timeline

请求体为出生输入 + 可选 `months`（默认 24）。

```json
{
  "birthYear": 2000,
  "window": { "fromTs": 0, "toTs": 0 },
  "nowTs": 0,
  "zDecades": [ {"name":"命宫","branch":"寅","startYear":2004,"endYear":2013} ],
  "vDashas": [ {"lord":"罗睺","startTs":0,"endTs":0,"current":true} ],
  "wEvents": [ {"ts":0,"label":"木星刑上升","system":"west"} ],
  "flowBands": [ {"label":"2026","palace":"官禄","startTs":0,"endTs":0} ],
  "bounds": [ {"ts":0,"label":"罗睺 大运","system":"vedic"} ],
  "resonances": [ {"startTs":0,"endTs":0,"label":"共振：...","systems":["west","vedic"],"count":2} ],
  "notice": "..."
}
```

实现口径：木/土对本命日、月、上升、中天的 0/90/120/180 过运，8 天采样 + 二分细化；紫微大限按虚岁折算；共振＝不同体系事件 14 天内聚簇（至少两个体系）。

---

## POST /api/ziwei-flow

```json
{ "dateStr":"2000-08-16", "ziweiTimeIndex":6, "gender":"女", "flowYear":2026 }
```

返回 `year / ganZhi / yearly{index,heavenlyStem,earthlyBranch,palaceNames,mutagen,stars} / decadal / age`。

---

## POST /api/export

请求体为出生输入 +：

| 字段 | 说明 |
|---|---|
| format | `md`（默认）或 `html` |
| save | 为 true 时只保存并返回 `{ok,id}`，不返回正文 |

返回 `text/markdown` 或 `text/html` 正文，可直接 `curl -o report.md`。

```sh
curl -X POST http://127.0.0.1:8765/api/export -H 'content-type: application/json' \
  -d '{"Y":2000,"M":8,"D":16,"gender":"女","format":"md","city":{"lat":31.23,"lon":121.47,"tz":8}}' \
  -o report.md
```

## 历史记录

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/history?limit=20` | 列出记录（新→旧） |
| GET | `/api/history/<id>` | 读取单条 |
| POST | `/api/history` | 保存 `{kind,label,payload}`，返回 `{ok,id}` |

ID 格式 `YYYYMMDDHHMMSS-xxxxxx`，落在项目 `data/` 目录；非法 ID 返回 404。

## 其他

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api` | 接口索引与未实现清单 |
| GET | `/openapi.json` | OpenAPI 3.0.3 描述（手工维护，非自动生成） |
| GET | `/health` | 健康检查 |

## POST /api/ziwei

单独计算紫微盘（前端用于渐进加载：先用 `skipZiwei: true` 拿三盘主体，再异步补紫微）。

```json
{ "dateStr":"2000-08-16", "timeIndex":6, "gender":"女" }
```
农历输入可改为传 `calendar:"lunar", Y,M,D,leapMonth`。

## 地区解析（中国省市区县）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/geo/provinces` | 34 个省级行政区 |
| GET | `/api/geo/cities?p=330000` | 该省地级市（直辖市返回空，区县直接挂在省下） |
| GET | `/api/geo/counties?c=330100` | 该市或直辖市的区县 |
| GET | `/api/geo/resolve?p=&c=&d=` | 返回 `{label,lat,lon,tz,datum,note}` |
| GET | `/api/geo/search?q=杭州` | 关键词模糊搜索城市/区县，返回 `province` / `provinceCode` / `city` / `cityCode` 便于前端联动 |

坐标来源为公开行政区划坐标（GCJ-02），与原站同一数据源；GCJ-02 与 WGS84 相差数百米，对宫位影响可忽略。

## 性能与响应头

- 所有接口返回 `x-compute-ms`（服务端计算耗时，不含网络）
- 响应体 >1 KB 且客户端 `Accept-Encoding: gzip` 时自动 gzip，并带 `Vary: Accept-Encoding`
- 盘面结果进程内缓存 10 分钟，键为出生输入哈希；`POST /api/cache/clear` 可清空
- `/api/timeline` 另有独立结果缓存（同一输入第二次约 4 ms）

## GET /api/validate

运行 11 项内置校验并返回逐项结果：

```json
{ "passed":11, "total":11, "ok":true,
  "checks":[{"name":"太阳黄经 春分 2000","pass":true,"detail":"实测 359.9998°…"}],
  "generatedAt":"..." }
```

覆盖：二分二至太阳黄经、Placidus 宫头单调、Vimshottari 合计 120 年、首运与月宿主星一致、八分盘取值范围、H1 与本体一致、农历双向转换、同盘合盘可算。

## 未实现

| 路径 | 返回 |
|---|---|
| `/api/report` | 501，原站 AI 报告与提示词非公开 |
| `/api/synastry/report` | 501，同上 |

## 错误格式

```json
{ "error": "需要有效出生年月日时和城市经纬度/时区" }
```
HTTP 400 参数错误，404 未知路径，413 请求过大，501 未实现。

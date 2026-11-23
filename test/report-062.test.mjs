// v0.62.0 报告速览：指标与要点只能来自已算好的字段，章号锚点必须落在真实章节上。
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBrief,briefHtml} from '../assets/console/report-brief.js';

const sections=[
 {title:'一、命局总览与格局'},{title:'二、命局根基：三垣与四柱力量来源'},{title:'三、性格与天赋'},
 {title:'四、事业方向'},{title:'五、财富模式'},{title:'六、婚姻与六亲'},{title:'七、健康与调候'},
 {title:'八、神煞详解'},{title:'九、大运逐运详批（每步十年）'},{title:'十、流年逐年详批（未来十年）'}
];
const baziState={
 reading:{
  bazi:{
   dayMaster:{stem:'丙',element:'火'},
   strength:{support:38.125,kind:'身弱',useful:['木','火'],caution:['土','金']},
   pillars:[{name:'月柱',stem:'己',branch:'未'}],
   cycles:[
    {stem:'庚',branch:'申',startYear:1994,startUtc:'1994-07-30T00:00:00Z',endUtc:'2004-07-29T00:00:00Z'},
    {stem:'癸',branch:'亥',startYear:2024,startUtc:'2024-07-29T00:00:00Z',endUtc:'2034-07-29T00:00:00Z'}
   ]
  }
 }
};
const baziReport={gege:'正印格',sections};

test('八字速览：指标取自盘面字段，要点挂回真实章节',()=>{
 const b=buildBrief({kind:'bazi',state:baziState,report:baziReport});
 assert.ok(b,'八字应能出速览');
 const m=Object.fromEntries(b.metrics.map(x=>[x.k,x.v]));
 assert.equal(m['日主'],'丙火');
 assert.equal(m['原局扶助'],'38.1%');
 assert.equal(m['格局'],'正印格');
 assert.equal(m['当前大运'],'癸亥','按交运时刻定位当前大运，不是按整年猜');
 // 每条要点都要有依据，且章号必须在正文范围里——点到不存在的章比不给链接更糟
 for(const p of b.points){
  assert.ok(p.t.length>6,'要点不能是空话');
  assert.ok(p.ev.length>=2,`${p.t} 要带依据`);
  assert.ok(p.sec>=1&&p.sec<=sections.length,`${p.t} 的章号越界`);
 }
 const day=b.points.find(p=>p.t.includes('日主'));
 assert.equal(day.sec,1,'日主与强弱在第 1 章');
 const luck=b.points.find(p=>p.t.includes('大运'));
 assert.equal(luck.sec,9,'大运要点应落在第 9 章');
 assert.ok(luck.t.includes('癸亥')&&luck.t.includes('2024'),'大运要点要写清干支与起止');
 assert.equal(b.actions.length,3);
 assert.deepEqual(b.actions.map(a=>a.k),['cal:general','period','copy']);
});

test('紫微/印占/西占：各自给关键指标，不硬凑四项',()=>{
 const ziwei=buildBrief({kind:'ziwei',state:{reading:{ziwei:{
  fiveElementsClass:'金四局',
  palaces:[{name:'命宫',earthlyBranch:'申',heavenlyStem:'甲',majorStars:[{name:'破军'}]},
   {name:'身宫',earthlyBranch:'寅',isBodyPalace:true}],
  sihua:[{star:'天机',type:'忌',palace:'父母'}],
  decades:[{palaceName:'田宅',ageRange:[34,43],yearRange:[2021,2030]}]
 }}},report:{sections:[{title:'一、命盘总览'},{title:'二、三方四正'},{title:'三、生年四化'}]}});
 assert.ok(ziwei);
 const zm=Object.fromEntries(ziwei.metrics.map(x=>[x.k,x.v]));
 assert.equal(zm['命宫'],'申宫');
 assert.equal(zm['五行局'],'金四局');
 assert.ok(ziwei.points.some(p=>p.t.includes('化忌')),'生年忌要单独点出来');
 assert.ok(ziwei.points.every(p=>p.sec>=1&&p.sec<=3),'紫微要点也要落在真实章节');

 const vedic=buildBrief({kind:'vedic',state:{reading:{vedic:{
  lagna:'天蝎座',planets:[{key:'moon',nakshatra:'哈斯塔',pada:1,nakLord:'月亮'}],
  dashas:[{lord:'木星',start:'2021-01-30T00:00:00Z',end:'2037-01-30T00:00:00Z'}]
 }}},report:{yogas:[{name:'Raja Yoga'}],sections:[{title:'一、上升主轴'},{title:'二、大运逐运详批'},{title:'三、Yoga 命格'}]}});
 assert.ok(vedic);
 const vm=Object.fromEntries(vedic.metrics.map(x=>[x.k,x.v]));
 assert.equal(vm['上升'],'天蝎座');
 assert.equal(vm['当前大运'],'木星运');
 assert.equal(vm['成立命格'],'1 组');

 const west=buildBrief({kind:'west',state:{reading:{
  western:{planets:[{key:'sun',sign:'巨蟹座',house:9},{key:'moon',sign:'处女座',house:12}],asc:{sign:'天蝎座'},mc:{sign:'狮子座'}},
  analysis:{elements:{percentages:{火:30,土:20,风:20,水:30},dominant:['火','水']},chartRuler:{planet:'火星',dignity:'入庙',house:5}}
 }},report:{sections:[{title:'一、核心三要素'},{title:'二、逐星解读'},{title:'三、相位与格局'}]}});
 assert.ok(west);
 assert.ok(west.points.some(p=>p.t.includes('元素')),'元素分布要单独一条');
 assert.ok(west.points.some(p=>p.t.includes('命主星')),'命主星要单独一条');
});

test('合盘速览：契合度与最突出的合来自同一份 fit',()=>{
 const b=buildBrief({kind:'synastry',state:{chartState:{synastry:{fit:{
  percent:90,total:32.5,max:36,highlight:'乙庚 · 天干五合',
  insights:[{name:'互动助力',text:'乙庚 · 天干五合'},{name:'相处留意',text:'子午 · 六冲'}]
 }}}},report:{sections:[{title:'一、关系总览'}]}});
 assert.ok(b);
 const m=Object.fromEntries(b.metrics.map(x=>[x.k,x.v]));
 assert.equal(m['契合度'],'90%');
 assert.equal(m['最突出的合'],'乙庚 · 天干五合');
 assert.ok(b.points.some(p=>p.t.includes('相处留意')));
 assert.deepEqual(b.actions.map(a=>a.k),['cal:wedding','period','copy'],'合盘默认落到嫁娶择日');
});

test('数据不全时宁可不给速览，也不编造指标',()=>{
 assert.equal(buildBrief({kind:'bazi',state:{},report:{}}),null);
 assert.equal(buildBrief({kind:'unknown-system',state:baziState,report:baziReport}),null);
 const thin=buildBrief({kind:'vedic',state:{reading:{vedic:{}}},report:{sections:[]}});
 assert.equal(thin,null,'没有任何字段时不出速览');
});

test('速览 HTML：章号可点、依据可见、文案转义',()=>{
 const html=briefHtml({metrics:[{k:'日主',v:'丙火',s:'本命'}],
  points:[{t:'日主丙火<script>alert(1)</script>',ev:['扶助 38.1%'],sec:3}],
  actions:[{k:'cal:general',label:'去择日'}]});
 assert.match(html,/data-toc="3"/,'要点要能跳章');
 assert.match(html,/第 03 章/);
 assert.match(html,/依据：扶助 38\.1%/);
 assert.doesNotMatch(html,/<script>/,'正文里出现的标签必须转义');
 assert.match(html,/data-brief-act="cal:general"/);
});

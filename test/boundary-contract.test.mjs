import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {baziPro} from '../src/bazi-pro.mjs';
import {buildBaziDeepReport} from '../www/js/deep-bazi.js';

const read=(p)=>readFile(new URL(p,import.meta.url),'utf8');
const CITY={label:'北京',lat:39.9,lon:116.4,tz:8};
const pillars=(Y,M,D,h,mi,extra={})=>{
 const r=baziPro({birth:{Y,M,D,h,mi,gender:'男',city:CITY,calendar:'solar',...extra}});
 return {gz:r.pillars.map(p=>p.stem+p.branch).join(' '),r};
};

test('交界用例回归：立春交节前后按时刻换年柱与月柱',()=>{
 const before=pillars(2024,2,4,16,25),after=pillars(2024,2,4,16,27);
 assert.equal(before.gz.split(' ')[0],'癸卯','交节前仍属癸卯年');
 assert.equal(before.gz.split(' ')[1],'乙丑','交节前仍属丑月');
 assert.equal(after.gz.split(' ')[0],'甲辰','交节后换甲辰年');
 assert.equal(after.gz.split(' ')[1],'丙寅','交节后换寅月');
});

test('交界用例回归：晚子时归次日与归当日应给出不同日柱',()=>{
 const next=pillars(2024,3,1,23,30,{lateZishi:'next-day'}).gz.split(' ')[2];
 const current=pillars(2024,3,1,23,30,{lateZishi:'current-day'}).gz.split(' ')[2];
 assert.notEqual(next,current,'两种晚子时口径必须换日柱');
});

test('交界用例回归：1988 夏令时跳时不存在的钟表时刻必须报错而非偷算',()=>{
 for(const dst1988Rule of ['iana','apr10']){
  assert.throws(()=>pillars(1988,4,17,2,30,{dst1988Rule}),/不存在|夏令时/);
 }
});

test('交界用例回归：农历闰月与非闰月给出不同公历与月柱，无效日期被拒',()=>{
 const leap=baziPro({birth:{Y:2023,M:2,D:15,h:10,mi:30,gender:'男',city:CITY,calendar:'lunar',leapMonth:true}});
 const normal=baziPro({birth:{Y:2023,M:2,D:15,h:10,mi:30,gender:'男',city:CITY,calendar:'lunar',leapMonth:false}});
 assert.equal(leap.info.solar,'2023-04-05');
 assert.equal(normal.info.solar,'2023-03-06');
 assert.notEqual(leap.pillars[1].stem+leap.pillars[1].branch,normal.pillars[1].stem+normal.pillars[1].branch);
 assert.throws(()=>baziPro({birth:{Y:2023,M:2,D:30,h:10,mi:30,gender:'男',city:CITY,calendar:'lunar',leapMonth:true}}));
});

test('交界用例回归：真太阳时在远离东经120度处应换时柱',()=>{
 const west=baziPro({birth:{Y:1990,M:5,D:20,h:10,mi:30,gender:'男',city:{label:'乌鲁木齐',lat:43.8,lon:87.6,tz:8},calendar:'solar',useSolarTime:true}});
 const east=pillars(1990,5,20,10,30,{useSolarTime:true}).r;
 assert.equal(east.pillars[3].stem+east.pillars[3].branch,'辛巳');
 assert.equal(west.pillars[3].stem+west.pillars[3].branch,'庚辰','经度校正后应换时柱');
 assert.equal(west.info.correction.corrected,true);
});

test('打包契约：显示名、privacy 清单、CSS/源码副本与资源引用全部正确',async()=>{
 const plist=await read('../ios-src/Info.plist');
 assert.match(plist,/<key>CFBundleDisplayName<\/key>\s*<string>星谕<\/string>/);
 assert.match(plist,/<key>CFBundleName<\/key>\s*<string>FirstLight<\/string>/);
 assert.doesNotMatch(plist,/UIUserInterfaceStyle/,'不应强制浅色');
 const yml=await read('../project.yml');
 assert.match(yml,/PrivacyInfo\.xcprivacy/);
 assert.match(yml,/INFOPLIST_KEY_CFBundleDisplayName: 星谕/);
 const privacy=await read('../ios-src/PrivacyInfo.xcprivacy');
 assert.match(privacy,/NSPrivacyAccessedAPICategoryUserDefaults/);
 const flow=await read('../.github/workflows/build-ipa.yml');
 assert.match(flow,/cp assets\/console\/design\.css assets\/console\/liquid\.css/,'liquid.css 必须入包');
 assert.match(flow,/rm -f www\/js\/rules\.js www\/js\/deep-\*\.js/,'源码副本不得入包');
 assert.match(flow,/CFBundleDisplayName='星谕'/);
 assert.match(flow,/\(app \/ name\)\.exists\(\)/,'CI 应检查隐私清单存在');
 const html=await read('../index.html');
 assert.doesNotMatch(html,/user-scalable=no/,'必须允许双指缩放');
 for(const m of html.matchAll(/(?:href|src)="\/([^"]+)"/g)){
  const path=m[1];
  if(path.startsWith('js/')||path.startsWith('assets/')){
   const source=await read('../'+path).catch(()=>null);
   assert.ok(source,'index.html 引用的资源必须在源码中存在: '+path);
  }
 }
 const release=JSON.parse(await read('../app-release.json'));
 assert.equal(release.name,'星谕 FirstLight');
});

test('专业细盘：神煞扩充、查法披露、扶抑口径与仇神闲神角色齐备',()=>{
 const r=baziPro({birth:{Y:1990,M:5,D:20,h:10,mi:30,gender:'男',city:CITY,calendar:'solar'}});
 const all=r.pillars.flatMap(p=>p.shensha||[]);
 for(const name of ['将星','亡神','金舆','学堂'])assert.ok(all.includes(name),'应检出扩充神煞: '+name);
 assert.match(r.shenshaMethod,/魁罡|纳音|长生/);
 assert.match(r.strength.approach,/扶抑/);
 assert.ok(Array.isArray(r.strength.roles.useful)&&Array.isArray(r.strength.roles.avoid));
 assert.ok(Array.isArray(r.strength.roles.enemy)&&Array.isArray(r.strength.roles.idle));
 assert.match(r.strength.roles.note,/仇神/);
 const report=buildBaziDeepReport(r);
 const text=report.sections.map(s=>(s.lines||[]).join('')+(s.html||'')).join('');
 assert.match(text,/取用口径：/);
 assert.match(text,/十神角色补全：/);
 assert.match(text,/查法口径：/);
 assert.doesNotMatch(text,/undefined|NaN/);
});

test('盘面语义：传统五行色为默认、品牌粉可切、口径条与深色层已挂载',async()=>{
 const css=await read('../assets/console/design.css');
 assert.match(css,/--wood:#2f7d46;--fire:#c53a2f;--earth:#a87614;--metal:#7a8391;--water:#2b5fa8/);
 assert.match(css,/html\[data-palette=pink\]\{--wood:#a44a86/);
 assert.match(css,/\.time-basis-note\{/);
 assert.match(css,/@media \(prefers-color-scheme:dark\)/);
 assert.doesNotMatch(css,/NaNpx/,'字号替换不得产生非法字号');
 const app=await read('../assets/console/app.js');
 assert.match(app,/dataset\.palette=state\.settings\.palette==='pink'\?'pink':'traditional'/);
 assert.match(app,/真太阳时未启用|new Date\(\)/);
 const bazi=await read('../assets/console/bazi.js');
 assert.match(bazi,/function timeBasis\(/);
 const ziwei=await read('../assets/console/ziwei.js');
 assert.match(ziwei,/时间口径：真太阳时/);
 const trend=await read('../assets/console/trend-chart.js');
 assert.match(trend,/var\(--fl-useful\)/);
 assert.match(css,/\[data-e=木\]\{color:var\(--wood\)!important/,'干支必须按 data-e 着色，不能被品牌粉覆盖');
 const liquid=await read('../assets/console/liquid.css');
 assert.match(liquid,/\.sheet\.liquid-glass,\.drawer\.liquid-glass\{background:linear-gradient\(180deg,rgba\(36,29,42/,'深色弹层必须覆盖 liquid.css 的 !important 浅色层');
});

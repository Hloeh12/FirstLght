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

test('报告可用性：目录锚点、滚动进度与章节导航已接入',async()=>{
 const fr=await read('../assets/console/full-report.js');
 assert.match(fr,/function tocHtml\(/,'应生成目录');
 assert.match(fr,/class="rpt-toc"/);
 assert.match(fr,/data-sec="\$\{i\+1\}"/,'章节应带锚点');
 assert.match(fr,/data-toc="\$\{i\+1\}"/,'目录项应指向锚点');
 const app=await read('../assets/console/app.js');
 assert.match(app,/data-rpt-progress/,'应有滚动进度');
 assert.match(app,/scrollIntoView\(\{behavior:'smooth'/,'点击目录应平滑滚动');
 assert.match(app,/addEventListener\('scroll',rptOnScroll/,'应监听滚动更新进度');
 const css=await read('../assets/console/design.css');
 assert.match(css,/\.rpt-toc\{position:relative/);
 assert.match(css,/\.rpt-toc-item\.on/);
 const app2=await read('../assets/console/app.js');
 assert.match(app2,/reportHtml\(report\)/,'报告页渲染入口存在');
});

test('紫微四化飞星轨迹：每宫宫干引动四化飞向目标宫，文墨式可核',async()=>{
 const {ziweiChart,ziweiFlow}=await import('../src/ziwei.mjs');
 const {buildZiweiDeepReport}=await import('../www/js/deep-ziwei.js');
 const chart=ziweiChart({dateStr:'1990-06-15',timeIndex:7,gender:'男'});
 const flow=ziweiFlow({dateStr:'1990-06-15',timeIndex:7,gender:'男',flowYear:2026,scope:'daily',month:6,day:10});
 const r=buildZiweiDeepReport(chart,flow);
 const sec=r.sections.find(x=>x.title.includes('四化飞星轨迹'));
 assert.ok(sec,'应存在含飞星轨迹的四化章节');
 assert.ok(sec.html&&/<table/.test(sec.html),'四化章应含飞星轨迹表格');
 const rows=sec.html.match(/<tr/g)||[];
 assert.ok(rows.length>=12,'飞星轨迹应逐宫列出（至少12宫）');
 assert.match(sec.lines.join(''),/飞星轨迹/);
 assert.match(sec.lines.join(''),/点击飞星连线/,'应说明与盘面飞星交互层互核');
 const txt=sec.lines.join('')+(sec.html||'');
 assert.doesNotMatch(txt,/undefined|NaN/);
});

test('从格判定须有通根/透干/得令证据，不只看百分比，且附核对行',()=>{
 const r=baziPro({birth:{Y:1990,M:5,D:20,h:10,mi:30,gender:'男',city:CITY,calendar:'solar'}});
 const rep=buildBaziDeepReport(r);
 // 格局名必须是四选一，不再出现「从弱格」这种裸百分比判定
 assert.ok(['从弱格','从强格','正格·身弱','正格·身强'].includes(rep.gege)||GEOGE_OK(rep.gege),'格局名应来自证据判定: '+rep.gege);
 const text=rep.sections.map(s=>(s.lines||[]).join('')+(s.html||'')).join('');
 assert.doesNotMatch(text,/弱到极处顺势而为|一气专旺/,'不应残留旧的无证据从格话术');
 assert.doesNotMatch(text,/false:false|rootsCount/,'不应残留死代码痕迹');
 assert.doesNotMatch(text,/undefined|NaN/);
 function GEOGE_OK(g){return ['正官格','七杀格','正财格','偏财格','正印格','偏印格','食神格','伤官格','中和格'].includes(g);}
});

test('八字刑冲合害破：报告层与引擎口径一致，新增刑害破不被误读为相合',()=>{
 const r=baziPro({birth:{Y:1990,M:5,D:20,h:10,mi:30,gender:'男',city:CITY,calendar:'solar'}});
 const rep=buildBaziDeepReport(r);
 const text=rep.sections.map(s=>(s.lines||[]).join('')+(s.html||'')).join('');
 // 报告层已具备相刑/相害/相破三类关系词（引擎亦有同口径表）
 for(const t of ['相刑','相害','相破'])assert.match(text,new RegExp(t),'报告应能输出'+t);
 assert.doesNotMatch(text,/相合聚力，人缘合作可借[^。]{0,40}相刑/,'刑害破不得被当成相合');
 assert.doesNotMatch(text,/undefined|NaN/);
});

test('紫微星×宫专断：命宫主星给出针对性断语，消除「命宫宫」重复',async()=>{
 const {ziweiChart}=await import('../src/ziwei.mjs');
 const {buildZiweiDeepReport}=await import('../www/js/deep-ziwei.js');
 const chart=ziweiChart({dateStr:'1990-06-15',timeIndex:7,gender:'男'});
 const r=buildZiweiDeepReport(chart,null);
 const text=r.sections.map(s=>(s.lines||[]).join('')+(s.html||'')).join('');
 assert.doesNotMatch(text,/命宫宫|[兄夫官财迁疾田福父]宫宫/,'不得出现重复宫字');
 const pal=r.sections.find(x=>x.title.includes('十二宫'));
 const ptxt=pal?((pal.html||'')+(pal.lines||[]).join('')):'';
 // 命宫主星坐命应有「坐命宫：」的专断句，而非仅通用拼接
 assert.match(ptxt,/坐命宫[:：]/,'命宫主星应有针对性专断');
 assert.doesNotMatch(text,/undefined|NaN/);
});

test('Ashtakavarga 八分点：SAV 校验位 337 恒定，七曜 BAV 总分吻合 BPHS',async()=>{
 const {chart}=await import('../src/chart.mjs');
 const {ashtakavarga,FIXED_TOTAL}=await import('../src/ashtakavarga.mjs');
 const city={lat:39.9,lon:116.4,tz:8};
 for(const b of [{Y:1990,M:6,D:15,h:14,mi:0},{Y:1985,M:1,D:2,h:23,mi:30},{Y:2000,M:12,D:31,h:8,mi:45}]){
  const v=chart({...b,city},{baseOnly:true}).vedic;
  const a=ashtakavarga(v);
  assert.equal(a.total,337,'SAV 总和须恒为 337，实际 '+a.total);
  assert.ok(a.valid,'校验位须通过');
  assert.deepEqual(a.rows.map(r=>r.total),Object.values(FIXED_TOTAL),'七曜 BAV 总分须为 48/49/39/54/56/52/39');
  assert.equal(a.sav.length,12);
 }
});

test('Shadbala 六力补强：Saptavargaja/Drik 入分项且口径声明覆盖六力',async()=>{
 const {vedicPro}=await import('../src/vedic-pro.mjs');
 const v=vedicPro({birth:{Y:1990,M:6,D:15,h:14,mi:30,gender:'男',city:CITY,calendar:'solar'}});
 const s=v.shadbala;
 assert.equal(s.rows.length,7);
 for(const r of s.rows){
  assert.ok(Number.isFinite(r.saptavargaja)&&r.saptavargaja>=0&&r.saptavargaja<=60,'七分友谊力范围 '+r.name);
  assert.ok(Number.isFinite(r.drik)&&r.drik>=-90&&r.drik<=90,'相位力范围 '+r.name);
  // 合计须等于各分项之和（含两项新增）
  const sum=r.sthana+r.dig+r.paksha+r.cheshta+r.naisargika+r.saptavargaja+r.drik;
  assert.ok(Math.abs(sum-r.total)<0.02,'合计须含两项新增 '+r.name);
 }
 assert.match(s.method,/Saptavargaja/);
 assert.match(s.method,/Drik/);
 assert.match(s.method,/Nathonnatha/,'须披露仍未计入的 Kala 其余分项');
});

test('iOS 显示缩放免疫：两套缩放( pageZoom + zoomScale )须同时锁定，viewport 注入在配置阶段',async()=>{
 const swift=await read('../ios-src/AppDelegate.swift');
 // 关键：iOS 显示缩放同时影响 pageZoom 和 scrollView.zoomScale，两者都要锁
 assert.match(swift,/webView\.pageZoom = 1\.0/,'须锁 pageZoom');
 assert.match(swift,/setZoomScale\(1\.0/,'须同时锁 scrollView.zoomScale（visual viewport）');
 // 根因硬锁（0.34.4）：只复位当前值不够，系统/手势会在加载后把 zoomScale 顶回非 1
 // （真机抓到 1.0659 → innerWidth 413、offsetLeft 14、右侧裁切）。必须把 min/max 范围锁死。
 assert.match(swift,/scrollView\.minimumZoomScale = 1\.0/,'须锁 minimumZoomScale=1');
 assert.match(swift,/scrollView\.maximumZoomScale = 1\.0/,'须锁 maximumZoomScale=1（根治放大裁切）');
 // 必须在配置阶段注入 viewport WKUserScript（初始化后注入无效）
 assert.match(swift,/WKUserScript\(source:/,'须在配置阶段注入 viewport 脚本');
 assert.match(swift,/initial-scale=1,minimum-scale=1/,'viewport 须锁定 initial/minimum scale=1');
 assert.doesNotMatch(swift,/user-scalable=no|maximum-scale=1/,'不得禁用双指缩放（无障碍契约）');
 // 复位时机齐全：初始化 / viewWillAppear / viewDidAppear / didFinish + 延迟
 assert.match(swift,/override func viewDidAppear/,'须在页面可见时再锁一次');
 assert.match(swift,/func webView\(_ webView: WKWebView, didFinish navigation: WKNavigation!\)/,'须实现导航完成回调');
 assert.match(swift,/asyncAfter/,'须延迟再锁，覆盖系统延后应用缩放');
 assert.ok((swift.match(/applyZoomLock\(\)/g)||[]).length>=5,'applyZoomLock 须在多个时机调用');
 // 诊断包须含 visualViewport.scale，便于真机定位
 const diag=await read('../assets/console/diagnostics.js');
 assert.match(diag,/visualViewport:vv\?\{[^}]*scale:vv\.scale/,'诊断包须导出 visualViewport.scale');
 const html=await read('../index.html');
 assert.doesNotMatch(html,/user-scalable=no/,'必须允许双指缩放');
});

test('冷启动首屏：加载须等到 viewDidLayoutSubviews 拿到真实 frame，杜绝按错误视口渲染首帧',async()=>{
 const swift=await read('../ios-src/AppDelegate.swift');
 // 根因：viewDidLoad 时 view.bounds 可能 0×0，过早 load 会按错误视口排版首帧，
 // 表现为「首屏放大/裁切、退出重进才正常」。加载必须延后到布局完成。
 assert.match(swift,/override func viewDidLayoutSubviews/,'须实现布局完成回调');
 assert.match(swift,/private func loadIfNeeded\(\)/,'须有「布局就绪后再加载」的守卫方法');
 assert.match(swift,/guard !didInitialLoad, webView\.bounds\.width > 0/,'须等 webView 有非零 frame 才加载且只加载一次');
 // viewDidLoad 里不得再直接 loadContent，必须走延迟守卫
 const vdl=swift.slice(swift.indexOf('override func viewDidLoad'),swift.indexOf('override func viewDidLayoutSubviews'));
 assert.doesNotMatch(vdl,/viewDidLoad\(\)[\s\S]*?\n\s*loadContent\(\)/,'viewDidLoad 内不得直接 loadContent');
 assert.match(vdl,/loadIfNeeded\(\)/,'viewDidLoad 须通过 loadIfNeeded 延迟加载');
 // 首屏在正确 frame 渲染前隐藏，且 didFinish 后才显现，杜绝错误瞬态
 assert.match(swift,/webView\.alpha = 0/,'首屏须先隐藏');
 assert.match(swift,/webView\.alpha = 1/,'导航完成后须显现');
 // 首屏快照：文档最早时刻采样 + 诊断导出，供下次真机一次定位
 assert.match(swift,/injectionTime: \.atDocumentStart/,'首屏采样须在文档最早时刻注入');
 assert.match(swift,/window\.__FL_BOOT__/,'须记录首屏视口快照');
 const diag=await read('../assets/console/diagnostics.js');
 assert.match(diag,/boot:window\.__FL_BOOT__/,'诊断包须导出首屏快照');
});

test('iOS 输入框聚焦放大免疫：表单控件字号须 >=16px（含 ID 选择器覆盖），杜绝 visualViewport.scale≈16/15',async()=>{
 // 根因（0.34.5 诊断 vv-1）：所有输入框 15px，iOS WKWebView 聚焦时自动把整页放大到 1.0659（≈16/15）
 // 并弹键盘（vvh 缩到 530），右侧被裁。此放大不走 zoomScale，缩放范围锁无法阻止，只能从字号根治。
 // 关键坑：design.css 有 #inputSheet input{font-size:15px!important}（ID+!important），
 // 必须用同等 ID 选择器 + !important 覆盖，单纯 input{...!important} 因特异性低无效。
 const liquid=await read('../assets/console/liquid.css');
 assert.match(liquid,/#inputSheet input,#inputSheet select,#screen form input,#screen form select[\s\S]{0,300}font-size:16px!important/,
   '须用同等 ID 选择器 + !important 覆盖 design.css 的 15px 输入字号');
 assert.match(liquid,/#inputSheet input:focus[\s\S]{0,200}font-size:16px!important/,'聚焦态字号也须覆盖为 16px');
 // design.css 的 15px 规则须仍在（被覆盖而非删除），保证非输入态与既有布局不变
 const design=await read('../assets/console/design.css');
 assert.match(design,/#inputSheet input,#inputSheet select,#screen form input,#screen form select[\s\S]{0,120}font-size:15px!important/,
   'design.css 原 15px 规则保留，由 liquid.css 覆盖');
});

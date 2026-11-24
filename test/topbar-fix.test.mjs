// v0.71.0 顶栏瘦身 + 白边修复 回归测试
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('报告顶栏：功能收进 ••• 菜单，标题占满',async()=>{
 const app=await readFile(new URL('../assets/console/app.js',import.meta.url),'utf8');
 // 顶栏不再直接排 5 个 rpt-act 按钮
 assert.doesNotMatch(app,/rpt-act" data-rpt-find>/,'顶栏不应再有直接排布的功能按钮');
 assert.match(app,/data-rpt-menu aria-label="报告功能"/,'须有 ••• 菜单按钮');
 assert.match(app,/data-rpt-menu-pop hidden/,'须有菜单弹出面板');
 assert.match(app,/<span class="rpt-topbar-title">\$\{esc\(report\.title/,'标题用报告全名');
 // 菜单开合逻辑 + 选中收起
 assert.match(app,/menuPop\.hidden=!open/,'点击 ••• 应切换开合');
 assert.match(app,/const closeMenu=/,'菜单项点击后须收起');
 const css=await readFile(new URL('../assets/console/design.css',import.meta.url),'utf8');
 assert.match(css,/\.rpt-menu\{position:absolute/,'菜单弹出面板样式');
 assert.match(css,/\.rpt-menu\[hidden\]\{display:none\}/,'隐藏态样式');
});

test('报告页白边修复：背景与主界面同色系、容器放宽',async()=>{
 const css=await readFile(new URL('../assets/console/design.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/linear-gradient\(170deg,#fff 0%,#fff8fc/,'不得再留纯白渐变涂层');
 assert.match(css,/linear-gradient\(170deg,#faf8fb/,'背景须与主界面纸色同源');
 assert.match(css,/\.rpt-doc\{max-width:640px/,'正文容器放宽');
 const liquid=await readFile(new URL('../assets/console/liquid.css',import.meta.url),'utf8');
 assert.match(liquid,/background:rgba\(250,248,251/,'顶栏背景同步换色');
});

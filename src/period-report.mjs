import {BAZI_FLOW_RULES as rules} from '../www/js/rules.js';
const riskTypes=new Set(['六冲','相刑','相害','相破']);
const fmt=n=>Number.isFinite(Number(n))?Number(n).toFixed(1):'未提供';
const periodName=selected=>selected.map(p=>p.stem+p.branch+p.name).join('／');
export function buildPeriodReport(data,current,influences,months=[]) {
 const {pillars,strength,natalStrength=strength,selected=[]}=data;
 const day=data.dayMaster??pillars.find(p=>p.name==='日柱')??{};
 const dayStem=day.stem??'日主',dayElement=day.element??'五行待核';
 const difference=Number(strength.support)-Number(natalStrength.support);
 const useful=influences.some(x=>x.affected?.some(y=>y.role==='useful'));
 const caution=influences.some(x=>x.affected?.some(y=>y.role==='caution'));
 const risks=influences.filter(x=>riskTypes.has(x.type));
 const merges=influences.filter(x=>['天干五合','六合','三合局','三会方'].includes(x.type));
 const ten=rules.tenGods[current.tenGod]??['先核对负责人、授权、期限和交付依据，再增加工作量。','核对固定支出、已承诺款项、实际到账和可用余额。','对照双方时间、承诺与责任，逐项协商优先次序。'];
 const commander=pillars.find(p=>p.name==='月柱')?.commander;
 const monthly=months.length?months.map(m=>m.label+'（'+m.stem+m.branch+'）：'+(m.links?.join('、')||'未检出直接关系')+'。按该月实际引动的柱位复核事项，不把单一干支视为事件保证。'):[
  '寅卯辰节气月木气渐旺：木为喜用且条件齐备时，可将准备转成计划、学习与协作；木为忌时避免多线开工。',
  '巳午未节气月火土渐显：检验公开表达、岗位责任和项目承载力；火土过旺时减少透支，决策留复核期。',
  '申酉戌节气月金气转强：适合复盘制度、报价、合同、质量与执行效率；金为忌时避免对抗升级。',
  '亥子丑节气月水气渐进：适合研究、储备、休整和现金流复盘；水为忌时避免信息堆积与无限延期。'
 ];
 const relations=influences.map(link=>{
  const hits=(link.affected??[]).map(hit=>{
   const i=pillars.findIndex(p=>p.name===hit.pillar);
   return hit.pillar+hit.branch+'（'+hit.element+'）：'+(rules.clash[hit.role]??rules.clash.neutral)+' '+(rules.palaces[Math.max(0,i)]??'按实际柱位复核。');
  });
  return link.pattern+link.type+'牵动'+((link.locations??[]).join('、')||'原局相关柱位')+'。'+(rules.relations[link.type]??'须结合完整结构核验。')+' '+hits.join(' ');
 });
 const status=useful?'防守蛰伏期':caution?'破局开拓期':Math.abs(difference)>=8?'转型沉淀期':'转型沉淀期';
 const layer1=[
  '本次选定时段：'+periodName(selected)+'；当期干支 '+current.stem+current.branch+'，天干对日主透出'+current.tenGod+'。日主为'+dayStem+'（'+dayElement+'），原局扶助权重 '+fmt(natalStrength.support)+'%，加入所选岁运后为 '+fmt(strength.support)+'%，变化 '+(difference>0?'+':'')+fmt(difference)+' 个百分点。此比例是本应用五行模型的相对权重，不是传统命理唯一标准，仍须结合月令、通根、透干、藏干司令和合化条件。',
  '日主详解：'+(rules.dayMasters[dayStem]??'日主断语资料不足，仅按已计算权重和干支关系观察，不补造个性断语。'),
  '月令司令：月柱为'+(pillars.find(p=>p.name==='月柱')?.stem??'未明')+(pillars.find(p=>p.name==='月柱')?.branch??'未明')+'。'+(commander?'当前司令为'+commander.stem+'，交'+commander.term.name+'后 '+fmt(commander.elapsedDays)+' 日。':'排盘未提供司令分段，不能臆断当权藏干。')+' 当期透干'+current.stem+'为'+current.tenGod+'，有根且得令时议题较容易落实；无根或受制时可能只是议题浮现，需资源、团队和时间配合。',
  '综合定性为“'+status+'”。'+(useful?'有原局喜用五行受冲证据，先保护稳定支持、现金缓冲和关键协作，修复承载能力后再扩大行动。':caution?'有原局忌神受冲证据，可视为清理低效流程和测试替代渠道的窗口，但不把冲动解释成暴利或必然成功。':'当前没有明确喜忌受冲证据，按月令司令、扶助差值和现实反馈决定节奏，先设阶段目标。')
 ];
 const layer2=[
  '自动扫描发现原局与所选岁运关系 '+influences.length+' 项，其中刑冲害破 '+risks.length+' 项、合会 '+merges.length+' 项。合不等于化，冲也不天然为凶；必须定位参与地支、检查化神与月令，再判断受触动的是喜用还是忌偏。以下只列出模型实际识别的关系，不补造未出现的组合。',
  ...(relations.length?relations:['本节点未检出直接牵动原局的刑冲合会，不强行套用冲忌或用神受制断语。']),
  '喜忌分流必须依据受冲五行：冲及原局忌神或仇神且该五行被强弱模型列入 caution，才可表述为“冲去忌神破局发越，虽有走动动荡，但主打破僵局、脱离旧泥潭、有开拓新财源之象”；冲及原局喜用神且列入 useful，则明确提示“用神受制，防情绪内耗、合同破耗、人际背离、稳守防御”。未归类者保持中性，不得只凭冲字断吉凶。',
  '柱位映射：年柱受触动，复核长辈照顾、家庭协商和外部关系；月柱受触动，复核岗位、团队、上级与组织流程；日柱受触动，复核伴侣身心节奏、共同预算和沟通方式；时柱受触动，复核投资项目、下属协作、晚辈照顾和长期交付。它们是现实核对清单，不是健康诊断或损失预言。',
  '同一柱同时参与冲与合，或一个地支被多种关系牵动时，代表结构复杂度上升，不可简单相互抵消。先检查成局、争合、月令强弱，再按事项可逆性排序：可撤回试行先做，不可逆签约、借贷、迁居或关系决定增加书面核验。'
 ];
 const layer3=[
  '事业职场：'+ten[0]+' '+(useful?'支持条件受冲，优先深耕已验证岗位和客户；若调整，先取得书面 offer、明确汇报关系和试用目标。':caution?'可评估跳槽、转岗或新项目，但先小范围试行；合伙写明股权、决策权、客户归属、知识产权和亏损分担。':'优先积累可迁移能力和作品，晋升或扩张以资源到位、职责明确和可量化验收为条件。')+' 建议设置30—90日里程碑并复盘。',
  '财务资金流：'+ten[1]+' 正财以稳定薪酬、长期合同和持续经营衡量；偏财只适合核验后的小额试验，不能把财星出现当成投机信号。将资金分为日常支出、已承诺款项、应急储备和可投资余额，防回款延迟、重复支出、担保及共同账户不透明。投资决策须服从风险承受力、法规和专业意见。',
  '婚恋情感：'+ten[2]+' 若日支参与冲合刑害，优先讨论日程、家务、居住、照顾责任和共同财务，不以单一星象判断忠诚或分合。每次解决一个具体问题：复述对方诉求、说明自身限制、确定负责人和复核日期；日支未被触动也不制造关系危机。',
  '身心健康：五行旺衰仅作传统文化中的生活节奏提示，不能诊断器官疾病。火势明显时关注睡眠、压力和规律运动；金气偏弱时重视空气质量与呼吸道常规防护；土重时注意饮食节律和久坐；水弱时避免长期熬夜；木受制时安排拉伸和工作间歇。有症状应寻求合格医疗人员。'
 ];
 const layer4=[
  '流月按节气交接划分，不等同农历初一换月。寅卯辰木气渐旺，巳午未火土渐显，申酉戌金气转强，亥子丑水气渐进；精确边界以出生地时区和当年节气交接时刻为准。',
  ...monthly,
  '应期按“窗口—事项—证据”三步使用：先由月柱关系筛出复核月份，再对照工作排期、资金到账、家庭日程和合同节点；只有现实证据出现时才调整行动。木火月在喜用得力且条件齐备时可发力，金水月适合规范、复盘和储备；若对应五行为忌则反向控制扩张。没有精确节气时间字段时，不虚构某日某时的必发应期。'
 ];
 return [
  {title:'第一层｜原局命格与当期岁运势能定性',lines:layer1},
  {title:'第二层｜干支刑冲破害与喜忌转化实战',lines:layer2},
  {title:'第三层｜事业、财务、婚恋与身心落地指南',lines:layer3},
  {title:'第四层｜流月能量转折与关键应期',lines:layer4}
 ];
}

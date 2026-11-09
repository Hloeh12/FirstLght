import {BAZI_FLOW_RULES as rules} from '../www/js/rules.js';

export function buildPeriodReport(data, current, influences, months) {
 const {pillars, strength, natalStrength, selected} = data;
 const difference = strength.support - natalStrength.support;
 const paths = influences.flatMap(link => link.affected.map(hit => ({
  title: link.pattern + link.type + ' · ' + hit.pillar,
  text: rules.clash[hit.role] + rules.palaces[pillars.findIndex(p => p.name === hit.pillar)]
 })));
 const useful = paths.length && influences.some(link => link.affected.some(hit => hit.role === 'useful'));
 const caution = paths.length && influences.some(link => link.affected.some(hit => hit.role === 'caution'));
 const [work, money, relationship] = rules.tenGods[current.tenGod] ?? [
  '先核对当前事项的负责人、硬期限与交付依据。',
  '核对固定支出与实际可用余额。',
  '对照双方的时间和承诺，逐项协商优先次序。'
 ];
 const dayStem = data.dayMaster?.stem ?? pillars.find(p => p.name === '日柱')?.stem;
 const period = selected.map(p => p.stem + p.branch + p.name).join('／');
 return [
  {title:'当期时空格局定性', lines:[
   period + '。当前透干为' + current.tenGod + '。' + (dayStem ? dayStem + '日主：' + rules.dayMasters[dayStem] : ''),
   '原局扶助 ' + natalStrength.support.toFixed(1) + '%，加入所选岁运后为 ' + strength.support.toFixed(1) + '%（' + (difference > 0 ? '+' : '') + difference.toFixed(1) + ' 个百分点）。该比例为五行模型的相对权重。' +
    (useful ? '当期先防守已确认的支持。' : caution ? '当期适合测试能主动改变的旧安排。' : '当期先以可观察的小步行动验证变化。')
  ]},
  {title:'原局岁运刑冲克害', lines: [
   ...influences.map(link => link.text),
   ...paths.map(path => path.title + '。' + path.text),
   ...(!influences.length ? ['本节点没有检出直接牵动原局的关系。以透干、扶助差值及月窗为当前观察依据。'] : [])
  ]},
  {title:'四项生活观察', lines:[
   '事业职场。' + work + ' 把观察记录在实际工作节点上：哪项责任发生转移，谁能批准变更，最迟何时需要复核。遇到多个机会并行时，比较返工和沟通成本，先选一个能在短周期验证的目标。',
   '财务资金流。' + money + ' 分别列出已发生、已承诺和待确认的款项。若涉及共同预算，记录各方认可的上限和到账日期；复盘时依据账户变化与书面凭据判断，留出应付延迟的缓冲。',
   '情感亲密关系。' + relationship + ' 先让双方各自描述发生的事情，再确认期望的分工、频率和边界。优先处理一件可以实际改进的日常安排，观察调整是否减轻了双方负担。',
   '身心与生活节奏。按一周为单位观察睡眠、工作时长和恢复时间，把任务峰值与实际疲劳相互对照。重要谈话和决策尽量安排在精力充足时，提前留下休整空档，避免把时段判读当作身体状况依据。'
  ]},
  {title:'流月关键观察窗口', lines: months.length ? [
   '以下按节气月柱核对原局。命中关系较多的月份适合优先复盘，宜根据关系类型和所涉宫位理解。',
   ...months.map(month => month.label + '起 · ' + month.stem + month.branch + '：' + month.links.join('、') + '。')
  ] : ['本节点没有可列出的流月直接关系。需要观察更具体的工作、关系或资源变化时，可选流年后展开节气月柱，按对应月份核对。']}
 ];
}

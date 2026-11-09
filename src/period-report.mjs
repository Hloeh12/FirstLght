import {BAZI_FLOW_RULES as rules} from '../www/js/rules.js';
const periodName=selected=>selected.map(p=>p.stem+p.branch+p.name).join('／');
export function buildPeriodReport(data,current,influences,months=[]) {
 const {pillars,strength,natalStrength=strength,selected=[]}=data;
 const day=data.dayMaster??pillars.find(p=>p.name==='日柱')??{};
 const dayStem=day.stem??'日主',dayElement=day.element??pillars.find(p=>p.name==='日柱')?.stemElement??'五行待考';
 const difference=Number(strength.support)-Number(natalStrength.support);
 const useful=influences.some(x=>x.affected?.some(y=>y.role==='useful'));
 const caution=influences.some(x=>x.affected?.some(y=>y.role==='caution'));
 const ten=rules.tenGods[current.tenGod]??['岁运之气既动，宜察时度势、修德进业。','财帛之事贵在知足守分，量入为出。','待人以诚，言语有度，家和为贵。'];
 const commander=pillars.find(p=>p.name==='月柱')?.commander;
 const relationText=influences.map(link=>{
  const hits=(link.affected??[]).map(hit=>hit.pillar+hit.branch+hit.element+'：'+(rules.clash[hit.role]??rules.clash.neutral));
  return link.pattern+link.type+'牵动'+((link.locations??[]).join('、')||'原局相关柱位')+'。'+(rules.relations[link.type]??'须参详全局')+' '+hits.join(' ');
 });
 const monthly=months.length?months.slice(0,4).map(m=>m.label+'（'+m.stem+m.branch+'）：'+(m.links?.join('、')||'未见显著刑冲合会')+'。合本命喜忌参看，不以月名断事。'):[
  '寅卯辰月木气渐舒，巳午未月火土渐盛，申酉戌月金气渐肃，亥子丑月水气渐旺；仍须依命局喜忌而取。',
  '木火为喜时宜发舒才学，金水为喜时宜静心修习；若所临五行为忌，则反宜收敛守成。'
 ];
 const layer1=[
  '今择'+periodName(selected)+'，当期干支'+current.stem+current.branch+'，天干透出'+current.tenGod+'。日主为'+dayStem+'（'+dayElement+'），原局扶助权重'+Number(natalStrength.support).toFixed(1)+'%，岁运加入后为'+Number(strength.support).toFixed(1)+'%，变化'+(difference>0?'+':'')+difference.toFixed(1)+'个百分点。此为本机五行模型之相对参考，古法仍以月令、通根、透干、藏干与全局寒暖燥湿为纲。',
  '月令提纲为'+(pillars.find(p=>p.name==='月柱')?.stem??'未明')+(pillars.find(p=>p.name==='月柱')?.branch??'未明')+'。'+(commander?'当前司令'+commander.stem+'，交'+commander.term.name+'后'+Number(commander.elapsedDays).toFixed(1)+'日。':'排盘未载司令分段，不妄断当权藏干。')+'岁运透干'+current.tenGod+'，须辨得令与否、有根无根、制化有情与否。',
  '扶助较原局增加'+(difference>0?Number(difference).toFixed(1):'0.0')+'个百分点。'+(useful?'原局喜用亦受触动，宜先固本培元，守住可贵根基。':caution?'忌神受冲有去旧更新之机，宜辨明方向，徐徐开新。':'喜忌尚无单一明确信号，宜持中守正，随月令变化再作判断。')
 ];
 const layer2=[
  '原局与岁运关系共'+influences.length+'项：'+(relationText.join('；')||'本次未见直接刑冲合会，不强立吉凶之名。')+'。合不等于化，冲亦不必然为凶；须察月令、化神、根气、喜忌与柱位。',
  rules.clash.caution,
  rules.clash.useful,
  '年柱观祖荫长辈，月柱观父母师友与事业环境，日柱观自身与配偶，时柱观子息门生与晚景。柱位只示应事范围，须与现实相参，不可凭一处刑冲妄断家运、婚姻或寿夭。',
  '若一支兼逢刑冲合害，须分清作用先后与力量轻重；有合解未必尽解，有冲开亦可能伤及喜神。论命贵在全局制化，不可断章取义。'
 ];
 const layer3=[
  '功名事业：'+ten[0]+' 宜择所长而深耕，亲近良师益友；进退之际先看时势与自身根基，不因一时荣枯轻弃长远志业。',
  '财帛进退（财务资金流）：'+ten[1]+' 正财贵在勤俭积累，偏财贵在审慎辨机；投资置业与借贷皆须量力，不以命盘财星代替现实判断。',
  '婚姻人伦：'+ten[2]+' 日支受触，宜体察伴侣心意，家计、居处、照顾与相处之道皆以诚恳商量为上；不可单凭冲合断离合。',
  '身心养护：五行旺衰只作传统生活节律参考，不可据此诊病。宜顺时作息、适度运动、饮食有节；身体不适应由合格医者诊察。'
 ];
 const layer4=[
  '流月以节气交接为界，并非公历每月初一换月。寅卯辰木气渐舒，巳午未火土渐盛，申酉戌金气渐肃，亥子丑水气渐旺；具体须以当年节气时刻为准。',
  ...monthly,
  '应期只是传统盘理提供的观察窗口，并非事情必然发生之日。若同一柱位反复受引，可留心相应生活主题；现实未见其应，不必牵强附会。'
 ];
 return [
  {title:'第一层｜原局命格与岁运提纲',lines:layer1},
  {title:'第二层｜刑冲合害与喜忌转化',lines:layer2},
  {title:'第三层｜事业财帛、婚恋与身心指引',lines:layer3},
  {title:'第四层｜流月气运与应期参看',lines:layer4}
 ];
}

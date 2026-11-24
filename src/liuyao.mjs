// 六爻纳甲起卦引擎：时间起卦（农历年支数+月+日 → 上卦，时+月+日 → 下卦，总和取动爻）
// 装纳甲（京房八宫）、世应、六亲（按日干）、六兽（按日干）、用神判定。全部确定性计算，离线可用。
import {dayPillar} from './bazi.mjs';
export const STEMS='甲乙丙丁戊己庚辛壬癸';
export const BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const PALACES=[ // 八宫：宫名、首卦三爻纳甲（初爻起）、五行
 {name:'乾',element:'金',na:{inner:['甲子','甲寅','甲辰'],outer:['壬午','壬申','壬戌']}},
 {name:'兑',element:'金',na:{inner:['丁巳','丁卯','丁丑'],outer:['丁亥','丁酉','丁未']}},
 {name:'离',element:'火',na:{inner:['己卯','己丑','己亥'],outer:['己酉','己未','己巳']}},
 {name:'震',element:'木',na:{inner:['庚子','庚寅','庚辰'],outer:['庚午','庚申','庚戌']}},
 {name:'巽',element:'木',na:{inner:['辛丑','辛亥','辛酉'],outer:['辛未','辛巳','辛卯']}},
 {name:'坎',element:'水',na:{inner:['戊寅','戊辰','戊午'],outer:['戊申','戊戌','戊子']}},
 {name:'艮',element:'土',na:{inner:['丙辰','丙午','丙申'],outer:['丙戌','丙子','丙寅']}},
 {name:'坤',element:'土',na:{inner:['乙未','乙巳','乙卯'],outer:['乙丑','乙亥','乙酉']}},
];
const TRIGRAM_BIN={ // 自下而上：1=阳，0=阴
 乾:[1,1,1],兑:[1,1,0],离:[1,0,1],震:[1,0,0],巽:[0,1,1],坎:[0,1,0],艮:[0,0,1],坤:[0,0,0]};
const BIN_TRIGRAM=Object.fromEntries(Object.entries(TRIGRAM_BIN).map(([k,v])=>[v.join(''),k]));
const TRIGRAM_PALACE=Object.fromEntries(PALACES.map(p=>[p.name,p]));
const ELEMENT_ORDER=['木','火','土','金','水'];
// 六亲：以本宫五行为我
function relative(el,me){
 if(el===me)return '兄弟';
 const d=(ELEMENT_ORDER.indexOf(el)-ELEMENT_ORDER.indexOf(me)+5)%5;
 return ['兄弟','父母','官鬼','妻财','子孙'][d===4?1:d===0?0:d]; // 递推：生我父母，我生子孙，克我官鬼，我克妻财
}
function relativeOf(el,me){
 if(el===me)return '兄弟';
 if(ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(me)+1)%5]===el)return '子孙'; // 我生
 if(ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(el)+1)%5]===me)return '父母'; // 生我
 if(ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(me)+2)%5]===el)return '官鬼'; // 克我
 return '妻财'; // 我克
}
const ANIMALS={甲乙:['青龙','朱雀','勾陈','螣蛇','白虎','玄武'],丙丁:['朱雀','勾陈','螣蛇','白虎','玄武','青龙'],
 戊:['勾陈','螣蛇','白虎','玄武','青龙','朱雀'],己:['螣蛇','白虎','玄武','青龙','朱雀','勾陈'],
 庚辛:['白虎','玄武','青龙','朱雀','勾陈','螣蛇'],壬癸:['玄武','青龙','朱雀','勾陈','螣蛇','白虎']};
// 世应位置：八宫首卦世在6爻(上爻)，一世到三世世爻逐位下移，四世五世游魂归魂…
// 简化标准表：本宫卦 index = 变爻数 0..5，游魂(4→4位)、归魂(5→3位)
const SHI_POS=[5,0,1,2,3,-1,-1]; // 0变:上爻;1..3变:初..三爻;4变游魂:四爻;5变归魂:三爻(特殊)
const SHI_TABLE={0:5,1:0,2:1,3:2,4:3,5:2}; // 世爻位（0=初爻…5=上爻）；游魂4→3？标准：四世世在四爻(3)，游魂世在四爻(3)，归魂世在三爻(2)
// 修正标准表：一世0 二世1 三世2 四世3 五世4 游魂3? —— 采用通行：游魂世四爻(3)，归魂世三爻(2)
const SHI={0:5,1:0,2:1,3:2,4:3,5:3,6:2}; // key=变爻数(1..5 普通, 4游魂, 5归魂?) —— 见 palaceGua
const PALACE_ORDER=['乾','坎','艮','震','巽','离','坤','兑'];
const GUA_ORDER=['乾','兑','离','震','巽','坎','艮','坤']; // 先天数序
export {GUA_ORDER};
const GUA_NUM={乾:1,兑:2,离:3,震:4,巽:5,坎:6,艮:7,坤:8};

// 八宫六十四卦：每宫从首卦起，一世到五世各变一位，四变游魂（再变四爻回原位不对——游魂=第4变后第5变回第四爻），归魂
export function palaceGua(){
 // 标准八宫：首卦；一世~五世依次变初爻…五爻；游魂=五世再变四爻(即第4爻回阳/阴)；归魂=游魂后下卦复归本宫(内卦=首卦内卦)
 const all=[];
 for(const g of PALACES){
  const base=TRIGRAM_BIN[g.name];
  const guas=[];
  guas.push({name:baseName(g.name,g.name),lower:g.name,upper:g.name,moves:0,shi:5,palace:g.name});
  let curLower=[...base],curUpper=[...base];
  for(let step=1;step<=7;step++){
   if(step<=3){curLower=[...base];for(let i=0;i<step;i++)curLower[i]=base[i]^1;}
   else if(step===4){curUpper=[...base];curUpper[0]=base[0]^1;}          // 四世：上卦第一位变
   else if(step===5){curUpper=[...base];curUpper[0]=base[0]^1;curUpper[1]=base[1]^1;} // 五世
   else if(step===6){curUpper=[...base];curUpper[1]=base[1]^1;}          // 游魂：四爻回，唯第5爻位仍变（实为五世再变四爻→与五世差在第3爻位）
   else{curUpper=[...base];curUpper[1]=base[1]^1;curLower=[...base];} // 归魂：外卦同游魂，内卦复归本宫
   const lname=BIN_TRIGRAM[curLower.join('')],uname=BIN_TRIGRAM[curUpper.join('')];
   const shiPos=step<=3?step-1:step===4?3:step===5?4:step===6?3:2;
   guas.push({name:baseName(lname,uname),lower:lname,upper:uname,moves:step,shi:shiPos,palace:g.name});
  }
  all.push({palace:g,guas});
 }
 return all;
}
function baseName(upper,lower){
 const T={'乾乾':'乾为天','兑兑':'兑为泽','离离':'离为火','震震':'震为雷','巽巽':'巽为风','坎坎':'坎为水','艮艮':'艮为山','坤坤':'坤为地',
 '乾兑':'泽天夬','兑乾':'天泽履','乾离':'火天大有','离乾':'天火同人','乾震':'雷天大壮','震乾':'天雷无妄','乾巽':'风天小畜','巽乾':'天风姤',
 '乾坎':'水天需','坎乾':'天水讼','乾艮':'山天大畜','艮乾':'天山遁','乾坤':'天地否','坤乾':'地天泰',
 '兑离':'火泽睽','离兑':'泽火革','兑震':'雷泽归妹','震兑':'泽雷随','兑巽':'风泽中孚','巽兑':'泽风大过','兑坎':'水泽节','坎兑':'泽水困','兑艮':'山泽损','艮兑':'泽山咸','兑坤':'地泽临','坤兑':'泽地萃',
 '离震':'雷火丰','震离':'火雷噬嗑','离巽':'风火家人','巽离':'火风鼎','离坎':'水火既济','坎离':'火水未济','离艮':'火山旅','艮离':'火山旅2','离坤':'地火明夷','坤离':'火地晋',
 '震巽':'风雷益','巽震':'雷风恒','震坎':'水雷屯','坎震':'雷水解','震艮':'山雷颐','艮震':'雷山小过','震坤':'地雷复','坤震':'雷地豫',
 '巽坎':'水风井','坎巽':'风水涣','巽艮':'山风蛊','艮巽':'风山渐','巽坤':'地风升','坤巽':'风地观',
 '坎艮':'山水蒙','艮坎':'水山蹇','坎坤':'地水师','坤坎':'水地比',
 '艮坤':'地山谦','坤艮':'山地剥'};
 return T[upper+lower]||((UPPER_LABEL[upper]||'')+(lower||''));
}
const QA_NAMES={};
function guessName(lower,upper){
 // 卦名表：上卦+下卦
 const T={'乾乾':'乾为天','兑乾':'天泽履','离乾':'同人','震乾':'无妄','巽乾':'姤','坎乾':'讼','艮乾':'遁','坤乾':'否',
 '乾兑':'泽天夬','兑兑':'兑为泽','离兑':'革','震兑':'随','巽兑':'大过','坎兑':'困','艮兑':'咸','坤兑':'萃',
 '乾离':'火天大有','兑离':'睽','离离':'离为火','震离':'噬嗑','巽离':'鼎','坎离':'未济','艮离':'旅','坤离':'晋',
 '乾震':'雷天大壮','兑震':'归妹','离震':'丰','震震':'震为雷','巽震':'恒','坎震':'解','艮震':'小过','坤震':'豫',
 '乾巽':'风天小畜','兑巽':'中孚','离巽':'家人','震巽':'益','巽巽':'巽为风','坎巽':'涣','艮巽':'渐','坤巽':'观',
 '乾坎':'水天需','兑坎':'节','离坎':'既济','震坎':'屯','巽坎':'井','坎坎':'坎为水','艮坎':'蒙','坤坎':'比',
 '乾艮':'山天大畜','兑艮':'损','离艮':'贲','震艮':'颐','巽艮':'蛊','坎艮':'屯','艮艮':'艮为山','坤艮':'谦',
 '乾坤':'天地否','兑坤':'临','离坤':'明夷','震坤':'复','巽坤':'升','坎坤':'师','艮坤':'谦','坤坤':'坤为地'};
 const u=UPPER_LABEL[upper]||'',l=lower;
 return T[upper+lower]||(u+'之'+l);
}
const UPPER_LABEL={乾:'天',兑:'泽',离:'火',震:'雷',巽:'风',坎:'水',艮:'山',坤:'地'};

function naYao(guaName,lower,upper){
 // 纳甲：按上下卦宫取表
 const inP=TRIGRAM_PALACE[lower],outP=TRIGRAM_PALACE[upper];
 return [...inP.na.inner,...outP.na.outer];
}
function branchOf(gz){return gz[1];}
function stemOf(gz){return gz[0];}

// 时间起卦：年支序(1-12)+月+日，除8取上卦；(时支序)+月+日 除8取下卦；总和除6取动爻
export function qiGuaByTime({date,gender}){
 const d=new Date(date);
 const y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate(),h=d.getHours();
 const hourIdx=Math.floor(((h+1)%24)/2); // 时支序 0-11
 const yearBranchIdx=(BRANCHES.indexOf(BRANCHES[(y-4)%12]));
 const yb=(y-4)%12+1; // 年支序 1-12
 const up=((yb+m+day)%8)||8;
 const dn=((hourIdx+1+m+day)%8)||8;
 const move=((yb+m+day+hourIdx+1)%6)||6;
 const upG=GUA_ORDER[up-1],dnG=GUA_ORDER[dn-1];
 return castByTrigrams({upper:upG,lower:dnG,move,date:date,gender});
}

// 按三爻卦名+动爻位置起卦（数字起卦等外部入口共用）
export function castByTrigrams({upper,lower,move,date,gender}){
 // 动爻：move=1..6 自下而上；动爻在本卦取反
 const lowerBin=TRIGRAM_BIN[lower],upperBin=TRIGRAM_BIN[upper];
 const full=[...lowerBin,...upperBin];
 const movedBin=[...full];movedBin[move-1]^=1;
 const nLower=BIN_TRIGRAM[movedBin.slice(0,3).join('')],nUpper=BIN_TRIGRAM[movedBin.slice(3).join('')];
 // 定本宫：直接查六十四卦全表（任意上下卦组合），取其所属八宫
 const org=palaceGua().flatMap(p=>p.guas.map(g=>({...g,palaceName:p.palace.name,element:p.palace.element,na:p.palace.na})));
 const self=org.find(g=>g.lower===lower&&g.upper===upper);
 if(!self)return castByTrigrams({upper:'乾',lower:'乾',move,date,gender}); // 兜底，不应触达
 const changed=org.find(g=>g.lower===nLower&&g.upper===nUpper&&g.moves===0)||org.find(g=>g.lower===nLower&&g.upper===nUpper)||org[0];
 const me=self.element;
 const naSelf=naYao(self.name,lower,upper);
 const naChg=naYao(changed.name,nLower,nUpper);
 const dayGz=typeof date==='string'?solarDayGz(date):(solarDayGz(new Date().toISOString().slice(0,10))); // 日干支
 const dayStem=stemOf(dayGz),dayBranch=branchOf(dayGz);
 const ANIMAL_KEY={甲:'甲乙',乙:'甲乙',丙:'丙丁',丁:'丙丁',戊:'戊',己:'己',庚:'庚辛',辛:'庚辛',壬:'壬癸',癸:'壬癸'};
 const animals=ANIMALS[ANIMAL_KEY[dayStem]]||ANIMALS['壬癸'];
 const yaoSelf=[],yaoChg=[];
 naSelf.forEach((gz,i)=>{
  const br=branchOf(gz);
  yaoSelf.push({pos:i,gz,animal:animals[i],relative:relativeOf(branchElement(br),me),sixShuang:sixClash(br,dayBranch)});
 });
 naChg.forEach((gz,i)=>{
  const br=branchOf(gz);
  yaoChg.push({pos:i,gz,relative:relativeOf(branchElement(br),changed.element)});
 });
 return {
  question_date:dayGz,
  ben:{lower,upper,name:self.name,palace:self.palaceName,element:me,yao:yaoSelf},
  bian:{lower:nLower,upper:nUpper,name:changed.name,palace:changed.palaceName,element:changed.element,yao:yaoChg},
  move,shi:self.shi,ying:(self.shi+3)%6,
  yongShen:yongShen(me,gender),
 };
}
const BRANCH_ELEMENT={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
function branchElement(b){return BRANCH_ELEMENT[b];}
function sixClash(br,dayBr){ // 旬空：此处仅标六冲（对宫）
 const i=BRANCHES.indexOf(br),j=BRANCHES.indexOf(dayBr);
 return (i+6)%12===j?'六冲':'';
}
function yongShen(me,gender){
 // 简化用神取法：测自身以世爻；此处给出六亲对应的常见事项映射
 return {世:'世爻为自己',子孙:'子女/下属/医药/僧道',妻财:'妻子/财物/饮食',官鬼:'官职/丈夫/疾病/忧疑',父母:'父母/文书/房屋',兄弟:'兄弟/朋友/竞争'};
}
// 日干支（儒略日法）
function solarDayGz(date){
 const d=new Date(date);
 const utc=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000+2440588;
 // 已知 2000-01-01 为戊午日（index: 甲子=0 → 戊午=54）
 const idx=((utc-2451545+54)%60+60)%60;
 return STEMS[idx%10]+BRANCHES[idx%12];
}

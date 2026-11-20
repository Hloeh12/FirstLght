/* 子平古籍立论内核（纯函数，无副作用，无 DOM 依赖）。
 * 时点专项详批的「深挖」层：以《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《渊海子平》
 * 五部原著可核对的论断为据，结合当前大运/流年干支、日主旺衰、十神配置与刑冲合害，
 * 分别推演事业、正财、偏财、感情四类主题与应期观察点。
 *
 * 原则（对应产品口径披露）：
 *  1. 每条断语尽量锚定「书名·篇名 + 原文片段」，可回溯核对；
 *  2. 古籍无明据、或条件不足者，显式标注「不妄断」，只给可核对的观察点，不造事件、不承诺结果；
 *  3. 旺衰看《滴天髓》，格局顺逆看《子平真诠》，调候看《穷通宝鉴》，
 *     十神取象/六亲看《渊海子平》与《三命通会》；各派口径并列，不假装定论；
 *  4. 运=环境、流年=节奏、日=触发：应期只说「易在何类条件下被引动」，不说「某年必发生」。
 * 仅作传统术数文化参考，不构成事实预测、投资或法律意见。 */

// 五部立论古籍：作者、成书、核心方法、可核对原文（每段标明篇名）
export const CLASSICS = {
  ditian: {
    book: '滴天髓', author: '原题京图氏（明）· 任铁樵注（清）',
    method: '衰旺与寒暖：旺则宜泄宜伤，衰则喜帮喜助；判断日主与全局气势的第一准则',
    quotes: [
      {篇: '通神论·衰旺', 文: '旺则宜洩宜伤，衰则喜帮喜助，子平之理也。然旺中有衰者存，不可损也；衰中有旺者存，不可益也。'},
      {篇: '通神论·寒暖', 文: '天道有寒暖，发育万物，人道行之，不可过也。'}
    ]
  },
  ziping: {
    book: '子平真诠', author: '沈孝瞻（清·乾隆）',
    method: '格局法：月令取用，财官印食四善神顺用、杀伤枭刃四凶神逆用；成败救应定吉凶',
    quotes: [
      {篇: '论用神', 文: '财、官、印、食，四善神也，顺用之；杀、伤、枭、刃，四凶神也，逆用之。'},
      {篇: '论用神成败救应', 文: '成中有败，必是带忌；败中有成，全凭救应。'},
      {篇: '论用神', 文: '当顺而顺，当逆而逆，配合得宜，皆为贵格。'}
    ]
  },
  qiongtong: {
    book: '穷通宝鉴', author: '余春台辑（清）',
    method: '调候法：按月令寒暖燥湿取用，与单纯扶抑互补（如寒木向阳、燥土得润）',
    quotes: [
      {篇: '五行总论', 文: '土无常性，视四时所乘，欲使相济得所，勿令太过弗及。'},
      {篇: '论甲木·三春甲木', 文: '正月甲木，初春尚有余寒，得丙癸逢，富贵双全。'}
    ]
  },
  sanming: {
    book: '三命通会', author: '万民英（明·万历）',
    method: '集大成：十神取象、神煞、纳音最备；论印绶「有官有印方成厚福，忌财破印」等',
    quotes: [
      {篇: '论印绶', 文: '正印阴阳相生，天地慈气；印赖官生，有官有印，方成厚福，忌财破印。'},
      {篇: '论五行生克', 文: '形气相感而化生万物，此造化生成之大纪也。'}
    ]
  },
  yuanhai: {
    book: '渊海子平', author: '徐大升编（宋末元初）',
    method: '现存最早系统子平专著：十神总诀、六亲配用神、大运框架；重「去病」',
    quotes: [
      {篇: '五言独步', 文: '有病方为贵，无伤不是奇；格中如去病，财禄两相随。'},
      {篇: '十神总诀', 文: '生我者印绶，我生者食伤，克我者官杀，我克者妻财，同我者比劫；阴阳相异为正，同类为偏。'},
      {篇: '论日为主', 文: '取日干为主，以年为根，以月为苗，以日为花，以时为果。'}
    ]
  }
};

const S = v => String(v ?? '');

// 十神 → 古籍取象：事业 / 正财 / 偏财 / 感情，每条锚定书名·篇名。
// 取象依据：《渊海子平·十神总诀》《三命通会·论十神》《子平真诠·论用神》原著通行论述。
const GOD_IMAGE = {
  正官: {
    career: {source:'子平真诠·论正官', text:'正官为贵气、分所当尊，主规矩、职位与名分；宜循正规渠道、凭资历口碑进阶。'},
    wealth: {source:'渊海子平·十神总诀', text:'官克我、财我克，官财相生——正财多随职位、名分与稳定俸禄而来，财从名中取。'},
    windfall: {source:'子平真诠·论用神', text:'正官为善神顺用，不主偏财流动之财；若以职权谋非常之利，古籍不主，此处不妄断。'},
    love:   {source:'子平真诠·论妻子', text:'女命以官为夫，官星得位、不被伤破，主婚姻有名分与依托；感情重承诺与体面。'},
    timing: '逢官星得位、印绶相生之运，或官星被引动之年，仕途名分与责任之事易见分晓。'
  },
  七杀: {
    career: {source:'子平真诠·论七杀', text:'七杀为凶神，须逆用：有食伤制、有印化则掌实权；高压、竞争、危局之地反能成事。'},
    wealth: {source:'滴天髓·衰旺', text:'身旺任杀亦任财，杀刃相济须有制；身弱逢杀财并旺，古籍戒其压身，不妄断其得。'},
    windfall: {source:'子平真诠·论用神', text:'杀为凶神，宜制不宜纵；搏机会须设止损，凶神无制而求偏财，古籍不主吉，此处不妄断其得。'},
    love:   {source:'三命通会·论十神', text:'杀主刚猛；感情易遇强势之人，须以制化（边界与沟通）取和，不宜硬碰。'},
    timing: '逢食伤制杀、印绶化杀之运，或七杀受制之年，竞争与压力之事易转为掌权之机。'
  },
  正财: {
    career: {source:'渊海子平·十神总诀', text:'正财我克而有情，主务实经营与稳定收获；宜现金流清晰的实业与管理。'},
    wealth: {source:'滴天髓·衰旺', text:'财我克者，身旺方能任财；财旺身弱，古籍戒「富屋贫人」，宜先固本再言聚财。'},
    windfall: {source:'子平真诠·论偏财', text:'正财主本分经营之财，不主流动偏财；守正财而逐偏财，古籍戒其舍本，不妄断其得。'},
    love:   {source:'子平真诠·论妻子', text:'男命以财为妻，坐下财官、财透成局主内助；财被劫破则婚姻与财务须防。'},
    timing: '逢身旺任财、食伤生财之运，或财星得地之年，稳定收入与婚缘之事易有实质推进。'
  },
  偏财: {
    career: {source:'渊海子平·十神总诀', text:'偏财我克而无情，主流动机会与人脉周转；宜贸易、撮合、机会型经营。'},
    wealth: {source:'子平真诠·论用神', text:'偏财为善神而性动，正财主稳定、偏财主流动；以偏财守固定现金流，古籍不主，不妄断其稳。'},
    windfall: {source:'子平真诠·论偏财', text:'偏财为善神而性动，财来财去；古籍主其流动不主其守，须核算风险、留盈余。'},
    love:   {source:'三命通会·论十神', text:'偏财主异性缘与社交魅力；缘分机会多，界限与分寸是古籍反复提醒处。'},
    timing: '逢食伤生财、财星流通之运，或偏财被引动之年，机会财与人脉之事易活跃，但去留难料。'
  },
  食神: {
    career: {source:'子平真诠·论食神', text:'食神我生而和，主才华输出与口碑；宜创作、教育、内容、技艺立身。'},
    wealth: {source:'子平真诠·论用神', text:'食神为善神顺用，食能生财——以作品与才华换稳定收益，细水长流。'},
    windfall: {source:'三命通会·论十神', text:'食神生财偏于稳定产出，非投机之财；以食神逐意外之财，古籍不主，不妄断。'},
    love:   {source:'三命通会·论十神', text:'食神主温和与口福，相处舒适、家庭氛围佳；最忌枭神夺食（偏印透）扰其福。'},
    timing: '逢食神得地、伤官不杂之运，或食神引动之年，作品落地、技艺兑现与人际相处之事易顺。'
  },
  伤官: {
    career: {source:'子平真诠·论伤官', text:'伤官为凶神，须逆用：伤官生财、伤官配印则可成；以专业表达与突破常规立身。'},
    wealth: {source:'子平真诠·论用神', text:'伤官生财是经典组合，收入弹性大；伤官无制而求稳财，古籍不主，不妄断。'},
    windfall: {source:'子平真诠·论伤官', text:'伤官主才气外露、好胜求名，逐流动偏财易大开大合；须先立规矩，古籍戒其无制。'},
    love:   {source:'三命通会·论十神', text:'伤官主锋芒与口舌，「有理还要有礼」是相处之要；言语易伤亲近之人。'},
    timing: '逢伤官生财、伤官配印之运，或伤官引动之年，表达、提案与作品之事易突出，须防口舌。'
  },
  正印: {
    career: {source:'三命通会·论印绶', text:'正印主学问、文书、长辈庇荫；印赖官生，有官有印方成厚福，宜学术、文教与专业资质。'},
    wealth: {source:'三命通会·论印绶', text:'忌财破印——财星坏印时，求财与名节、学业相冲，古籍戒贪财损名。'},
    windfall: {source:'子平真诠·论用神', text:'印为善神，主清贵与稳定名分，不主流动偏财；弃印逐偏财，古籍不主，不妄断。'},
    love:   {source:'子平真诠·论六亲', text:'正印为母、为庇护；感情偏重被照顾与精神契合，伴侣宜包容型。'},
    timing: '逢官印相生、印绶得地之运，或印星引动之年，进修、证照、文书与贵人扶助之事易见。'
  },
  偏印: {
    career: {source:'渊海子平·论枭神', text:'偏印（枭神）主异路技艺、专精与悟性；宜研究、技术、玄学等冷门深耕。'},
    wealth: {source:'渊海子平·论枭神', text:'枭神夺食则衣食亏损——偏印旺而夺食时求财多反复，古籍不主顺遂，此处不妄断得财。'},
    windfall: {source:'三命通会·论十神', text:'偏印主孤冷专精，非流通生财之星；以偏印谋机会偏财，古籍不主，不妄断。'},
    love:   {source:'三命通会·论十神', text:'偏印性孤冷、寡和少友；心事不外露，须主动沟通补足亲密关系。'},
    timing: '逢偏印得地、食神不被夺之运，或偏印引动之年，冷门技能与钻研之事易成型，人际须主动。'
  },
  比肩: {
    career: {source:'渊海子平·十神总诀', text:'比肩同我，主自我、同辈与自立；宜专业自立、同行协作。'},
    wealth: {source:'滴天髓·衰旺', text:'比劫帮身，身弱得之比劫可任财；身旺再见比劫则分财，合伙须明分益。'},
    windfall: {source:'滴天髓·衰旺', text:'比肩主自立与分夺，身旺争财尤忌；以比肩逐偏财，古籍戒其争夺，不妄断其得。'},
    love:   {source:'子平真诠·论六亲', text:'比肩为兄弟同辈；感情偏平等，须防争主导权。'},
    timing: '逢比劫帮身之运（身弱者佳），或比劫引动之年，自立与同辈协作之事易起，财务边界须清。'
  },
  劫财: {
    career: {source:'渊海子平·十神总诀', text:'劫财同我而争，主竞争、破耗与行动力；宜团队开拓，不宜独自管钱。'},
    wealth: {source:'滴天髓·衰旺', text:'劫财为帮身之劫，身弱可借力、身旺则劫财；借贷担保合伙，古籍屡戒其耗。'},
    windfall: {source:'渊海子平·十神总诀', text:'劫财主争夺破耗，逢偏财尤易因财生争；古籍戒其贪，此处不妄断得。'},
    love:   {source:'三命通会·论十神', text:'劫财主争夺与豪爽，为情破财是常见剧本；金钱界限是相处底线。'},
    timing: '逢劫财引动之年，竞争、分财与合作抉择易显现，宜先立书面约定再行动。'
  }
};

// 旺衰用词（据《滴天髓·衰旺》，并注明「旺中有衰、衰中有旺」的变通）
const STRENGTH_WORD = k => k==='身强'
  ? '日主偏旺：依《滴天髓》「旺则宜泄宜伤」，喜输出（食伤）与克耗（财官）来流通，过刚则宜收敛。'
  : k==='身弱'
  ? '日主偏弱：依《滴天髓》「衰则喜帮喜助」，喜印比生扶；纵见财官亦须先固本，不可强任。'
  : '日主中和：进退有余，依《子平真诠》「配合得宜，皆为贵格」，重在格局与调候的配平。';

// 顺用/逆用（据《子平真诠·论用神》）
const GOOD_GODS=['正财','正官','正印','食神'];
const BAD_GODS=['七杀','伤官','偏印','劫财'];
const yinYangUse = god => GOOD_GODS.includes(god) ? '善神顺用（生扶、护持其用）'
  : BAD_GODS.includes(god) ? '凶神逆用（制化、约束其势）' : '比劫帮身，随旺衰定喜忌';

// 应期观察点：把「大运=环境、流年=节奏、日=触发」落到可核对的条件，不承诺具体事件。
function timingWindow(ctx){
 const {luckName,luckGZ,yearName,yearGZ,dayName,dayGZ,role} = ctx;
 const label=(n,def)=>{const s=S(n);return s&&s!==def?s:'';};
 const layers=[];
 if(luckGZ)layers.push(`大运${label(luckName,'大运')?label(luckName,'大运')+' ':''}${luckGZ}（十年环境：${role==='useful'?'喜用当道，主题较易展开':role==='caution'?'忌神当道，宜守成待时':'中性环境，靠动作推动'}）`);
 if(yearGZ)layers.push(`流年${label(yearName,'流年')?label(yearName,'流年')+' ':''}${yearGZ}（年度节奏：流年干支若扶用抑忌，则本年较易兑现；反之先收）`);
 if(dayGZ)layers.push(`流日${label(dayName,'流日')?label(dayName,'流日')+' ':''}${dayGZ}（触发点：用于把年度主题落到具体时日，不以单日定全年吉凶）`);
 const gate = role==='useful'
  ? '本时点十神落在喜用一侧，古籍以「用神得力」论顺；应期看大运流年是否继续护此用神。'
  : role==='caution'
  ? '本时点十神落在忌神一侧，古籍以「忌神当令」论逆；应期看何运何年制化忌神（凶神逆用）再动。'
  : '本时点十神喜忌未明，依《渊海子平》「不可执一」，不妄断应期，只列可核对的引动条件。';
 return {layers:layers.length?layers:['尚未选定具体大运/流年/流日——应期需先选时点，此处不妄断。'],gate};
}

// 生成一段主题：古籍原文 → 本盘对照 → 观察点
function domainBlock(title,img,ctx,note){
 if(!img)return {title,lines:[`该主题的古籍明据不足，依「凡古籍无据者不妄断」原则，不据此下断语。`]};
 return {title,lines:[
  `【古籍依据·${img.source}】${img.text}`,
  `【本盘对照】${ctx.god}为${ctx.role==='useful'?'当前喜用一侧':ctx.role==='caution'?'当前忌神一侧':'喜忌未明'}；${ctx.strengthWord}十神以「${yinYangUse(ctx.god)}」论。${note||''}`,
  `【应期观察】${ctx.timing.gate}`
 ]};
}

/* 主入口：输入时点上下文，输出「章」数组（title + lines），供 period-focus 铺开。 */
export function classicsReading(ctx){
 const god=S(ctx.god||'正官');
 const img=GOD_IMAGE[god]||GOD_IMAGE.正官;
 const role=ctx.role==='useful'?'useful':ctx.role==='caution'?'caution':'neutral';
 const strengthWord=STRENGTH_WORD(ctx.strengthKind);
 const timing=timingWindow({...ctx,god,role});
 const base={god,role,strengthWord,timing};
 const out=[];
 // 立论总纲：五派并列，口径披露
 out.push({title:'立论总纲 · 五部古籍',lines:[
  `本篇以五部子平原著为据：${CLASSICS.ziping.book}（${CLASSICS.ziping.method}）、${CLASSICS.ditian.book}（${CLASSICS.ditian.method}）、${CLASSICS.qiongtong.book}（${CLASSICS.qiongtong.method}）、${CLASSICS.yuanhai.book}（${CLASSICS.yuanhai.method}）、${CLASSICS.sanming.book}（${CLASSICS.sanming.method}）。`,
  `总纲原文——《${CLASSICS.yuanhai.book}·五言独步》「${CLASSICS.yuanhai.quotes[0].文}」：有病方为贵，重在格局「去病」；《${CLASSICS.ditian.book}·衰旺》「${CLASSICS.ditian.quotes[0].文}」。`,
  `时点定性：${S(ctx.gz||'')} ${god}（${yinYangUse(god)}）；${strengthWord}`
 ]});
 // 事业 / 正财 / 偏财 / 感情 四段，各三段式
 out.push(domainBlock('一、事业 · 古籍立论与本盘对照',img.career,base,ctx.careerNote));
 out.push(domainBlock('二、正财 · 古籍立论与本盘对照',img.wealth,base,ctx.wealthNote));
 out.push(domainBlock('三、偏财 · 古籍立论与本盘对照',img.windfall,base,ctx.windfallNote));
 out.push(domainBlock('四、感情 · 古籍立论与本盘对照',img.love,base,ctx.loveNote));
 // 应期窗口
 out.push({title:'五、应期窗口 · 运/年/日三层',lines:[
  `《${CLASSICS.yuanhai.book}·论日为主》「${CLASSICS.yuanhai.quotes[2].文}」：运为根苗、年为花、日为果，应期须层层相扣。`,
  ...timing.layers.map((x,i)=>`${i+1}) ${x}`),
  timing.gate
 ]});
 // 调候补论（据穷通宝鉴），仅当给了月令线索时展开，否则不妄断
 if(ctx.monthBranch){
  out.push({title:'六、调候补论 · 穷通宝鉴',lines:[
   `《${CLASSICS.qiongtong.book}·五行总论》「${CLASSICS.qiongtong.quotes[0].文}」：月令 ${S(ctx.monthBranch)} 定寒暖燥湿。`,
   ctx.tiaoHouNote?S(ctx.tiaoHouNote):'当前未给出该月令的调候喜忌明细——依「凡古籍无据者不妄断」，此处只提示「调候与扶抑互补」，不指定具体用神。'
  ]});
 }
 // 边界
 out.push({title:'边界 · 不妄断',lines:[
  `凡上述未标明出处、或条件不足处，一律只列可核对的观察点，不造事件、不承诺结果；传统术数供文化与自我观察参考，不构成事实预测、投资或法律意见。`
 ]});
 return out;
}

export {GOD_IMAGE, STRENGTH_WORD, yinYangUse};

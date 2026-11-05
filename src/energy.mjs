/* 能量场：复现公开客户端的评分公式（娱乐化建模，不是健康评估）。 */
const CHAKRA=[
 {key:'root',zh:'海底轮',planet:'saturn',theme:'安全感与生存根基'},
 {key:'sacral',zh:'生殖轮',planet:'venus',theme:'创造力与亲密'},
 {key:'solar',zh:'太阳轮',planet:'mars',theme:'意志与行动力'},
 {key:'heart',zh:'心轮',planet:'jupiter',theme:'爱与接纳'},
 {key:'throat',zh:'喉轮',planet:'mercury',theme:'表达与真实'},
 {key:'brow',zh:'眉心轮',planet:'moon',theme:'直觉与洞察'},
 {key:'crown',zh:'顶轮',planet:'sun',theme:'灵性与连接'}];
const ELEMENT=['火','土','风','水','火','土','风','水','火','土','风','水'];
function hash32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
export function energy(western,filterPrint=''){
 const byKey=Object.fromEntries(western.planets.map(p=>[p.key,p]));
 const chakras=CHAKRA.map(c=>{const p=byKey[c.planet];let score=55;if(p){score+=Math.round(p.degree.degrees/30*8);if([1,4,7,10].includes(p.house))score+=10;else if([2,5,8,11].includes(p.house))score+=4;else score-=2;if(p.retro)score-=9;const harm=western.aspects.filter(a=>(a.a===p.name||a.b===p.name)&&(a.angle===120||a.angle===60)).length;const tens=western.aspects.filter(a=>(a.a===p.name||a.b===p.name)&&(a.angle===90||a.angle===180)).length;score+=harm*5-tens*5;}score=Math.max(22,Math.min(96,Math.round(score+(hash32(filterPrint+c.key)%13)-6)));return {...c,score,status:score<60?'阻滞':score<=85?'平衡':'过载'};});
 const count={'火':0,'土':0,'风':0,'水':0};for(const p of western.planets)count[ELEMENT[['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].indexOf(p.sign)]]++;
 const dominant=Object.keys(count).sort((a,b)=>count[b]-count[a])[0];
 const yang=western.planets.filter(p=>['火','风'].includes(ELEMENT[['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].indexOf(p.sign)])).length;
 const worst=western.aspects.filter(a=>a.angle===90||a.angle===180).sort((a,b)=>a.orb-b.orb)[0];
 return {chakras,fieldStrength:Math.round(chakras.reduce((a,b)=>a+b.score,0)/chakras.length),polarity:yang>=5?'外放·阳极':yang<=3?'内敛·阴极':'阴阳均衡',dominant,interference:worst?`${worst.a}刑冲${worst.b}`:'无明显干扰源',weakest:chakras.slice().sort((a,b)=>a.score-b.score)[0].zh,notice:'公开公式的娱乐化建模，不构成健康建议。'};
}

import {hexFromLines} from './yijing-tianji.mjs';
export const DIRECTIONS={乾:'西北',坤:'西南',震:'东',巽:'东南',坎:'北',离:'南',艮:'东北',兑:'西'};
const bits={乾:[1,1,1],坤:[0,0,0],震:[1,0,0],巽:[0,1,1],坎:[0,1,0],离:[1,0,1],艮:[0,0,1],兑:[1,1,0]};
export function housingReading(h){
 if(!h?.direction||!h?.member)return null;
 if(!bits[h.direction]||!bits[h.member])throw Error('阳宅方位无效');
 const hex=hexFromLines([...bits[h.member],...bits[h.direction]]);
 return {hex,aligned:h.member===h.direction,text:(h.member===h.direction?'名位相应':'名位异位')+'：身份卦'+h.member+'、居住方位'+h.direction+'（'+DIRECTIONS[h.direction]+'），组成'+hex.name+'。'+hex.guaci,method:'本应用显式象意联动：方位为上卦、家庭成员身份为下卦；不是经核验的天纪阳宅断验，不据此判定健康、寿命或住宅吉凶。'};
}

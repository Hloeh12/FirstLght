// v0.91.0：案例备份加密（可选口令）。
// 用浏览器原生 Web Crypto 对备份 JSON 做 AES-GCM 加密，密钥由口令经 PBKDF2 派生。
// 密钥只在本地内存生成与使用，从不离开设备、不上传任何服务端——契合「出生数据不出设备」的隐私定位。
// 加密包结构：{ format:'firstlight-cases', version:5, encrypted:true, alg:'A256GCM',
//   kdf:{name:'PBKDF2',salt,iter:210000,hash:'SHA-256'},iv,data(base64) }
// 导入时按 alg/kdf 还原密钥再解密；口令错误会在 GCM 认证失败时报「口令不正确或数据已损坏」。
const enc=new TextEncoder(),dec=new TextDecoder();
const b64u=bytes=>btoa(String.fromCharCode(...bytes));
const b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const bytes=async buf=>new Uint8Array(await crypto.subtle.digest('SHA-256',buf));
const keyFrom=async(pass,salt)=>{
 const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
};
export async function encryptBackup(json,pass){
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await keyFrom(pass,salt);
 const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(json));
 return JSON.stringify({format:'firstlight-cases',version:5,encrypted:true,alg:'A256GCM',
  kdf:{name:'PBKDF2',salt:b64u(salt),iter:210000,hash:'SHA-256'},iv:b64u(iv),data:b64u(new Uint8Array(data))});
}
export async function decryptBackup(text,pass){
 const p=JSON.parse(text);
 if(!p||p.encrypted!==true||!p.data||!p.kdf)throw Error('不是加密的案例备份');
 const salt=b64d(p.kdf.salt),iv=b64d(p.iv),key=await keyFrom(pass,salt);
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,b64d(p.data));
 const json=dec.decode(plain);
 try{JSON.parse(json);return json;}
 catch{throw Error('解密后数据格式无效');}
}
export const isEncryptedBackup=text=>{try{const p=JSON.parse(text);return !!(p&&p.encrypted===true&&p.data);}catch{return false;}};

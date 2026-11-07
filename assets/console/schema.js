export const SCHEMA_VERSION=4;
export function migrateProfile(p){
 if(!p||typeof p!=='object'||!['string','number'].includes(typeof p.id))return null;
 return {...p,id:String(p.id),schemaVersion:4,pinned:!!p.pinned,category:p.category==='客户'?'特别关注':p.category||'我的',tags:Array.isArray(p.tags)?p.tags:[],fields:{...p.fields,housing:p.fields?.housing||null}};
}
export function migrateStorage(storage){
 const raw=JSON.parse(storage.getItem('xy:cases:v2')||'[]');if(!Array.isArray(raw))throw Error('案例库格式无效，保留原始内容');
 const cases=raw.map(migrateProfile);if(cases.some(p=>!p))throw Error('存在无效档案，保留原始内容');const active=migrateProfile(JSON.parse(storage.getItem('xy_active_profile')||'null'));
 storage.setItem('xy:cases:v2',JSON.stringify(cases));if(active)storage.setItem('xy_active_profile',JSON.stringify(active));storage.setItem('xy_schema_version','4');
}

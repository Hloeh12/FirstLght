// One activation owner; results are bounded, keyed by complete normalized input.
export class ProfileMachine {
 constructor(compute,{capacity=8,ttl=300000,clock=()=>Date.now()}={}){this.compute=compute;this.capacity=capacity;this.ttl=ttl;this.clock=clock;this.cache=new Map();this.pending=new Map();this.sequence=0;this.status='idle';this.profile=null;}
 key(birth){return JSON.stringify(birth);}
 peek(birth){const key=this.key(birth),entry=this.cache.get(key);if(!entry)return null;if(this.clock()-entry.at>this.ttl){this.cache.delete(key);return null;}this.cache.delete(key);this.cache.set(key,entry);return entry.result;}
 async resolve(birth){const key=this.key(birth),cached=this.peek(birth);if(cached)return cached;if(this.pending.has(key))return this.pending.get(key);
  const job=Promise.resolve().then(()=>this.compute(birth)).then(result=>{this.cache.set(key,{at:this.clock(),result});while(this.cache.size>this.capacity)this.cache.delete(this.cache.keys().next().value);return result;}).finally(()=>this.pending.delete(key));this.pending.set(key,job);return job;
 }
 async activate(profile,birth){const sequence=++this.sequence;this.profile=profile;this.status='loading';try{const result=await this.resolve(birth);if(sequence!==this.sequence)return null;this.status='ready';return result;}catch(error){if(sequence!==this.sequence)return null;this.status='error';throw error;}}
 clear(){this.sequence++;this.profile=null;this.status='idle';this.cache.clear();}
}

// Deploy to elsdr-auth. Secrets: ADMIN_PASSWORD, SESSION_KEY, GITHUB_PRIVATE_KEY.
// Rate limiting binding LOGIN_LIMITER: 5 requests / 60 seconds per IP.
const ORIGIN='https://elsdr-lab.github.io', REPO='elsdr-lab/elsdr-lab.github.io';
const enc=new TextEncoder(), dec=new TextDecoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const un64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const headers={'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Cache-Control':'no-store','Content-Type':'application/json','Vary':'Origin'};
const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers});
const hkey=s=>crypto.subtle.importKey('raw',enc.encode(s),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
async function session(env){const payload=b64(enc.encode(JSON.stringify({exp:Date.now()+3600000,nonce:crypto.randomUUID()})));return payload+'.'+b64(await crypto.subtle.sign('HMAC',await hkey(env.SESSION_KEY),enc.encode(payload)));}
async function valid(s,env){try{const [p,sig,...rest]=s.split('.');return !rest.length&&await crypto.subtle.verify('HMAC',await hkey(env.SESSION_KEY),un64(sig),enc.encode(p))&&JSON.parse(dec.decode(un64(p))).exp>Date.now()}catch{return false}}
function der(tag,b){const n=b.length;let l=n<128?[n]:n<256?[129,n]:[130,n>>8,n&255];return Uint8Array.from([tag,...l,...b])}
async function appToken(env){
 let pem=env.GITHUB_PRIVATE_KEY.replace(/\\n/g,'\n'), raw=Uint8Array.from(atob(pem.replace(/-----[^-]+-----|\s/g,'')),c=>c.charCodeAt(0));
 if(pem.includes('BEGIN RSA PRIVATE KEY'))raw=der(48,Uint8Array.from([2,1,0,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,...der(4,raw)]));
 const key=await crypto.subtle.importKey('pkcs8',raw,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const now=Math.floor(Date.now()/1000), p=b64(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'})))+'.'+b64(enc.encode(JSON.stringify({iat:now-60,exp:now+540,iss:'5694265'})));
 const jwt=p+'.'+b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(p)));
 const h={Authorization:'Bearer '+jwt,Accept:'application/vnd.github+json','User-Agent':'ELSDR-Admin'};
 const r=await fetch('https://api.github.com/repos/'+REPO+'/installation',{headers:h});if(!r.ok)throw Error('Installation unavailable');
 const i=await r.json();const t=await fetch('https://api.github.com/app/installations/'+i.id+'/access_tokens',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({repositories:['elsdr-lab.github.io'],permissions:{contents:'write'}})});if(!t.ok)throw Error('Token unavailable');return (await t.json()).token;
}
const files=new Set(['home-records.js','people-records.js','research-records.js','life-records.js','study-resources.js','contact-records.js']);
export default {async fetch(req,env){
 if(req.headers.get('Origin')!==ORIGIN)return reply({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Not found'},404);
 if(!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD.length<16||!env.SESSION_KEY||env.SESSION_KEY.length<32||!env.GITHUB_PRIVATE_KEY||!env.LOGIN_LIMITER)return reply({error:'Server configuration incomplete'},503);
 try{
 const route=new URL(req.url).pathname;
 if(route==='/login'){
 const limit=await env.LOGIN_LIMITER.limit({key:req.headers.get('CF-Connecting-IP')||'unknown'});if(!limit.success)return reply({error:'Too many attempts. Try again later.'},429);
 const b=await req.json();if(typeof b.password!=='string'||b.password.length>256)return reply({error:'Invalid password'},401);
 const key=await hkey(env.SESSION_KEY),sig=await crypto.subtle.sign('HMAC',key,enc.encode(env.ADMIN_PASSWORD));
 if(!await crypto.subtle.verify('HMAC',key,sig,enc.encode(b.password)))return reply({error:'Invalid password'},401);
 return reply({session:await session(env)});
 }
 if(route!=='/repo')return reply({error:'Not found'},404);
 if(!await valid((req.headers.get('Authorization')||'').replace(/^Bearer /,''),env))return reply({error:'Session expired'},401);
 const b=await req.json(), path=b.path, method=b.method||'GET';
 const match=typeof path==='string'&&path.match(/^\/contents\/([^?]+)(?:\?ref=main)?$/);
 if(!match||!['GET','PUT'].includes(method)||!(files.has(match[1])||/^assets\/(?:uploads\/|people\/professor-)[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(match[1])))return reply({error:'Path not permitted'},403);
 let body;if(method==='PUT'){body=JSON.parse(b.body);if(body.branch!=='main'||typeof body.content!=='string'||body.content.length>6000000)return reply({error:'Invalid content'},400);}
 const token=await appToken(env);
 const r=await fetch('https://api.github.com/repos/'+REPO+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'ELSDR-Admin','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 return new Response(await r.text(),{status:r.status,headers});
 }catch{return reply({error:'Server request failed'},502)}
}};

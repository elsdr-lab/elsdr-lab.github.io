/* Cloudflare Worker. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET as secrets.
   No token or secret is logged, persisted, or sent in a redirect. */
const ORIGIN="https://elsdr-lab.github.io";
const CALLBACK=ORIGIN+"/admin/";
const REPO="elsdr-lab/elsdr-lab.github.io";
const headers={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store","Content-Type":"application/json","Vary":"Origin"};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
export default {async fetch(request,env){
 if(request.headers.get("Origin")!==ORIGIN)return reply({error:"Origin not allowed"},403);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="POST"||new URL(request.url).pathname!=="/exchange")return reply({error:"Not found"},404);
 if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET)return reply({error:"GitHub App configuration missing"},503);
 try{
  const body=await request.json();
  if(typeof body.code!=="string"||body.code.length>200||typeof body.verifier!=="string"||!/^[a-f0-9]{64}$/.test(body.verifier))return reply({error:"Invalid authorization response"},400);
  const data=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:body.code,redirect_uri:CALLBACK,code_verifier:body.verifier});
  const response=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded"},body:data});
  const result=await response.json();
  if(!response.ok||!result.access_token)return reply({error:"GitHub authorization failed. Please log in again."},401);
  const ghHeaders={Authorization:"Bearer "+result.access_token,Accept:"application/vnd.github+json","User-Agent":"ELSDR-Admin"};
  const [repo,user]=await Promise.all([fetch("https://api.github.com/repos/"+REPO,{headers:ghHeaders}),fetch("https://api.github.com/user",{headers:ghHeaders})]);
  const repository=await repo.json(),identity=await user.json();
  if(!repo.ok||!user.ok||!repository.permissions?.push)return reply({error:"You do not have write access to the ELSDR repository."},403);
  return reply({access_token:result.access_token,login:identity.login});
 }catch{return reply({error:"Unable to complete authorization"},502)}
}};

(()=>{'use strict';
const REPO='elsdr-lab/elsdr-lab.github.io',API='https://api.github.com/repos/'+REPO;
const configs=[
 {id:'home',label:'첫 화면',file:'home-records.js',variable:'ELSDR_HOME_DATA',description:'메인 문구와 연구실 소개를 수정합니다.'},
 {id:'professor',label:'교수님 프로필',file:'people-records.js',variable:'ELSDR_PEOPLE_RECORDS',description:'교수님 프로필 카드, 사진, 한·영 소개글을 수정합니다.'},
 {id:'career',label:'교수님 경력·활동',file:'people-records.js',variable:'ELSDR_PEOPLE_RECORDS',description:'학력, 주요 경력, 대외활동 및 수상 이력을 관리합니다.'},
 {id:'books',label:'교수님 도서',file:'people-records.js',variable:'ELSDR_PEOPLE_RECORDS',description:'Books & Writings의 도서를 추가·수정·삭제하고 표지 이미지를 업로드합니다.'},
 {id:'columns',label:'교수님 신문 칼럼',file:'people-records.js',variable:'ELSDR_PEOPLE_RECORDS',description:'신문 칼럼의 제목·언론사·원문 발행일·원문 링크를 관리합니다.'},
 {id:'essays',label:'교수님 에세이·기타 글',file:'people-records.js',variable:'ELSDR_PEOPLE_RECORDS',description:'에세이와 잡지 연재·기타 기고문을 추가·수정·삭제합니다.'},
 {id:'people',label:'구성원',file:'people-records.js',variable:'ELSDR_PEOPLE_RECORDS',description:'저술·연구원·졸업생 기록을 관리합니다.'},
 {id:'research',label:'연구성과',file:'research-records.js',variable:'ELSDR_RESEARCH_RECORDS',description:'프로젝트와 논문의 내용·연도·연구영역을 관리합니다.'},
 {id:'life',label:'소식·활동',file:'life-records.js',variable:'ELSDR_LIFE_RECORDS',description:'행사와 현장활동 기록을 관리합니다. 교수 칼럼은 구성원 메뉴에서 수정합니다.'},
 {id:'study',label:'연구자료',file:'study-resources.js',variable:'ELSDR_STUDY_RESOURCES',description:'공개 연구노트와 교육·세미나 자료를 관리합니다.'},
 {id:'contact',label:'연락처·모집',file:'contact-records.js',variable:'ELSDR_CONTACT_DATA',description:'주소와 연락처, 모집 공고를 관리합니다. 확인된 공개 정보만 입력하세요.'}
];
const labels={professor:'교수 정보',career:'경력',books:'도서',columns:'신문 칼럼',essays:'에세이·기타 글',researchers:'연구원',alumni:'졸업생',theses:'학위논문',events:'행사',activities:'현장활동',location:'위치',contacts:'연락처',opportunities:'참여 분야',positions:'현재 모집',pastNotices:'이전 모집 공고',nameEn:'영문 이름',nameKo:'국문 이름',title:'제목 / 직함',affiliation:'소속',email:'이메일',officePhone:'교수 연구실 전화',labPhone:'연구실 전화',labEmail:'연구실 이메일',professorEmail:'교수 이메일',professorPhone:'교수 전화',professorName:'교수 이름',id:'고유 ID',period:'기간',organization:'기관',category:'분류',year:'연도',type:'자료 유형',theme:'연구영역',summary:'요약',keywords:'키워드',url:'원문 링크',publication:'매체명',genre:'글 유형',sourceUrl:'출처 링크',downloadUrl:'다운로드 링크',fullTextUrl:'원문 링크',photo:'사진 주소',initials:'영문 이니셜',interests:'연구 관심사',verification:'확인 메모',academicStatus:'학적 / 직위',group:'그룹',authors:'저자',author:'작성자',journal:'학술지',publicationType:'논문 종류',abstract:'초록',doi:'DOI',funder:'지원기관',role:'참여 역할',detailNote:'상세 메모',date:'원문 발행일 (YYYY-MM-DD 또는 YYYY-MM)',speaker:'발표자',organizer:'주최',eventId:'관련 행사 ID',places:'지도 위치',name:'이름',region:'지역',lat:'위도',lon:'경도',approximate:'대략적인 위치',topic:'주제',status:'상태',published:'게시일',description:'설명',institution:'기관',campus:'캠퍼스',buildingKo:'건물명 (국문)',buildingEn:'건물명 (영문)',roomKo:'호실 (국문)',roomEn:'호실 (영문)',addressKo:'주소 (국문)',addressEn:'주소 (영문)',mapSearch:'지도 검색어',kicker:'상단 영문 소개',titleLead:'타이틀 첫 문구',titleAccent:'타이틀 강조 단어',titleMiddle:'타이틀 둘째 줄',titleEnd:'타이틀 마지막 줄',leadKo:'소개 문구 (국문)',leadEn:'소개 문구 (영문)',descriptionKo:'상세 소개 (국문)',descriptionEn:'상세 소개 (영문)'};
Object.assign(labels,{degree:'학위',titleKo:'직함 (국문)',title:'제목 / 직함',affiliation:'소속',affiliationKo:'소속 (국문)',biographyKo:'전체 소개글 (국문)',biographyEn:'전체 소개글 (영문)',descriptionKo:'짧은 소개 (국문)',descriptionEn:'짧은 소개 (영문)'});
Object.assign(labels,{titleKo:'직함 / 제목 (국문)',periodKo:'기간 (국문)',organizationKo:'기관 (국문)'});
const careerCategories={education:'Education / 학력',career:'Career & Appointments / 경력·보직',society:'Societies / 학회',advisory:'Advisory & Policy / 자문·정책',professional:'Professional Activities / 전문 활동',awards:'Honors & Awards / 수상'};
const choices={type:['project','publication','research-note','learning-material','seminar-material'],theme:['climate','ecosystem','coastal','regional'],group:['phd','ms','researcher','staff','domestic','overseas'],status:['status-unverified','open','closed']};
const $=id=>document.getElementById(id);let token='',selected=configs[0],current=null,dirty=false,busy=false,loadId=0;

/* GitHub App OAuth: authorization code + PKCE. Only random state/verifier
   persist across the redirect; the access token stays in memory. */
const auth=window.ELSDR_GITHUB_LOGIN||{};
const callback='https://elsdr-lab.github.io/admin/';
const oauthReady=!!(auth.clientId&&auth.exchangeUrl);
const oauthStorage='elsdr.github.oauth';
const randomString=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function loginGitHub(){
 if(!oauthReady)return;
 try{
  const state=randomString(),verifier=randomString();
  const challenge=base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  sessionStorage.setItem(oauthStorage,JSON.stringify({state,verifier,created:Date.now()}));
  const params=new URLSearchParams({client_id:auth.clientId,redirect_uri:callback,state,code_challenge:challenge,code_challenge_method:'S256',allow_signup:'false'});
  location.assign('https://github.com/login/oauth/authorize?'+params);
 }catch(e){message('GitHub 로그인을 시작하지 못했습니다. '+e.message,true)}
}
async function finishGitHubLogin(){
 const q=new URLSearchParams(location.search);
 if(!q.has('code')&&!q.has('error'))return;
 history.replaceState(null,'',location.pathname);
 let saved;
 try{saved=JSON.parse(sessionStorage.getItem(oauthStorage)||'null')}catch{}
 sessionStorage.removeItem(oauthStorage);
 if(!oauthReady||q.has('error')||!saved||q.get('state')!==saved.state||Date.now()-saved.created>10*60*1000){message('로그인 확인이 만료되었거나 취소되었습니다. 다시 로그인하세요.',true);return}
 busy=true;controls();
 try{
  const response=await fetch(auth.exchangeUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:q.get('code'),verifier:saved.verifier})});
  const result=await response.json();
  if(!response.ok||!result.access_token)throw Error(result.error||'GitHub 인증을 완료하지 못했습니다.');
  token=result.access_token;
  const repository=await request('');
  if(!repository.permissions?.push)throw Error('연구실 저장소 수정 권한이 없습니다.');
  $('connection').textContent='GitHub 로그인됨'+(result.login?' · '+result.login:'');
  $('disconnect').hidden=false;$('connect-panel').open=false;
  if(current)render();
  message('GitHub 계정으로 로그인했습니다. 내용을 수정하고 저장할 수 있습니다.');
 }catch(e){token='';message(e.message,true)}
 finally{busy=false;controls()}
}

const cache=new Map();
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function message(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error)}
function controls(){ $('save').disabled=!token||!dirty||busy||!current;$('reload').disabled=busy;$('dirty').textContent=dirty?'저장하지 않은 변경':'저장된 내용';$('editor').inert=busy;document.querySelectorAll('nav button').forEach(button=>button.disabled=busy);}
function changed(){dirty=true;controls()}
async function request(path,options={}){const response=token.startsWith('session:')?await fetch('https://elsdr-auth.elsdr501a.workers.dev/repo',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token.slice(8)},body:JSON.stringify({path,method:options.method||'GET',body:options.body})}):await fetch(API+path,{...options,cache:'no-store',headers:{Accept:'application/vnd.github+json',...(token?{Authorization:'Bearer '+token}:{}),...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});if(!response.ok){const status=response.status;throw new Error(status===401?'연결 정보가 만료되었거나 올바르지 않습니다. 다시 연결하세요.':status===403?'저장 권한이 없거나 요청 한도에 도달했습니다. Contents 쓰기 권한과 조직 승인을 확인하세요.':status===409||status===422?'다른 변경과 충돌했거나 입력값이 올바르지 않습니다. 변경 내용을 복사해 보관한 뒤 다시 불러오세요.':'GitHub 요청에 실패했습니다 ('+status+'). 잠시 후 다시 시도하세요.')}return response.json()}
function decode(content){const bytes=Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}
function encode(text){const bytes=new TextEncoder().encode(text);let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(raw)}
function parse(source,config){const match=new RegExp('window\\.'+config.variable+'\\s*=\\s*').exec(source);if(!match)throw Error('자료 형식이 변경되어 불러올 수 없습니다.');const start=match.index+match[0].length;const json=source.slice(start).trim().replace(/;\s*$/,'');return {data:JSON.parse(json),prefix:source.slice(0,start)}}
function serialize(){return current.prefix+JSON.stringify(current.data,null,2).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n'}
async function load(config,force=false){if(busy)return;if(dirty&&!confirm('저장하지 않은 변경이 있습니다. 변경을 버리고 이동할까요?'))return;const serial=++loadId;selected=config;dirty=false;current=null;controls();$('editor').replaceChildren();$('editor').setAttribute('aria-busy','true');$('page-title').textContent=config.label;$('page-description').textContent=config.description;document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.id===config.id?'page':'false'));message('자료를 불러오는 중입니다.');try{let entry=!force&&cache.get(config.file);if(!entry){const file=await request('/contents/'+config.file+'?ref=main');entry={...parse(decode(file.content),config),sha:file.sha};cache.set(config.file,structuredClone(entry))}if(serial!==loadId)return;current=structuredClone(entry);if(config.id==='research'&&window.ELSDRResearchEditor)window.ELSDRResearchEditor.reset();render();message(token?'수정 후 변경 내용 저장을 누르세요. 저장하면 공개 홈페이지에 반영됩니다.':'읽기 모드입니다. 자료를 확인할 수 있으며, 수정·저장은 GitHub 연결 후 가능합니다.')}catch(e){if(serial===loadId)message(e.message,true)}finally{if(serial===loadId){$('editor').setAttribute('aria-busy','false');controls()}}}
function blank(value,key=''){if(Array.isArray(value))return [];if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,blank(v,k)]));if(key==='id')return 'record-'+crypto.randomUUID().slice(0,8);if(key==='year')return new Date().getFullYear();if(typeof value==='number')return 0;if(typeof value==='boolean')return false;if(['type','theme','group','category','status'].includes(key))return value;return ''}
function careerDateKey(item){
 const value=String(item.period||item.year||"").trim();
 const m=value.match(/(?:19|20)\d{2}(?:[.\/-](0?[1-9]|1[0-2])(?=$|[.\/\s–—-]))?/);
 return m?Number(m[0].slice(0,4))*100+Number(m[1]||0):-1;
}
function sortCareer(items){return items.sort((a,b)=>careerDateKey(b)-careerDateKey(a));}

function template(key){if(key==='career')return {id:'career-'+crypto.randomUUID().slice(0,8),category:'career',period:'',title:'',titleKo:'',organization:'',organizationKo:'',sourceUrl:''};const base={id:'record-'+crypto.randomUUID().slice(0,8),title:'',url:''};if(key==='places')return {id:base.id,name:'',region:'',lat:0,lon:0,group:'domestic',approximate:false};if(key==='keywords')return '';if(key==='positions')return {...base,description:'',status:'open',published:''};return {...base,year:new Date().getFullYear(),authors:'',publisher:'',description:''}}
function newItem(array,key){if(key==='career')return template(key);if(key==='books')return {id:'book-'+crypto.randomUUID().slice(0,8),title:'',year:new Date().getFullYear(),publisher:'',authors:'',role:'',roleEn:'',summary:'',summaryEn:'',cover:'',url:''};if(key==='columns'||key==='essays')return template(key);if(key==='columns'||key==='essays')return {id:(key==='columns'?'column-':'essay-')+crypto.randomUUID().slice(0,8),title:'',publication:'',date:'',author:'전진형',summary:'',url:'',...(key==='essays'?{genre:'기고'}:{})};if(!array.length)return template(key);if(array[0]&&typeof array[0]==='object'&&!Array.isArray(array[0])){const union={};for(const item of array)for(const [k,v] of Object.entries(item))if(!(k in union))union[k]=v;return blank(union)}return blank(array[0])}
function recordTitle(item,index){if(typeof item!=='object'||item===null)return String(item)||'새 항목';return item.title||item.nameKo||item.nameEn||item.name||'항목 '+(index+1)}
function collection(array,key,parent){if(key==='career')sortCareer(array);const section=el('section',undefined,'group'),head=el('div',undefined,'group-head');head.append(el('h2',labels[key]||'등록 자료'));const add=el('button','+ 새 항목','secondary');add.disabled=!token;add.onclick=()=>{array.push(newItem(array,key));changed();render()};head.append(add);section.append(head);if(!array.length)section.append(el('p','등록된 항목이 없습니다.','empty'));array.forEach((item,index)=>{const card=el('details',undefined,'record');const summary=el('summary',recordTitle(item,index));card.append(summary);const area=el('div',undefined,'record-fields');if(item!==null&&typeof item==='object')fields(item,area);else field(array,index,area);const actions=el('div',undefined,'record-actions');for(const [title,delta] of (key==='career'?[]:[['위로',-1],['아래로',1]])){const button=el('button',title,'secondary');button.disabled=!token||index+delta<0||index+delta>=array.length;button.onclick=()=>{[array[index],array[index+delta]]=[array[index+delta],array[index]];changed();render()};actions.append(button)}const remove=el('button','항목 삭제','danger');remove.disabled=!token;remove.onclick=()=>{if(confirm('이 항목을 삭제할까요? 저장 전까지 홈페이지에는 반영되지 않습니다.')){array.splice(index,1);changed();render()}};actions.append(remove);area.append(actions);card.append(area);section.append(card)});parent.append(section)}
function field(object,key,parent){if(key==='id'||(selected.id==='career'&&key==='periodKo'))return;if(key==='photo'||key==='cover'){photoField(object,key,parent);return}const value=object[key],name=selected.id==='professor'&&key==='title'?'직함 (영문)':selected.id==='professor'&&key==='affiliation'?'소속 (영문)':labels[key]||String(key),wrapper=el('label',undefined,'field');wrapper.append(el('span',name));let input;if(typeof value==='boolean'){input=el('input');input.type='checkbox';input.checked=value;input.onchange=()=>{object[key]=input.checked;changed()}}else if(selected.id==='career'&&key==='category'){input=el('select');for(const [v,label] of Object.entries(careerCategories)){const option=el('option',label);option.value=v;input.append(option)}input.value=value;input.onchange=()=>{object[key]=input.value;changed()}}else if(choices[key]){input=el('select');const opts=[...new Set([value,...choices[key]])];opts.forEach(v=>{const option=el('option',v||'미지정');option.value=v;input.append(option)});input.value=value;input.onchange=()=>{object[key]=input.value;changed()}}else{const long=/summary|abstract|description|biography|affiliation|interests|verification|detailNote|lead/i.test(String(key));input=el(long?'textarea':'input');if(long)wrapper.classList.add('wide');if(/^biography/.test(key)){input.rows=14;wrapper.append(el('small','문단 사이에는 빈 줄을 넣어 주세요.'))}if(!long)input.type=typeof value==='number'?'number':'text';if(typeof value==='number'){input.step='any';input.required=true}input.value=value??'';input.oninput=()=>{object[key]=typeof value==='number'?Number(input.value):input.value;changed()};if(key==='id'){input.required=true;wrapper.append(el('small','항목마다 서로 다른 ID를 사용하세요.'))}if(/url|photo/i.test(String(key)))wrapper.append(el('small','https:// 링크 또는 홈페이지 내부의 상대 경로'))}
input.disabled=!token;wrapper.append(input);parent.append(wrapper)}

const photoPreviews=new Map();
function photoField(object,key,parent){
 const wrapper=el('div',undefined,'field photo-file-field');
 wrapper.append(el('span',key==='cover'?'도서 표지 이미지':'사진'));
 const layout=el('div',undefined,'photo-file-layout'),picture=el('div',undefined,'photo-file-preview');
 const img=el('img');img.alt='등록된 사진 미리보기';
 const empty=el('span','등록된 사진 없음','photo-file-empty');
 function show(){const path=object[key];let url='';try{if(path){const u=new URL(path,location.origin+'/');if(['http:','https:'].includes(u.protocol))url=photoPreviews.get(path)||u.href}}catch{}img.hidden=!url;empty.hidden=!!url;if(url)img.src=url;else img.removeAttribute('src');}
 picture.append(img,empty);show();
 const controlsBox=el('div',undefined,'photo-file-controls');
 const upload=el('input',undefined,'upload');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.disabled=!token;upload.setAttribute('aria-label','사진 파일 첨부');
 upload.onchange=()=>uploadImage(upload.files[0],object,key,upload,show);
 controlsBox.append(upload,el('small',key==='cover'?'표지 파일 JPG, PNG, WebP · 최대 4MB. 첨부 후 상단의 변경 내용 저장을 눌러주세요.':'JPG, PNG, WebP · 최대 4MB. 첨부한 파일은 GitHub에 저장됩니다.'));
 if(!token)controlsBox.append(el('small','사진 교체는 GitHub 연결 후 가능합니다.'));
 layout.append(picture,controlsBox);wrapper.append(layout);parent.append(wrapper);
}

function fields(object,parent){const grid=el('div',undefined,'fields');for(const key of Object.keys(object)){const value=object[key];if(Array.isArray(value)){const nested=el('div',undefined,'nested');collection(value,key,nested);grid.append(nested)}else if(value&&typeof value==='object'){const nested=el('section',undefined,'nested');nested.append(el('h3',labels[key]||key));fields(value,nested);grid.append(nested)}else field(object,key,grid)}parent.append(grid)}

function renderProfessorEditor(editor){
 const p=current.data.professor;
 if(!p){editor.append(el('p','교수 정보가 없습니다.','empty'));return}
 const photoSection=el('section',undefined,'group professor-admin-group');
 const head=el('div',undefined,'group-head');head.append(el('h2','프로필 사진'));photoSection.append(head);
 const photoFields=el('div',undefined,'fields');field(p,'photo',photoFields);
 photoFields.append(el('p','사진 파일 첨부 후 상단의 변경 내용 저장을 눌러야 공개 프로필에 적용됩니다.','notice'));
 photoSection.append(photoFields);editor.append(photoSection);
 const groups=[
  ['기본 정보',['nameEn','nameKo','degree','title','titleKo','affiliationKo','affiliation']],
  ['연락처',['email','officePhone','labPhone']],
  ['프로필 카드 소개',['descriptionKo','descriptionEn']],
  ['전체 소개글',['biographyKo','biographyEn']]
 ];
 for(const [title,keys] of groups){const section=el('section',undefined,'group professor-admin-group');const head=el('div',undefined,'group-head');head.append(el('h2',title));section.append(head);const grid=el('div',undefined,'fields');for(const key of keys)field(p,key,grid);section.append(grid);editor.append(section);}
 const link=el('a','공개 Professor 페이지 보기 ↗','text-link');link.href='../#/people/professor';link.target='_blank';link.rel='noopener';editor.append(link);
}

function render(){const editor=$('editor');editor.replaceChildren();editor.classList.toggle('research-cms',selected.id==='research');if(selected.id==='professor'){renderProfessorEditor(editor);$('count').textContent='';controls();return}if(selected.id==='career'){collection(current.data.career,'career',editor);$('count').textContent=current.data.career.length+'개 항목';controls();return}if(selected.id==='books'){if(!Array.isArray(current.data.books))current.data.books=[];collection(current.data.books,'books',editor);const link=el('a','공개 Books 페이지 보기 ↗','text-link');link.href='../#/people/professor/books';link.target='_blank';link.rel='noopener';editor.append(link);$('count').textContent=current.data.books.length+'권';controls();return}if(selected.id==='columns'||selected.id==='essays'){const key=selected.id;if(!Array.isArray(current.data[key]))current.data[key]=[];collection(current.data[key],key,editor);const tip=el('p',key==='columns'?'신문사 원문 링크와 실제 발행일을 입력하세요.':'에세이·연재 기고는 저자 확인 후 등록하세요. 원문이 공개된 경우 해당 매체의 직접 링크를 입력하세요.','notice');editor.append(tip);const link=el('a','공개 Books & Writings 보기 ↗','text-link');link.href='../#/people/professor/books';link.target='_blank';link.rel='noopener';editor.append(link);$('count').textContent=current.data[key].length+'개 항목';controls();return}if(selected.id==='people'){const {professor,career,...other}=current.data;fields(other,editor);$('count').textContent='';controls();return}if(selected.id==='research'&&window.ELSDRResearchEditor){window.ELSDRResearchEditor.render({data:current.data,editor,editable:!!token,changed,message,save:()=>$('save').click()});$('count').textContent=current.data.length+'개 항목';controls();return}if(Array.isArray(current.data)){collection(current.data,selected.id,editor);$('count').textContent=current.data.length+'개 항목'}else{fields(current.data,editor);$('count').textContent=''}controls()}
function validate(value,path=''){if(Array.isArray(value)){const ids=value.filter(x=>x&&typeof x==='object'&&'id'in x).map(x=>x.id);if(ids.some(x=>!x)||new Set(ids).size!==ids.length)throw Error('고유 ID가 비어 있거나 중복되었습니다: '+path);value.forEach((v,i)=>validate(v,path+'/'+i))}else if(value&&typeof value==='object'){for(const [key,v]of Object.entries(value)){if(typeof v==='string'&&/^(url|sourceUrl|downloadUrl|fullTextUrl|photo|cover)$/i.test(key)&&v){const resolved=new URL(v,location.origin+'/');if(!['http:','https:'].includes(resolved.protocol))throw Error('링크에는 http 또는 https 주소를 입력하세요: '+(labels[key]||key));if((key==='photo'||key==='cover')&&/\.svg(?:\?|$)/i.test(resolved.pathname))throw Error('사진에는 PNG, JPG, WebP를 사용하세요.')}if(typeof v==='number'&&!Number.isFinite(v))throw Error('숫자 입력을 확인하세요.');validate(v,path+'/'+key)}}}
$('connect-form').onsubmit=event=>{event.preventDefault();$('github-login').click()};
$('disconnect').onclick=()=>{if(busy)return;if(dirty&&!confirm('저장하지 않은 변경이 있습니다. 연결을 해제할까요?'))return;token='';dirty=false;cache.clear();$('connection').textContent='읽기 모드';$('disconnect').hidden=true;$('connect-panel').open=true;load(selected,true)};
$('reload').onclick=()=>load(selected,true);
$('save').onclick=async()=>{if(!token||busy||!current||!dirty)return;try{if(selected.id==='career'){sortCareer(current.data.career);current.data.career.forEach(item=>delete item.periodKo)}validate(current.data);if(selected.id==='research'&&window.ELSDRResearchEditor)window.ELSDRResearchEditor.validate(current.data)}catch(e){message(e.message,true);return}if(!confirm(selected.id==='research'?'연구성과 변경을 GitHub에 저장할까요? 공개 상태의 자료만 홈페이지에 표시됩니다.':'변경 내용을 저장하고 공개 홈페이지에 반영할까요?'))return;busy=true;controls();message('GitHub에 저장하는 중입니다. 페이지를 닫지 마세요.');try{const latest=await request('/contents/'+selected.file+'?ref=main');if(latest.sha!==current.sha)throw Error('다른 관리자가 이 자료를 수정했습니다. 입력 내용을 복사해 보관한 뒤 다시 불러오세요. 기존 자료는 덮어쓰지 않았습니다.');const saved=await request('/contents/'+selected.file,{method:'PUT',body:JSON.stringify({message:'Update '+selected.label+' from ELSDR admin',content:encode(serialize()),sha:current.sha,branch:'main'})});current.sha=saved.content.sha;dirty=false;cache.set(selected.file,structuredClone(current));if(selected.id==='career')render();message('저장했습니다. 홈페이지 반영에는 몇 분이 걸릴 수 있습니다.');const link=el('a','저장된 변경 기록 보기 ↗','saved-link');link.href=saved.commit.html_url;link.target='_blank';link.rel='noopener';$('status').append(link)}catch(e){message(e.message,true)}finally{busy=false;controls()}};
async function uploadImage(file,object,key,input,onUploaded){if(!file||busy)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4*1024*1024){message('4MB 이하의 PNG, JPG, WebP 사진을 선택하세요.',true);return}if(!confirm('이 사진을 공개 홈페이지 저장소에 업로드할까요?'))return;busy=true;controls();const originalToken=token;try{const bytes=new Uint8Array(await file.arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));const extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type];const path=(key==='cover'?'assets/people/books/':selected.id==='professor'?'assets/people/professor-':'assets/uploads/')+crypto.randomUUID()+'.'+extension;await request('/contents/'+path,{method:'PUT',body:JSON.stringify({message:'Upload website photo',content:btoa(raw),branch:'main'})});if(token!==originalToken)return;object[key]=path;photoPreviews.set(path,'data:'+file.type+';base64,'+btoa(raw));input.value='';changed();if(onUploaded)onUploaded();message('사진을 업로드했습니다. 항목에도 적용하려면 변경 내용 저장을 누르세요.')}catch(e){message(e.message,true)}finally{busy=false;controls()}}
for(const config of configs){const button=el('button',config.label);button.dataset.id=config.id;button.onclick=()=>load(config);$('navigation').append(button)}
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue=''}});
$('github-login').disabled=false;
$('github-login').onclick=async()=>{const password=$('token').value;$('token').value='';if(!password)return;try{const response=await fetch('https://elsdr-auth.elsdr501a.workers.dev/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const result=await response.json();if(!response.ok||!result.session)throw Error(result.error||'로그인 실패');token='session:'+result.session;$('connection').textContent='관리자 연결됨';$('disconnect').hidden=false;$('connect-panel').open=false;if(current)render();message('관리자로 연결되었습니다.');}catch(e){message(e.message,true)}};
$('github-login-status').textContent='연구실 공용 관리자 암호를 입력하세요.';
$('connect-panel').open=true;
(async()=>{await load(configs[0]);/* No OAuth redirect in password mode. */})();
})();

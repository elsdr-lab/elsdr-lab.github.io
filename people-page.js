/* ELSDR V2 People — distinct routes & records, 2026-10-28
   Data source: people-records.js (previous preview content; verification pending).
   Other site sections and V1 are intentionally untouched. */
(function(){
"use strict";
const page=document.querySelector('[data-page="people"]');
if(!page)return;
const data=window.ELSDR_PEOPLE_RECORDS||{};
const $=(s,r=page)=>r.querySelector(s);
const $$=(s,r=page)=>Array.from(r.querySelectorAll(s));
const E=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const clean=v=>String(v||"").toLocaleLowerCase().trim();
const nav={
 professor:[["professor","Profile"],["professor/career","Career & Activities"],["professor/books","Books & Writings"]],
 researchers:[["researchers","Researchers"]],
 alumni:[["alumni","Alumni Directory"],["alumni/theses","Thesis Archive"]]
};
function empty(title,description="자료 확인 후 추가 예정"){
 return '<div class="pp-v2-empty"><strong>'+E(title)+'</strong><p>'+E(description)+'</p></div>';
}
function validUrl(href){
 if(!href)return "";
 try{const v=new URL(String(href),window.location.href);return ["https:","http:"].includes(v.protocol)?v.href:"";}catch{return "";}
}
function outerLink(url,label){
 const safe=validUrl(url);
 return safe?'<a class="pp-v2-link" href="'+E(safe)+'" target="_blank" rel="noopener noreferrer">'+E(label)+' <span aria-hidden="true">↗</span></a>':"";
}
const sources=(data.researchers||[]);
function renderResearchers(){
 const groups=[["phd","Ph.D. Researchers","박사과정 연구원"],["ms","M.S. Researchers","석사과정 연구원"],["intern","Research Interns","연구인턴"]];
 const html=groups.map(([key,title,description],index)=>{
   const people=sources.filter(p=>p.group===key);
   if(!people.length)return "";
   const cards=people.map(person=>{
     const name=person.nameKo||person.nameEn||"이름 확인 중";
     const translation=person.nameKo&&person.nameEn?'<span class="pp-person-korean">'+E(person.nameEn)+'</span>':"";
     const initial=person.initials||name[0]||"";
     const email=person.email?'<a class="pp-person-email" href="mailto:'+E(person.email)+'">'+E(person.email)+' <span aria-hidden="true">↗</span></a>':"";
     const photo=person.photo?'<img alt="'+E(name)+' 프로필 사진" src="'+E(person.photo)+'" loading="lazy">':
       '<span class="pp-photo-initials" aria-hidden="true">'+E(initial)+'</span><span class="pp-photo-caption" aria-hidden="true">PHOTO PENDING</span>';
     return '<article class="pp-person-card pp-v2-researcher-card">'+
       '<div class="pp-person-photo" aria-label="'+E(name)+' 사진 등록 영역">'+photo+'</div>'+
       '<div class="pp-person-info">'+
         '<div class="pp-person-topline"><span>'+E(person.academicStatus||title)+'</span></div>'+
         '<h3>'+E(name)+'</h3>'+translation+
         '<p class="pp-person-interests">'+E(person.interests||'연구 관심 분야 입력 예정')+'</p>'+
         email+'</div></article>';
   }).join("");
   return '<section class="pp-v2-group"><div class="pp-group-heading"><div><span>RESEARCH COMMUNITY / '+String(index+1).padStart(2,"0")+'</span>'+
          '<h3>'+title+'</h3></div><small>'+description+'</small></div>'+
          '<div class="pp-people-grid">'+cards+'</div></section>';
 }).filter(Boolean).join("");
 $("#pp-v2-researcher-groups").innerHTML=html||empty("연구원 프로필 등록 예정","등록 인원이 없는 분류는 표시하지 않습니다.");
}
function careerCollection(category,label,description){
 const entries=(data.career||[]).filter(entry=>entry.category===category);
 return '<section class="pp-v2-collection"><div class="pp-v2-category-head"><span>'+E(description)+'</span><h3>'+E(label)+'</h3></div>'+
   (entries.length?'<div class="pp-v2-timeline">'+entries.map(item=>
     '<div class="pp-v2-career-row"><time>'+E(item.period||item.year)+'</time><div><strong>'+E(item.title)+'</strong>'+
     '<p>'+E(item.organization||"")+'</p></div></div>').join("")+'</div>':empty("등록 자료 없음","확인된 "+label+" 항목을 추후 등록합니다."))+'</section>';
}
function renderCareer(){
 $("#pp-v2-career-collections").innerHTML=
  careerCollection("career","Major Career & Appointments","01 / CAREER & APPOINTMENTS")+
  careerCollection("society","Academic Societies & Professional Associations","02 / SOCIETIES")+
  careerCollection("advisory","Public Committees & Policy Advisory","03 / ADVISORY & POLICY")+
  careerCollection("awards","Honors & Academic Achievements","04 / HONORS & AWARDS");
}
function writingList(records,title){
 if(!records?.length)return empty(title+" 등록 예정","제목 · 매체명 · 발행일 · 원문 링크를 입력할 수 있습니다.");
 return '<div class="pp-v2-writings-list">'+[...records].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).map(item=>
    '<div class="pp-v2-writing-row"><time>'+E(item.date||"")+'</time>'+
    '<div><h4>'+E(item.title)+'</h4><p>'+E(item.publication||item.medium||"")+'</p></div>'+
    (item.url?outerLink(item.url,"View article"):"")+'</div>').join("")+'</div>';
}
function renderWritings(){
 const books=data.books||[];
 $("#pp-v2-books").innerHTML=books.length?books.map(item=>
   '<article class="pp-v2-book"><div class="pp-v2-book-cover">'+
   (item.cover?'<img src="'+E(item.cover)+'" alt="'+E(item.title)+' 표지" loading="lazy">':'<span>BOOK COVER</span>')+
   '</div><div><h4>'+E(item.title)+'</h4><p>'+E(item.publisher)+' · '+E(item.year)+'</p>'+
   '<p>'+E(item.summary||"")+'</p>'+outerLink(item.url,"Book details")+'</div></article>').join("") :
   '<article class="pp-v2-book pp-v2-book-template"><div class="pp-v2-book-cover"><span>BOOK COVER</span></div>'+
   '<div><h4>Books 등록 예정</h4><p>도서 제목 · 출판사 · 발행연도</p><p>단독 저서, 공동 저서, 번역서를 등록할 수 있습니다.</p></div></article>';
 $("#pp-v2-columns").innerHTML=writingList(data.columns,"Newspaper Columns");
 $("#pp-v2-essays").innerHTML=writingList(data.essays,"Essays & Other Writings");
}

/* Professor overview reuses existing detail-page DOM from one data source. */
function renderOverview(){
 const careerRows=$("#pp-v2-career-collections .pp-v2-career-row").slice(0,4);
 $("#pp-prof-overview-career-list").innerHTML=careerRows.length?
   careerRows.map(row=>row.outerHTML).join(""):
   '<p class="pp-prof-overview-empty">Career &amp; Activities 등록 예정</p>';

 const bookCards=(data.books||[]).length?
   $("#pp-v2-books .pp-v2-book").slice(0,2):[];
 $("#pp-prof-overview-books-list").innerHTML=bookCards.length?
   bookCards.map(card=>card.outerHTML).join(""):
   '<p class="pp-prof-overview-empty">Books 등록 예정</p>';

 const columns=$("#pp-v2-columns .pp-v2-writing-row").slice(0,2);
 $("#pp-prof-overview-columns-list").innerHTML=columns.length?
   '<div class="pp-v2-writings-list">'+columns.map(row=>row.outerHTML).join("")+'</div>':
   '<p class="pp-prof-overview-empty">Newspaper Columns 등록 예정</p>';

 const essays=$("#pp-v2-essays .pp-v2-writing-row").slice(0,2);
 const essaysPanel=$("#pp-prof-overview-essays-group");
 essaysPanel.hidden=essays.length===0;
 $("#pp-prof-overview-essays-list").innerHTML=essays.length?
   '<div class="pp-v2-writings-list">'+essays.map(row=>row.outerHTML).join("")+'</div>':"";
}
const overviewAnchors={
 profile:"#people-professor",
 career:"#pp-prof-overview-career",
 books:"#pp-prof-overview-books",
 research:"#pp-prof-overview-research"
};
function setOverviewActive(key){
 $("[data-pp-overview-scroll]").forEach(button=>{
   const active=button.dataset.ppOverviewScroll===key;
   button.classList.toggle("is-active",active);
   if(active)button.setAttribute("aria-current","location");
   else button.removeAttribute("aria-current");
 });
}
function updateOverviewActive(){
 const route=window.location.hash.replace(/^#\/?/,"").split("?")[0];
 if(route!=="people"&&route!=="people/professor")return;
 let active="profile";
 for(const [key,selector] of Object.entries(overviewAnchors)){
   const node=$(selector);
   if(node&&node.getBoundingClientRect().top<=170)active=key;
 }
 setOverviewActive(active);
}
let overviewScrollScheduled=false;
window.addEventListener("scroll",()=>{
 if(overviewScrollScheduled)return;
 overviewScrollScheduled=true;
 window.requestAnimationFrame(()=>{
   overviewScrollScheduled=false;
   updateOverviewActive();
 });
},{passive:true});

function normalizeName(name){
 const s=clean(name).replace(/[^a-z,\s]/g,"").trim();
 if(!s)return "";
 const reversed=s.includes(",")?s.split(",").map(x=>x.trim()).reverse().join(" "):s;
 return reversed.replace(/\s+/g,"");
}
function matchingThesis(person){
 const key=normalizeName(person.nameEn),all=data.theses||[];
 return all.filter(item=>key&&normalizeName(item.nameEn)===key);
}
function renderAlumni(){
 const q=clean($("#pp-v2-alumni-search").value);
 const entries=(data.alumni||[]).filter(person=>
  [person.nameEn,person.nameKo,person.degree,person.graduationYear,person.affiliation,person.field].some(value=>clean(value).includes(q))
 ).sort((a,b)=>Number(b.graduationYear)-Number(a.graduationYear));
 $("#pp-v2-alumni-count").textContent="표시 "+entries.length+"건 · 이관 자료";
 $("#pp-v2-alumni-list").innerHTML=entries.length?entries.map(person=>{
    const thesis=matchingThesis(person);
    return '<article class="pp-v2-alumni-row">'+
      '<span class="pp-v2-alumni-year">'+E(person.graduationYear||"–")+'</span>'+
      '<div class="pp-v2-alumni-primary"><h3>'+E(person.nameKo||person.nameEn)+'</h3>'+
       (person.nameKo&&person.nameEn?'<span>'+E(person.nameEn)+'</span>':"")+'</div>'+
      '<div class="pp-v2-alumni-meta"><strong>'+E(person.degree||"학위 확인 중")+'</strong>'+
       '<span>'+E(person.affiliation||"소속 입력 예정")+'</span>'+
       (person.field?'<small>'+E(person.field)+'</small>':"")+'</div>'+
      (thesis.length?'<a class="pp-v2-thesis-crosslink" href="#/people/alumni/theses?q='+encodeURIComponent(thesis[0].nameEn||thesis[0].author)+'">Thesis Archive ↗</a>':'<span></span>')+
    '</article>';
 }).join(""):empty("일치하는 졸업생이 없습니다","검색어를 변경하거나 새 졸업생 정보를 등록해 주세요.");
}
const degreeLabel={master:"M.S. THESIS",doctor:"Ph.D. DISSERTATION"};
let selectedDegree="all";
function renderTheses(){
 const q=clean($("#pp-v2-thesis-search").value);
 const entries=(data.theses||[]).filter(item=>
  (selectedDegree==="all"||item.degree===selectedDegree)&&
  [item.title,item.author,item.nameEn].some(v=>clean(v).includes(q))
 ).sort((a,b)=>Number(b.graduationYear)-Number(a.graduationYear));
 $("#pp-v2-thesis-count").textContent="표시 "+entries.length+"건 · 이관 자료 검수 중";
 $("#pp-v2-thesis-list").innerHTML=entries.length?entries.map(item=>
    '<article class="pp-v2-thesis-row"><span class="pp-v2-thesis-year">'+E(item.graduationYear)+'</span>'+
    '<div class="pp-v2-thesis-copy"><small>'+E(degreeLabel[item.degree]||"THESIS")+'</small>'+
    '<h3>'+E(item.title)+'</h3><p>'+E(item.author)+
    (item.nameEn?' <span>'+E(item.nameEn)+'</span>':'')+
    (item.affiliation?' · '+E(item.affiliation):'')+'</p></div>'+
    '<div class="pp-v2-thesis-outlink">'+(item.fullTextUrl?outerLink(item.fullTextUrl,"원문 보기"):outerLink(item.sourceUrl,"기록 보기"))+'</div></article>'
 ).join(""):empty("일치하는 학위논문이 없습니다","논문 제목 또는 저자를 다시 검색해 주세요.");
 $$("[data-pp-v2-degree]").forEach(button=>{
  const active=button.dataset.ppV2Degree===selectedDegree;
  button.classList.toggle("is-selected",active);
  button.setAttribute("aria-pressed",String(active));
 });
}
function renderRoute(){
 const fragment=window.location.hash.replace(/^#\/?/,"");
 const [path,query=""]=fragment.split("?");
 const segments=path.split("/");
 if(segments[0]!=="people")return;
 let primary=segments[1]||"professor";
 if(!nav[primary])primary="professor";
 let key=segments.slice(1).join("/")||"professor";
 const valid=nav[primary].some(([slug])=>slug===key);
 if(!valid)key=primary==="professor"?"professor":primary==="researchers"?"researchers":"alumni";
 $$("[data-people-panel]").forEach(section=>section.hidden=section.dataset.peoplePanel!==key);
 $$("[data-people-nav]").forEach(anchor=>{
   const active=anchor.dataset.peopleNav===primary;
   anchor.classList.toggle("is-selected",active);
   if(active)anchor.setAttribute("aria-current","page");else anchor.removeAttribute("aria-current");
 });
 const sub=$("#pp-v2-depth-nav");
 if(key==="professor"){
    const overviewNav=[["profile","Profile"],["career","Career & Activities"],["books","Books & Writings"],["research","Research"]];
    sub.innerHTML=overviewNav.map(([slug,label])=>
      '<button type="button" data-pp-overview-scroll="'+slug+'"'+
      (slug==="profile"?' class="is-active" aria-current="location"':'')+'>'+E(label)+'</button>'
    ).join("");
    $("[data-pp-overview-scroll]",sub).forEach(button=>button.addEventListener("click",()=>{
      const target=$(overviewAnchors[button.dataset.ppOverviewScroll]);
      if(!target)return;
      setOverviewActive(button.dataset.ppOverviewScroll);
      target.scrollIntoView({behavior:"smooth",block:"start"});
    }));
  }else{
    sub.innerHTML=nav[primary].map(([slug,label])=>
      '<a href="#/people/'+slug+'"'+(slug===key?' class="is-active" aria-current="page"':'')+'>'+E(label)+'</a>'
    ).join("");
  }
  sub.hidden=primary==="researchers";
 if(key==="alumni/theses"){
  const params=new URLSearchParams(query);
  if(params.has("q")){
    selectedDegree="all";
    $("#pp-v2-thesis-search").value=params.get("q");
  }
  renderTheses();
 }
 const pageNames={
  "professor":"Professor / Profile","professor/career":"Professor / Career & Activities",
  "professor/books":"Professor / Books & Writings","researchers":"Researchers",
  "alumni":"Alumni Directory","alumni/theses":"Thesis Archive"
 };
 document.title=(pageNames[key]||"People")+" | ELSDR";
 window.scrollTo(0,0);
}
$("#pp-v2-alumni-search").addEventListener("input",renderAlumni);
$("#pp-v2-thesis-search").addEventListener("input",renderTheses);
$$("[data-pp-v2-degree]").forEach(button=>button.addEventListener("click",()=>{
 selectedDegree=button.dataset.ppV2Degree;renderTheses();
}));
renderCareer();renderWritings();renderOverview();renderResearchers();renderAlumni();renderTheses();
window.addEventListener("hashchange",renderRoute);
renderRoute();
})();
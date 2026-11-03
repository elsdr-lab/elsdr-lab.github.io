/* ELSDR V2 — Study Research Resources
   Source data: study-resources.js; items are public only when explicitly added.
   No direct download link is assumed from an original post link. */
(function(){
"use strict";
const scope=document.getElementById("v2-study-resources");
if(!scope)return;
const source=Array.isArray(window.ELSDR_STUDY_RESOURCES)?window.ELSDR_STUDY_RESOURCES:[];
const $=(s)=>scope.querySelector(s);
const $$=(s)=>Array.from(scope.querySelectorAll(s));
const escape=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const types={"research-note":"Research Notes","learning-material":"Learning Materials","seminar-material":"Seminar Materials"};
const state={type:"all",query:"",year:"all"};
const search=$("#v2-study-search"),yearSelect=$("#v2-study-year"),container=$("#v2-study-list"),count=$("#v2-study-count"),empty=$("#v2-study-empty");
function safeURL(input){
 if(!input)return"";
 try{const u=new URL(input,window.location.href);return["http:","https:"].includes(u.protocol)?u.href:"";}catch{return"";}
}
function link(url,label){
 const safe=safeURL(url);
 return safe?'<a href="'+escape(safe)+'" target="_blank" rel="noopener noreferrer" class="st-v2-resource-link">'+escape(label)+' <span aria-hidden="true">↗</span></a>':"";
}
function formatRow(record){
 const original=link(record.sourceUrl,"원문 및 첨부자료 확인");
 const downloadable=record.downloadUrl?link(record.downloadUrl,"자료 다운로드"):"";
 return '<article class="st-v2-resource-row">'+
 '<span class="st-v2-resource-year">'+escape(record.year||"—")+'</span>'+
 '<div class="st-v2-resource-copy">'+
 '<span class="st-v2-resource-kind">'+escape(types[record.type]||record.type||"RESOURCE")+'</span>'+
 '<h3>'+escape(record.title)+'</h3>'+
 '<p class="st-v2-resource-topic">'+escape(record.topic||"주제 입력 예정")+'</p>'+
 '<p class="st-v2-resource-description">'+escape(record.summary||"간단 소개 입력 예정")+'</p>'+
 '</div><div class="st-v2-resource-actions">'+(downloadable||"")+original+
 (!downloadable&&!original?'<span class="st-v2-resource-note">공개 링크 준비 중</span>':"")+
 '</div></article>';
}
function update(){
 const q=state.query;
 const matches=source.filter(d=>(state.type==="all"||d.type===state.type)&&
 (state.year==="all"||String(d.year)===state.year)&&
 (!q||[d.title,d.topic,d.summary,d.year,types[d.type]].join(" ").toLocaleLowerCase().includes(q))
 ).sort((a,b)=>String(b.date||b.year||"").localeCompare(String(a.date||a.year||"")));
 container.innerHTML=matches.map(formatRow).join("");
 empty.hidden=matches.length>0;
 count.textContent=matches.length+" / "+source.length+" resources";
 $$("[data-study-resource-type]").forEach(button=>{
  const selected=button.dataset.studyResourceType===state.type;
  button.classList.toggle("is-selected",selected);
  button.setAttribute("aria-pressed",String(selected));
 });
}
const years=[...new Set(source.map(d=>Number(d.year)).filter(Number.isFinite))].sort((a,b)=>b-a);
for(const year of years){const opt=document.createElement("option");opt.value=year;opt.textContent=year;yearSelect.append(opt);}
$$("[data-study-resource-type]").forEach(b=>b.addEventListener("click",()=>{state.type=b.dataset.studyResourceType;update();}));
search.addEventListener("input",()=>{state.query=search.value.trim().toLocaleLowerCase();update();});
yearSelect.addEventListener("change",()=>{state.year=yearSelect.value;update();});
update();
})();

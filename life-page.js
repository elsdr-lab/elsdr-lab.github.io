/* ELSDR V2 Life: official News, existing Events, unified Activities.
   Places derive from activity records; never keep separate map-only locations.
   Event IDs may be associated with activity.eventId for two-way links.
   Actual photo assets and exact locations are left blank until confirmed. */
(function(){
"use strict";
const root=document.querySelector('[data-page="life"]');
if(!root)return;
const registry=window.ELSDR_LIFE_RECORDS||{events:[],activities:[]};
const news=Array.isArray(registry.news)?registry.news:[];
const events=Array.isArray(registry.events)?registry.events:[];
const activities=Array.isArray(registry.activities)?registry.activities:[];
const $=(s,base=root)=>base.querySelector(s);
const $$=(s,base=root)=>Array.from(base.querySelectorAll(s));
const E=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const categories={fieldwork:"Fieldwork",workshop:"Workshop",exchange:"Academic Exchange",lab:"Lab Life"};
const eventTypes={seminar:"Seminar",lecture:"Guest Lecture",conference:"Conference",workshop:"Workshop",forum:"Forum"};
function validUrl(s){
 if(!s)return"";
 try{const u=new URL(String(s),location.href);return["http:","https:"].includes(u.protocol)?u.href:"";}catch{return"";}
}
function extLink(url,label){
 const href=validUrl(url);
 return href?'<a href="'+E(href)+'" target="_blank" rel="noopener noreferrer">'+E(label)+' <span aria-hidden="true">↗</span></a>':"";
}
const state={eventType:"all",eventYear:"all",eventQuery:"",activityType:"all",activityQuery:"",placeId:null,region:"all",eventPage:1,eventPageSize:10,activityPage:1,activityPageSize:10};
let map=null,ready=false,failed=false,markers={};
const area=$('[data-life-view="activities"]');
const points=new Map();
for(const activity of activities){
 if(!Array.isArray(activity.places))continue;
 for(const place of activity.places){
  if(!place||!place.id||!Number.isFinite(place.lat)||!Number.isFinite(place.lon))continue;
  if(!points.has(place.id))points.set(place.id,{...place,activityIds:[]});
  const target=points.get(place.id);
  if(!target.activityIds.includes(activity.id))target.activityIds.push(activity.id);
 }
}
const locationList=[...points.values()];
const mapKinds={fieldwork:{label:"Field Trip",color:"#267d68"},conference:{label:"Conference",color:"#7555ae"},workshop:{label:"Workshop",color:"#d57d38"},other:{label:"Other Activities",color:"#66818b"}};
function mapKindForActivity(a){if(a.category==="fieldwork")return"fieldwork";if(a.category==="workshop")return"workshop";const e=events.find(e=>e.id===a.eventId);return a.category==="conference"||e?.category==="conference"?"conference":"other";}
function mapKindForPlace(p){const kinds=new Set(p.activityIds.map(id=>activities.find(a=>a.id===id)).filter(Boolean).map(mapKindForActivity));return kinds.size===1?[...kinds][0]:"other";}

function formattedPlaces(activity){
 return (activity.places||[]).map(p=>p.name).join(" · ");
}
function updateCategoryControls(){
 const buttons=$$("[data-lf-v2-activity-kind]");
 buttons.forEach(b=>{const active=b.dataset.lfV2ActivityKind===state.activityType;b.classList.toggle("is-selected",active);b.setAttribute("aria-pressed",String(active));});
}
function filteredActivities(){
 return activities.filter(a=>
   (state.activityType==="all"||a.category===state.activityType)&&
   (!state.placeId||(a.places||[]).some(p=>p.id===state.placeId))&&
   (!state.activityQuery||[a.title,a.date,a.year,a.summary,a.category,formattedPlaces(a)].join(" ").toLocaleLowerCase().includes(state.activityQuery))
 ).sort((a,b)=>{
    const byYear=Number(b.year)-Number(a.year);
    return byYear || String(b.date||"").localeCompare(String(a.date||""));
 });
}
function photoMarkup(a){
 if(a.photo&&validUrl(a.photo)){
   return '<div class="lf-v2-activity-photo"><img loading="lazy" src="'+E(validUrl(a.photo))+'" alt="'+E(a.title)+' 현장 사진"></div>';
 }
 return '<div class="lf-v2-activity-photo lf-v2-no-photo" aria-hidden="true"></div>';
}
const newsCategories={award:"Research & Awards",research:"Research News",publication:"Books & Publications",media:"Media Coverage",update:"Lab Updates"};
let newsFilter="all",newsQuery="";
function renderNews(){
 const list=$("#lf-v2-news-archive");
 if(!list)return;
 const filtered=[...news].filter(item=>
  (newsFilter==="all"||item.category===newsFilter)&&
  (!newsQuery||[item.title,item.date,item.publication,item.summary].join(" ").toLocaleLowerCase().includes(newsQuery))
 ).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
 list.innerHTML=filtered.map(item=>{
  const source=validUrl(item.externalUrl);
  // News is a consistently aligned text-only editorial index.
  return '<article class="lf-v2-news-row">'+
   '<div class="lf-v2-news-date"><time>'+E(item.date||"")+'</time><small>'+E(newsCategories[item.category]||"Lab News")+'</small></div>'+
   '<div class="lf-v2-news-content"><span class="lf-v2-news-publication">'+E(item.publication||"ELSDR")+'</span>'+
   '<h3>'+E(item.title||"")+'</h3>'+
   (item.summary?'<p>'+E(item.summary)+'</p>':"")+'</div>'+
   '<div class="lf-v2-news-action">'+(source?extLink(source,"Read story"):"")+'</div></article>';
 }).join("");
 $("#lf-v2-news-count").textContent=filtered.length+" news records";
 $("#lf-v2-news-no-results").hidden=filtered.length>0;
 $$("[data-lf-news-category]").forEach(button=>{
  const active=button.dataset.lfNewsCategory===newsFilter;
  button.classList.toggle("is-selected",active);
  button.setAttribute("aria-pressed",String(active));
 });
}
function initNews(){
 const search=$("#lf-v2-news-search");
 if(search)search.addEventListener("input",e=>{newsQuery=e.target.value.trim().toLocaleLowerCase();renderNews()});
 $$("[data-lf-news-category]").forEach(button=>button.addEventListener("click",()=>{newsFilter=button.dataset.lfNewsCategory;renderNews()}));
 renderNews();
}
function renderPager(type,total){
 const isEvent=type==="event",pageKey=isEvent?"eventPage":"activityPage",sizeKey=isEvent?"eventPageSize":"activityPageSize";
 const totalPages=Math.max(1,Math.ceil(total/state[sizeKey])),page=Math.min(state[pageKey],totalPages);
 const pager=$("#lf-v2-"+type+"-pagination");if(!pager)return;
 pager.replaceChildren();
 const prev=document.createElement("button");prev.type="button";prev.textContent="‹";prev.disabled=page<=1;prev.setAttribute("aria-label","이전 페이지");
 prev.addEventListener("click",()=>{state[pageKey]=page-1;isEvent?renderEvents():renderActivities();});
 pager.append(prev);
 for(let i=1;i<=totalPages;i++){
  const btn=document.createElement("button");btn.type="button";btn.textContent=String(i);btn.className=i===page?"is-current":"";btn.setAttribute("aria-label",i+"페이지");
  if(i===page)btn.setAttribute("aria-current","page");
  btn.addEventListener("click",()=>{state[pageKey]=i;isEvent?renderEvents():renderActivities();});pager.append(btn);
 }
 const next=document.createElement("button");next.type="button";next.textContent="›";next.disabled=page>=totalPages;next.setAttribute("aria-label","다음 페이지");
 next.addEventListener("click",()=>{state[pageKey]=page+1;isEvent?renderEvents():renderActivities();});pager.append(next);
}
function renderActivities(){
 const data=filteredActivities();
 const pageCount=Math.max(1,Math.ceil(data.length/state.activityPageSize));
 state.activityPage=Math.min(state.activityPage,pageCount);
 const visible=data.slice((state.activityPage-1)*state.activityPageSize,state.activityPage*state.activityPageSize);
 const wrap=$("#lf-v2-activity-grid");
 wrap.innerHTML=visible.map((a,i)=>
  '<a class="lf-v2-activity-card lf-v2-activity-row" href="#/life/activities/'+encodeURIComponent(a.id)+'">'+
  '<span class="lf-v2-row-index">'+String((state.activityPage-1)*state.activityPageSize+i+1).padStart(2,"0")+'</span>'+
  '<span class="lf-v2-row-year">'+E(a.year||String(a.date||"").slice(0,4)||"—")+'</span>'+
  '<strong class="lf-v2-row-title">'+E(a.title)+'</strong>'+
  '<span class="lf-v2-row-meta">'+E(categories[a.category]||"Activity")+(formattedPlaces(a)?" · "+E(formattedPlaces(a)):"")+'</span>'+
  '<span class="lf-v2-row-arrow" aria-hidden="true">↗</span></a>'
 ).join("");
 $("#lf-v2-activity-counter").textContent=data.length+" activities";
 renderPager("activity",data.length);
 $("#lf-v2-activity-empty").hidden=data.length>0;
 const clear=$("#lf-v2-clear-location");
 clear.hidden=!state.placeId;
 if(state.placeId){
  const name=points.get(state.placeId)?.name||state.placeId;
  clear.textContent=name+" 필터 해제 ✕";
 }
 updateCategoryControls();
 $$(".lf-v2-place-button").forEach(btn=>{
   const active=btn.dataset.lfV2Place===state.placeId;
   btn.classList.toggle("is-active",active);
   btn.setAttribute("aria-pressed",String(active));
 });
}
function activityDetail(id){
 const target=activities.find(x=>x.id===id);
 const container=$("#lf-v2-activity-detail-body");
 if(!container)return;
 if(!target){
  container.innerHTML='<h2>활동 기록을 찾지 못했습니다.</h2>';
  return;
 }
 const event=target.eventId?events.find(e=>e.id===target.eventId):null;
 const connected=event?'<a class="lf-v2-crosslink" href="#/life/events/'+encodeURIComponent(event.id)+'">Related Event ↗</a>':"";
 const photos=[...new Set((Array.isArray(target.photos)?target.photos:[]).concat(target.photo||""))]
  .filter(src=>!!validUrl(src));
 const photoGallery=photos.length?'<section class="lf-v2-activity-gallery"><div class="lf-v2-activity-gallery-head">'+
  '<h3>Photo Archive<span>.</span></h3><small>'+photos.length+' PHOTOS</small></div>'+
  '<div class="lf-v2-activity-gallery-grid">'+
  photos.map((photo,i)=>'<figure><img loading="lazy" src="'+E(validUrl(photo))+'" alt="'+E(target.title)+' 현장 기록 '+(i+1)+'"></figure>').join("")+
  '</div></section>':"";
 const facts=[
  ["DATE / YEAR",target.date||target.year||""],
  ["LOCATION",(target.places||[]).map(p=>p.name).join(" · ")],
  ["ACTIVITY TYPE",categories[target.category]||"Activity"]
 ].filter(([,val])=>String(val).trim())
  .map(([name,value])=>'<div><dt>'+E(name)+'</dt><dd>'+E(value)+'</dd></div>').join("");
 container.innerHTML='<header class="lf-v2-activity-detail-head">'+
  '<span>ELSDR / ACTIVITY RECORD / '+E(categories[target.category]||"Activity")+'</span>'+
  '<h2>'+E(target.title)+'</h2>'+
  (String(target.summary||"").trim()?'<p>'+E(target.summary)+'</p>':'<p class="lf-v2-detail-pending">활동 내용은 확인 후 추가 예정입니다.</p>')+
  '</header><dl class="lf-v2-activity-facts">'+facts+'</dl>'+
  photoGallery+
  (connected?'<div class="lf-v2-activity-links">'+connected+'</div>':"");
 document.title=target.title+" | ELSDR";
}

const eventCategoryLabels={seminar:"Seminar",lecture:"Guest Lecture",conference:"Conference",workshop:"Workshop",forum:"Forum"};
function eventSort(a,b){
 const y=Number(b.year||0)-Number(a.year||0);
 if(y)return y;
 const dateA=String(a.date||""),dateB=String(b.date||"");
 const aPrecise=/^\d{4}[.\/-]\d{2}/.test(dateA),bPrecise=/^\d{4}[.\/-]\d{2}/.test(dateB);
 if(aPrecise!==bPrecise)return aPrecise?-1:1;
 return dateB.localeCompare(dateA,"ko");
}
function eventMeta(record){
 return [record.speaker,record.organizer,record.location,record.summary].filter(Boolean).join(" · ");
}
function renderEventDetail(id){
 const e=events.find(item=>item.id===id);
 const target=$("#lf-event-detail-dynamic");
 if(!target)return false;
 if(!e){
  target.innerHTML='<a class="lf-event-back" href="#/life/events">← Back to Events</a><h2>행사 정보를 찾지 못했습니다.</h2>';
  document.title="Events | ELSDR";
  return false;
 }
 const category=eventCategoryLabels[e.category]||"Event";
 const parts=[["TYPE",category],["DATE / YEAR",e.date||e.year||""],["SPEAKER",e.speaker],["ORGANIZER",e.organizer],["LOCATION",e.location]]
  .filter(([,v])=>String(v??"").trim());
 const facts=parts.map(([label,value])=>'<div><dt>'+E(label)+'</dt><dd>'+E(value)+'</dd></div>').join("");
 const related=activities.filter(a=>a.eventId===e.id);
 const relatedHtml=related.length?'<div class="lf-v2-event-related"><strong>RELATED ACTIVITIES</strong>'+
  related.map(a=>'<a href="#/life/activities/'+encodeURIComponent(a.id)+'">'+E(a.title)+' · Activity Archive ↗</a>').join("")+'</div>':"";
 const photoUrl=validUrl(e.photo);
 const eventVisual=photoUrl?
   '<div class="lf-v2-event-photo"><img loading="lazy" src="'+E(photoUrl)+'" alt="'+E(e.title)+' 행사 기록 사진"></div>':
   '<div class="lf-event-detail-graphic" aria-hidden="true"><span>ELSDR / ACADEMIC EXCHANGE</span>'+
    '<strong>'+E(e.year||"")+'</strong><span>RESEARCH · COMMUNITY · IDEAS</span></div>';
 target.innerHTML='<a class="lf-event-back" href="#/life/events">← Back to Events</a>'+
  '<header class="lf-event-detail-head"><span class="lf-event-detail-eyebrow">ELSDR / EVENTS / '+E(category)+' / '+E(e.year||"")+'</span>'+
  '<h2>'+E(e.title)+'</h2></header>'+
  '<div class="lf-event-detail-grid">'+
   eventVisual+
   '<div class="lf-event-detail-content"><h3>Event information</h3><dl>'+facts+'</dl>'+
   (String(e.summary||"").trim()?'<p class="lf-v2-event-description">'+E(e.summary)+'</p>':"")+
   relatedHtml+'</div></div>'+
   '<div class="lf-event-detail-foot"><a href="#/life/events">← All events</a><span>ELSDR / LIFE</span></div>';
 document.title=e.title+" | ELSDR";
 return true;
}
function initEventFilters(){
 const year=$("#lf-v2-event-year");
 year.innerHTML='<option value="all">All Years</option>';
 [...new Set(events.map(e=>Number(e.year)).filter(y=>Number.isFinite(y)&&y>0))].sort((a,b)=>b-a).forEach(y=>{
  const opt=document.createElement("option");opt.value=String(y);opt.textContent=String(y);year.append(opt);
 });
 $$("[data-seminar-filter]").forEach(btn=>{
  btn.addEventListener("click",()=>{state.eventType=btn.dataset.seminarFilter;state.eventPage=1;renderEvents();});
 });
 year.addEventListener("change",()=>{state.eventYear=year.value;state.eventPage=1;renderEvents();});
 $("#lf-seminar-search").addEventListener("input",e=>{state.eventQuery=e.target.value.trim().toLocaleLowerCase();state.eventPage=1;renderEvents();});
 $("#lf-v2-event-page-size").addEventListener("change",e=>{state.eventPageSize=Number(e.target.value)||10;state.eventPage=1;renderEvents();});
 renderEvents();
}
function renderEvents(){
 const filtered=[...events].filter(e=>
  (state.eventType==="all"||state.eventType===e.category)&&
  (state.eventYear==="all"||String(e.year)===state.eventYear)&&
  (!state.eventQuery||[e.title,e.speaker,e.organizer,e.location,e.summary,e.date,e.year].join(" ").toLocaleLowerCase().includes(state.eventQuery))
 ).sort(eventSort);
 const pages=Math.max(1,Math.ceil(filtered.length/state.eventPageSize));
 state.eventPage=Math.min(state.eventPage,pages);
 const visible=filtered.slice((state.eventPage-1)*state.eventPageSize,state.eventPage*state.eventPageSize);
 const list=$(".lf-seminar-list");
 if(list)list.innerHTML=visible.map((e,i)=>
  '<a class="lf-seminar" href="#/life/events/'+encodeURIComponent(e.id)+'">'+
  '<span>'+String((state.eventPage-1)*state.eventPageSize+i+1).padStart(2,"0")+'</span><span>'+E(e.year||"—")+'</span>'+
  '<div><small>'+E(eventCategoryLabels[e.category]||"Event")+' · '+E(e.date||e.year||"")+'</small>'+
  '<h3>'+E(e.title)+'</h3>'+
  (e.speaker||e.organizer?'<p class="lf-seminar-person">'+E(e.speaker||e.organizer)+'</p>':"")+'</div>'+
  '<span class="lf-seminar-arrow">↗</span></a>').join("");
 $$("[data-seminar-filter]").forEach(btn=>{
  const type=btn.dataset.seminarFilter,active=type===state.eventType;
  btn.classList.toggle("is-selected",active);btn.setAttribute("aria-pressed",String(active));
  const count=events.filter(e=>type==="all"||e.category===type).length;
  const label={all:"전체",seminar:"세미나",lecture:"초청강연",conference:"학술대회",workshop:"워크숍",forum:"포럼"}[type]||type;
  // Rebuild from canonical labels and a single count; never reuse stale markup.
  const badge=document.createElement("span");
  badge.className="lf-seminar-filter-count";
  badge.textContent=String(count);
  btn.replaceChildren(document.createTextNode("# "+label),badge);
 });
 $("#lf-seminar-count").textContent=filtered.length+" event records";
 renderPager("event",filtered.length);
 $("#lf-seminar-empty").hidden=filtered.length>0;
}
function popupForPlace(p){
 const wrap=document.createElement("div");wrap.className="lf-v2-map-popup";
 const heading=document.createElement("strong");heading.textContent=p.name;wrap.append(heading);
 const desc=document.createElement("p");desc.textContent=p.approximate?"지역 중심 좌표 · 정확한 방문 지점 미확인":"활동 위치";wrap.append(desc);
 p.activityIds.forEach(id=>{
   const activity=activities.find(a=>a.id===id);
   if(!activity)return;
   const link=document.createElement("a");link.href="#/life/activities/"+encodeURIComponent(id);
   link.textContent=mapKinds[mapKindForActivity(activity)].label+" · "+activity.title;wrap.append(link);
 });
 return wrap;
}
function locationSelection(id,{fly=true}={}){
 if(id&&!points.has(id))return;
 state.placeId=id||null;state.activityType="all";state.activityQuery="";state.activityPage=1;
 $("#lf-v2-activity-search").value="";renderActivities();
 const p=id?points.get(id):null;
 $("#lf-v2-active-place").textContent=p?p.name+" · "+p.activityIds.length+" linked records":"All locations";
 const layout=$(".lf-v2-map-layout"),panel=$("#lf-v2-spotlight"),content=$("#lf-v2-spotlight-content");
 layout.classList.toggle("is-detail-open",!!p);panel.hidden=!p;
 if(p){
  content.replaceChildren();
  const eyebrow=document.createElement("div");eyebrow.className="lf-v2-spotlight-eyebrow";eyebrow.textContent="SELECTED LOCATION / "+p.region;
  const title=document.createElement("h4");title.textContent=p.name;
  const meta=document.createElement("p");meta.className="lf-v2-spotlight-meta";meta.textContent=(p.approximate?"지역 중심 좌표 · ":"")+p.activityIds.length+" connected activities";
  const list=document.createElement("div");list.className="lf-v2-spotlight-entries";
  p.activityIds.forEach(id=>{
   const a=activities.find(item=>item.id===id);if(!a)return;
   const link=document.createElement("a");link.className="lf-v2-spotlight-entry";link.href="#/life/activities/"+encodeURIComponent(a.id);
   const kind=document.createElement("span");kind.className="lf-v2-spotlight-kind";kind.dataset.mapKind=mapKindForActivity(a);kind.textContent=mapKinds[mapKindForActivity(a)].label;
   const name=document.createElement("strong");name.textContent=a.title;
   const more=document.createElement("small");more.textContent=(a.year||"")+" · View activity ↗";
   link.append(kind,name,more);
   const shots=[...new Set([a.photo,...(Array.isArray(a.photos)?a.photos:[])])].filter(src=>!!validUrl(src));
   if(shots.length){
    const gallery=document.createElement("div");gallery.className="lf-v2-spotlight-gallery";
    const first=document.createElement("img");first.src=validUrl(shots[0]);first.alt=a.title+" 활동 사진";first.loading="lazy";first.className="lf-v2-spotlight-cover";
    gallery.append(first);
    const strip=document.createElement("div");strip.className="lf-v2-spotlight-thumbs";strip.setAttribute("aria-label",a.title+" 사진 미리보기");
    shots.forEach((src,i)=>{
     const thumb=document.createElement("button");thumb.type="button";thumb.className="lf-v2-spotlight-thumb";thumb.setAttribute("aria-label","사진 "+(i+1)+" 보기");
     const img=document.createElement("img");img.src=validUrl(src);img.alt="";img.loading="lazy";thumb.append(img);
     thumb.addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation();first.src=validUrl(src);strip.querySelectorAll("button").forEach(el=>el.classList.remove("is-current"));thumb.classList.add("is-current");});
     if(i===0)thumb.classList.add("is-current");strip.append(thumb);
    });
    gallery.append(strip);
    const wrapper=document.createElement("div");wrapper.className="lf-v2-spotlight-record";wrapper.append(link,gallery);list.append(wrapper);
   }else list.append(link);
  });
  content.append(eyebrow,title,meta,list);
 }
 if(map){map.select(id,fly);map.updateVisible();}
}
function placeButtons(){
 const visible=locationList.filter(p=>state.region==="all"||p.group===state.region);
 $("#lf-v2-place-count").textContent=visible.length+" PLACES";
 const el=$("#lf-v2-place-list");el.replaceChildren();
 visible.forEach(p=>{
   const button=document.createElement("button");
   button.type="button";button.className="lf-v2-place-button";button.dataset.lfV2Place=p.id;button.setAttribute("aria-pressed",String(state.placeId===p.id));
   const title=document.createElement("strong");title.textContent=p.name;
   const linked=p.activityIds.map(id=>activities.find(a=>a.id===id)).filter(Boolean);
   const kinds=[...new Set(linked.map(a=>mapKinds[mapKindForActivity(a)].label))];
   const subtitle=document.createElement("small");subtitle.textContent=p.region+" · "+linked.length+" activities";
   const kindLine=document.createElement("span");kindLine.className="lf-v2-place-kinds";kindLine.textContent=kinds.join(" / ");
   button.append(title,subtitle,kindLine);
   button.addEventListener("click",()=>locationSelection(p.id,{fly:true}));
   const entry=document.createElement("div");entry.className="lf-v2-place-entry";
   const linkedList=document.createElement("div");linkedList.className="lf-v2-place-linked";
   linked.slice(0,3).forEach(activity=>{
     const anchor=document.createElement("a");
     anchor.href="#/life/activities/"+encodeURIComponent(activity.id);
     const label=document.createElement("span");label.className="lf-v2-place-type";label.textContent=mapKinds[mapKindForActivity(activity)].label;label.dataset.mapKind=mapKindForActivity(activity);
     const activityName=document.createElement("strong");activityName.textContent=activity.title;
     anchor.append(label,activityName);linkedList.append(anchor);
   });
   if(linked.length>3){const more=document.createElement("small");more.textContent="외 "+(linked.length-3)+"건";linkedList.append(more);}
   entry.append(button,linkedList);el.append(entry);
 });
 $$("[data-lf-v2-region]").forEach(btn=>{
   const selected=btn.dataset.lfV2Region===state.region;
   btn.classList.toggle("is-selected",selected);btn.setAttribute("aria-pressed",String(selected));
 });
 if(map)map.updateVisible();
}
function resetMap(){if(map)map.reset();}
function mapFallback(){
 if(ready||failed)return;
 failed=true;
 $("#lf-v2-map").innerHTML='<div class="lf-v2-map-unavailable">지구본을 불러오지 못했습니다. 아래 장소 목록에서 활동을 확인할 수 있습니다.</div>';
}
async function initializeMap(){
 if(ready||failed||$('[data-life-view="activities"]').hidden)return;
 if(!window.d3||!window.topojson){if(document.readyState==="complete")mapFallback();return;}
 ready=true;
 const node=$("#lf-v2-map");node.replaceChildren();
 try{
  const response=await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  if(!response.ok)throw Error("Geography unavailable");
  const world=await response.json(),d3=window.d3,land=window.topojson.feature(world,world.objects.land);
  const svg=d3.select(node).append("svg").attr("viewBox","0 0 640 640").attr("role","img").attr("aria-label","드래그하여 회전하는 지구본. 색상 점을 선택하면 활동 정보를 볼 수 있습니다.");
  const projection=d3.geoOrthographic().scale(289).translate([320,320]).clipAngle(90).precision(.3),path=d3.geoPath(projection);
  const ocean=svg.append("path").datum({type:"Sphere"}).attr("class","lf-globe-ocean");
  const grid=svg.append("path").datum(d3.geoGraticule10()).attr("class","lf-globe-grid");
  const ground=svg.append("path").datum(land).attr("class","lf-globe-land");

  const dots=svg.append("g").attr("class","lf-globe-points").selectAll("g").data(locationList).join("g").attr("class","lf-globe-point").attr("tabindex",0).attr("role","button").attr("aria-label",p=>p.name+" 활동 보기");
  dots.append("circle").attr("class","lf-globe-halo").attr("r",15);
  dots.append("circle").attr("class","lf-globe-core").attr("r",7).attr("fill",p=>mapKinds[mapKindForPlace(p)].color);
  dots.append("title").text(p=>p.name);
  let holdUntil=0,last=0,dragMoved=false;
  function draw(){
   ocean.attr("d",path);grid.attr("d",path);ground.attr("d",path);
   dots.each(function(p){
    const show=d3.geoDistance([p.lon,p.lat],[-projection.rotate()[0],-projection.rotate()[1]])<Math.PI/2-.02&&(state.region==="all"||p.group===state.region);
    const dot=d3.select(this);dot.style("display",show?"":"none");
    if(show){const xy=projection([p.lon,p.lat]);dot.attr("transform","translate("+xy[0]+","+xy[1]+")");}
    dot.classed("is-selected",p.id===state.placeId);
   });
  }
  function select(id,fly=true){
   if(!id){holdUntil=Date.now()+1200;draw();return;}
   const p=points.get(id);if(!p)return;
   holdUntil=Date.now()+5500;
   if(fly)projection.rotate([-p.lon,-p.lat,0]);
   draw();
  }
  dots.on("click",(ev,p)=>{ev.stopPropagation();if(!dragMoved)locationSelection(p.id,{fly:true});});
  dots.on("keydown",(ev,p)=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();locationSelection(p.id,{fly:true});}});
  svg.call(d3.drag().on("start",()=>{dragMoved=false;holdUntil=Date.now()+4500;}).on("drag",event=>{
   if(Math.abs(event.dx)+Math.abs(event.dy)>1)dragMoved=true;
   const r=projection.rotate();projection.rotate([r[0]+event.dx*.32,Math.max(-80,Math.min(80,r[1]-event.dy*.32)),0]);draw();holdUntil=Date.now()+4000;
  }).on("end",()=>{setTimeout(()=>{dragMoved=false;},80);}));
  projection.rotate([-25,-13,0]);draw();
  function tick(t){if(!node.isConnected)return;if(last&&Date.now()>holdUntil){const r=projection.rotate();projection.rotate([r[0]+Math.min(32,t-last)*.006,r[1],0]);draw();}last=t;requestAnimationFrame(tick);}
  requestAnimationFrame(tick);
  map={invalidateSize:draw,select,reset(){holdUntil=Date.now()+1400;projection.rotate(state.region==="korea"?[-127,-37,0]:state.region==="overseas"?[-15,-27,0]:[-25,-13,0]);draw();},updateVisible:draw};
  placeButtons();
 }catch(err){ready=false;mapFallback();}
}
function initActivityFilters(){
 $("#lf-v2-spotlight-close").addEventListener("click",()=>locationSelection(null));
 $$("[data-lf-v2-activity-kind]").forEach(btn=>btn.addEventListener("click",()=>{state.activityType=btn.dataset.lfV2ActivityKind;state.placeId=null;state.activityPage=1;renderActivities();}));
 $("#lf-v2-activity-search").addEventListener("input",e=>{state.activityQuery=e.target.value.toLocaleLowerCase().trim();state.activityPage=1;renderActivities();});
 $("#lf-v2-clear-location").addEventListener("click",()=>locationSelection(null));
 $("#lf-v2-places-reset").addEventListener("click",()=>{state.region="all";locationSelection(null);placeButtons();});
 $$("[data-lf-v2-region]").forEach(btn=>btn.addEventListener("click",()=>{
   state.region=btn.dataset.lfV2Region;
   if(state.placeId&&points.get(state.placeId)?.group!==state.region&&state.region!=="all")locationSelection(null);
   placeButtons();resetMap();
 }));
 $("#lf-v2-activity-page-size").addEventListener("change",e=>{state.activityPageSize=Number(e.target.value)||10;state.activityPage=1;renderActivities();});
 placeButtons();renderActivities();
}
function renderRoute(){
 const route=location.hash.replace(/^#\/?/,"").split("?")[0];
 const [section,view="news",id]=route.split("/");
 if(section!=="life")return;
 const legacyNews={ "green-space":"people/professor/books","campus":"people/professor/books","light":"people/professor/books","summer":"people/professor/books","recruitment":"contact/join" };
 if(view==="news"&&id&&legacyNews[id]){
   location.replace("#/"+legacyNews[id]);return;
 }
 const current=["news","events","activities"].includes(view)?view:"news";
 const eventDetail=current==="events"&&!!id;
 const activityDetailOpen=current==="activities"&&!!id;
 $$("[data-life-view]").forEach(panel=>{
   const panelView=panel.dataset.lifeView;
   panel.hidden= panelView!== (activityDetailOpen?"activity-detail":current);
 });
 $$("[data-v2-life-nav]").forEach(anchor=>{
   const active=anchor.dataset.v2LifeNav===current;
   anchor.classList.toggle("is-active",active);
   if(active)anchor.setAttribute("aria-current","page");else anchor.removeAttribute("aria-current");
 });
 const eventList=$("#lf-events-list"),eventContainer=$("#lf-event-stories");
 if(eventList&&eventContainer){
  eventList.hidden=eventDetail;
  eventContainer.hidden=!eventDetail;
  if(eventDetail)renderEventDetail(id);
 }
 if(activityDetailOpen)activityDetail(id);
 if(current==="activities"&&!activityDetailOpen){
   requestAnimationFrame(()=>{initializeMap();if(map)map.invalidateSize();});
 }
 if(!id)document.title=(current==="activities"?"Activities":current==="events"?"Events":"News")+" | ELSDR";
}
initNews();initEventFilters();initActivityFilters();
window.addEventListener("hashchange",renderRoute);
window.addEventListener("load",()=>{renderRoute();if(!ready&&!failed&&!$('[data-life-view="activities"]').hidden)initializeMap();});
renderRoute();
})();
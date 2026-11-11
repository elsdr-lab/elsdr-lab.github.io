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
const state={eventType:"all",eventYear:"all",eventQuery:"",activityType:"all",activityQuery:"",placeId:null,region:"all"};
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
 return '<div class="lf-v2-activity-photo lf-v2-no-photo"><span>PHOTO / TO BE ADDED</span><b>ELSDR</b></div>';
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
function renderActivities(){
 const data=filteredActivities();
 const wrap=$("#lf-v2-activity-grid");
 wrap.innerHTML=data.map(a=>
   '<a class="lf-v2-activity-card" href="#/life/activities/'+encodeURIComponent(a.id)+'">'+photoMarkup(a)+
     '<div class="lf-v2-card-copy"><span class="lf-v2-card-meta">'+E(a.date||a.year||"")+' / '+E(categories[a.category]||"Activity")+'</span>'+
     '<h4>'+E(a.title)+'</h4>'+
     '<p>'+E(formattedPlaces(a)||"장소 미등록 / 기록만 표시")+'</p>'+
     '<span class="lf-v2-card-link">View activity <b aria-hidden="true">↗</b></span></div></a>'
 ).join("");
 $("#lf-v2-activity-counter").textContent=data.length+" activities";
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
 if(!target){
   container.innerHTML='<h2>활동 기록을 찾지 못했습니다.</h2><p>Activities 목록에서 다시 확인해 주세요.</p>';
   return;
 }
 const fromEvent=target.eventId?events.find(e=>e.id===target.eventId):null;
 const eventLink=fromEvent?'<a class="lf-v2-crosslink" href="#/life/events/'+encodeURIComponent(fromEvent.id)+'">Connected Event / 행사 안내 ↗</a>':"";
 const rawPlaces=(target.places||[]);
 container.innerHTML='<header class="lf-v2-activity-detail-head">'+
    '<span>ELSDR / ACTIVITY RECORD / '+E(categories[target.category]||"Activity")+'</span>'+
    '<h2>'+E(target.title)+'</h2><p>'+E(target.summary||"활동 내용 입력 예정")+'</p></header>'+
    '<dl class="lf-v2-activity-facts">'+
      '<div><dt>DATE / YEAR</dt><dd>'+E(target.date||target.year||"등록 예정")+'</dd></div>'+
      '<div><dt>LOCATION</dt><dd>'+E(rawPlaces.map(p=>p.name).join(" · ")||"위치 정보 없음")+'</dd></div>'+
      '<div><dt>ACTIVITY TYPE</dt><dd>'+E(categories[target.category]||"Activity")+'</dd></div>'+
    '</dl>'+
    '<section class="lf-v2-activity-gallery"><h3>Photos &amp; Records</h3>'+photoMarkup(target)+
      '<p>기존 게시물의 현장 사진은 확인 후 등록합니다. 현재 예시 이미지를 실제 기록으로 오인하지 않도록 사진 자리만 표시했습니다.</p></section>'+
    '<div class="lf-v2-activity-links">'+
       extLink(target.sourceUrl,"Original activity record")+eventLink+
    '</div>';
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
  btn.addEventListener("click",()=>{state.eventType=btn.dataset.seminarFilter;renderEvents();});
 });
 year.addEventListener("change",()=>{state.eventYear=year.value;renderEvents();});
 $("#lf-seminar-search").addEventListener("input",e=>{state.eventQuery=e.target.value.trim().toLocaleLowerCase();renderEvents();});
 renderEvents();
}
function renderEvents(){
 const filtered=[...events].filter(e=>
  (state.eventType==="all"||state.eventType===e.category)&&
  (state.eventYear==="all"||String(e.year)===state.eventYear)&&
  (!state.eventQuery||[e.title,e.speaker,e.organizer,e.location,e.summary,e.date,e.year].join(" ").toLocaleLowerCase().includes(state.eventQuery))
 ).sort(eventSort);
 const list=$(".lf-seminar-list");
 if(list)list.innerHTML=filtered.map((e,i)=>
  '<a class="lf-seminar" href="#/life/events/'+encodeURIComponent(e.id)+'">'+
  '<span>'+String(i+1).padStart(2,"0")+'</span><span>'+E(e.year||"—")+'</span>'+
  '<div><small>'+E(eventCategoryLabels[e.category]||"Event")+' · '+E(e.date||e.year||"")+'</small>'+
  '<h3>'+E(e.title)+'</h3>'+
  (e.speaker||e.organizer?'<p class="lf-seminar-person">'+E(e.speaker||e.organizer)+'</p>':"")+'</div>'+
  '<span class="lf-seminar-arrow">↗</span></a>').join("");
 $$("[data-seminar-filter]").forEach(btn=>{
  const type=btn.dataset.seminarFilter,active=type===state.eventType;
  btn.classList.toggle("is-selected",active);btn.setAttribute("aria-pressed",String(active));
  const count=events.filter(e=>type==="all"||e.category===type).length;
  const badge=$("span",btn);if(badge)badge.textContent=count;
 });
 $("#lf-seminar-count").textContent=filtered.length+" event records";
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
   link.textContent=activity.title+" ↗";wrap.append(link);
 });
 return wrap;
}
function locationSelection(id,{scroll=false,fly=true}={}){
 if(id&&!points.has(id))return;
 state.placeId=id||null;state.activityType="all";state.activityQuery="";
 $("#lf-v2-activity-search").value="";
 renderActivities();
 const point=id?points.get(id):null;
 $("#lf-v2-active-place").textContent=point?point.name+" · "+point.activityIds.length+" linked records":"All locations";
 if(map&&point&&markers[id]&&fly){
   map.flyTo([point.lat,point.lon],point.group==="korea"?10:9,{duration:.6});
   markers[id].openPopup();
 }
 if(!id)resetMap();
 if(scroll)requestAnimationFrame(()=>$("#lf-v2-activity-archive").scrollIntoView({behavior:"smooth",block:"start"}));
}
function placeButtons(){
 const visible=locationList.filter(p=>state.region==="all"||p.group===state.region);
 $("#lf-v2-place-count").textContent=visible.length+" PLACES";
 const el=$("#lf-v2-place-list");el.replaceChildren();
 visible.forEach(p=>{
   const button=document.createElement("button");
   button.type="button";button.className="lf-v2-place-button";button.dataset.lfV2Place=p.id;button.setAttribute("aria-pressed",String(state.placeId===p.id));
   const title=document.createElement("strong");title.textContent=p.name;
   const subtitle=document.createElement("small");subtitle.textContent=p.region+" · "+p.activityIds.length+" activities";
   button.append(title,subtitle);
   button.addEventListener("click",()=>locationSelection(p.id,{scroll:true,fly:true}));
   el.append(button);
 });
 $$("[data-lf-v2-region]").forEach(btn=>{
   const selected=btn.dataset.lfV2Region===state.region;
   btn.classList.toggle("is-selected",selected);btn.setAttribute("aria-pressed",String(selected));
 });
 if(map){
   for(const p of locationList){
     const marker=markers[p.id];
     if(!marker)continue;
     const show=state.region==="all"||p.group===state.region;
     if(show&&!map.hasLayer(marker))marker.addTo(map);
     if(!show&&map.hasLayer(marker))map.removeLayer(marker);
   }
 }
}
function resetMap(){
 if(!map)return;
 map.closePopup();
 const selected=locationList.filter(p=>state.region==="all"||p.group===state.region);
 if(!selected.length){map.setView([35,22],2);return;}
 if(state.region==="all"){map.setView([34,17],2,{animate:true});return;}
 const bounds=window.L.latLngBounds(selected.map(p=>[p.lat,p.lon]));
 map.flyToBounds(bounds,{padding:[50,50],maxZoom:state.region==="korea"?9:5,duration:.65});
}
function mapFallback(){
 if(ready||failed)return;
 failed=true;
 const node=$("#lf-v2-map");
 node.innerHTML='<div class="lf-v2-map-unavailable">대화형 지도를 불러오지 못했습니다.<br>왼쪽 장소 목록에서 연결된 활동을 확인할 수 있습니다.</div>';
}
function initializeMap(){
 if(ready||failed)return;
 const panel=$('[data-life-view="activities"]');
 if(panel.hidden)return;
 const mapNode=$("#lf-v2-map");
 if(!window.L){
   if(document.readyState==="complete")mapFallback();
   return;
 }
 ready=true;mapNode.innerHTML="";
 map=window.L.map(mapNode,{scrollWheelZoom:false,worldCopyJump:true}).setView([34,17],2);
 window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
   minZoom:2,maxZoom:17,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
 }).addTo(map);
 for(const p of locationList){
   const marker=window.L.circleMarker([p.lat,p.lon],{radius:10,color:"#ffffff",weight:2,fillColor:"#4d98b8",fillOpacity:.94}).addTo(map);
   marker.bindPopup(popupForPlace(p));
   marker.on("click",()=>locationSelection(p.id,{scroll:false,fly:false}));
   markers[p.id]=marker;
 }
 placeButtons();resetMap();
 requestAnimationFrame(()=>map.invalidateSize());
}
function initActivityFilters(){
 $$("[data-lf-v2-activity-kind]").forEach(btn=>btn.addEventListener("click",()=>{state.activityType=btn.dataset.lfV2ActivityKind;state.placeId=null;renderActivities();}));
 $("#lf-v2-activity-search").addEventListener("input",e=>{state.activityQuery=e.target.value.toLocaleLowerCase().trim();renderActivities();});
 $("#lf-v2-clear-location").addEventListener("click",()=>locationSelection(null));
 $("#lf-v2-places-reset").addEventListener("click",()=>{state.region="all";locationSelection(null);placeButtons();});
 $$("[data-lf-v2-region]").forEach(btn=>btn.addEventListener("click",()=>{
   state.region=btn.dataset.lfV2Region;
   if(state.placeId&&points.get(state.placeId)?.group!==state.region&&state.region!=="all")locationSelection(null);
   placeButtons();resetMap();
 }));
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
/* ELSDR V2 Contact — consolidated Location and data-managed Join Us.
   Current openings must be explicitly added to contact-records.js.
   A previous recruitment notice is not proof that a position remains open. */
(function(){
 "use strict";
 const page=document.querySelector('[data-page="contact"]');
 if(!page)return;
 const data=window.ELSDR_CONTACT_DATA||{};
 const $=(selector)=>page.querySelector(selector);
 const $$=(selector)=>Array.from(page.querySelectorAll(selector));
 const escape=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const safeURL=value=>{
   if(!value)return"";
   try{
     const parsed=new URL(String(value),window.location.href);
     return ["https:","http:"].includes(parsed.protocol)?parsed.href:"";
   }catch{return"";}
 };
 const mailTo=(address,subject)=>"mailto:"+String(address).trim()+(subject?"?subject="+encodeURIComponent(subject):"");
 const phoneTo=phone=>"tel:+82"+String(phone).replace(/[^0-9]/g,"").replace(/^0/,"");
 const assignLink=(id,text,href)=>{
   const el=$("#"+id);if(!el||!text)return;
   el.textContent=text+" ↗";el.href=href;
 };
 function renderLocation(){
   const loc=data.location||{},contacts=data.contacts||{};
   const addressKo=$("#ct-v2-address-ko"),addressEn=$("#ct-v2-address-en");
   if(addressKo)addressKo.textContent=loc.addressKo||"주소 확인 후 입력";
   if(addressEn)addressEn.textContent=loc.addressEn||"Address to be confirmed";
   const building=$("#ct-v2-building"),room=$("#ct-v2-room");
   if(building)building.textContent=(loc.institution?"고려대학교 자연계캠퍼스 · ":"")+(loc.buildingKo||"건물 정보 확인 후 입력");
   if(room)room.textContent=[loc.roomKo,loc.roomEn].filter(Boolean).join(" · ")||"호실 확인 후 입력";
   if(contacts.labEmail)assignLink("ct-v2-lab-email",contacts.labEmail,mailTo(contacts.labEmail));
   if(contacts.labPhone)assignLink("ct-v2-lab-phone",contacts.labPhone,phoneTo(contacts.labPhone));
   if(contacts.professorEmail)assignLink("ct-v2-professor-email",contacts.professorEmail,mailTo(contacts.professorEmail));
   if(contacts.professorPhone)assignLink("ct-v2-professor-phone",contacts.professorPhone,phoneTo(contacts.professorPhone));
   if(contacts.labEmail){
     assignLink("ct-v2-apply-email","Research inquiry by email",mailTo(contacts.labEmail,"ELSDR Research Inquiry"));
     assignLink("ct-v2-inquiry-link","Contact the lab",mailTo(contacts.labEmail,"ELSDR Research Inquiry"));
   }
   const iframe=$(".ct-v2-map-shell iframe"),map=$("#ct-v2-map-link");
   if(loc.mapSearch&&iframe&&map){
     const query=encodeURIComponent(loc.mapSearch);
     iframe.src="https://www.google.com/maps?q="+query+"&output=embed";
     map.href="https://www.google.com/maps/search/?api=1&query="+query;
   }
 }
 function renderOpportunities(){
   const entries=Array.isArray(data.opportunities)?data.opportunities:[];
   const el=$("#ct-v2-opportunity-list");if(!el)return;
   el.innerHTML=entries.length?entries.map((item,index)=>
    '<div class="ct-v2-opportunity-row"><span>'+String(index+1).padStart(2,"0")+'</span>'+
    '<div><h4>'+escape(item.title)+'</h4><p>'+escape(item.description)+'</p></div></div>'
   ).join(""):'<div class="ct-v2-empty">연구 참여 활동 정보는 자료 확인 후 등록합니다.</div>';
 }
 const statusLabel={open:"모집 중",upcoming:"모집 예정",closed:"모집 마감",unverified:"상태 확인 중"};
 function renderPositions(){
   const el=$("#ct-v2-open-position-list");
   if(!el)return;
   const registered=Array.isArray(data.positions)?data.positions:[];
   const confirmed=registered.filter(p=>p.verified===true&&["open","upcoming","closed"].includes(p.status)&&p.title);
   const sorted=[...confirmed].sort((a,b)=>String(a.deadline||"").localeCompare(String(b.deadline||"")));
   el.innerHTML=sorted.length?'<div class="ct-v2-position-list">'+sorted.map(item=>{
     const href=safeURL(item.url);
     const stateClass=["open","upcoming","closed"].includes(item.status)?item.status:"unverified";
     return '<article class="ct-v2-position">'+
       '<div><span class="ct-v2-position-status is-'+stateClass+'">'+escape(statusLabel[stateClass])+'</span>'+
       '<h4>'+escape(item.title)+'</h4><p>'+escape(item.type||"")+(item.deadline?" · 지원기한 "+escape(item.deadline):"")+'</p></div>'+
       (href?'<a href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">공고 확인 ↗</a>':"")+
     '</article>';
   }).join("")+'</div>':'<div class="ct-v2-empty"><strong>현재 확인된 모집 공고가 없습니다.</strong><p>모집 중이 아니라는 확정 안내는 아니며, 최신 모집 여부는 연구실에 문의해 주세요.</p></div>';
 }
 function renderHistory(){
   const el=$("#ct-v2-recruitment-history");if(!el)return;
   const records=Array.isArray(data.pastNotices)?data.pastNotices:[];
   el.innerHTML=records.length?records.map(item=>{
     const href=safeURL(item.url);
     return '<div class="ct-v2-prior-item">'+
       '<div><span>'+escape(item.published||"이전 게시물")+' / 이전 모집 안내 · 현재 상태 미확인</span>'+
       '<h4>'+escape(item.title)+'</h4></div>'+
       (href?'<a href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">기존 공고 보기 ↗</a>':"")+'</div>';
   }).join(""):'<p class="ct-v2-empty">이전 모집 공고가 등록되어 있지 않습니다.</p>';
 }
 function syncNav(){
   const route=window.location.hash.replace(/^#\/?/,"").split("?")[0];
   if(route.split("/")[0]!=="contact")return;
   const path=route.split("/")[1]||"location";
   $$("[data-ct-v2-tab]").forEach(a=>{
     const active=a.dataset.ctV2Tab===path;
     a.classList.toggle("is-selected",active);
     if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
   });
 }
 renderLocation();
 renderOpportunities();
 renderPositions();
 renderHistory();
 $("[data-ct-scroll]").forEach(button=>button.addEventListener("click",()=>{
   const id=button.dataset.ctScroll;
   const target=page.querySelector("#"+id);
   target?.scrollIntoView({block:"start",behavior:"smooth"});
 }));
 window.addEventListener("hashchange",syncNav);
 syncNav();
})();
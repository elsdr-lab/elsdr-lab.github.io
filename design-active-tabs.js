/* View-only enhancements for the Claude design handoff:
   active breadcrumb/tab styles. Does not change routes or site data. */
(function(){
"use strict";
function render(){
 const route=window.location.hash.replace(/^#\/?/,"").split("?")[0].toLowerCase();
 const parts=route.split("/");
 const root=parts[0]||"home";
 const researcher=parts[1]||"";
 const sub=parts[2]||"";
 document.querySelectorAll("[data-ds-research]").forEach(link=>{
   const slug=link.dataset.dsResearch;
   const current=root==="research"&&(
     (slug==="all"&&!["projects","publications"].includes(researcher))||
     (slug==="project"&&researcher==="projects")||
     (slug==="publication"&&researcher==="publications")
   );
   link.classList.toggle("is-active",current);
   if(current)link.setAttribute("aria-current","page");
   else link.removeAttribute("aria-current");
 });
 document.querySelectorAll(".ds-about-masthead .ab-sections-nav a").forEach(link=>{
   const current=root==="about"&&link.getAttribute("href")==="#/"+route;
   link.classList.toggle("is-active",current);
   if(current)link.setAttribute("aria-current","location");
   else link.removeAttribute("aria-current");
 });
 const crumb=document.getElementById("ds-people-current");
 if(crumb&&root==="people"){
   crumb.textContent=researcher==="alumni"?"Alumni":researcher==="researchers"?"Researchers":"Professor";
 }
}
window.addEventListener("hashchange",render);
render();
})();
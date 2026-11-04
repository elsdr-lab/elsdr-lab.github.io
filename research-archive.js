/* Research Archive: independent type, theme, year and query filters.
   Dataset is maintained in research-records.js; the archive never invents missing values. */
(function(){
  "use strict";
  const root=document.getElementById("research-archive-v2");
  if(!root)return;
  const records=(Array.isArray(window.ELSDR_RESEARCH_RECORDS)?window.ELSDR_RESEARCH_RECORDS:[]).filter(record=>record.status!=='draft'&&record.status!=='archived');
  const $=(selector)=>root.querySelector(selector);
  const $$=(selector)=>Array.from(root.querySelectorAll(selector));
  const archiveView=window.ELSDRResearchView;
  if(!archiveView)return;
  const {archiveRow,searchString}=archiveView;
  const state={type:"all",theme:"all",year:"all",query:"",limit:12};
  const typeBtns=$$("[data-research-kind]"),themeBtns=$$("[data-research-theme]");
  const yearInput=$("#research-year"),searchInput=$("#research-search");
  const list=$("#research-list"),counter=$("#research-counter");
  const more=$("#research-more"),empty=$("#research-empty");

  // Build year options from available data, rather than a fixed list.
  const years=[...new Set(records.map(record=>Number(record.year)).filter(Number.isFinite))].sort((a,b)=>b-a);
  for(const year of years){
    const option=document.createElement("option");option.value=String(year);option.textContent=String(year);
    yearInput.append(option);
  }
  function filter(){
    return records.filter(record=>
      (state.type==="all"||record.type===state.type)&&
      (state.theme==="all"||record.theme===state.theme)&&
      (state.year==="all"||String(record.year)===state.year)&&
      (!state.query||searchString(record).includes(state.query))
    ).sort((a,b)=>Number(b.year)-Number(a.year));
  }
  function update(){
    const previousOpen=new Set($$(".ra-entry[open]").map(x=>x.dataset.recordId));
    const results=filter();
    list.innerHTML=results.slice(0,state.limit).map(archiveRow).join("");
    $$(".ra-entry").forEach(el=>{if(previousOpen.has(el.dataset.recordId))el.open=true;});
    counter.textContent=results.length+" records"+(results.length===records.length?"":" / "+records.length+" total");
    empty.hidden=results.length!==0;
    more.hidden=results.length<=state.limit;
    typeBtns.forEach(btn=>{
      const selected=btn.dataset.researchKind===state.type;
      btn.classList.toggle("is-selected",selected);
      btn.setAttribute("aria-pressed",String(selected));
    });
    themeBtns.forEach(btn=>{
      const selected=btn.dataset.researchTheme===state.theme;
      btn.classList.toggle("is-selected",selected);
      btn.setAttribute("aria-pressed",String(selected));
    });
  }
  function newFilter(){state.limit=12;update();}
  function urlType(){
    const route=window.location.hash.replace(/^#\/?/,"").split("?")[0];
    if(route==="research/projects")return "project";
    if(route==="research/publications")return "publication";
    return "all";
  }
  function syncRoute(){
    const route=window.location.hash.replace(/^#\/?/,"").split("?")[0];
    if(route.split("/")[0]!=="research")return;
    state.type=urlType();update();
  }
  typeBtns.forEach(btn=>btn.addEventListener("click",()=>{
    state.type=btn.dataset.researchKind;
    const path=state.type==="project"?"#/research/projects":
      state.type==="publication"?"#/research/publications":"#/research";
    if(window.location.hash!==path){
      window.history.replaceState(null,"",path);
    }
    newFilter();
  }));
  themeBtns.forEach(btn=>btn.addEventListener("click",()=>{state.theme=btn.dataset.researchTheme;newFilter();}));
  yearInput.addEventListener("change",()=>{state.year=yearInput.value;newFilter();});
  searchInput.addEventListener("input",()=>{state.query=searchInput.value.trim().toLocaleLowerCase();newFilter();});
  more.addEventListener("click",()=>{state.limit+=12;update();});
  window.addEventListener("hashchange",syncRoute);
  syncRoute();
})();

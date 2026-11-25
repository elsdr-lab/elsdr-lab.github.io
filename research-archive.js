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
  const {archiveRow,compileQuery,searchString}=archiveView;
  const state={type:"all",theme:"all",year:"all",query:"",page:1,pageSize:15};
  const typeBtns=$("[data-research-kind]"),themeInput=$("#research-theme");
  const yearInput=$("#research-year"),searchInput=$("#research-search"),searchButton=$("#research-search-submit");
  const list=$("#research-list"),counter=$("#research-counter");
  const pagination=$("#research-pagination"),pageSizeInput=$("#research-page-size"),empty=$("#research-empty");

  // Build year options from available data, rather than a fixed list.
  const years=[...new Set(records.map(record=>Number(record.year)).filter(Number.isFinite))].sort((a,b)=>b-a);
  for(const year of years){
    const option=document.createElement("option");option.value=String(year);option.textContent=String(year);
    yearInput.append(option);
  }
  function filter(){
    const matches=compileQuery(state.query);
    return records.filter(record=>
      (state.type==="all"||record.type===state.type)&&
      (state.theme==="all"||record.theme===state.theme)&&
      (state.year==="all"||String(record.year)===state.year)&&
      matches(searchString(record))
    ).sort((a,b)=>Number(b.year)-Number(a.year));
  }
  function update(){
    const results=filter();
    const pageCount=Math.max(1,Math.ceil(results.length/state.pageSize));
    state.page=Math.min(Math.max(1,state.page),pageCount);
    const start=(state.page-1)*state.pageSize;
    list.innerHTML=results.slice(start,start+state.pageSize).map(archiveRow).join("");
    counter.textContent=results.length+" records"+(results.length===records.length?"":" / "+records.length+" total");
    empty.hidden=results.length!==0;
    pagination.hidden=pageCount<=1;
    pagination.replaceChildren();
    if(pageCount>1){
      const addButton=(label,page,disabled=false,current=false)=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="ra-page-button"+(current?" is-current":"");
        button.textContent=label;
        button.disabled=disabled;
        if(current)button.setAttribute("aria-current","page");
        button.setAttribute("aria-label",current?"현재 "+page+"페이지":label==="이전"||label==="다음"?label+" 페이지":page+"페이지로 이동");
        button.addEventListener("click",()=>{
          state.page=page;update();
          root.querySelector(".ra-list-controls")?.scrollIntoView({block:"start",behavior:"smooth"});
        });
        pagination.append(button);
      };
      addButton("이전",Math.max(1,state.page-1),state.page===1);
      // Show a compact sliding window even when the archive grows to hundreds of pages.
      const pageButtons=new Set([1,pageCount]);
      for(let n=Math.max(1,state.page-2);n<=Math.min(pageCount,state.page+2);n++)pageButtons.add(n);
      let previous=0;
      [...pageButtons].sort((a,b)=>a-b).forEach(page=>{
        if(previous&&page>previous+1){
          const dots=document.createElement("span");
          dots.className="ra-page-ellipsis";dots.textContent="…";dots.setAttribute("aria-hidden","true");
          pagination.append(dots);
        }
        addButton(String(page),page,false,page===state.page);
        previous=page;
      });
      addButton("다음",Math.min(pageCount,state.page+1),state.page===pageCount);
    }
    typeBtns.forEach(btn=>{
      const selected=btn.dataset.researchKind===state.type;
      btn.classList.toggle("is-selected",selected);
      btn.setAttribute("aria-pressed",String(selected));
    });
    themeInput.value=state.theme;
  }
  function newFilter(){state.page=1;update();}
  function urlType(){
    const route=window.location.hash.replace(/^#\/?/,"").split("?")[0];
    if(route==="research/projects")return "project";
    if(route==="research/publications")return "publication";
    return "all";
  }
  function syncRoute(){
    const route=window.location.hash.replace(/^#\/?/,"").split("?")[0];
    if(route.split("/")[0]!=="research")return;
    const type=urlType();if(state.type!==type){state.type=type;state.page=1;}update();
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
  themeInput.addEventListener("change",()=>{state.theme=themeInput.value;newFilter();});
  yearInput.addEventListener("change",()=>{state.year=yearInput.value;newFilter();});
  searchInput.addEventListener("input",()=>{state.query=searchInput.value.trim().normalize("NFKC").toLocaleLowerCase();newFilter();});
  searchButton.addEventListener("click",()=>{state.query=searchInput.value.trim().normalize("NFKC").toLocaleLowerCase();newFilter();searchInput.focus();});
  searchInput.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();searchButton.click();}});
  pageSizeInput.addEventListener("change",()=>{state.pageSize=Number(pageSizeInput.value)===20?20:15;state.page=1;update();});
  window.addEventListener("hashchange",syncRoute);
  syncRoute();
})();

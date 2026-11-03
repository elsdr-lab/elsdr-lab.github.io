/* Research Archive: independent type, theme, year and query filters.
   Dataset is maintained in research-records.js; the archive never invents missing values. */
(function(){
  "use strict";
  const root=document.getElementById("research-archive-v2");
  if(!root)return;
  const records=Array.isArray(window.ELSDR_RESEARCH_RECORDS)?window.ELSDR_RESEARCH_RECORDS:[];
  const $=(selector)=>root.querySelector(selector);
  const $$=(selector)=>Array.from(root.querySelectorAll(selector));
  const escapeHtml=(value)=>String(value??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const themeNames={
    climate:"Climate Adaptation and Resilience",
    ecosystem:"Ecosystem Services and Nature-based Solutions",
    coastal:"Coastal Landscape and Living Systems",
    regional:"Regional Landscape Strategy"
  };
  const themeShort={climate:"Climate",ecosystem:"Ecosystem",coastal:"Coastal",regional:"Regional"};
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
  const available=(v)=>v!==undefined&&v!==null&&String(v).trim()!=="";
  const display=(v)=>available(v)?escapeHtml(v):'<span class="ra-tbd">확인 후 입력</span>';
  const field=(label,value)=>'<div class="ra-field"><dt>'+escapeHtml(label)+'</dt><dd>'+display(value)+'</dd></div>';
  function validHref(link){
    if(!available(link))return "";
    try{
      const parsed=new URL(String(link),window.location.href);
      return ["https:","http:"].includes(parsed.protocol)?parsed.href:"";
    }catch{return "";}
  }
  function link(href,label,extra=""){
    const url=validHref(href);
    return url?'<a class="ra-detail-link" target="_blank" rel="noopener noreferrer" href="'+escapeHtml(url)+'">'+escapeHtml(label)+' <span aria-hidden="true">↗</span></a>':extra;
  }
  function themeLabel(record){return themeNames[record.theme]||record.theme||"";}
  function summaryMeta(record){
    if(record.type==="project")return record.funder||"지원기관 미입력";
    return record.journal||"학술지 미입력";
  }
  function details(record){
    const isProject=record.type==="project";
    let overview="";
    if(isProject){
      overview='<div class="ra-expanded-main"><span class="ra-section-label">RESEARCH OVERVIEW</span><p>'+
        display(record.summary)+'</p></div>';
      const fields='<dl class="ra-data-fields">'+
        field("Research Period / 연구기간",record.period)+
        field("Funding Agency / 지원기관",record.funder)+
        field("Participation / 참여 역할",record.role)+
        field("Research Theme / 연구영역",themeLabel(record))+
      '</dl>';
      const links='<div class="ra-external-links">'+link(record.url,"기존 프로젝트 목록 보기")+
        (record.detailUrl&&record.detailUrl!==record.url?link(record.detailUrl,"프로젝트 상세 페이지"):"")+'</div>';
      return overview+fields+(record.detailNote?'<p class="ra-editorial-note">'+escapeHtml(record.detailNote)+'</p>':"")+links;
    }
    overview='<div class="ra-expanded-main"><span class="ra-section-label">ABSTRACT / SUMMARY</span>'+
      (available(record.abstract)?'<p>'+escapeHtml(record.abstract)+'</p>':
      '<p>'+display(record.summary)+'</p><p class="ra-editorial-note">현재는 기존 사이트의 연구 요약입니다. 정식 초록은 추후 입력합니다.</p>')+'</div>';
    const fields='<dl class="ra-data-fields">'+
      field("Authors / 저자",record.authors)+
      field("Journal / 학술지",record.journal)+
      field("Publication Year / 발행연도",record.year)+
      field("Publication Type / 논문 유형",record.publicationType)+
      field("Research Theme / 연구영역",themeLabel(record))+
      field("Keywords / 키워드",Array.isArray(record.keywords)?record.keywords.join(" · "):record.keywords)+
      field("DOI",record.doi)+
    '</dl>';
    const doi=available(record.doi)?String(record.doi).replace(/^https?:\/\/doi\.org\//i,""):"";
    const links='<div class="ra-external-links">'+
      (doi?link("https://doi.org/"+encodeURIComponent(doi).replaceAll("%2F","/"),"DOI / 논문 페이지"):"")+
      (record.fullTextUrl?link(record.fullTextUrl,"원문 열람"):"")+
      (!doi&&record.url?link(record.url,"자료 링크"):"")+
      '</div>';
    return overview+fields+(record.detailNote?'<p class="ra-editorial-note">'+escapeHtml(record.detailNote)+'</p>':"")+links;
  }
  function archiveRow(record){
    const type=record.type==="project"?"Project":"Publication";
    const name=escapeHtml(record.title);
    return '<details class="ra-entry" data-record-id="'+escapeHtml(record.id||record.title)+'">'+
      '<summary class="ra-summary">'+
        '<span class="ra-year">'+escapeHtml(record.year)+'</span>'+
        '<span class="ra-kind">'+type+'</span>'+
        '<span class="ra-title-stack"><span class="ra-title">'+name+'</span>'+
          '<span class="ra-submeta">'+escapeHtml(summaryMeta(record))+'</span></span>'+
        '<span class="ra-chevron" aria-hidden="true"></span>'+
      '</summary><div class="ra-expanded">'+details(record)+'</div></details>';
  }
  function searchString(record){
    return [
      record.title,record.summary,record.authors,record.journal,record.funder,
      record.period,record.role,record.doi,record.year,record.publicationType,
      record.type,themeLabel(record),themeShort[record.theme],record.detailNote,
      ...(Array.isArray(record.keywords)?record.keywords:[record.keywords])
    ].map(v=>String(v??"")).join(" ").toLocaleLowerCase();
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

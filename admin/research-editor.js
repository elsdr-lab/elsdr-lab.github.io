/* ELSDR Research CMS. Uses the same record renderer as the public Research Archive. */
(function () {
  "use strict";
  const view=window.ELSDRResearchView;
  if(!view)throw Error("Research Archive 표시 모듈을 불러오지 못했습니다.");
  const themes=[
    ["climate","Climate Adaptation and Resilience"],
    ["ecosystem","Ecosystem Services and Nature-based Solutions"],
    ["coastal","Coastal Landscape and Living Systems"],
    ["regional","Regional Landscape Strategy"]
  ];
  const types={project:"Projects",publication:"Publications"};
  const sections={
    project:[
      {label:"01 / 목록에 표시되는 정보",desc:"연도 · Project · 프로젝트명 · 지원기관이 공개 목록에 표시됩니다.",fields:[
        ["year","연도 / Year","number",true],
        ["title","프로젝트명 / Title","text",true,true],
        ["funder","지원기관 / Funding Agency","text"]
      ]},
      {label:"02 / 펼쳐지는 상세정보",desc:"홈페이지의 RESEARCH OVERVIEW와 상세 정보 순서에 맞춘 입력 항목입니다. 목록에서 입력한 연도와 지원기관도 상세정보에서 재사용됩니다.",fields:[
        ["summary","연구 개요 / Research Overview","textarea",false,true],
        ["period","연구기간 / Research Period","text"],
        ["role","참여 역할 / Participation","text"],
        ["theme","연구영역 / Research Theme","theme",true],
        ["detailNote","추가 설명 / Detail Note","textarea",false,true],
        ["url","프로젝트 관련 자료 / Link","url",false,true],
        ["detailUrl","프로젝트 상세 페이지 / Detail Link","url",false,true]
      ]},
      {label:"03 / 검색용 정보",desc:"키워드는 현재 공개 목록의 본문에는 나타나지 않으며, 검색 시에만 사용됩니다.",fields:[
        ["keywords","검색 키워드 (쉼표로 구분)","keywords",false,true]
      ]}
    ],
    publication:[
      {label:"01 / 목록에 표시되는 정보",desc:"연도 · Publication · 논문 제목 · 학술지가 공개 목록에 표시됩니다.",fields:[
        ["year","발행연도 / Year","number",true],
        ["title","논문 제목 / Title","text",true,true],
        ["journal","학술지 / Journal","text",false,true]
      ]},
      {label:"02 / 펼쳐지는 상세정보",desc:"홈페이지의 ABSTRACT / SUMMARY와 서지정보 순서에 맞췄습니다. 연도와 학술지는 위에서 입력한 값을 재사용합니다.",fields:[
        ["abstract","초록 / Abstract","textarea",false,true],
        ["summary","짧은 요약 / Summary (초록이 없을 때 표시)","textarea",false,true],
        ["authors","저자 / Authors","text",false,true],
        ["publicationType","논문 유형 / Publication Type","text"],
        ["theme","연구영역 / Research Theme","theme",true],
        ["keywords","키워드 / Keywords (상세에도 표시)","keywords",false,true],
        ["doi","DOI","text",false,true],
        ["fullTextUrl","원문 링크 / Full Text","url",false,true],
        ["url","관련 자료 링크 / Additional Link","url",false,true],
        ["detailNote","추가 설명 / Detail Note","textarea",false,true]
      ]}
    ]
  };
  const state={type:"all",theme:"all",year:"all",query:"",view:"list",id:null};
  let context=null;
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const lower=value=>String(value??"").trim().toLocaleLowerCase();
  const text=value=>String(value??"").trim();
  const published=item=>item.status!=="draft"&&item.status!=="archived";
  const editable=()=>Boolean(context?.editable);
  const currentRecord=()=>context?.data.find(record=>record.id===state.id);
  const labelRecord=item=>item.title||"제목 미입력";
  function reset(){
    state.type="all";state.theme="all";state.year="all";state.query="";state.view="list";state.id=null;
  }
  function blank(type){
    const record={id:type+"-"+crypto.randomUUID().slice(0,12),type,status:"draft",year:new Date().getFullYear(),
      theme:"",title:"",summary:"",keywords:[],url:"",detailNote:""};
    if(type==="project")return {...record,period:"",funder:"",role:"",detailUrl:""};
    return {...record,authors:"",journal:"",publicationType:"",abstract:"",doi:"",fullTextUrl:""};
  }
  function validate(data){
    if(!Array.isArray(data))throw Error("Research Archive 데이터 형식이 올바르지 않습니다.");
    const ids=new Set();
    for(const item of data){
      if(!item||!["project","publication"].includes(item.type))throw Error("자료 유형이 잘못되었습니다.");
      if(!text(item.id)||ids.has(item.id))throw Error("고유 ID가 비어 있거나 중복되었습니다: "+item.id);
      ids.add(item.id);
      if(item.status&&!["draft","published","archived"].includes(item.status))throw Error("공개 상태가 잘못되었습니다: "+item.id);
      if(!published(item))continue;
      if(!text(item.title))throw Error("공개할 연구성과의 제목을 입력해 주세요.");
      if(!Number.isInteger(Number(item.year))||Number(item.year)<1900||Number(item.year)>2100)
        throw Error("공개할 연구성과의 연도를 확인해 주세요: "+labelRecord(item));
      if(!themes.some(([slug])=>item.theme===slug))
        throw Error("공개할 연구성과의 연구영역을 선택해 주세요: "+labelRecord(item));
    }
  }
  function filterRows(includeQuery=true){
    return context.data.filter(item=>
      (state.type==="all"||item.type===state.type) &&
      (state.theme==="all"||item.theme===state.theme) &&
      (state.year==="all"||String(item.year)===state.year) &&
      (!includeQuery||!state.query||view.searchString(item).includes(lower(state.query)))
    ).sort((a,b)=>Number(b.year||0)-Number(a.year||0));
  }
  function typeButton(type,label){
    return '<button type="button" class="ra-filter-btn '+(state.type===type?'is-selected':'')+
      '" data-action="type" data-type="'+type+'" aria-pressed="'+(state.type===type)+'">'+esc(label)+'</button>';
  }
  function themeButton(theme,label){
    return '<button type="button" class="ra-filter-btn '+(state.theme===theme?'is-selected':'')+
      '" data-action="theme" data-theme="'+theme+'" aria-pressed="'+(state.theme===theme)+'">'+esc(label)+'</button>';
  }
  function row(item){
    const status=published(item)?"공개":"임시저장";
    const search=esc(view.searchString(item));
    return '<div class="rc-managed-entry" data-research-row data-search="'+search+'">'+
      view.archiveRow(item)+
      '<div class="rc-entry-controls"><span class="rc-state '+(published(item)?"published":"draft")+'">'+status+'</span>'+
      '<button type="button" class="rc-edit" data-action="edit" data-id="'+esc(item.id)+'">'+
      (editable()?"수정":"보기")+' ↗</button></div></div>';
  }
  function listView(){
    const all=context.data;
    const showing=filterRows();
    const years=[...new Set(all.map(item=>Number(item.year)).filter(n=>Number.isFinite(n)&&n>0))].sort((a,b)=>b-a);
    const publishedCount=all.filter(published).length;
    const draftCount=all.length-publishedCount;
    const buttons=state.type==="all"?'<button type="button" data-action="new" data-type="project" '+(!editable()?'disabled':'')+
      '>+ 새 프로젝트</button><button type="button" class="secondary" data-action="new" data-type="publication" '+(!editable()?'disabled':'')+
      '>+ 새 논문</button>':'<button type="button" data-action="new" data-type="'+state.type+'" '+(!editable()?'disabled':'')+
      '>+ '+(state.type==="project"?"새 프로젝트 등록":"새 논문 등록")+'</button>';
    return '<div class="rc-section-heading"><div><h2>Research Archive</h2><p>공개 '+publishedCount+
      '건 · 임시저장 '+draftCount+'건 (전체 '+all.length+'건)</p></div><div class="rc-heading-actions">'+buttons+'</div></div>'+
      '<section id="research-archive-v2" class="rc-admin-archive" aria-label="연구성과 목록">' +
      '<div class="ra-filter-toolbar"><div class="ra-filter-block" role="group" aria-label="자료 유형"><span class="ra-label">Type</span>'+
        typeButton("all","All")+typeButton("project","Projects")+typeButton("publication","Publications")+'</div>'+
      '<div class="ra-filter-block" role="group" aria-label="연구영역"><span class="ra-label">Research Theme</span>'+
        themeButton("all","All Themes")+themes.map(([slug,name])=>themeButton(slug,view.themeShort[slug]||name)).join("")+'</div>'+
      '<div class="ra-filter-block"><label class="ra-label" for="rc-year">Year</label>'+
        '<select id="rc-year" class="ra-filter-year" aria-label="연도 선택"><option value="all">All Years</option>'+
        years.map(year=>'<option value="'+year+'" '+(state.year===String(year)?'selected':'')+'>'+year+'</option>').join("")+
        '</select></div></div>'+
      '<div class="ra-search-line"><label class="ra-search-box" for="rc-search">'+
        '<input id="rc-search" type="search" class="ra-search-input" autocomplete="off" placeholder="Search title, researcher, or keywords…" value="'+esc(state.query)+'" aria-label="제목, 연구자, 키워드 검색">'+
        '</label><span id="rc-counter" class="ra-count" aria-live="polite">'+showing.length+' records</span></div>'+
      '<div class="ra-records" id="rc-list">'+showing.map(row).join("")+'</div>'+
      '<p id="rc-no-results" class="ra-empty" '+(showing.length?'hidden':'')+'>해당 조건의 자료가 없습니다.</p>'+
      '</section><p class="rc-list-note">공개 사이트와 동일한 목록·펼침 구조입니다. 각 항목의 ‘수정’을 누르면 입력 화면으로 이동합니다. 임시저장은 관리자에게만 표시됩니다.</p>';
  }
  function formField(record,def){
    const [key,label,kind,required,wide]=def;
    const value=key==="keywords"?(Array.isArray(record.keywords)?record.keywords.join(", "):record.keywords||""):(record[key]??"");
    const id="rc-field-"+key;
    const attr=' id="'+id+'" data-record-field="'+esc(key)+'" name="'+esc(key)+'" '+
      (!editable()?'disabled ':'')+(required&&published(record)?'required ':'');
    let input;
    if(kind==="theme"){
      input='<select'+attr+'><option value="">연구영역 선택</option>'+themes.map(([slug,title])=>
        '<option value="'+slug+'" '+(record.theme===slug?'selected':'')+'>'+esc(title)+'</option>').join("")+'</select>';
    } else if(kind==="textarea"){
      input='<textarea'+attr+' rows="4" placeholder="내용을 입력하세요">'+esc(value)+'</textarea>';
    } else {
      input='<input'+attr+' type="'+(kind==="number"?"number":kind==="url"?"url":"text")+'" '+
        (kind==="number"?'min="1900" max="2100" step="1" ':'')+
        'value="'+esc(value)+'" '+(kind==="url"?'placeholder="https://..."':'')+'>';
    }
    return '<label class="rc-field '+(wide?'rc-field-wide':'')+'" for="'+id+'"><span>'+
      esc(label)+(required?' <b aria-hidden="true">*</b>':'')+'</span>'+input+'</label>';
  }
  function formView(){
    const record=currentRecord();
    if(!record){state.view="list";return listView();}
    const status=published(record)?"공개":"임시저장";
    return '<div class="rc-form-top"><button type="button" class="rc-back" data-action="back">← 목록으로</button>'+
      '<span class="rc-state '+(published(record)?"published":"draft")+'">'+status+'</span></div>'+
      '<h2 class="rc-record-heading">'+esc(record.title||"새 "+(record.type==="project"?"프로젝트":"논문"))+'</h2>'+
      '<p class="rc-id">ID: '+esc(record.id)+' · '+types[record.type]+'</p>'+
      sections[record.type].map(section=>
        '<section class="rc-form-section"><div class="rc-form-section-heading"><h3>'+esc(section.label)+'</h3><p>'+
        esc(section.desc)+'</p></div><div class="rc-fields">'+section.fields.map(def=>formField(record,def)).join("")+
        '</div></section>').join("")+
      '<div class="rc-form-buttons"><button type="button" class="secondary" data-action="preview">실제 홈페이지 형태로 미리보기</button>'+
      '<button type="button" class="danger" data-action="delete" '+(!editable()?'disabled':'')+'>항목 삭제</button>'+
      '<span class="rc-grow"></span><button type="button" class="secondary" data-action="draft" '+(!editable()?'disabled':'')+
      '>임시저장</button><button type="button" data-action="publish" '+(!editable()?'disabled':'')+'>공개하기</button></div>'+
      '<div class="rc-preview" id="rc-preview" hidden></div>'+
      '<p class="rc-save-help">상단 저장 버튼 또는 임시저장·공개하기를 이용하면 GitHub에 변경이 저장됩니다. 공개되지 않은 자료도 공개 GitHub 소스에서는 조회할 수 있습니다.</p>';
  }
  function previewHtml(record){
    return '<div class="rc-preview-head"><strong>홈페이지 Research Archive와 같은 구성</strong>'+
      '<span>목록 + 펼쳐진 상세정보 · 저장 전 미리보기</span></div>'+
      '<div id="research-archive-v2" class="rc-admin-archive rc-preview-archive"><div class="ra-records">'+
      view.archiveRow(record).replace('<details class="ra-entry"','<details class="ra-entry" open')+
      '</div></div>';
  }
  function refreshSearch(){
    const rows=Array.from(context.editor.querySelectorAll("[data-research-row]"));
    let count=0;
    for(const row of rows){const match=row.dataset.search.includes(lower(state.query));row.hidden=!match;if(match)count++;}
    const counter=context.editor.querySelector("#rc-counter");if(counter)counter.textContent=count+" records";
    const empty=context.editor.querySelector("#rc-no-results");if(empty)empty.hidden=count!==0;
  }
  function render(ctx){
    context=ctx;
    const target=ctx.editor;
    target.classList.add("research-cms");
    target.innerHTML='<div class="rc-intro"><p>Research Archive · 공개 홈페이지의 구성에 맞춰 입력·수정합니다.</p>'+
      '<small>공개 사이트의 목록·상세 컴포넌트를 그대로 사용합니다. 임시저장은 사이트에서만 숨겨지며 GitHub 저장소 자체는 공개됩니다.</small></div>'+
      (state.view==="edit"?formView():listView());
    target.onclick=event=>{
      const button=event.target.closest("[data-action]");
      if(!button||!target.contains(button))return;
      const action=button.dataset.action;
      if(action==="type"){state.type=button.dataset.type;render(ctx);return;}
      if(action==="theme"){state.theme=button.dataset.theme;render(ctx);return;}
      if(action==="new"){
        if(!editable())return;
        const type=button.dataset.type;
        if(!types[type])return;
        const item=blank(type);ctx.data.push(item);state.id=item.id;state.view="edit";
        ctx.changed();render(ctx);return;
      }
      if(action==="edit"){state.id=button.dataset.id;state.view="edit";render(ctx);return;}
      if(action==="back"){state.view="list";state.id=null;render(ctx);return;}
      const record=currentRecord();if(!record)return;
      if(action==="preview"){
        const box=target.querySelector("#rc-preview");
        if(box){box.hidden=!box.hidden;if(!box.hidden){box.innerHTML=previewHtml(record);box.scrollIntoView?.({block:"nearest",behavior:"smooth"});}}
        return;
      }
      if(!editable())return;
      if(action==="delete"){
        if(!confirm("이 자료를 삭제할까요? GitHub에 변경 내용을 저장해야 공개 사이트에도 반영됩니다."))return;
        const index=ctx.data.findIndex(item=>item.id===record.id);
        if(index>=0){ctx.data.splice(index,1);state.view="list";state.id=null;ctx.changed();render(ctx);}return;
      }
      if(action==="draft"||action==="publish"){
        const next=action==="draft"?"draft":"published";
        if(next==="draft"&&published(record)&&
          !confirm("공개 중인 자료가 사이트에서 숨겨집니다. 계속할까요?"))return;
        const previous=record.status;record.status=next;
        try{validate(ctx.data);}catch(error){record.status=previous;ctx.message(error.message,true);return;}
        ctx.changed();render(ctx);ctx.save();
      }
    };
    target.oninput=event=>{
      const item=event.target;
      if(item.id==="rc-search"){state.query=item.value;refreshSearch();return;}
      if(!item.hasAttribute("data-record-field")||!editable())return;
      const record=currentRecord();if(!record)return;
      const key=item.getAttribute("data-record-field");
      if(key==="year")record.year=item.value===""?0:Number(item.value);
      else if(key==="keywords")record.keywords=item.value.split(/[,，]/).map(value=>value.trim()).filter(Boolean);
      else record[key]=item.value;
      ctx.changed();
      const box=target.querySelector("#rc-preview");
      if(box&&!box.hidden)box.innerHTML=previewHtml(record);
    };
    target.onchange=event=>{
      if(event.target.id==="rc-year"){state.year=event.target.value;render(ctx);return;}
      const input=event.target;
      if(input.hasAttribute("data-record-field")&&editable()){
        const record=currentRecord();
        if(record){record[input.getAttribute("data-record-field")]=input.value;ctx.changed();}
        const box=target.querySelector("#rc-preview");
        if(box&&!box.hidden&&record)box.innerHTML=previewHtml(record);
      }
    };
  }
  window.ELSDRResearchEditor={render,reset,validate};
})();

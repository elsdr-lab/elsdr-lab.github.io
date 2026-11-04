/* ELSDR Research Manager — an editorial UI, not a copy of the public archive.
   Public preview uses the same renderer as research-archive.js. */
(function(){
  "use strict";
  const view=window.ELSDRResearchView;
  if(!view)throw Error("Research preview renderer not loaded.");
  const themes=[
    ["climate","Climate Adaptation and Resilience"],
    ["ecosystem","Ecosystem Services and Nature-based Solutions"],
    ["coastal","Coastal Landscape and Living Systems"],
    ["regional","Regional Landscape Strategy"]
  ];
  const themeShort={climate:"Climate",ecosystem:"Ecosystem",coastal:"Coastal",regional:"Regional"};
  const names={project:"Projects",publication:"Publications"};
  const singular={project:"프로젝트",publication:"논문"};
  const sections={
    project:[
      {title:"기본 정보",desc:"홈페이지 목록에 표시되는 정보를 입력합니다.",fields:[
        ["title","프로젝트명","text",true,true,"연구과제의 공식 명칭을 입력하세요."],
        ["year","연도","number",true],
        ["theme","연구영역","theme",true],
        ["period","연구기간","text",false,false,"예: 2025.03–2026.02"],
        ["funder","지원기관","text"],
        ["role","참여 역할","text",false,false,"예: 책임 / 공동"]
      ]},
      {title:"연구 내용",desc:"프로젝트 목록을 펼쳤을 때 나타나는 설명입니다.",fields:[
        ["summary","연구 개요","textarea",false,true,"연구 목적, 주요 내용과 결과를 간결하게 작성하세요."],
        ["detailNote","추가 설명","textarea",false,true,"필요할 때만 작성합니다."]
      ]},
      {title:"관련 자료",desc:"홈페이지에서 연결할 링크와 검색용 키워드를 입력합니다.",fields:[
        ["url","프로젝트 관련 자료 링크","url",false,true,"https://..."],
        ["detailUrl","프로젝트 상세 페이지 링크","url",false,true,"https://..."],
        ["keywords","검색 키워드","keywords",false,true,"쉼표로 구분하세요. 프로젝트 목록에는 표시되지 않습니다."]
      ]}
    ],
    publication:[
      {title:"기본 정보",desc:"홈페이지 목록과 논문의 서지정보에 사용됩니다.",fields:[
        ["title","논문 제목","text",true,true,"논문의 공식 제목을 입력하세요."],
        ["year","발행연도","number",true],
        ["theme","연구영역","theme",true],
        ["authors","저자","text",false,true,"저자명은 원문 순서로 입력하세요."],
        ["journal","학술지","text",false,true,"학술지의 공식 명칭"],
        ["publicationType","논문 유형","text",false,false,"예: Journal Article"]
      ]},
      {title:"논문 내용",desc:"초록이 있으면 초록을, 없으면 요약을 공개 페이지에 표시합니다.",fields:[
        ["abstract","초록 (Abstract)","textarea",false,true,"공식 초록을 입력하세요."],
        ["summary","짧은 요약 (Summary)","textarea",false,true,"초록이 없을 때 대신 표시됩니다."],
        ["keywords","키워드","keywords",false,true,"쉼표로 구분하세요."],
        ["detailNote","추가 설명","textarea",false,true,"필요할 때만 작성합니다."]
      ]},
      {title:"원문 및 링크",desc:"DOI와 원문 링크는 입력하면 홈페이지 상세정보에 나타납니다.",fields:[
        ["doi","DOI","text",false,true,"예: 10.1234/example"],
        ["fullTextUrl","원문 링크","url",false,true,"https://..."],
        ["url","기타 자료 링크","url",false,true,"https://..."]
      ]}
    ]
  };
  const state={type:"project",view:"list",id:null,query:"",status:"all",theme:"all"};
  let ctx=null;
  const e=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const txt=value=>String(value??"").trim();
  const lc=value=>txt(value).toLocaleLowerCase();
  const published=item=>item.status!=="draft"&&item.status!=="archived";
  const canEdit=()=>!!ctx?.editable;
  const selected=()=>ctx?.data.find(item=>item.id===state.id);
  const stateName=item=>item.status==="archived"?"보관":published(item)?"공개":"임시저장";
  function reset(){state.type="project";state.view="list";state.id=null;state.query="";state.status="all";state.theme="all";}
  function create(type){
    const common={id:type+"-"+crypto.randomUUID().slice(0,12),type,status:"draft",year:new Date().getFullYear(),theme:"",
      title:"",summary:"",keywords:[],url:"",detailNote:""};
    return type==="project"?
      {...common,period:"",funder:"",role:"",detailUrl:""}:
      {...common,authors:"",journal:"",publicationType:"",abstract:"",doi:"",fullTextUrl:""};
  }
  function validate(data){
    if(!Array.isArray(data))throw Error("연구성과 자료 형식이 올바르지 않습니다.");
    const ids=new Set();
    for(const item of data){
      if(!item||!names[item.type])throw Error("프로젝트 또는 논문 유형을 확인해 주세요.");
      if(!txt(item.id)||ids.has(item.id))throw Error("고유 ID가 비어 있거나 중복되었습니다: "+item.id);
      ids.add(item.id);
      if(item.status&&!["draft","published","archived"].includes(item.status))throw Error("등록 상태를 확인해 주세요.");
      for(const key of ["url","fullTextUrl","detailUrl"]){
        const v=txt(item[key]);if(!v)continue;
        try{const parsed=new URL(v,"https://elsdr-lab.github.io/");
          if(!["http:","https:"].includes(parsed.protocol))throw Error("scheme");
        }catch{throw Error("링크 주소를 확인해 주세요: "+(item.title||item.id)+" / "+key);}
      }
      if(!published(item))continue;
      if(!txt(item.title))throw Error("공개하려면 제목을 입력해야 합니다.");
      if(!Number.isInteger(Number(item.year))||Number(item.year)<1900||Number(item.year)>2100)
        throw Error("공개할 연구성과의 연도를 확인해 주세요: "+(item.title||item.id));
      if(!themes.some(([slug])=>slug===item.theme))
        throw Error("공개할 연구성과의 연구영역을 선택해 주세요: "+(item.title||item.id));
    }
  }
  function filtered(){
    return ctx.data.filter(item=>
      item.type===state.type&&
      (state.status==="all" || (state.status==="published"?published(item):item.status==="draft"))&&
      (state.theme==="all"||item.theme===state.theme)&&
      (!state.query||view.searchString(item).includes(lc(state.query)))
    ).sort((a,b)=>Number(b.year||0)-Number(a.year||0)||txt(a.title).localeCompare(txt(b.title)));
  }
  function tab(type){
    const count=ctx.data.filter(item=>item.type===type).length;
    const active=state.type===type;
    return '<button type="button" class="rc-tab '+(active?"is-active":"")+
      '" role="tab" aria-selected="'+active+'" data-action="tab" data-type="'+type+'">'+names[type]+
      '<span>'+count+'</span></button>';
  }
  function row(item){
    const support=item.type==="project"?(item.funder||"지원기관 미입력"):(item.journal||"학술지 미입력");
    const status=stateName(item);
    const klass=item.status==="archived"?"archived":published(item)?"published":"draft";
    return '<article class="rc-record">'+
      '<div class="rc-record-year">'+e(item.year||"—")+'</div>'+
      '<div class="rc-record-main"><strong>'+e(item.title||"제목 미입력")+'</strong><small>'+
        e(themeShort[item.theme]||"연구영역 미지정")+' <i aria-hidden="true">·</i> '+e(support)+'</small></div>'+
      '<span class="rc-state '+klass+'">'+status+'</span>'+
      '<button type="button" class="rc-row-edit" data-action="edit" data-id="'+e(item.id)+'">'+
        (canEdit()?"수정":"보기")+' <span aria-hidden="true">↗</span></button></article>';
  }
  function listView(){
    const current=ctx.data.filter(item=>item.type===state.type);
    const countPublic=current.filter(published).length;
    const countDraft=current.filter(item=>item.status==="draft").length;
    const shown=filtered();
    return '<section class="rc-panel">'+
      '<header class="rc-panel-header"><div><p class="rc-eyebrow">CONTENT LIBRARY</p>'+
      '<h2>등록된 '+singular[state.type]+'</h2><p class="rc-panel-description">공개 '+countPublic+
      '건 <span aria-hidden="true">·</span> 임시저장 '+countDraft+'건</p></div>'+
      '<button type="button" class="rc-primary-action" data-action="new" '+(!canEdit()?'disabled':'')+
      '><span aria-hidden="true">＋</span> 새 '+singular[state.type]+' 등록</button></header>'+
      '<div class="rc-filters"><label class="rc-search" for="rc-search"><span>검색</span>'+
      '<input id="rc-search" type="search" autocomplete="off" placeholder="제목, 연구자, 키워드 검색" value="'+e(state.query)+'"></label>'+
      '<label class="rc-select-filter"><span>등록 상태</span><select id="rc-status">'+
      [['all',"전체"],["published","공개"],["draft","임시저장"]].map(([v,l])=>'<option value="'+v+'" '+(state.status===v?'selected':'')+'>'+l+'</option>').join("")+'</select></label>'+
      '<label class="rc-select-filter"><span>연구영역</span><select id="rc-theme"><option value="all">전체 연구영역</option>'+
      themes.map(([v,l])=>'<option value="'+v+'" '+(state.theme===v?'selected':'')+'>'+e(themeShort[v])+'</option>').join("")+'</select></label></div>'+
      '<div class="rc-list-caption"><span>연구성과 목록</span><span>'+shown.length+'개 표시</span></div>'+
      '<div class="rc-list">'+(shown.length?shown.map(row).join(""):
      '<div class="rc-empty"><strong>해당하는 연구성과가 없습니다.</strong><p>검색 조건을 바꾸거나 새 항목을 등록해 주세요.</p></div>')+
      '</div><p class="rc-helper">항목의 ‘수정’을 눌러 정보를 변경할 수 있습니다. 공개 홈페이지는 저장된 공개 자료만 표시합니다.</p>'+
      '</section>';
  }
  function field(record,def){
    const [key,label,kind,required,wide,placeholder=""]=def;
    const value=key==="keywords"?(Array.isArray(record.keywords)?record.keywords.join(", "):record.keywords||""):(record[key]??"");
    const id="rc-"+key;
    const attrs=' id="'+id+'" data-record-field="'+e(key)+'" name="'+e(key)+'" '+
      (canEdit()?'':'disabled ') + (required&&published(record)?'required ':'');
    let control;
    if(kind==="theme"){
      control='<select'+attrs+'><option value="">연구영역 선택</option>'+themes.map(([v,n])=>
        '<option value="'+v+'" '+(record.theme===v?"selected":"")+'>'+e(n)+'</option>').join("")+'</select>';
    }else if(kind==="textarea"){
      control='<textarea'+attrs+' rows="4" placeholder="'+e(placeholder)+'">'+e(value)+'</textarea>';
    }else{
      const t=kind==="number"?"number":kind==="url"?"url":"text";
      control='<input'+attrs+' type="'+t+'" '+(kind==="number"?'min="1900" max="2100" step="1" ':'')+
        'value="'+e(value)+'" placeholder="'+e(placeholder)+'">';
    }
    return '<label class="rc-field '+(wide?'rc-field-wide':'')+'" for="'+id+'"><span>'+e(label)+
      (required?' <b aria-label="필수 항목">*</b>':'')+'</span>'+control+'</label>';
  }
  function editView(){
    const record=selected();
    if(!record){state.view="list";return listView();}
    const newEntry=!txt(record.title);
    return '<section class="rc-edit-layout"><div class="rc-edit-top"><button type="button" data-action="back" class="rc-back">← 목록으로 돌아가기</button>'+
      '<span class="rc-state '+(published(record)?"published":"draft")+'">'+stateName(record)+'</span></div>'+
      '<div class="rc-edit-heading"><p class="rc-eyebrow">'+names[record.type].toUpperCase()+' / EDITOR</p>'+
      '<h2>'+e(newEntry?"새 "+singular[record.type]+" 등록":record.title)+'</h2>'+
      '<p>입력한 내용은 GitHub에 저장한 뒤 공개 홈페이지에 반영됩니다.</p></div>'+
      sections[record.type].map((section,i)=>
      '<section class="rc-editor-section"><header><span class="rc-section-index">'+String(i+1).padStart(2,"0")+'</span>'+
      '<div><h3>'+e(section.title)+'</h3><p>'+e(section.desc)+'</p></div></header>'+
      '<div class="rc-form-grid">'+section.fields.map(def=>field(record,def)).join("")+'</div></section>').join("")+
      '<div class="rc-edit-actions"><button type="button" class="rc-preview-button" data-action="preview">'+
      '<span aria-hidden="true">◫</span> 홈페이지 미리보기</button>'+
      '<button type="button" class="rc-delete" data-action="delete" '+(!canEdit()?'disabled':'')+'>삭제</button>'+
      '<span class="rc-action-spacer"></span>'+
      '<button type="button" class="rc-draft-button" data-action="draft" '+(!canEdit()?'disabled':'')+'>임시저장</button>'+
      '<button type="button" class="rc-publish-button" data-action="publish" '+(!canEdit()?'disabled':'')+'>공개하기</button></div>'+
      '<div class="rc-preview-container" id="rc-preview" hidden></div>'+
      '<p class="rc-helper">임시저장은 홈페이지 목록에서만 숨깁니다. GitHub 저장소는 공개이므로 비공개 연구자료는 입력하지 마세요.</p>'+
      '</section>';
  }
  function exactPreview(record){
    return '<div class="rc-preview-heading"><strong>홈페이지 미리보기</strong><small>실제 Research Archive와 동일한 목록·상세 표시</small></div>'+
      '<div id="research-archive-v2" class="rc-site-preview"><div class="ra-records">'+
      view.archiveRow(record).replace('<details class="ra-entry"','<details class="ra-entry" open')+'</div></div>';
  }
  function refreshPreview(){
    const box=ctx?.editor.querySelector("#rc-preview");
    if(box&&!box.hidden){const record=selected();if(record)box.innerHTML=exactPreview(record);}
  }
  function render(input){
    ctx=input;
    const target=ctx.editor;
    target.classList.add("research-cms");
    target.innerHTML='<div class="rc-manager-head"><div><p class="rc-eyebrow">ELSDR / CONTENT MANAGEMENT</p>'+
      '<h2>Research Archive<span>.</span></h2>'+
      '<p>연구 프로젝트와 논문을 등록하고 관리합니다.</p></div>'+
      '<span class="rc-manager-label">CONTENT EDITOR</span></div>'+
      '<div class="rc-tabs" role="tablist" aria-label="연구성과 유형">'+tab("project")+tab("publication")+'</div>'+
      (state.view==="list"?listView():editView());
    target.onclick=event=>{
      const btn=event.target.closest("[data-action]");
      if(!btn||!target.contains(btn))return;
      const action=btn.dataset.action;
      if(action==="tab"){
        state.type=btn.dataset.type;state.view="list";state.id=null;state.query="";state.status="all";state.theme="all";render(ctx);return;
      }
      if(action==="new"){
        if(!canEdit())return;
        const record=create(state.type);ctx.data.push(record);state.id=record.id;state.view="edit";ctx.changed();render(ctx);return;
      }
      if(action==="edit"){state.id=btn.dataset.id;state.view="edit";render(ctx);return;}
      if(action==="back"){state.view="list";state.id=null;render(ctx);return;}
      const record=selected();if(!record)return;
      if(action==="preview"){
        const box=target.querySelector("#rc-preview");
        if(box){box.hidden=!box.hidden;if(!box.hidden){box.innerHTML=exactPreview(record);box.scrollIntoView?.({block:"nearest",behavior:"smooth"});}}
        return;
      }
      if(!canEdit())return;
      if(action==="delete"){
        if(!confirm("이 자료를 삭제할까요? GitHub에 저장해야 실제 사이트에서도 반영됩니다."))return;
        const index=ctx.data.findIndex(item=>item.id===record.id);
        if(index!==-1){ctx.data.splice(index,1);state.view="list";state.id=null;ctx.changed();render(ctx);}
        return;
      }
      if(action==="draft"||action==="publish"){
        const next=action==="draft"?"draft":"published";
        if(next==="draft"&&published(record)&&
          !confirm("이 항목을 홈페이지의 공개 목록에서 숨기고 임시저장 상태로 변경할까요?"))return;
        const prior=record.status;record.status=next;
        try{validate(ctx.data);}catch(error){record.status=prior;ctx.message(error.message,true);return;}
        ctx.changed();render(ctx);ctx.save();
      }
    };
    target.oninput=event=>{
      const node=event.target;
      if(node.id==="rc-search"){state.query=node.value;renderListOnly();return;}
      if(!node.hasAttribute("data-record-field")||!canEdit())return;
      const record=selected();if(!record)return;
      const key=node.getAttribute("data-record-field");
      if(key==="year")record.year=node.value===""?0:Number(node.value);
      else if(key==="keywords")record.keywords=node.value.split(/[,，]/).map(v=>v.trim()).filter(Boolean);
      else record[key]=node.value;
      ctx.changed();refreshPreview();
    };
    target.onchange=event=>{
      const node=event.target;
      if(node.id==="rc-status"){state.status=node.value;render(ctx);return;}
      if(node.id==="rc-theme"){state.theme=node.value;render(ctx);return;}
      if(node.hasAttribute("data-record-field")&&canEdit()){
        const record=selected();if(!record)return;
        record[node.getAttribute("data-record-field")]=node.value;ctx.changed();refreshPreview();
      }
    };
  }
  function renderListOnly(){
    const holder=ctx?.editor.querySelector(".rc-panel");
    if(holder)holder.outerHTML=listView();
  }
  window.ELSDRResearchEditor={render,reset,validate};
})();

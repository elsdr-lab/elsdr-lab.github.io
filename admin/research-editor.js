/* Research-only editor for ELSDR. Leaves the other admin collections unchanged. */
(function () {
  "use strict";
  const themes = [
    ["climate", "Climate Adaptation and Resilience"],
    ["ecosystem", "Ecosystem Services and Nature-based Solutions"],
    ["coastal", "Coastal Landscape and Living Systems"],
    ["regional", "Regional Landscape Strategy"]
  ];
  const themeShort = {climate:"Climate", ecosystem:"Ecosystem", coastal:"Coastal", regional:"Regional"};
  const statusText = {draft:"임시저장", published:"공개"};
  const state = {type:"project", view:"list", id:null, query:""};
  const fieldSets = {
    project: [
      ["title","프로젝트명","text",true,true],
      ["year","연도","number",true],
      ["theme","연구영역","theme",true],
      ["period","연구기간","text"],
      ["funder","지원기관","text"],
      ["role","참여 역할","text"],
      ["summary","연구 개요","textarea",false,true],
      ["keywords","키워드 (쉼표로 구분)","keywords",false,true],
      ["url","관련 자료 링크","url",false,true],
      ["detailUrl","프로젝트 상세 페이지 링크","url",false,true],
      ["detailNote","추가 설명","textarea",false,true]
    ],
    publication: [
      ["title","논문 제목","text",true,true],
      ["year","발행연도","number",true],
      ["theme","연구영역","theme",true],
      ["authors","저자","text",false,true],
      ["journal","학술지","text",false,true],
      ["publicationType","논문 유형","text"],
      ["abstract","초록","textarea",false,true],
      ["summary","짧은 요약","textarea",false,true],
      ["keywords","키워드 (쉼표로 구분)","keywords",false,true],
      ["doi","DOI","text",false,true],
      ["fullTextUrl","원문 링크","url",false,true],
      ["url","관련 자료 링크","url",false,true],
      ["detailNote","추가 설명","textarea",false,true]
    ]
  };
  let context = null;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]
  ));
  const text = value => String(value ?? "").trim();
  const norm = value => text(value).toLocaleLowerCase();
  const visible = record => record.status !== "draft";
  const themeLabel = value => themes.find(item => item[0] === value)?.[1] || value || "미분류";
  const isEditable = () => Boolean(context && context.editable);
  const getRecord = () => context.data.find(item => item.id === state.id && item.type === state.type);

  function reset() {
    state.type = "project";
    state.view = "list";
    state.id = null;
    state.query = "";
  }

  function template(type) {
    const id = type + "-" + crypto.randomUUID().slice(0, 12);
    const shared = {
      id, type, status:"draft", year:new Date().getFullYear(), theme:"",
      title:"", summary:"", keywords:[], url:"", detailNote:""
    };
    if (type === "project") {
      return {...shared, period:"", funder:"", role:"", detailUrl:""};
    }
    return {...shared, authors:"", journal:"", publicationType:"", abstract:"", doi:"", fullTextUrl:""};
  }

  function validateRecord(record) {
    if (!record || !["project","publication"].includes(record.type)) {
      throw Error("프로젝트 또는 논문 유형을 확인해 주세요.");
    }
    if (!text(record.id)) throw Error("고유 ID가 비어 있습니다.");
    if (record.status && !["draft","published"].includes(record.status)) {
      throw Error("공개 상태를 확인해 주세요: " + (record.title || record.id));
    }
    if (!visible(record)) return; // A draft may be incomplete.
    if (!text(record.title)) throw Error("공개할 연구성과의 제목을 입력해 주세요.");
    if (!Number.isInteger(Number(record.year)) || Number(record.year) < 1900 || Number(record.year) > 2100) {
      throw Error("공개할 연구성과의 연도를 확인해 주세요: " + record.title);
    }
    if (!themes.some(item => item[0] === record.theme)) {
      throw Error("공개할 연구성과의 연구영역을 선택해 주세요: " + record.title);
    }
  }

  function validate(data) {
    if (!Array.isArray(data)) throw Error("연구성과 자료 형식이 올바르지 않습니다.");
    const ids = new Set();
    data.forEach(record => {
      validateRecord(record);
      if (ids.has(record.id)) throw Error("중복된 연구성과 ID가 있습니다: " + record.id);
      ids.add(record.id);
    });
  }

  function pills(data) {
    const projects = data.filter(item => item.type === "project").length;
    const publications = data.filter(item => item.type === "publication").length;
    return '<div class="rc-tabs" role="tablist" aria-label="연구성과 유형">' +
      [['project',"Projects",projects],['publication',"Publications",publications]].map(([type,label,count]) =>
        '<button type="button" role="tab" aria-selected="' + (state.type===type) +
        '" class="' + (state.type===type?'is-active':'') + '" data-action="tab" data-type="' + type +
        '">' + label + ' <span>' + count + '</span></button>'
      ).join("") + '</div>';
  }

  function listView() {
    const data = context.data.filter(item => item.type === state.type);
    const published = data.filter(visible).length;
    const drafts = data.length-published;
    const rows = data.slice().sort((a,b)=>Number(b.year||0)-Number(a.year||0)).map(record => {
      const label = record.type==="project" ? (record.funder||"지원기관 미입력") : (record.journal||"학술지 미입력");
      const keyword = norm([record.title,record.year,record.funder,record.authors,record.journal,record.theme].join(" "));
      return '<article class="rc-list-row" data-research-row data-search="' + esc(keyword) + '">' +
        '<div class="rc-row-year">' + esc(record.year||"—") + '</div>' +
        '<div class="rc-row-main"><strong>' + esc(record.title||"제목 미입력") + '</strong>' +
        '<small>' + esc(themeShort[record.theme]||"미분류") + ' · ' + esc(label) + '</small></div>' +
        '<span class="rc-state ' + (visible(record)?"published":"draft") + '">' +
          (visible(record)?"공개":"임시저장") + '</span>' +
        '<button type="button" class="rc-edit" data-action="edit" data-id="' + esc(record.id) +
        '">' + (isEditable()?"수정":"보기") + ' ↗</button></article>';
    }).join("");
    return '<section class="rc-section">' +
      '<div class="rc-section-heading"><div><h2>' + (state.type==="project"?"Projects":"Publications") +
      '</h2><p>공개 ' + published + '건 · 임시저장 ' + drafts + '건</p></div>' +
      '<button type="button" data-action="new" ' + (!isEditable()?'disabled':'') +
      '>+ ' + (state.type==="project"?"새 프로젝트 등록":"새 논문 등록") + '</button></div>' +
      '<label class="rc-search-label">제목·연도·저자·지원기관 검색<input type="search" id="rc-search" placeholder="등록된 자료 검색" value="' +
      esc(state.query) + '"></label>' +
      '<div class="rc-list" id="rc-list">' + (rows||'<p class="rc-no-data">아직 등록된 자료가 없습니다.</p>') +
      '</div><p class="rc-no-results" id="rc-no-results" hidden>검색 결과가 없습니다.</p></section>';
  }

  function field(record, def) {
    const [key,label,kind,required,wide] = def;
    const requiredMark = required ? ' <b aria-hidden="true">*</b>' : '';
    const attr = ' data-record-field="' + esc(key) + '" name="' + esc(key) + '" id="rc-' + esc(key) + '" ' +
      (!isEditable()?'disabled ':'') + (required && visible(record)?'required ':'');
    const current = key==="keywords" ? (Array.isArray(record.keywords)?record.keywords.join(", "):record.keywords||"") : record[key] ?? "";
    let control;
    if (kind==="theme") {
      control = '<select' + attr + '><option value="">연구영역 선택</option>' + themes.map(([v,n]) =>
        '<option value="' + v + '" ' + (record.theme===v?'selected':'') + '>' + esc(n) + '</option>'
      ).join("") + '</select>';
    } else if(kind==="textarea") {
      control = '<textarea' + attr + ' rows="4" placeholder="내용을 입력하세요">' + esc(current) + '</textarea>';
    } else {
      control = '<input' + attr + ' type="' + (kind==="number"?"number":kind==="url"?"url":"text") +
        '" ' + (kind==="number"?'min="1900" max="2100" step="1" ':'') +
        'value="' + esc(current) + '"' + (kind==="url"?' placeholder="https://..."':'') + '>';
    }
    return '<label class="rc-field ' + (wide?"rc-field-wide":"") + '" for="rc-' + esc(key) + '">' +
      '<span>' + esc(label) + requiredMark + '</span>' + control + '</label>';
  }

  function formView() {
    const record=getRecord();
    if(!record) {state.view="list";return listView();}
    const published=visible(record);
    const typeLabel=record.type==="project"?"Project":"Publication";
    return '<section class="rc-section"><div class="rc-form-top">' +
      '<button type="button" class="rc-back" data-action="back">← 목록으로</button>' +
      '<span class="rc-state ' + (published?"published":"draft") + '">' + (published?"공개":"임시저장") + '</span>' +
      '</div><h2>' + esc(record.title||"새 "+typeLabel) + '</h2>' +
      '<p class="rc-id">ID: ' + esc(record.id) + ' · ' + typeLabel + '</p>' +
      '<div class="rc-fields">' + fieldSets[record.type].map(def => field(record,def)).join("") + '</div>' +
      '<div class="rc-form-buttons">' +
        '<button type="button" class="secondary" data-action="preview">홈페이지 미리보기</button>' +
        '<button type="button" class="danger" data-action="delete" ' + (!isEditable()?'disabled':'') + '>항목 삭제</button>' +
        '<span class="rc-grow"></span>' +
        '<button type="button" class="secondary" data-action="draft" ' + (!isEditable()?'disabled':'') + '>임시저장</button>' +
        '<button type="button" data-action="publish" ' + (!isEditable()?'disabled':'') + '>공개하기</button>' +
      '</div><div id="rc-preview" class="rc-preview" hidden></div>' +
      '<p class="rc-save-help">임시저장과 공개하기를 누르면 GitHub 저장 확인창이 열립니다. ' +
      '상단의 ‘변경 내용 저장’ 버튼으로도 저장할 수 있습니다.</p></section>';
  }

  function safeUrl(value) {
    try {
      if(!text(value))return "";
      const u = new URL(value,location.origin+"/");
      return ["http:","https:"].includes(u.protocol) ? u.href : "";
    } catch (_) {return "";}
  }
  const previewField=(label,value)=>'<div class="rc-preview-field"><span>'+esc(label)+'</span><strong>'+esc(text(value)||"확인 후 입력")+'</strong></div>';
  function previewView(record) {
    const project=record.type==="project";
    const meta=project ? (record.funder||"지원기관 미입력") : (record.journal||"학술지 미입력");
    const sourceUrl = safeUrl(record.url);
    const doi = text(record.doi).replace(/^https?:\/\/doi\.org\//i,"");
    const paperUrl = safeUrl(record.fullTextUrl);
    let fields=project ?
      previewField("연구기간",record.period)+previewField("지원기관",record.funder)+previewField("참여 역할",record.role) :
      previewField("저자",record.authors)+previewField("학술지",record.journal)+previewField("논문 유형",record.publicationType)+previewField("DOI",doi);
    fields+=previewField("연구영역",themeLabel(record.theme));
    const overview = !project && text(record.abstract) ? record.abstract : record.summary;
    return '<div class="rc-preview-head"><b>공개 홈페이지 목록 · 미리보기</b><small>실제 페이지와 유사한 내용 확인용</small></div>' +
      '<div class="rc-preview-summary"><span>' + esc(record.year) + '</span><span>' + (project?"Project":"Publication") +
      '</span><div><strong>' + esc(record.title||"제목 미입력") + '</strong><small>' + esc(meta) +
      '</small></div></div><div class="rc-preview-details">' +
      '<small>' + (project?"RESEARCH OVERVIEW":"ABSTRACT / SUMMARY") + '</small>' +
      '<p>' + esc(overview||"확인 후 입력") + '</p><div class="rc-preview-grid">' + fields + '</div>' +
      (Array.isArray(record.keywords)&&record.keywords.length ? '<p>Keywords: '+esc(record.keywords.join(" · "))+'</p>':"") +
      (record.detailNote?'<p>'+esc(record.detailNote)+'</p>':"") +
      (sourceUrl?'<a target="_blank" rel="noopener noreferrer" href="'+esc(sourceUrl)+'">관련 자료 ↗</a>':"") +
      (paperUrl?'<a target="_blank" rel="noopener noreferrer" href="'+esc(paperUrl)+'">원문 보기 ↗</a>':"") +
      '</div>';
  }

  function render(ctx) {
    context=ctx;
    const target=ctx.editor;
    target.classList.add("research-cms");
    target.innerHTML='<div class="rc-intro"><p>연구성과 전용 편집기 · 자료 유형별로 입력하고 공개 상태를 관리합니다.</p>' +
      '<small>‘임시저장’은 홈페이지 목록에 표시되지 않는다는 의미입니다. GitHub 저장소는 공개이므로 비공개·민감한 정보는 등록하지 마세요.</small></div>' +
      pills(ctx.data) + (state.view==="edit"?formView():listView());
    target.onclick = event => {
      const button=event.target.closest("[data-action]");
      if(!button || !target.contains(button))return;
      const action=button.dataset.action;
      if(action==="tab"){state.type=button.dataset.type;state.view="list";state.id=null;state.query="";render(ctx);return;}
      if(action==="new"){
        if(!isEditable())return;
        const record=template(state.type);
        ctx.data.push(record);
        state.id=record.id;state.view="edit";ctx.changed();render(ctx);return;
      }
      if(action==="edit"){state.id=button.dataset.id;state.view="edit";render(ctx);return;}
      if(action==="back"){state.view="list";state.id=null;render(ctx);return;}
      const record=getRecord();if(!record)return;
      if(action==="preview"){
        const box=target.querySelector("#rc-preview");if(!box)return;
        box.hidden=!box.hidden;if(!box.hidden){box.innerHTML=previewView(record);box.scrollIntoView({block:"nearest",behavior:"smooth"});}
        return;
      }
      if(!isEditable())return;
      if(action==="delete"){
        if(!confirm("이 연구성과를 삭제할까요? GitHub에 변경 내용을 저장하기 전까지 공개 홈페이지에는 반영되지 않습니다."))return;
        const index=ctx.data.findIndex(item=>item.id===record.id&&item.type===record.type);
        if(index>=0){ctx.data.splice(index,1);state.view="list";state.id=null;ctx.changed();render(ctx);}
        return;
      }
      if(action==="draft"||action==="publish"){
        const next=action==="draft"?"draft":"published";
        if(next==="draft"&&visible(record) &&
          !confirm("공개 항목을 임시저장으로 바꾸면 GitHub 저장 후 홈페이지에서 보이지 않습니다. 계속할까요?"))return;
        const previous=record.status;
        record.status=next;
        try{validate(ctx.data);}catch(error){record.status=previous;ctx.message(error.message,true);return;}
        ctx.changed();
        render(ctx);
        ctx.save();
      }
    };
    target.oninput = event => {
      const item=event.target;
      if(item.id==="rc-search"){
        state.query=item.value;
        let count=0;
        target.querySelectorAll("[data-research-row]").forEach(row=>{
          const match=row.dataset.search.includes(norm(state.query));
          row.hidden=!match;if(match)count++;
        });
        const none=target.querySelector("#rc-no-results");
        if(none)none.hidden=count>0||target.querySelectorAll("[data-research-row]").length===0;
        return;
      }
      if(!item.hasAttribute("data-record-field")||!isEditable())return;
      const record=getRecord();if(!record)return;
      const key=item.getAttribute("data-record-field");
      if(key==="year")record.year=item.value===""?0:Number(item.value);
      else if(key==="keywords")record.keywords=item.value.split(/[,，]/).map(value=>value.trim()).filter(Boolean);
      else record[key]=item.value;
      ctx.changed();
    };
    target.onchange=event=>{
      if(event.target.hasAttribute("data-record-field")&&event.target.tagName==="SELECT"){
        const record=getRecord();if(record){record[event.target.getAttribute("data-record-field")]=event.target.value;ctx.changed();}
      }
    };
  }
  window.ELSDRResearchEditor={render,reset,validate};
})();

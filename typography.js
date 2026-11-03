/* Apply Korean spacing to glyph runs without changing source content or language toggles. */
(()=>{
 const excluded='script,style,textarea,input,select,option,svg,.ds-ko';
 function mark(root){
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
   return node.parentElement&&!node.parentElement.closest(excluded)&&/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(node.data)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
  for(const node of nodes){
   const frag=document.createDocumentFragment();
   for(const run of node.data.split(/([\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]+)/)){
    if(!run)continue;
    if(/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(run)){
     const span=document.createElement('span');span.className='ds-ko';span.textContent=run;frag.append(span);
    }else frag.append(document.createTextNode(run));
   }
   node.replaceWith(frag);
  }
 }
 mark(document.body);
 const observer=new MutationObserver(records=>{
  observer.disconnect();
  for(const record of records)for(const node of record.addedNodes){
   if(node.nodeType===1)mark(node);else if(node.nodeType===3&&node.parentElement)mark(node.parentElement);
  }
  observer.observe(document.body,{childList:true,subtree:true});
 });
 observer.observe(document.body,{childList:true,subtree:true});
})();

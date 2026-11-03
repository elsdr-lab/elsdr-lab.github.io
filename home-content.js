/* Public HOME reads the same records the administrator edits. No credentials. */
(()=>{
 const data=window.ELSDR_HOME_DATA,contact=window.ELSDR_CONTACT_DATA;
 const root=document.querySelector('.home-scene');if(!root)return;
 const text=(selector,value)=>{const node=root.querySelector(selector);if(node&&typeof value==='string')node.textContent=value};
 if(data){
  text('.home-kicker',data.kicker);
  const headline=root.querySelector('.home-headline');
  if(headline){const first=document.createElement('em'),last=document.createElement('em');first.textContent=data.titleAccent;last.textContent=data.titleEnd;headline.replaceChildren(document.createTextNode(data.titleLead+' '),first,document.createElement('br'),document.createTextNode(data.titleMiddle),document.createElement('br'),last)}
  text('.lang-ko .home-lead',data.leadKo);text('.lang-en .home-lead',data.leadEn);
  text('.lang-ko .home-desc',data.descriptionKo);text('.lang-en .home-desc',data.descriptionEn);
 }
 if(contact){
  const {location:l,contacts:c}=contact;
  const items=root.querySelectorAll('.home-contact-item');
  if(items.length===3){
   items[0].querySelector('.home-contact-value').textContent=[l.roomEn,l.buildingEn,l.institution].filter(Boolean).join(', ');
   items[0].querySelector('.home-contact-detail').textContent=l.addressEn;
   const tel=items[1].querySelector('a');tel.textContent=c.labPhone;tel.href='tel:'+c.labPhone.replace(/[^+\d]/g,'');
   const mail=items[2].querySelector('.home-contact-value');mail.textContent=c.labEmail;mail.href='mailto:'+c.labEmail;
   const prof=items[2].querySelector('.home-contact-detail a');prof.textContent=c.professorEmail;prof.href='mailto:'+c.professorEmail;
  }
 }
})();

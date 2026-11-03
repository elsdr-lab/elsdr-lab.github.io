/* Homepage contact details from the current ELSDR site and 2026 recruitment notice. */
(function(){
  const home = document.querySelector('.home-scene');
  if (!home || home.querySelector('.home-contact')) return;
  const panel = document.createElement('section');
  panel.className='home-contact';
  panel.setAttribute('aria-label','ELSDR contact information');
  panel.innerHTML = `
    <div class="wrap home-contact-grid">
      <div class="home-contact-item">
        <div class="home-contact-label">LOCATION</div>
        <div class="home-contact-value">Room 501A, Life Science West BLD, Korea University</div>
        <div class="home-contact-detail">145 Anam-ro, Seongbuk-gu, Seoul 02841, Korea</div>
      </div>
      <div class="home-contact-item">
        <div class="home-contact-label">TELEPHONE</div>
        <a class="home-contact-value" href="tel:+82232903621">02-3290-3621</a>
      </div>
      <div class="home-contact-item">
        <div class="home-contact-label">EMAIL</div>
        <a class="home-contact-value" href="mailto:chlghwns0117@korea.ac.kr">chlghwns0117@korea.ac.kr</a>
        <div class="home-contact-detail">Professor: <a href="mailto:jchon@korea.ac.kr">jchon@korea.ac.kr</a></div>
      </div>
    </div>`;
  home.appendChild(panel);
})();

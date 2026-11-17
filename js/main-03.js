/* index-02/03: schede delle tre anime che si ribaltano (tocco e tastiera) e Dentor che saluta solo quando e' in vista */
(function(){
  'use strict';
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)');

  var souls = [].slice.call(document.querySelectorAll('.soul'));
  souls.forEach(function(el){
    el.addEventListener('click', function(){
      if (finePointer.matches) return;                       // con il mouse si ribalta al passaggio, non al clic
      var on = !el.classList.contains('is-flipped');
      souls.forEach(function(o){ o.classList.remove('is-flipped'); });
      el.classList.toggle('is-flipped', on);
    });
    el.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); el.classList.toggle('is-flipped'); }
    });
  });

  var rig = document.getElementById('dentor-rig');
  if (rig){
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ rig.classList.toggle('is-live', en[0].isIntersecting); }, { threshold: 0.25 }).observe(rig);
    } else { rig.classList.add('is-live'); }
  }
})();

/* index-03: "Lavora con noi", il modulo si apre dal pulsante (e si apre da solo se si arriva dal link #candidati) */
(function(){
  'use strict';
  var btn = document.getElementById('join-toggle'), panel = document.getElementById('join-panel');
  if (!btn || !panel) return;
  var inner = panel.querySelector('.join-panel-in');
  function set(open){
    panel.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open){ inner.removeAttribute('inert'); } else { inner.setAttribute('inert', ''); }
    btn.querySelector('span').textContent = open ? 'Chiudi il modulo' : 'Candidati ora';
  }
  btn.addEventListener('click', function(){
    var open = !panel.classList.contains('is-open');
    set(open);
    if (open){ setTimeout(function(){ var f = panel.querySelector('input'); if (f && !('ontouchstart' in window)) f.focus({ preventScroll: true }); }, 720); }
  });
  if (location.hash === '#candidati'){ set(true); }
})();

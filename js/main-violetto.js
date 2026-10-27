(function(){
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  // ---------- menu a tutto schermo (hamburger che diventa X) ----------
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function setMenu(open){
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    root.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function(){ setMenu(!menu.classList.contains('is-open')); });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('is-open')){ setMenu(false); burger.focus(); } });

  // ---------- barra in alto ----------
  var topbar = document.getElementById('topbar');
  var stack = topbar.parentElement;
  if (hasGsap){
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.create({ trigger: document.body, start: 'top -80', end: 'max', onToggle: function(s){ topbar.classList.toggle('is-solid', s.isActive); } });
    ScrollTrigger.create({ trigger: '.hero-pin', start: 'top -22%', end: 'max', onToggle: function(s){ stack.classList.toggle('show-cta', s.isActive); } });
  } else {
    stack.classList.add('show-cta');
    topbar.classList.add('is-solid');
  }

  // ---------- scene di scroll (sempre attive, in entrata e in uscita) ----------
  if (hasGsap && !reduceMotion){
    var mm = gsap.matchMedia();

    // 1. hero: la scena di Milano e' subito visibile. Scorrendo: il dentino sorvola
    //    e cresce sfumando, i testi escono dai due lati e la scena si fonde con la pagina.
    mm.add('(min-width: 1px)', function(){
      root.classList.add('js-hero');

      // ingresso all'apertura: lavora su elementi INTERNI, diversi da quelli guidati dallo scroll
      gsap.from('.h1-l1 .in', { x: '-40vw', opacity: 0, duration: 1.1, ease: 'power3.out' });
      gsap.from('.h1-l2 .in', { x: '40vw', opacity: 0, duration: 1.1, delay: 0.12, ease: 'power3.out' });
      gsap.from('.scene .lead .in, .hero-cta > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, delay: 0.45, ease: 'power3.out' });
      gsap.from('.mascot-fly', { x: '46vw', y: '-18vh', rotate: 16, opacity: 0, duration: 1.7, delay: 0.3, ease: 'power3.out' });
      gsap.from('.scene-bg', { scale: 1.12, duration: 2.2, ease: 'power2.out' });
      gsap.from('.hero-a svg', { scale: 0.82, opacity: 0, duration: 1.8, delay: 0.1, ease: 'power3.out' });
      gsap.from('.hero-a-glow', { opacity: 0, duration: 2.4, delay: 0.2, ease: 'power2.out' });

      // sequenza guidata dallo scroll: ogni passaggio ha valori di partenza e di arrivo espliciti,
      // cosi' tornando in cima la hero si ricompone sempre uguale
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hero-pin', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
      });
      tl.fromTo('.scene-art', { scale: 1 }, { scale: 1.14, duration: 1 }, 0)
        // si entra nella "A": cresce fino a riempire lo schermo (l'origine e' il suo vuoto centrale)
        .fromTo('.hero-a', { scale: 1, opacity: 1 }, { scale: 15, duration: 0.84, ease: 'power2.in' }, 0.04)
        .fromTo('.hero-a', { opacity: 1 }, { opacity: 0, duration: 0.14, ease: 'none', immediateRender: false }, 0.78)
        .fromTo('.mascot-scrub', { x: 0, y: 0, rotate: 0, scale: 1 }, { x: '-26vw', y: '7vh', rotate: -8, scale: 1.6, duration: 0.72 }, 0)
        .fromTo('.mascot-scrub', { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.5)
        .fromTo('.scene .lead, .hero-cta', { y: 0, opacity: 1 }, { y: -30, opacity: 0, duration: 0.22 }, 0.5)
        .fromTo('.h1-l1', { x: 0, opacity: 1 }, { x: '-46vw', opacity: 0, duration: 0.32 }, 0.58)
        .fromTo('.h1-l2', { x: 0, opacity: 1 }, { x: '46vw', opacity: 0, duration: 0.32 }, 0.62)
        .fromTo('.scene-dim', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.8);
      // rete di sicurezza: quando lo scroll si ferma la hero viene riallineata alla posizione reale,
      // cosi' tornando in cima si ricompone sempre (anche se l'animazione era stata interrotta a meta')
      var heroST = tl.scrollTrigger;
      function syncHero(){ tl.progress(heroST.progress); }
      ScrollTrigger.addEventListener('scrollEnd', syncHero);
      ScrollTrigger.addEventListener('refresh', syncHero);
      ScrollTrigger.refresh();
      return function(){ ScrollTrigger.removeEventListener('scrollEnd', syncHero); ScrollTrigger.removeEventListener('refresh', syncHero); root.classList.remove('js-hero'); };
    });

    // 2. motore di scroll: ogni blocco entra (dai lati o dal basso) e sfuma man mano che esce dal bordo alto
    root.classList.add('js-scroll');
    var items = [];
    function collect(){
      items = [].slice.call(document.querySelectorAll('[data-from], .reveal, [data-fade]')).map(function(el){
        return { el: el, from: el.getAttribute('data-from') || (el.hasAttribute('data-fade') ? 'none' : 'bottom'), top: 0, h: 0 };
      });
    }
    function docTop(el){ var t = 0; while (el){ t += el.offsetTop; el = el.offsetParent; } return t; }
    function measure(){ items.forEach(function(it){ it.top = docTop(it.el); it.h = it.el.offsetHeight; }); }
    function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
    function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
    function render(y){
      var vh = window.innerHeight, wide = window.innerWidth > 980;
      for (var i = 0; i < items.length; i++){
        var it = items[i];
        var relTop = it.top - y, relBottom = relTop + it.h;
        var pIn = clamp((vh * 0.94 - relTop) / (vh * 0.4));            // entrata: dal basso della finestra
        var pOut = clamp((vh * 0.34 - relBottom) / (vh * 0.34));       // uscita: quando il bordo basso si avvicina al top
        var e = easeOut(pIn);
        var x = 0, yy = 0;
        if (it.from === 'left' && wide) x = -(1 - e) * 14;
        else if (it.from === 'right' && wide) x = (1 - e) * 14;
        else if (it.from !== 'none') yy = (1 - e) * (it.from === 'bottom' ? 70 : 56);
        yy -= pOut * 34;
        it.el.style.opacity = (e * (1 - pOut)).toFixed(3);
        it.el.style.transform = (x || yy) ? 'translate3d(' + x.toFixed(2) + 'vw,' + yy.toFixed(1) + 'px,0)' : 'none';
      }
    }
    collect();
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function(self){ render(self.scroll()); } });
    ScrollTrigger.addEventListener('refresh', function(){ measure(); render(window.scrollY); });
    measure(); render(window.scrollY);

    // 3. costi: numeri giganti e testi che si incrociano dai lati (reversibile)
    mm.add('(min-width: 641px)', function(){
      document.querySelectorAll('.cost-row').forEach(function(row){
        var dir = row.getAttribute('data-side') === 'left' ? -1 : 1;
        var t = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: row, start: 'top 92%', end: 'top 38%', scrub: 0.6 } });
        t.from(row.querySelector('.cost-num'), { x: dir * 30 + 'vw' }, 0)
         .from(row.querySelector('.cost-body'), { x: -dir * 22 + 'vw' }, 0);
      });
    });

    // 4. profondita
    document.querySelectorAll('[data-parallax]').forEach(function(mark){
      gsap.fromTo(mark, { yPercent: -14, rotate: -3 }, { yPercent: 14, rotate: 3, ease: 'none', scrollTrigger: { trigger: mark.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
    gsap.fromTo('.eco-cover-bg', { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1, ease: 'none', scrollTrigger: { trigger: '.eco-cover', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    gsap.fromTo('.tools-three', { scale: 1.5, opacity: 0.2 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.tools-head', start: 'top 95%', end: 'top 35%', scrub: 0.6 } });
    gsap.fromTo('.contact-bg', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    gsap.fromTo('.stat-map', { scale: 1.25, opacity: 0.05 }, { scale: 1, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.stat-stage', start: 'top 95%', end: 'bottom 40%', scrub: 0.6 } });

    // 5. contatori: ripartono ogni volta che il numero rientra in vista
    document.querySelectorAll('[data-count]').forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obj = { v: 0 }, tween = null;
      function run(){ if (tween) tween.kill(); obj.v = 0; tween = gsap.to(obj, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: function(){ el.textContent = Math.round(obj.v); } }); }
      function reset(){ if (tween) tween.kill(); obj.v = 0; el.textContent = '0'; }
      el.textContent = '0';
      ScrollTrigger.create({ trigger: el, start: 'top 88%', end: 'bottom 12%', onEnter: run, onEnterBack: run, onLeave: reset, onLeaveBack: reset });
    });

    window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  }

  // ---------- faq: una sola risposta aperta alla volta ----------
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function(item){
    var btn = item.querySelector('.faq-question');
    btn.addEventListener('click', function(){
      var wasOpen = item.classList.contains('is-open');
      faqItems.forEach(function(other){
        other.classList.remove('is-open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen){
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
      if (hasGsap) setTimeout(function(){ ScrollTrigger.refresh(); }, 520);
    });
  });

  // ---------- richiesta informazioni (nessun invio reale: da collegare al backend) ----------
  var form = document.getElementById('lead-form');
  var success = document.getElementById('form-success');
  var errorBox = document.getElementById('form-error');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var invalid = [];
    form.querySelectorAll('[required]').forEach(function(f){
      var ok = f.type === 'checkbox' ? f.checked : f.checkValidity() && f.value.trim() !== '';
      f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) invalid.push(f);
    });
    if (invalid.length){ errorBox.hidden = false; invalid[0].focus(); return; }
    errorBox.hidden = true;
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });
  form.addEventListener('input', function(e){
    if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
  });
})();

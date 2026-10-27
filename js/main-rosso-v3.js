(function(){
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  // tornando alla pagina dalla cache del browser (indietro/avanti) si ricarica, cosi' l'apertura e le animazioni ripartono
  window.addEventListener('pageshow', function(e){ if (e.persisted) window.location.reload(); });

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
    ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });
    ScrollTrigger.create({ trigger: document.body, start: 'top -80', end: 'max', onToggle: function(s){ topbar.classList.toggle('is-solid', s.isActive); } });
    ScrollTrigger.create({ trigger: '.hero-pin', start: 'top -22%', end: 'max', onToggle: function(s){ stack.classList.toggle('show-cta', s.isActive); } });
  } else {
    stack.classList.add('show-cta');
    topbar.classList.add('is-solid');
  }
  if (!hasGsap || reduceMotion){ root.classList.add('intro-skip'); root.classList.remove('intro-lock'); }

  // ---------- scene di scroll (sempre attive, in entrata e in uscita) ----------
  if (hasGsap && !reduceMotion){
    root.classList.add('js-scroll');
    var mm = gsap.matchMedia();

    // 0. la citta' stilizzata: tre livelli di palazzi disegnati una volta sola su canvas (nitidi, con finestre accese).
    //    Scorrendo si ingrandiscono a velocita' diverse e si entra nella citta' (vedi la timeline della hero).
    function buildCity(){
      var stage = document.querySelector('.scene'); if (!stage) return;
      var W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var seed = 7;
      function rnd(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
      function between(a, b){ return a + rnd() * (b - a); }
      var lights = ['255,196,140', '255,120,96', '255,150,120', '255,226,200'];
      function tower(ctx, x, w, top, bottom, o){
        var g = ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, o.c1); g.addColorStop(1, o.c2);
        ctx.fillStyle = g; ctx.fillRect(x, top, w, bottom - top);
        // luce di bordo in alto e sul lato sinistro
        ctx.fillStyle = 'rgba(255,92,72,' + o.rim + ')'; ctx.fillRect(x, top, w, Math.max(1.2, o.ww * 0.28));
        ctx.fillStyle = 'rgba(255,92,72,' + (o.rim * 0.35) + ')'; ctx.fillRect(x, top, Math.max(1, o.ww * 0.2), bottom - top);
        // antenna o guglia
        if (o.spire && rnd() < o.spire){ ctx.fillStyle = o.c1; var sw = Math.max(2, w * 0.05), sh = between(0.04, 0.1) * H; ctx.fillRect(x + w * between(0.3, 0.6), top - sh, sw, sh); }
        // finestre
        var ww = o.ww, wh = o.wh, gx = o.gx, gy = o.gy;
        var cols = Math.floor((w - gx) / (ww + gx)), rows = Math.floor((bottom - top - gy) / (wh + gy));
        var ox = x + (w - (cols * (ww + gx) - gx)) / 2;
        for (var r = 0; r < rows; r++){
          for (var c = 0; c < cols; c++){
            if (rnd() > o.lit) continue;
            ctx.fillStyle = 'rgba(' + lights[(rnd() * lights.length) | 0] + ',' + between(o.a0, o.a1).toFixed(2) + ')';
            ctx.fillRect(ox + c * (ww + gx), top + gy + r * (wh + gy), ww, wh);
          }
        }
      }
      function layer(sel, draw){
        var cv = document.querySelector(sel); if (!cv) return;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H); draw(ctx);
      }
      var u = W / 1440;   // unita' di misura proporzionale alla larghezza
      // livello 1: palazzi lontani e medi su tutta la larghezza, bassi
      layer('.city-1', function(ctx){
        var x = -20 * u;
        while (x < W + 20 * u){
          var w = between(52, 112) * u, top = H * (1 - between(0.16, 0.36));
          tower(ctx, x, w, top, H + 4, { c1: 'rgb(30,7,12)', c2: 'rgb(10,2,5)', rim: 0.5, ww: 3.6 * u, wh: 5.4 * u, gx: 5 * u, gy: 7 * u, lit: 0.2, a0: 0.3, a1: 0.7, spire: 0.25 });
          x += w + between(0, 6) * u;
        }
      });
      // livello 2: palazzi vicini ai due lati, il centro resta libero (la via)
      layer('.city-2', function(ctx){
        function side(x0, x1){
          var x = x0;
          while (x < x1){
            var w = between(70, 130) * u, top = H * (1 - between(0.5, 0.92));
            tower(ctx, x, w, top, H + 4, { c1: 'rgb(20,4,9)', c2: 'rgb(5,1,3)', rim: 0.6, ww: 6 * u, wh: 9 * u, gx: 9 * u, gy: 12 * u, lit: 0.26, a0: 0.3, a1: 0.75, spire: 0.15 });
            x += w + between(0, 8) * u;
          }
        }
        side(-30 * u, 0.15 * W); side(0.86 * W, W + 30 * u);
      });
      // livello 3: lastre altissime a ridosso della camera, solo ai bordi
      layer('.city-3', function(ctx){
        tower(ctx, -40 * u, 0.1 * W, H * 0.02, H + 4, { c1: 'rgb(12,2,6)', c2: 'rgb(3,0,1)', rim: 0.45, ww: 11 * u, wh: 16 * u, gx: 16 * u, gy: 22 * u, lit: 0.18, a0: 0.25, a1: 0.6, spire: 0 });
        tower(ctx, 0.92 * W, 0.12 * W, H * 0.08, H + 4, { c1: 'rgb(12,2,6)', c2: 'rgb(3,0,1)', rim: 0.45, ww: 11 * u, wh: 16 * u, gx: 16 * u, gy: 22 * u, lit: 0.18, a0: 0.25, a1: 0.6, spire: 0 });
      });
    }
    buildCity();
    var cityW = window.innerWidth, cityT;
    window.addEventListener('resize', function(){
      clearTimeout(cityT);
      cityT = setTimeout(function(){ if (Math.abs(window.innerWidth - cityW) > 40){ cityW = window.innerWidth; buildCity(); } }, 250);
    });

    // 1. hero: la scena di Milano e' subito visibile. Scorrendo: il dentino sorvola
    //    e cresce sfumando, i testi escono dai due lati e la scena si fonde con la pagina.
    var heroIn = [];   // ingressi della hero: partono quando l'apertura (la A) si libera
    mm.add('(min-width: 1px)', function(){
      root.classList.add('js-hero');

      // ingresso all'apertura: lavora su elementi INTERNI, diversi da quelli guidati dallo scroll
      heroIn.push(gsap.from('.h1-l1 .in', { x: '-40vw', opacity: 0, duration: 1.1, ease: 'power3.out', paused: true }));
      heroIn.push(gsap.from('.h1-l2 .in', { x: '40vw', opacity: 0, duration: 1.1, delay: 0.12, ease: 'power3.out', paused: true }));
      heroIn.push(gsap.from('.scene .lead .in, .hero-cta > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, delay: 0.45, ease: 'power3.out', paused: true }));
      heroIn.push(gsap.from('.mascot-fly', { x: '46vw', y: '-18vh', rotate: 16, opacity: 0, duration: 1.7, delay: 0.3, ease: 'power3.out', paused: true }));
      heroIn.push(gsap.from('.scene-bg', { scale: 1.12, duration: 2.2, ease: 'power2.out', paused: true }));

      // sequenza guidata dallo scroll: ogni passaggio ha valori di partenza e di arrivo espliciti,
      // cosi' tornando in cima la hero si ricompone sempre uguale
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hero-pin', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
      });
      tl.fromTo('.scene-art', { scale: 1 }, { scale: 1.4, duration: 0.9, ease: 'power1.in' }, 0)
        // la citta' a livelli: i piu' vicini si ingrandiscono di piu' e sfumano alla fine, come se ci passassi in mezzo
        .fromTo('.city-1', { scale: 1 }, { scale: 1.7, duration: 0.88, ease: 'power1.in' }, 0)
        .fromTo('.city-2', { scale: 1 }, { scale: 2.8, duration: 0.88, ease: 'power2.in' }, 0)
        .fromTo('.city-3', { scale: 1 }, { scale: 4.8, duration: 0.88, ease: 'power2.in' }, 0)
        .fromTo('.city-3', { opacity: 1 }, { opacity: 0, duration: 0.22, ease: 'none', immediateRender: false }, 0.62)
        .fromTo('.city-2', { opacity: 1 }, { opacity: 0, duration: 0.18, ease: 'none', immediateRender: false }, 0.74)
        .fromTo('.city-1', { opacity: 1 }, { opacity: 0, duration: 0.14, ease: 'none', immediateRender: false }, 0.8)
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
      ScrollTrigger.addEventListener('refresh', syncHero);
      ScrollTrigger.refresh();
      return function(){ ScrollTrigger.removeEventListener('refresh', syncHero); root.classList.remove('js-hero'); };
    });

    // 1b. apertura: la A si disegna al neon, si riempie di rosso, si ingrandisce e lascia vedere la hero
    var intro = document.getElementById('intro');
    var introDone = false;
    function playHero(){ heroIn.forEach(function(t){ t.play(); }); }
    function endIntro(){
      if (introDone) return; introDone = true;
      root.classList.add('intro-skip'); root.classList.remove('intro-lock');
      if (intro) intro.style.display = 'none';
    }
    if (intro){
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      var iSvg = intro.querySelector('.intro-a'), iStroke = intro.querySelectorAll('.ia-stroke'), iFill = intro.querySelector('.ia-fill'), iGlow = intro.querySelector('.intro-glow');
      gsap.set(iStroke, { strokeDasharray: 100, strokeDashoffset: 100 });
      gsap.set(iFill, { opacity: 0 });
      var iSlogan = intro.querySelector('.intro-slogan');
      gsap.set(iSlogan, { opacity: 0, y: 8 });
      // la A e' disegnata 3 volte piu' grande e mostrata ridotta: durante lo zoom il browser la ingrandisce
      // partendo da una trama ad alta risoluzione (livello dedicato = fluido, e senza sgranare)
      var KI = 3, bI = iSvg.getBoundingClientRect(), wI = bI.width, hI = bI.height;
      gsap.set(iSvg, { transformOrigin: '47% 68%', scale: 1 / KI, x: (1 - 1 / KI) * 0.03 * wI, y: -(1 - 1 / KI) * 0.18 * hI });
      // le immagini della hero vengono decodificate ora, dietro l'apertura, cosi' lo zoom non si ferma a caricarle
      document.querySelectorAll('.scene-bg, .scene-mascot').forEach(function(im){ if (im.decode) im.decode().catch(function(){}); });
      clearTimeout(window.__ti);   // il rimedio dell'head serve solo se GSAP non si carica
      var itl = gsap.timeline({ onComplete: endIntro });
      window.__introTl = itl;
      itl.to(iStroke, { strokeDashoffset: 0, duration: 2.3, ease: 'power2.inOut' }, 0.35)
         .to(iFill, { opacity: 1, duration: 1.3, ease: 'power1.inOut' }, 2.6)
         .to(iGlow, { opacity: 1, duration: 1.3, ease: 'power1.inOut' }, 2.5)
         .to(iSlogan, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 2.6)
         .to(iSlogan, { opacity: 0, letterSpacing: '0.62em', duration: 0.9, ease: 'power1.in' }, 3.85)
         .call(function(){ ScrollTrigger.refresh(); }, null, 1.2)
         .to(iSvg, { scale: 16 / KI, duration: 1.6, ease: 'power2.in' }, 3.85)
         .to(intro.querySelectorAll('.ia-halo'), { opacity: 0, duration: 0.5, ease: 'power1.out' }, 3.85)
         .to(iGlow, { scale: 4, opacity: 0, duration: 1.4, ease: 'power1.in' }, 3.85)
         .to(intro, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.8, ease: 'power1.in' }, 4.6)
         .add(playHero, 5.35)
         .to(intro, { opacity: 0, duration: 0.3 }, 5.6);
      // un tocco per saltare l'apertura
      intro.addEventListener('click', function(){ itl.progress(1); playHero(); });
      // rete di sicurezza: se per qualunque motivo l'apertura si blocca, dopo 9 secondi si apre comunque la hero
      setTimeout(function(){ if (!introDone){ itl.progress(1); playHero(); } }, 9000);
    } else {
      playHero();
    }

    // 1c. manifesto: una parola alla volta, sempre al centro dello schermo (su mobile restano una sotto l'altra)
    mm.add('(min-width: 761px)', function(){
      var words = gsap.utils.toArray('.mf-word');
      var t = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.manifesto', start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true } });
      words.forEach(function(w, i){
        var from = i % 2 ? 12 : -12, at = i * 1.25;
        t.fromTo(w, { opacity: 0, x: from + 'vw', scale: 0.94 }, { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'power2.out' }, at);
        if (i < words.length - 1) t.fromTo(w, { opacity: 1, x: 0, scale: 1 }, { opacity: 0, x: (-from) + 'vw', scale: 1.04, duration: 0.4, ease: 'power2.in', immediateRender: false }, at + 0.8);
      });
      t.to({}, { duration: 0.5 });
    });
    mm.add('(max-width: 760px)', function(){
      var words = gsap.utils.toArray('.mf-word');
      var t = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.manifesto', start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true } });
      words.forEach(function(w, i){
        t.fromTo(w, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, i * 0.9);
      });
      t.to({}, { duration: 0.7 });
    });

    // 2. motore di scroll: ogni blocco entra (dai lati o dal basso) e sfuma man mano che esce dal bordo alto
    var items = [];
    function collect(){
      items = [].slice.call(document.querySelectorAll('[data-from], .reveal, [data-fade]')).map(function(el){
        return { el: el, from: el.getAttribute('data-from') || (el.hasAttribute('data-fade') ? 'none' : 'bottom'), lead: parseFloat(el.getAttribute('data-lead')) || 0, top: 0, h: 0 };
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
        // blocchi lontani dalla finestra: stato finale scritto una volta e poi saltati (meno lavoro a ogni scroll)
        if (relTop > vh * 1.6 || relBottom < -vh * 0.6){
          if (!it.off){ it.el.style.opacity = '0'; it.off = true; }
          continue;
        }
        it.off = false;
        var pIn = clamp((vh * (0.94 + it.lead) - relTop) / (vh * 0.4));            // entrata: dal basso della finestra
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
        var t = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: row, start: 'top 102%', end: 'top 48%', scrub: 0.6 } });
        t.from(row.querySelector('.cost-num'), { x: dir * 30 + 'vw' }, 0)
         .from(row.querySelector('.cost-body'), { x: -dir * 22 + 'vw' }, 0);
      });
    });

    // 3b. brand: le schede arrivano da sinistra a scorrimento, prima l'ultima, poi la centrale, poi la prima.
    //     Partono tutte dalla stessa distanza (come un treno) e sfumano mentre entrano: nessuna passa sotto un'altra
    mm.add('(min-width: 981px)', function(){
      var cards = gsap.utils.toArray('.brand-card');
      var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.brand-track', start: 'top 94%', end: 'top 30%', scrub: 0.5, invalidateOnRefresh: true } });
      function startX(){
        var far = 0;
        cards.forEach(function(c){ var r = c.getBoundingClientRect(); far = Math.max(far, r.right - (gsap.getProperty(c, 'x') || 0)); });
        return -far - 40;
      }
      cards.slice().reverse().forEach(function(card, i){
        var at = i * 0.75;
        tl.fromTo(card, { x: startX }, { x: 0, duration: 1.2, ease: 'power2.out' }, at)
          .fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power1.in', immediateRender: true }, at);
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

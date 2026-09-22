(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── conteúdo ───────────────────────────────────────────────────────────
  const YT_ID = 'F33uCg-3XiY'; // Olivia Rodrigo — teenage dream (Official Lyric Video)
  const SPOTIFY_ID = '531XIdq8xsN30xtTv278bR'; // mesma música no Spotify (plano B)
  const MP3 = 'musica/teenage-dream.mp3'; // se existir, toca daqui em vez do YouTube

  // x/y são coordenadas do mapa (viewBox 1000 × 700)
  const PHOTOS = [
    { file: '01', x: 160, y: 175, pin: 'o wallpaper',
      title: 'A foto do wallpaper',
      text: 'Nesse dia eu não estava com você. Você me mandou essa foto e virou meu wallpaper na hora — é a primeira coisa que eu vejo todo dia.' },
    { file: '02', x: 390, y: 160, pin: 'risadas',
      title: 'Rindo de nada',
      text: 'A gente rindo de nada — que é a nossa forma favorita de rir de tudo.' },
    { file: '03', x: 595, y: 185, pin: '♥ com as mãos',
      title: 'Coração com as mãos',
      text: 'O coração que você faz com as mãos. E o que você fez com o meu.' },
    { file: '04', x: 825, y: 150, pin: 'Divinópolis',
      title: 'Divinópolis · a entrada do parque',
      text: 'A gente em Divinópolis, no shopping. Essa era a entrada do parque do pula-pula — um corredor de luz e você do meu lado, meu lugar preferido no mundo.' },
    { file: '05', x: 820, y: 320, pin: 'nós dois',
      title: 'Divinópolis · nós dois',
      text: 'Ainda em Divinópolis. Esse sorriso é o motivo de eu levantar todo dia.' },
    { file: '06', x: 605, y: 400, pin: 'eu, sério',
      title: 'Divinópolis · eu, sendo eu',
      text: 'Prova de que você namora um homem muito sério. Você ri dessa foto até hoje, e eu amo isso.' },
    { file: '07', x: 395, y: 470, pin: 'o cinema',
      title: 'A primeira foto',
      text: 'Nossa primeira foto juntos, logo depois do nosso encontro no cinema. Você mostrando a língua, eu fingindo que não te conheço — e ali já começava tudo.' },
  ].map((p) => ({
    ...p,
    src: `fotos/foto-${p.file}.jpg`,
    thumb: `fotos/thumb-${p.file}.jpg`,
    alt: `${p.title} — Jhullya e Iury`,
  }));

  // ─── revelações ao rolar ────────────────────────────────────────────────
  const revealIn = (el, delay) => {
    el.style.transitionDelay = delay ? `${delay}ms` : '';
    el.classList.add('in');
    // o atraso só vale pra entrada; depois some pra hover/press responderem na hora
    el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    setTimeout(() => { el.style.transitionDelay = ''; }, delay + 800);
  };

  const revealGroup = (group) => {
    const items = $$('[data-reveal]', group).filter((el) => el !== group);
    const mode = group.dataset.revealGroup;
    if (group.hasAttribute('data-reveal')) revealIn(group, 0);
    if (mode === 'path') {
      // pinos do mapa aparecem acompanhando a trilha (2600ms linear + 200ms de atraso)
      const n = Math.max(items.length - 1, 1);
      items.forEach((el, i) => revealIn(el, 250 + Math.round((i / n) * 2500)));
    } else {
      const step = Number(mode) || 60;
      items.forEach((el, i) => revealIn(el, i * step));
    }
  };

  const startReveals = () => {
    const targets = $$('[data-reveal-group], [data-reveal]').filter((el) =>
      el.hasAttribute('data-reveal-group') || !el.parentElement.closest('[data-reveal-group]'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        if (entry.target.hasAttribute('data-reveal-group')) revealGroup(entry.target);
        else revealIn(entry.target, 0);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
  };

  // ─── mapa: pinos ────────────────────────────────────────────────────────
  const buildPins = () => {
    const wrap = $('#pins');
    PHOTOS.forEach((p, i) => {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'pin';
      pin.setAttribute('data-reveal', '');
      pin.style.setProperty('--x', `${p.x / 10}%`);
      pin.style.setProperty('--y', `${p.y / 7}%`);
      pin.setAttribute('aria-label', `Ver foto: ${p.title}`);
      pin.innerHTML = `<span class="pin-label">${p.pin}</span><span class="pin-dot"></span>`;
      pin.addEventListener('click', () => openLightbox(i));
      wrap.appendChild(pin);
    });
  };

  // ─── galeria: polaroids ─────────────────────────────────────────────────
  const buildPolaroids = () => {
    const wrap = $('#polaroids');
    PHOTOS.forEach((p, i) => {
      const fig = document.createElement('figure');
      fig.className = 'polaroid';
      fig.setAttribute('data-reveal', '');
      fig.innerHTML = `
        <button type="button" aria-label="Abrir foto: ${p.title}">
          <img src="${p.thumb}" alt="${p.alt}" loading="lazy" decoding="async" width="480" height="600">
          <figcaption>${p.title}</figcaption>
        </button>`;
      fig.querySelector('button').addEventListener('click', () => openLightbox(i));
      wrap.appendChild(fig);
    });
  };

  // ─── lightbox ───────────────────────────────────────────────────────────
  const lb = $('#lightbox');
  const lbImg = $('.lb-img', lb);
  const lbTitle = $('.lb-title', lb);
  const lbText = $('.lb-text', lb);
  const lbCount = $('.lb-count', lb);
  let lbIndex = 0;
  let lbLastFocus = null;
  let lbBusy = false;

  const preload = (i) => { const im = new Image(); im.src = PHOTOS[(i + PHOTOS.length) % PHOTOS.length].src; };

  const renderLightbox = () => {
    const p = PHOTOS[lbIndex];
    lbImg.src = p.src;
    lbImg.alt = p.alt;
    lbTitle.textContent = p.title;
    lbText.textContent = p.text;
    lbCount.textContent = `${lbIndex + 1} / ${PHOTOS.length}`;
    preload(lbIndex + 1); preload(lbIndex - 1);
  };

  function openLightbox(i) {
    lbIndex = i;
    renderLightbox();
    lbLastFocus = document.activeElement;
    lb.hidden = false;
    lb.classList.remove('closing');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      lb.classList.add('open');
      $('.lb-close', lb).focus({ preventScroll: true });
    }));
  }

  const closeLightbox = () => {
    if (lb.hidden || lbBusy) return;
    lbBusy = true;
    lb.classList.add('closing');
    lb.classList.remove('open');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      lb.hidden = true;
      lb.classList.remove('closing');
      document.body.style.overflow = '';
      lbBusy = false;
      if (lbLastFocus && lbLastFocus.focus) lbLastFocus.focus({ preventScroll: true });
    };
    $('.lb-card', lb).addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, reduceMotion ? 0 : 200);
  };

  const stepLightbox = (dir) => {
    lbIndex = (lbIndex + dir + PHOTOS.length) % PHOTOS.length;
    renderLightbox();
    if (!reduceMotion) lbImg.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  };

  lb.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeLightbox();
    const step = e.target.closest('[data-step]');
    if (step) stepLightbox(Number(step.dataset.step));
  });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') stepLightbox(1);
    if (e.key === 'ArrowLeft') stepLightbox(-1);
  });
  // arrastar pro lado no celular
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 48) stepLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });

  // ─── música ─────────────────────────────────────────────────────────────
  const frame = $('#player-frame');
  const fallbackBtn = $('#player-fallback');

  const note = $('#player-note');
  const noteBtn = $('#player-spotify');

  // Plano B: player do Spotify (toca 30s sem login, inteira se ela estiver logada)
  let spotifyOn = false;
  const spotifyPlayer = () => {
    if (spotifyOn) return;
    spotifyOn = true;
    frame.innerHTML = '';
    frame.classList.add('spotify');
    const ifr = document.createElement('iframe');
    ifr.src = `https://open.spotify.com/embed/track/${SPOTIFY_ID}?utm_source=generator&theme=0`;
    ifr.title = 'teenage dream — Olivia Rodrigo (Spotify)';
    ifr.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    frame.appendChild(ifr);
    note.textContent = 'aperta o play ♪ (entra no Spotify pra ouvir inteira)';
  };
  noteBtn.addEventListener('click', spotifyPlayer);

  // Plano A: YouTube via IFrame API — se o vídeo não puder ser embutido, cai pro Spotify sozinho
  const loadYouTubeApi = () => new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(true);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(true); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
    setTimeout(() => resolve(!!(window.YT && window.YT.Player)), 7000);
  });

  const youtubePlayer = () => {
    let started = false;
    return {
      async start(autoplay) {
        if (started) return;
        started = true;
        fallbackBtn.hidden = true;
        const ok = await loadYouTubeApi();
        if (!ok || spotifyOn) { if (!spotifyOn) spotifyPlayer(); return; }
        const host = document.createElement('div');
        frame.appendChild(host);
        new window.YT.Player(host, {
          videoId: YT_ID,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { autoplay: autoplay ? 1 : 0, rel: 0, playsinline: 1, modestbranding: 1 },
          events: {
            onReady: (e) => { if (autoplay) e.target.playVideo(); },
            onError: () => spotifyPlayer(),
          },
        });
      },
    };
  };

  const localPlayer = () => {
    const audio = new Audio(MP3);
    audio.preload = 'auto';
    audio.loop = true;
    const card = document.createElement('div');
    card.className = 'audio';
    card.innerHTML = `
      <button class="audio-play" type="button" aria-label="Tocar">▶</button>
      <div>
        <div class="audio-title">teenage dream</div>
        <div class="audio-artist">Olivia Rodrigo</div>
        <div class="audio-bar"><i></i></div>
      </div>`;
    frame.parentElement.replaceChild(card, frame);
    const btn = $('.audio-play', card);
    const bar = $('.audio-bar i', card);
    const sync = () => { btn.textContent = audio.paused ? '▶' : '❚❚'; btn.setAttribute('aria-label', audio.paused ? 'Tocar' : 'Pausar'); };
    btn.addEventListener('click', () => { audio.paused ? audio.play().catch(() => {}) : audio.pause(); });
    audio.addEventListener('play', sync); audio.addEventListener('pause', sync);
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) bar.style.transform = `scaleX(${audio.currentTime / audio.duration})`;
    });
    return { start(autoplay) { if (autoplay) audio.play().catch(() => {}); } };
  };

  const setupMusic = async () => {
    let hasMp3 = false;
    try {
      if (location.protocol.startsWith('http')) {
        const res = await fetch(MP3, { method: 'HEAD' });
        hasMp3 = res.ok && /audio|octet-stream/.test(res.headers.get('content-type') || '');
      }
    } catch (_) { /* sem mp3 → YouTube */ }
    return hasMp3 ? localPlayer() : youtubePlayer();
  };
  const musicReady = setupMusic();
  fallbackBtn.addEventListener('click', () => musicReady.then((m) => m.start(true)));

  // ─── portão ─────────────────────────────────────────────────────────────
  const gate = $('#gate');
  const gateBtn = $('#gate-btn');
  const site = $('#site');
  const body = document.body;
  let opened = false;

  const openSite = ({ autoplayMusic }) => {
    if (opened) return;
    opened = true;

    const r = gateBtn.getBoundingClientRect();
    site.style.setProperty('--rx', `${Math.round(r.left + r.width / 2)}px`);
    site.style.setProperty('--ry', `${Math.round(r.top + r.height / 2)}px`);

    window.scrollTo(0, 0);
    body.classList.remove('locked');
    body.classList.add('opening');
    gate.classList.add('closing');

    if (autoplayMusic) musicReady.then((m) => m.start(true));
    setTimeout(() => revealGroup($('.hero')), reduceMotion ? 0 : 180);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      body.classList.add('open');
      body.classList.remove('opening');
      gate.hidden = true;
      startReveals();
    };
    if (reduceMotion) finish();
    else {
      site.addEventListener('transitionend', (e) => { if (e.propertyName === 'clip-path') finish(); }, { once: true });
      setTimeout(finish, 1200);
    }
  };

  gateBtn.addEventListener('click', () => openSite({ autoplayMusic: true }));

  // ─── selo ───────────────────────────────────────────────────────────────
  $('#seal-btn').addEventListener('click', () => {
    $('#promessas').classList.add('sealed');
  });

  // ─── boot ───────────────────────────────────────────────────────────────
  buildPins();
  buildPolaroids();

  // ?aberto pula o portão (link direto / pré-visualização); ?semanim desliga as animações
  const params = new URLSearchParams(location.search);
  if (params.has('semanim')) document.documentElement.classList.add('no-anim');
  if (params.has('aberto')) {
    gate.hidden = true;
    body.classList.remove('locked');
    body.classList.add('open');
    opened = true;
    revealGroup($('.hero'));
    startReveals();
    musicReady.then((m) => m.start(false));
  }

  // ─── PWA ────────────────────────────────────────────────────────────────
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // veio site novo: recarrega só se ela ainda não abriu o mapa (não interrompe a leitura)
      if (refreshing || !hadController || opened) return;
      refreshing = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

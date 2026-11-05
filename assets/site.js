/* Shared script for every page of instructorhamid.github.io.
   Each block runs only when its section is on the current page. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- reveal: hide only what starts below the fold, reveal on intersect ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const vh = innerHeight;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('await'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach((el, i) => {
      if (el.getBoundingClientRect().top > vh) {
        el.classList.add('await');
        // small stagger for siblings in lists
        const sib = [...el.parentElement.children].filter(c => c.classList.contains('rv')).indexOf(el);
        el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
        io.observe(el);
      }
    });
  }

  /* ---------- header state + scroll-linked process progress (one rAF-throttled handler) ---------- */
  const hdr = $('#hdr'), steps = $('#steps'), fill = $('#stepsFill');
  let ticking = false;
  const onScroll = () => {
    hdr.classList.toggle('scrolled', scrollY > 24);
    if (steps) {
      const r = steps.getBoundingClientRect(), mid = innerHeight * .55;
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      fill.style.setProperty('--p', p.toFixed(3));
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- active nav link ---------- */
  const navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length) {
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['about','why','process','work','tools','reviews','contact'].forEach(id => { const s = document.getElementById(id); if (s) secIO.observe(s); });
  }

  /* ---------- mobile menu ---------- */
  const mb = $('#menuBtn'), mn = $('#mnav');
  const setMenu = open => {
    mb.setAttribute('aria-expanded', open); mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mn.classList.toggle('open', open); hdr.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) mn.querySelector('a').focus();
  };
  mb.addEventListener('click', () => setMenu(mb.getAttribute('aria-expanded') !== 'true'));
  mn.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && mn.classList.contains('open')) { setMenu(false); mb.focus(); } });

  /* ---------- magnetic buttons (fine pointers only) ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    $$('.mag').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.22,.8,.24,1),background .3s,box-shadow .3s'; b.style.transform = ''; });
      b.addEventListener('pointerenter', () => { b.style.transition = 'transform .12s linear,background .3s,box-shadow .3s'; });
    });
  }

  /* ---------- hero: pause SMIL when reduced motion or off-screen; cycle example log ---------- */
  const svg = $('#heroSvg');
  if (svg) {
  if (reduce) svg.pauseAnimations();
  const events = [
    'Lead captured · landing page','Contact created in CRM','Tagged: webinar-registrant','Confirmation email sent',
    'Reminder scheduled · 1h before','Team notified · Slack','Call booked · calendar','Pipeline stage → Booked'
  ];
  const log = $('#log');
  let ei = 3, mins = 14, logTimer = null;
  const pushLog = () => {
    mins = (mins + 1) % 60;
    const li = document.createElement('li');
    li.innerHTML = `<time>09:${String(mins).padStart(2,'0')}</time>${events[ei++ % events.length]}`;
    li.style.opacity = '0'; li.style.transform = 'translateY(-10px)';
    log.prepend(li);
    requestAnimationFrame(() => { li.style.opacity = ''; li.style.transform = ''; });
    while (log.children.length > 3) log.lastElementChild.remove();
  };
  if (!reduce) {
    const heroIO = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { svg.unpauseAnimations(); if (!logTimer) logTimer = setInterval(pushLog, 1800); }
      else { svg.pauseAnimations(); clearInterval(logTimer); logTimer = null; }
    });
    heroIO.observe($('.hero'));
  }
  }

  /* ---------- why: connect / disconnect toggle ---------- */
  const board = $('#board'), sw = $('#sw');
  if (board && sw) {
  const caps = {
    on: ['Connected system','Every tool hands off to the next. Leads arrive tagged with their source, get the right emails and land in front of your team at the right moment.'],
    off: ['Disconnected tools','The same tools, working alone. Data moves by export and copy-paste, follow-ups slip, and nobody can trace a lead back to its source.']
  };
  const setBoard = on => {
    board.classList.toggle('on', on); sw.setAttribute('aria-checked', on);
    $('#boardLabel').textContent = caps[on ? 'on' : 'off'][0];
    $('#boardCap').textContent = caps[on ? 'on' : 'off'][1];
  };
  sw.addEventListener('click', () => setBoard(sw.getAttribute('aria-checked') !== 'true'));
  // Play the "before → after" once when the board first scrolls into view.
  if (!reduce) {
    const bIO = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { bIO.disconnect(); setBoard(false); setTimeout(() => setBoard(true), 1500); }
    }, { threshold: .5 });
    bIO.observe(board);
  }
  }

  /* ---------- process: active stage drives the loop diagram ---------- */
  const loopSvg = $('#loopSvg'), stepEls = $$('.step');
  if (loopSvg && stepEls.length) {
  const NS = 'http://www.w3.org/2000/svg';
  const dots = stepEls.map((_, i) => {
    const a = (-90 + i * 60) * Math.PI / 180, g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'dot');
    g.innerHTML = `<circle cx="${160 + 120 * Math.cos(a)}" cy="${160 + 120 * Math.sin(a)}" r="18"/><text x="${160 + 120 * Math.cos(a)}" y="${160 + 120 * Math.sin(a)}">${i + 1}</text>`;
    loopSvg.appendChild(g); return g;
  });
  const setStage = idx => {
    stepEls.forEach((s, i) => s.classList.toggle('is-on', i <= idx));
    dots.forEach((d, i) => { d.classList.toggle('cur', i === idx); d.classList.toggle('done', i < idx); });
    $('#loopProg').setAttribute('stroke-dashoffset', 100 - (idx / 6) * 100 - (100 / 12));
    $('#loopName').textContent = stepEls[idx].dataset.name.toUpperCase();
  };
  setStage(0);
  const stIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStage(stepEls.indexOf(e.target)); }), { rootMargin: '-48% 0px -48% 0px' });
  stepEls.forEach(s => stIO.observe(s));
  }

  /* ---------- project 1: a lit step walks down the workflow ---------- */
  const wfSteps = $$('#wf .stp');
  if (!reduce && wfSteps.length) {
    let w = 0, wt = null;
    const wfIO = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !wt) wt = setInterval(() => { wfSteps.forEach(s => s.classList.remove('lit')); wfSteps[w++ % wfSteps.length].classList.add('lit'); }, 900);
      else if (!e.isIntersecting) { clearInterval(wt); wt = null; }
    });
    wfIO.observe($('#wf'));
  }

  /* ---------- project 3: gauges sweep from "before" to "after" ---------- */
  if (!reduce && $('#gauges')) {
    const gs = $$('.gauge');
    gs.forEach(g => g.querySelector('.now').setAttribute('stroke-dashoffset', 100 - g.dataset.was));
    const gIO = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; gIO.disconnect();
      gs.forEach(g => {
        const now = +g.dataset.now, was = +g.dataset.was, num = g.querySelector('.num');
        g.querySelector('.now').setAttribute('stroke-dashoffset', 100 - now);
        const t0 = performance.now(), D = 1600;
        const step = t => { const k = Math.min(1, (t - t0) / D), ez = 1 - Math.pow(1 - k, 3); num.textContent = Math.round(was + (now - was) * ez); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }, { threshold: .4 });
    gIO.observe($('#gauges'));
  }

  /* ---------- tools: selectable tiles update the detail panel ---------- */
  const TOOLS = {
    ghl: ['CRM & marketing platform','GoHighLevel','Funnels, forms, pipelines, workflows and email in one place. My main build platform for webinar funnels and lead-generation systems.','landing pages, Meta and Google ads, calendars, Slack alerts'],
    hubspot: ['CRM & marketing platform','HubSpot','CRM, lead management and marketing email for teams that already run on HubSpot. I set up pipelines, properties and workflows to match the sales process.','website forms, meeting booking, email sequences, reporting'],
    n8n: ['Automation & integration','n8n','Flexible workflow automation for multi-step logic, API calls and syncing data between apps that don\'t integrate natively.','CRMs, spreadsheets, webhooks, AI steps, internal tools'],
    zapier: ['Automation & integration','Zapier','Fast, dependable connections between everyday apps when a simple trigger and action is all a process needs.','forms, CRMs, email tools, calendars, Slack'],
    claude: ['AI assistant','Claude','Support for research, strategy, copy drafts and workflow planning. AI speeds up the thinking; the decisions and the build stay with me.','planning docs, email drafts, automation logic'],
    chatgpt: ['AI assistant','ChatGPT','Used alongside Claude for research, content development and planning workflows before they are built.','planning docs, content drafts, research'],
    ga4: ['Tracking & analytics','Google Analytics 4','Conversion tracking and reporting, including attribution from ad click to CRM record.','landing pages, Tag Manager, ad platforms'],
    gtm: ['Tracking & analytics','Google Tag Manager','Manages tracking tags and conversion events without editing site code for every change.','GA4, Meta Pixel and CAPI, landing pages'],
    gsc: ['Tracking & analytics','Search Console','Indexing and search performance data, part of SEO and site health work.','GA4, site audits, keyword mapping'],
    meta: ['Tracking & analytics','Meta','Lead capture from Meta ads and Conversions API events, so ad delivery learns from real conversions.','CRM webhooks, GA4, landing pages']
  };
  const tiles = $$('.tile'), det = $('#detail');
  const pick = t => {
    tiles.forEach(x => x.setAttribute('aria-pressed', x === t));
    const d = TOOLS[t.dataset.k];
    $('#dK').textContent = d[0]; $('#dT').textContent = d[1]; $('#dP').textContent = d[2];
    $('#dC').innerHTML = '<b>Typically connects to:</b> ' + d[3];
    det.classList.remove('swap'); void det.offsetWidth; det.classList.add('swap');
  };
  if (det) tiles.forEach(t => t.addEventListener('click', () => pick(t)));

  /* ---------- testimonials: verbatim, supplied by Hamid ---------- */
  const REVIEWS = [
    { q: 'I had the pleasure of working with Hamid to enhance my digital presence for Smart Solution with Sandip Surila. His expertise in website redesign, SEO, content creation, social media management, and ad campaigns was outstanding. He handled everything from integrating property listings with RealtyPress to setting up analytic, ensuring everything ran smoothly. The results were remarkable, my online presence improved, engagement increased, and lead generation became more efficient. Highly recommend!',
      n: 'Sandip Surila', d: 'Real Estate · Mortgage · Insurance · Investment', s: 'LinkedIn', r: '5.0', note: 'Nov 11, 2025' },
    { q: 'Very good experience. He exceeded expectations. He was very fast to get the job done & communicated efficiently. I would recommend to work with again. He helped me setup all my social media accounts and created all emails and passwords and smoothly transferred all accounts to me. We look to do more business together.',
      n: 'jpconstructi647', d: 'United States', s: 'Fiverr', r: '5' },
    { q: 'He did an excellent work, will recommend. communication wasn\'t an issue and he deliver.',
      n: 'kongumaru', d: 'United States', s: 'Fiverr', r: '5' },
    { q: 'It is amazing working with you. Thank you so much for everything. You are really the best.',
      n: 'openupwide', d: 'Slovenia · Repeat client', s: 'Fiverr', r: '5' }
  ];
  const fq = $('#fq'), fw = $('#fw'), qwrap = $('#quotes');
  if (fq && fw && qwrap) {
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const showReview = (i, animate) => {
    const r = REVIEWS[i];
    fq.textContent = r.q;
    fw.innerHTML = `<b>${esc(r.n)}</b><span>${esc(r.d)}</span><span class="stars" aria-label="${r.r} out of 5 stars">★★★★★</span><span class="src">${r.s}</span>${r.note ? `<span>${r.note}</span>` : ''}`;
    if (animate) { fq.classList.remove('swap'); void fq.offsetWidth; fq.classList.add('swap'); }
    $$('.qcard').forEach((c, k) => c.setAttribute('aria-pressed', k === i));
  };
  REVIEWS.forEach((r, i) => {
    const b = document.createElement('button');
    b.className = 'qcard'; b.type = 'button';
    b.innerHTML = `<span class="stars" aria-hidden="true">★★★★★</span><p>${esc(r.q)}</p><footer><b>${esc(r.n)}</b><span>${r.s}</span></footer>`;
    b.setAttribute('aria-label', `Show review from ${r.n} on ${r.s}`);
    b.addEventListener('click', () => { showReview(i, true); $('#reviews .feature').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
    qwrap.appendChild(b);
  });
  // The large panel shows one review; the cards show the other three.
  showReview(0, false);
  // Hide the card that matches the featured review so the page shows all four, once each.
  const syncCards = () => { const cur = $$('.qcard').findIndex(c => c.getAttribute('aria-pressed') === 'true'); $$('.qcard').forEach((c, k) => c.hidden = k === cur); };
  qwrap.addEventListener('click', () => requestAnimationFrame(syncCards));
  syncCards();
  }

  /* ---------- copy buttons ---------- */
  const copyText = async (text, btn, label) => {
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; btn.classList.add('ok'); }
    catch { const r = document.createRange(); const n = btn.previousElementSibling || btn; r.selectNodeContents(n); getSelection().removeAllRanges(); getSelection().addRange(r); btn.textContent = 'Selected'; }
    setTimeout(() => { btn.textContent = label; btn.classList.remove('ok'); }, 1800);
  };
  $$('.cpy').forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy, b, 'Copy')));

  /* ---------- inquiry form ---------- */
  const form = $('#inq');
  if (form) {
  const rules = {
    name: v => v.trim().length >= 2 || 'Please enter your name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address, like you@company.com.',
    need: v => !!v || 'Choose the option closest to your project.',
    message: v => v.trim().length >= 15 || 'Add a sentence or two about the project (at least 15 characters).'
  };
  const ids = { name: 'name', email: 'email', need: 'need', message: 'msg' };
  const check = name => {
    const el = form.elements[name], res = rules[name](el.value), fld = el.closest('.fld'), err = $('#e-' + ids[name]);
    const ok = res === true; fld.classList.toggle('bad', !ok); err.textContent = ok ? '' : res;
    el.setAttribute('aria-invalid', !ok); el.setAttribute('aria-describedby', 'e-' + ids[name]);
    return ok;
  };
  Object.keys(rules).forEach(n => form.elements[n].addEventListener('blur', () => { if (form.elements[n].value) check(n); }));
  // Replace this function to send inquiries to a webhook (GoHighLevel / n8n / Zapier).
  const sendInquiry = data => {
    const text = `Hi Hamid, I'm ${data.name} (${data.email}).\n\nI need help with: ${data.need}\n\n${data.message}`;
    $('#msgOut').textContent = text;
    $('#waLink').href = 'https://wa.me/447848498892?text=' + encodeURIComponent(text);
    $('#formBody').hidden = true; $('#done').hidden = false; $('#done h3').setAttribute('tabindex', '-1'); $('#done h3').focus();
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = Object.keys(rules).filter(n => !check(n));
    if (bad.length) { form.elements[bad[0]].focus(); return; }
    sendInquiry(Object.fromEntries(new FormData(form)));
  });
  $('#copyMsg').addEventListener('click', e => copyText($('#msgOut').textContent, e.currentTarget, 'Copy message'));
  $('#editMsg').addEventListener('click', () => { $('#done').hidden = true; $('#formBody').hidden = false; form.elements.message.focus(); });
  }

  /* ---------- screenshot lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lbImg');
  if (lb) {
  $$('.shot-btn').forEach(b => b.addEventListener('click', () => {
    const im = b.querySelector('img'); lbImg.src = im.src; lbImg.alt = im.alt; $('#lbCap').textContent = b.dataset.cap;
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
  }));
  const closeLb = () => { if (lb.close) lb.close(); else lb.removeAttribute('open'); };
  $('#lbX').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  }

  /* ---------- footer ---------- */
  $('#yr').textContent = new Date().getFullYear();
  $('#totop').addEventListener('click', () => { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); $('.brand').focus({ preventScroll: true }); });
})();

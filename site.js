// Shared behaviour for all pages
(function () {
  function init() {
    var y = document.getElementById('yr');
    if (y) y.textContent = new Date().getFullYear();

    // Favicon — navy tile with a gold serif S
    if (!document.querySelector('link[rel="icon"]')) {
      var fav = document.createElement('link');
      fav.rel = 'icon';
      fav.type = 'image/svg+xml';
      fav.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230f1826'/%3E%3Ctext x='50%25' y='52%25' dy='.32em' text-anchor='middle' font-family='Georgia,serif' font-weight='600' font-size='40' fill='%23cdbf9e'%3ES%3C/text%3E%3C/svg%3E";
      document.head.appendChild(fav);
    }

    // Header: homepage fades from transparent to solid on scroll.
    // Inner pages mark the header ".solid" so it stays solid.
    var hdr = document.getElementById('hdr');
    if (hdr && !hdr.classList.contains('solid')) {
      var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 20); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Mobile hamburger menu
    var menuBtn = document.querySelector('.menu-btn');
    if (menuBtn && hdr) {
      menuBtn.addEventListener('click', function () {
        var open = hdr.classList.toggle('nav-open');
        menuBtn.textContent = open ? '✕' : '☰';
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      var navAnchors = hdr.querySelectorAll('.navlinks a');
      for (var i = 0; i < navAnchors.length; i++) {
        navAnchors[i].addEventListener('click', function () {
          // Only close the menu for same-page (#) links. For links that
          // navigate to another page, do NOT touch the DOM here — hiding the
          // tapped link mid-click cancels navigation on mobile browsers.
          var href = this.getAttribute('href') || '';
          if (href.charAt(0) === '#') {
            hdr.classList.remove('nav-open');
            menuBtn.textContent = '☰';
          }
        });
      }
    }

    // Scroll-progress bar (thin gold line at the top)
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    var onProgress = function () {
      var d = document.documentElement;
      var max = d.scrollHeight - d.clientHeight;
      bar.style.width = (max > 0 ? (d.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onProgress, { passive: true });
    onProgress();

    // Cursor-reactive 3D tilt on the book cover (pointer devices only)
    var coverWrap = document.querySelector('.cover-wrap');
    var cover = coverWrap && coverWrap.querySelector('.cover');
    if (cover && window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      var rest = 'perspective(1300px) rotateY(-7deg) rotateX(2.5deg)';
      cover.style.transition = 'transform .2s cubic-bezier(.2,.7,.2,1), box-shadow .5s cubic-bezier(.2,.7,.2,1)';
      coverWrap.addEventListener('mousemove', function (e) {
        var r = coverWrap.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        cover.style.transform = 'perspective(1300px) rotateY(' + (-px * 16).toFixed(2) + 'deg) rotateX(' + (py * 12).toFixed(2) + 'deg)';
      });
      coverWrap.addEventListener('mouseleave', function () { cover.style.transform = rest; });
    }

    // Ambient "freeway at night" light streaks behind everything —
    // slow warm headlight + red taillight trails, like a long exposure.
    (function ambient(){
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      var c = document.createElement('canvas');
      c.id = 'fxcanvas';
      document.body.insertBefore(c, document.body.firstChild);
      var ctx = c.getContext('2d');
      var W, H, DPR, streaks, running = true;
      function rnd(a,b){ return a + Math.random()*(b-a); }
      function size(){
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = c.width = Math.floor(innerWidth * DPR);
        H = c.height = Math.floor(innerHeight * DPR);
        c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
      }
      function makeStreak(spawnAcross){
        var dir = Math.random() < 0.5 ? 1 : -1;
        var warm = Math.random() < 0.6;                 // headlights vs taillights
        var len = rnd(140, 380) * DPR;
        return {
          x: spawnAcross ? rnd(0, W) : (dir > 0 ? -len : W + len),
          y: rnd(0.06, 0.97) * H,
          vx: rnd(2, 6) * DPR * dir,
          drift: rnd(-0.12, 0.12) * DPR,
          len: len,
          w: rnd(1, 2.6) * DPR,
          a: rnd(0.14, 0.42),
          warm: warm
        };
      }
      function reset(){
        size();
        var n = innerWidth < 760 ? 8 : 15;
        streaks = [];
        for (var i = 0; i < n; i++) streaks.push(makeStreak(true));
      }
      function frame(){
        if (!running) return;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(13,20,32,0.20)';          // navy wash → motion-blur trails
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (var i = 0; i < streaks.length; i++){
          var s = streaks[i];
          s.x += s.vx; s.y += s.drift;
          var tailX = s.x - (s.vx > 0 ? s.len : -s.len);
          var g = ctx.createLinearGradient(s.x, s.y, tailX, s.y);
          var head = s.warm ? '255,234,196' : '255,92,74';
          g.addColorStop(0, 'rgba(' + head + ',' + s.a + ')');
          g.addColorStop(0.5, 'rgba(' + head + ',' + (s.a * 0.22) + ')');
          g.addColorStop(1, 'rgba(' + head + ',0)');
          ctx.strokeStyle = g; ctx.lineWidth = s.w;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tailX, s.y); ctx.stroke();
          if ((s.vx > 0 && s.x - s.len > W) || (s.vx < 0 && s.x + s.len < 0)) streaks[i] = makeStreak(false);
        }
        requestAnimationFrame(frame);
      }
      reset();
      window.addEventListener('resize', reset);
      document.addEventListener('visibilitychange', function(){
        running = !document.hidden;
        if (running) requestAnimationFrame(frame);
      });
      requestAnimationFrame(frame);
    })();

    var els = [].slice.call(document.querySelectorAll('.reveal'));

    // Reveal-on-scroll for below-the-fold content.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.14 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('in'); });
    }

    // Guarantee: anything already on screen at load reveals immediately,
    // even if the observer doesn't fire on first paint.
    var revealInView = function () {
      var vh = window.innerHeight || 800;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.98 && r.bottom > 0) el.classList.add('in');
      });
    };
    requestAnimationFrame(revealInView);
    window.addEventListener('load', revealInView);
    setTimeout(revealInView, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

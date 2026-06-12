// Shared behaviour for all pages
(function () {
  function init() {
    var y = document.getElementById('yr');
    if (y) y.textContent = new Date().getFullYear();

    // Favicon — navy tile with a sand serif S
    if (!document.querySelector('link[rel="icon"]')) {
      var fav = document.createElement('link');
      fav.rel = 'icon';
      fav.type = 'image/svg+xml';
      fav.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230f1826'/%3E%3Ctext x='50%25' y='52%25' dy='.32em' text-anchor='middle' font-family='Georgia,serif' font-weight='600' font-size='40' fill='%23cdbf9e'%3ES%3C/text%3E%3C/svg%3E";
      document.head.appendChild(fav);
    }

    // Header: homepage fades from transparent to solid on scroll.
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
          // Only close for same-page (#) links — hiding a tapped link mid-click
          // cancels navigation on mobile browsers.
          var href = this.getAttribute('href') || '';
          if (href.charAt(0) === '#') {
            hdr.classList.remove('nav-open');
            menuBtn.textContent = '☰';
          }
        });
      }
    }

    // Scroll-progress bar
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

    // Ambient atmosphere — mounted only into a [data-fx] section (homepage hero
    // + book-page top): cinematic "freeway at night" light streaks + visible
    // rain beads on the glass catching the light.
    (function ambient(){
      var host = document.querySelector('[data-fx]');
      if (!host) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      var c = document.createElement('canvas');
      c.className = 'fxc';
      host.insertBefore(c, host.firstChild);
      var ctx = c.getContext('2d');
      var W, H, DPR, streaks, drops, bead, running = true;
      function rnd(a,b){ return a + Math.random()*(b-a); }

      // pre-rendered lit water bead, stamped many times for speed
      function makeBead(){
        var S = 64, o = document.createElement('canvas'); o.width = o.height = S;
        var x = o.getContext('2d'), cx = S/2, cy = S/2, R = S*0.34;
        x.save();
        x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 7; x.shadowOffsetX = 2; x.shadowOffsetY = 3;
        x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fillStyle = 'rgba(18,28,44,0.42)'; x.fill();
        x.restore();
        var rim = x.createRadialGradient(cx-R*0.3, cy-R*0.3, R*0.2, cx, cy, R);
        rim.addColorStop(0.0,'rgba(222,233,246,0)'); rim.addColorStop(0.82,'rgba(222,233,246,0)');
        rim.addColorStop(0.95,'rgba(222,233,246,0.55)'); rim.addColorStop(1,'rgba(222,233,246,0)');
        x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fillStyle = rim; x.fill();
        var inner = x.createRadialGradient(cx, cy, 0, cx, cy, R*0.9);
        inner.addColorStop(0,'rgba(186,206,230,0.16)'); inner.addColorStop(1,'rgba(186,206,230,0)');
        x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fillStyle = inner; x.fill();
        var hx = cx - R*0.32, hy = cy - R*0.4;
        var sp = x.createRadialGradient(hx, hy, 0, hx, hy, R*0.42);
        sp.addColorStop(0,'rgba(255,255,255,0.92)'); sp.addColorStop(1,'rgba(255,255,255,0)');
        x.beginPath(); x.arc(hx, hy, R*0.42, 0, Math.PI*2); x.fillStyle = sp; x.fill();
        return o;
      }
      function size(){
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        var r = host.getBoundingClientRect();
        W = c.width = Math.max(1, Math.floor(r.width * DPR));
        H = c.height = Math.max(1, Math.floor(r.height * DPR));
        c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
      }
      function makeStreak(across){
        var dir = Math.random() < 0.5 ? 1 : -1, warm = Math.random() < 0.6, len = rnd(160, 400) * DPR;
        return { x: across ? rnd(0,W) : (dir>0 ? -len : W+len), y: rnd(0.04,0.96)*H,
          vx: rnd(1.8, 4.6)*DPR*dir, drift: rnd(-0.08,0.08)*DPR, len: len,
          w: rnd(1.2, 2.8)*DPR, a: rnd(0.16, 0.44), warm: warm };
      }
      function makeDrop(top){
        var big = Math.random() < 0.16;
        var sz = (big ? rnd(28,52) : rnd(8,22)) * DPR;
        return { x: rnd(0,W), y: top ? rnd(-0.14,-0.02)*H : rnd(0,H), s: sz,
          vy: (big ? rnd(0.6,1.5) : rnd(0.02,0.13)) * DPR, a: rnd(0.55, big ? 0.95 : 0.85) };
      }
      function reset(){
        size();
        if (!bead) bead = makeBead();
        var ns = innerWidth < 760 ? 5 : 8;
        var nd = innerWidth < 760 ? 26 : 54;
        streaks = []; for (var i=0;i<ns;i++) streaks.push(makeStreak(true));
        drops = []; for (var j=0;j<nd;j++) drops.push(makeDrop(false));
      }
      function frame(){
        if (!running) return;
        // soft trail wash
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(13,20,32,0.15)';
        ctx.fillRect(0,0,W,H);
        // freeway light streaks (additive glow)
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (var i=0;i<streaks.length;i++){
          var s = streaks[i]; s.x += s.vx; s.y += s.drift;
          var tx = s.x - (s.vx>0 ? s.len : -s.len);
          var g = ctx.createLinearGradient(s.x, s.y, tx, s.y);
          var h = s.warm ? '255,232,194' : '255,96,80';
          g.addColorStop(0,'rgba('+h+','+s.a+')'); g.addColorStop(0.5,'rgba('+h+','+(s.a*0.2)+')'); g.addColorStop(1,'rgba('+h+',0)');
          ctx.strokeStyle = g; ctx.lineWidth = s.w;
          ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(tx,s.y); ctx.stroke();
          if ((s.vx>0 && s.x-s.len>W) || (s.vx<0 && s.x+s.len<0)) streaks[i] = makeStreak(false);
        }
        // rain beads on the glass
        ctx.globalCompositeOperation = 'source-over';
        for (var k=0;k<drops.length;k++){
          var d = drops[k]; d.y += d.vy;
          ctx.globalAlpha = d.a;
          ctx.drawImage(bead, d.x - d.s/2, d.y - d.s/2, d.s, d.s);
          if (d.y - d.s > H) drops[k] = makeDrop(true);
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
      }
      reset();
      window.addEventListener('resize', reset);
      document.addEventListener('visibilitychange', function(){ running = !document.hidden; if (running) requestAnimationFrame(frame); });
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

    // Guarantee: anything already on screen at load reveals immediately.
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

// Shared behaviour for all pages
(function () {
  function init() {
    var y = document.getElementById('yr');
    if (y) y.textContent = new Date().getFullYear();

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

/*
 * First paint before the app loads (LCP): index.html ships the home header and title in English;
 * this tiny script runs right after them and switches them to the visitor's language, the same way
 * src/i18n.ts picks it (link ?lang=, then the saved choice, then the browser). Off the home route
 * the title is removed, so a shared result never flashes the home title. A plain same-origin file:
 * the CSP allows no inline scripts. test/pre.test.ts keeps the strings in step with i18n.
 */
/* global location, localStorage */
(function () {
  try {
    var m = /[?&]lang=(nl|en|de)\b/.exec(location.hash);
    var l = m ? m[1] : null;
    if (!l) {
      try {
        l = localStorage.getItem('df_lang');
      } catch {
        l = null;
      }
    }
    if (l !== 'nl' && l !== 'en' && l !== 'de') {
      var n = (navigator.language || '').toLowerCase();
      l = n.indexOf('nl') === 0 ? 'nl' : n.indexOf('de') === 0 ? 'de' : 'en';
    }
    var T = {
      nl: { h1: 'Vind darts die echt lekker in je hand liggen', me: 'Mijn fits', skip: 'Naar de inhoud' },
      de: { h1: 'Finde Darts, die richtig gut in deiner Hand liegen', me: 'Meine Fits', skip: 'Zum Inhalt' },
    };
    document.documentElement.lang = l;
    var home = /^(#\/?)?(\?.*)?$/.test(location.hash);
    var hero = document.getElementById('pre-hero');
    if (!home && hero) hero.parentNode.removeChild(hero);
    var h1 = document.getElementById('pre-h1');
    // Show the title once Geist is in (preloaded), so it paints once at its final size: a fallback-font
    // paint followed by a slightly larger Geist one would make the later paint the LCP.
    if (h1) {
      var shown = false;
      var show = function () {
        if (shown) return;
        shown = true;
        h1.className = 'ready';
      };
      setTimeout(show, 1200);
      if (document.fonts && document.fonts.load) document.fonts.load('650 40px "Geist Variable"').then(show, show);
      else show();
    }
    var t = T[l];
    if (!t) return;
    if (h1) h1.textContent = t.h1;
    var me = document.getElementById('pre-me');
    if (me) me.textContent = t.me;
    var skip = document.querySelector('.skip');
    if (skip) skip.textContent = t.skip;
  } catch {
    /* the app takes over anyway */
  }
})();

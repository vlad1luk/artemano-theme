/*
  Artemano — couche prestige : apparition lente des blocs au défilement
  et citation du manifeste révélée mot à mot.
  Rien n'est caché si le script ne tourne pas, si le visiteur a demandé moins
  de mouvement, ou dans l'éditeur de thème.
*/
(function () {
  if (window.ArtemanoLuxe) return;
  window.ArtemanoLuxe = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var design = window.Shopify && window.Shopify.designMode;
  if (reduce || design || !('IntersectionObserver' in window)) return;

  var TARGETS = [
    '.artemano-pillars__header',
    '.artemano-pillars__item',
    '.artemano-split__media',
    '.artemano-split__text',
    '.artemano-mosaic__tile',
    '.artemano-rooms__tile',
    '.artemano-guarantees__item',
    '.artemano-reviews__item',
    '.artemano-store__info',
    '.artemano-store__map',
    '.artemano-signature__card',
    '.artemano-band__text',
    '.artemano-products__header',
    '.artemano-products__grid > *',
    '.artemano-manifesto__mark',
    '.artemano-manifesto__eyebrow',
    '.artemano-manifesto__signature',
    '.artemano-manifesto__link',
    '.artemano-section-title'
  ].join(',');

  var STAGGER = 90;
  var MAX_DELAY = 450;

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0;
  }

  function cleanup(el) {
    el.classList.remove('lx-reveal', 'lx-in');
    el.style.removeProperty('--lx-delay');
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add('lx-in');
        if (el.classList.contains('lx-reveal')) {
          var delay = parseInt(el.style.getPropertyValue('--lx-delay'), 10) || 0;
          setTimeout(function () { cleanup(el); }, 1400 + delay);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );

  function prepare(root) {
    var nodes = (root || document).querySelectorAll(TARGETS);
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.dataset.lx || el.closest('.artemano-tl, .artemano-popup, [data-lx-skip]')) return;
      if (el.parentElement && el.parentElement.closest('[data-lx]')) return; // déjà animé par un parent
      el.dataset.lx = '1';
      if (inView(el)) return;

      // Décalage selon la position parmi les frères qui apparaissent ensemble
      var index = 0;
      var sib = el.previousElementSibling;
      while (sib) {
        if (sib.dataset && sib.dataset.lx) index++;
        sib = sib.previousElementSibling;
      }
      el.style.setProperty('--lx-delay', Math.min(index * STAGGER, MAX_DELAY) + 'ms');
      el.classList.add('lx-reveal');
      observer.observe(el);
    });

    var quotes = (root || document).querySelectorAll('[data-lx-words]');
    Array.prototype.forEach.call(quotes, function (q) {
      if (q.dataset.lxWordsReady) return;
      q.dataset.lxWordsReady = '1';
      if (inView(q)) return;
      var i = 0;
      var walker = document.createTreeWalker(q, NodeFilter.SHOW_TEXT, null);
      var texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.forEach(function (node) {
        var parts = node.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var span = document.createElement('span');
            span.className = 'lx-w';
            span.style.setProperty('--w', i++);
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      });
      q.classList.add('lx-words');
      observer.observe(q);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { prepare(); });
  } else {
    prepare();
  }

  // Sections chargées plus tard (filtres de collection, etc.)
  document.addEventListener('shopify:section:load', function (e) { prepare(e.target); });
})();

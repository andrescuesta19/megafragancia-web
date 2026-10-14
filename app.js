/* ==========================================================
   Mega Fragancia — Lógica de la app v3
   - Carrito con persistencia (localStorage)
   - Buscador de productos
   - Modal de detalle de producto
   - Botón flotante de WhatsApp
   - Panel admin completo: promo, productos (CRUD), textos
   - SVG construido con createElementNS (sin innerHTML inseguro)
   ========================================================== */

(function () {
  'use strict';

  // ---------- Configuración ----------
  var WHATSAPP = '573106399810';
  var COMBO_PRECIO_DEFAULT = 300000;
  var DATA_URL = 'data.json';

  // ---------- GitHub sync ----------
  // El admin guarda los cambios en data.json que está en el repo.
  // Esto se hace con la GitHub API directamente desde el navegador.
  // Ver SETUP-GITHUB-TOKEN.md para instrucciones.
  var GITHUB_REPO = 'andrescuesta19/megafragancia-web';
  var GITHUB_BRANCH = 'main';
  var GITHUB_TOKEN = ''; // Pegar aquí el Personal Access Token, o ingresarlo desde el admin

  function getToken() {
    if (GITHUB_TOKEN) return Promise.resolve(GITHUB_TOKEN);
    return Promise.resolve(loadJSON('mf_github_token', '') || '');
  }

  function saveTokenToLocal(t) {
    if (!t) {
      try { localStorage.removeItem('mf_github_token'); } catch (e) {}
    } else {
      saveJSON('mf_github_token', t);
    }
  }

  // ---------- Helpers de almacenamiento local ----------
  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var p = JSON.parse(raw);
      return p == null ? fallback : p;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // ---------- Helpers de almacenamiento local ----------
  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var p = JSON.parse(raw);
      return p == null ? fallback : p;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // ---------- Defaults (usados como fallback si falla la carga de data.json) ----------
  var PROMO_DEFAULT = {
    activo: true,
    titulo: '2× $300.000',
    subtitulo: 'Combo de octubre',
    vigencia: 'Cantidad limitada',
    precio: 300000
  };
  var SITE_DEFAULT = {
    hero_h1: 'Perfumes árabes<br>y de nicho · <em>100% originales</em>',
    hero_lead: 'Elige tus fragancias, arma tu combo y paga solo cuando lo recibes. Trabajamos directamente con proveedores autorizados y entregamos factura de cada pedido.',
    nosotros_texto: 'Mega Fragancia es un emprendimiento colombiano dedicado a la curaduría de perfumes árabes y de nicho. Seleccionamos cada fragancia con proveedores autorizados y la probamos antes de ofrecerla, porque sabemos que un buen perfume es una decisión personal.\n\nEstamos en Turbo, Antioquia y enviamos a todo el país. Si quieres conocer la procedencia exacta de cualquier producto, te la mostramos: factura, lote y video del empaque.',
    instagram: 'https://www.instagram.com/mega.fragancia7/'
  };
  var PRODUCTOS_DEFAULT = [
    { n: 'Ámbar Real', t: 'Unisex', h: 38, img: '', desc: 'Cálido, especiado y envolvente. Ideal para noches frescas.', a: ['Cardamomo', 'Bergamota'], b: ['Ámbar', 'Rosa'], c: ['Vainilla', 'Pachulí'] },
    { n: 'Oud Nocturno', t: 'Hombre', h: 260, img: '', desc: 'Profundo, ahumado y elegante. Un clásico de la perfumería árabe.', a: ['Azafrán', 'Pimienta'], b: ['Oud', 'Cuero'], c: ['Sándalo', 'Almizcle'] },
    { n: 'Rosa del Desierto', t: 'Mujer', h: 340, img: '', desc: 'Floral, dulce y sofisticado. Para quien deja huella.', a: ['Frambuesa', 'Litchi'], b: ['Rosa damascena', 'Peonía'], c: ['Almizcle', 'Ámbar'] },
    { n: 'Noche de Dátil', t: 'Unisex', h: 28, img: '', desc: 'Gourmand, oriental y memorable. Perfecto para regalar.', a: ['Dátil', 'Canela'], b: ['Haba tonka', 'Café'], c: ['Vainilla', 'Madera'] },
    { n: 'Atlas Fresco', t: 'Hombre', h: 200, img: '', desc: 'Aromático, limpio y versátil. Para el día a día.', a: ['Limón', 'Menta'], b: ['Lavanda', 'Salvia'], c: ['Vetiver', 'Cedro'] },
    { n: 'Jazmín Dorado', t: 'Mujer', h: 48, img: '', desc: 'Floral blanco, solar y sofisticado. Elegancia en cada nota.', a: ['Mandarina', 'Pera'], b: ['Jazmín', 'Azahar'], c: ['Sándalo', 'Vainilla'] }
  ];

  // ---------- Estado cargado de data.json ----------
  var promo = Object.assign({}, PROMO_DEFAULT);
  var site = Object.assign({}, SITE_DEFAULT);
  var DATA = PRODUCTOS_DEFAULT.slice();

  function sanitizeProduct(p) {
    if (!p || typeof p !== 'object') return null;
    var n = typeof p.n === 'string' ? p.n.slice(0, 60).trim() : '';
    if (!n) return null;
    return {
      n: n,
      t: ['Hombre', 'Mujer', 'Unisex'].indexOf(p.t) >= 0 ? p.t : 'Unisex',
      h: Number.isFinite(Number(p.h)) ? Math.max(0, Math.min(360, Number(p.h))) : 38,
      desc: typeof p.desc === 'string' ? p.desc.slice(0, 200) : '',
      a: Array.isArray(p.a) ? p.a.slice(0, 6).map(String) : [],
      b: Array.isArray(p.b) ? p.b.slice(0, 6).map(String) : [],
      c: Array.isArray(p.c) ? p.c.slice(0, 6).map(String) : [],
      img: typeof p.img === 'string' ? p.img.slice(0, 500) : ''
    };
  }

  function applyRemoteData(d) {
    if (!d || typeof d !== 'object') return;
    if (d.promo && typeof d.promo === 'object') {
      promo = {
        activo: Boolean(d.promo.activo),
        titulo: typeof d.promo.titulo === 'string' ? d.promo.titulo.slice(0, 40) : PROMO_DEFAULT.titulo,
        subtitulo: typeof d.promo.subtitulo === 'string' ? d.promo.subtitulo.slice(0, 60) : PROMO_DEFAULT.subtitulo,
        vigencia: typeof d.promo.vigencia === 'string' ? d.promo.vigencia.slice(0, 60) : PROMO_DEFAULT.vigencia,
        precio: Number.isFinite(Number(d.promo.precio)) && Number(d.promo.precio) > 0 ? Number(d.promo.precio) : PROMO_DEFAULT.precio
      };
    }
    if (d.site && typeof d.site === 'object') {
      site = Object.assign({}, SITE_DEFAULT, d.site);
    }
    if (Array.isArray(d.productos) && d.productos.length) {
      var arr = [];
      d.productos.forEach(function (p) {
        var s = sanitizeProduct(p);
        if (s) arr.push(s);
      });
      if (arr.length) DATA = arr;
    }
  }

  // Si el admin ya editó en este navegador, sus cambios están en localStorage.
  // El admin guarda en localStorage Y en data.json (cuando hay backend).
  // Aquí priorizamos los cambios locales del admin sobre el data.json remoto.
  function applyLocalOverrides() {
    var localPromo = loadJSON('mf_promo', null);
    if (localPromo && typeof localPromo === 'object') {
      promo = {
        activo: Boolean(localPromo.activo),
        titulo: typeof localPromo.titulo === 'string' ? localPromo.titulo.slice(0, 40) : PROMO_DEFAULT.titulo,
        subtitulo: typeof localPromo.subtitulo === 'string' ? localPromo.subtitulo.slice(0, 60) : PROMO_DEFAULT.subtitulo,
        vigencia: typeof localPromo.vigencia === 'string' ? localPromo.vigencia.slice(0, 60) : PROMO_DEFAULT.vigencia,
        precio: Number.isFinite(Number(localPromo.precio)) && Number(localPromo.precio) > 0 ? Number(localPromo.precio) : PROMO_DEFAULT.precio
      };
    }
    var localSite = loadJSON('mf_site', null);
    if (localSite && typeof localSite === 'object') {
      site = Object.assign({}, SITE_DEFAULT, localSite);
    }
    var localProducts = loadJSON('mf_products', null);
    if (Array.isArray(localProducts) && localProducts.length) {
      var arr = [];
      localProducts.forEach(function (p) {
        var s = sanitizeProduct(p);
        if (s) arr.push(s);
      });
      if (arr.length) DATA = arr;
    }
  }

  // Carga data.json al iniciar. Si falla, usa defaults.
  function loadRemote() {
    return fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { applyRemoteData(d); return true; })
      .catch(function (e) {
        console.warn('No se pudo cargar data.json, usando defaults:', e.message);
        return false;
      });
  }

  // Carrito (sigue siendo local — el carrito de un visitante no debe compartirse entre dispositivos)
  var cart = (function () {
    var c = loadJSON('mf_cart', {});
    if (!c || typeof c !== 'object') return {};
    var out = {};
    Object.keys(c).forEach(function (k) {
      var v = Number(c[k]);
      if (Number.isInteger(v) && v > 0 && v <= 20 && typeof k === 'string' && k.length < 80) {
        out[k] = v;
      }
    });
    return out;
  })();
  function saveCart() { saveJSON('mf_cart', cart); }

  // ---------- Estado UI ----------
  var active = 'Todos';
  var search = '';
  var COMBO_PRECIO = promo.precio || COMBO_PRECIO_DEFAULT;
  var editingProduct = null;
  var productToOpen = null;

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function fmt(n) { return '$' + Number(n).toLocaleString('es-CO'); }
  function sanitizeLine(s, max) {
    var cleaned = String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim();
    if (max && cleaned.length > max) cleaned = cleaned.slice(0, max);
    return cleaned;
  }
  function isValidWhatsApp(num) { return /^\d{10,15}$/.test(num); }

  // SVG seguro de frasco
  function buildBottleSVG(hue) {
    var h = Math.floor(Number(hue));
    if (!Number.isFinite(h) || h < 0 || h > 360) h = 38;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 180');
    svg.setAttribute('width', '120'); svg.setAttribute('height', '180');
    svg.setAttribute('aria-hidden', 'true');
    var defs = document.createElementNS(NS, 'defs');
    var grad = document.createElementNS(NS, 'linearGradient');
    var gradId = 'g' + h + '-' + Math.random().toString(36).slice(2, 8);
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '1'); grad.setAttribute('y2', '1');
    var stop1 = document.createElementNS(NS, 'stop');
    stop1.setAttribute('offset', '0'); stop1.setAttribute('stop-color', 'hsl(' + h + ', 35%, 60%)');
    var stop2 = document.createElementNS(NS, 'stop');
    stop2.setAttribute('offset', '1'); stop2.setAttribute('stop-color', 'hsl(' + h + ', 28%, 35%)');
    grad.appendChild(stop1); grad.appendChild(stop2);
    defs.appendChild(grad); svg.appendChild(defs);
    var cap = document.createElementNS(NS, 'rect');
    cap.setAttribute('x', '46'); cap.setAttribute('y', '6');
    cap.setAttribute('width', '28'); cap.setAttribute('height', '22');
    cap.setAttribute('rx', '5'); cap.setAttribute('fill', '#3a2c1e');
    svg.appendChild(cap);
    var neck = document.createElementNS(NS, 'rect');
    neck.setAttribute('x', '52'); neck.setAttribute('y', '28');
    neck.setAttribute('width', '16'); neck.setAttribute('height', '14');
    neck.setAttribute('fill', '#7a5a3a');
    svg.appendChild(neck);
    var body = document.createElementNS(NS, 'rect');
    body.setAttribute('x', '18'); body.setAttribute('y', '42');
    body.setAttribute('width', '84'); body.setAttribute('height', '128');
    body.setAttribute('rx', '18'); body.setAttribute('fill', 'url(#' + gradId + ')');
    svg.appendChild(body);
    var shine = document.createElementNS(NS, 'rect');
    shine.setAttribute('x', '28'); shine.setAttribute('y', '56');
    shine.setAttribute('width', '12'); shine.setAttribute('height', '100');
    shine.setAttribute('rx', '6'); shine.setAttribute('fill', '#fff');
    shine.setAttribute('opacity', '0.18');
    svg.appendChild(shine);
    return svg;
  }

  // ---------- Render promo ----------
  function renderPromo() {
    var elTitulo = $('promo-titulo');
    if (!elTitulo) return;
    if (promo.activo) {
      elTitulo.textContent = promo.titulo;
      var elSub = $('promo-subtitulo');
      if (elSub) {
        elSub.textContent = '';
        var parts = sanitizeLine(promo.subtitulo, 60).split('\n');
        parts.forEach(function (p, i) {
          elSub.appendChild(document.createTextNode(p));
          if (i < parts.length - 1) elSub.appendChild(document.createElement('br'));
        });
      }
      var elVig = $('promo-vigencia');
      if (elVig) elVig.textContent = promo.vigencia;
      var elEyebrow = $('promo-eyebrow');
      if (elEyebrow) {
        var lastWord = sanitizeLine(promo.subtitulo, 60).split(' ').pop() || 'octubre';
        elEyebrow.textContent = 'Colección de ' + lastWord + ' · Envíos a toda Colombia';
      }
    } else {
      var block = $('promo-block');
      if (block) block.style.display = 'none';
    }
    if (Number.isFinite(promo.precio) && promo.precio > 0) {
      COMBO_PRECIO = promo.precio;
    }
  }

  // ---------- Render textos del sitio ----------
  // Helper: convierte un string con HTML simple (<br>, <em>, <strong>) a HTML seguro.
  function safeHTML(s) {
    if (!s) return '';
    // Escapamos TODO primero
    var esc = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Permitimos solo <br>, <br/>, <em>, </em>, <strong>, </strong>
    return esc
      .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
      .replace(/&lt;em&gt;/gi, '<em>').replace(/&lt;\/em&gt;/gi, '</em>')
      .replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>');
  }

  function renderSite() {
    var h1 = document.querySelector('.hero-text h1');
    if (h1 && site.hero_h1) h1.innerHTML = safeHTML(site.hero_h1);
    var lead = document.querySelector('.hero-text .lead');
    if (lead && site.hero_lead) lead.textContent = sanitizeLine(site.hero_lead, 500);
    var nosText = document.querySelector('.nos-text');
    if (nosText && site.nosotros_texto) {
      var existingPs = nosText.querySelectorAll('p:not(.eyebrow):not(.nos-dev)');
      var newP = document.createElement('p');
      newP.textContent = sanitizeLine(site.nosotros_texto, 1000);
      if (existingPs[0]) existingPs[0].parentNode.replaceChild(newP, existingPs[0]);
      if (existingPs[1]) existingPs[1].remove();
    }
  }

  // ---------- Render catálogo ----------
  function renderFilters() {
    var fbox = $('filters');
    fbox.textContent = '';
    FILTERS.forEach(function (f) {
      var b = el('button', 'chip', f);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(f === active));
      b.setAttribute('aria-controls', 'grid');
      b.addEventListener('click', function () {
        active = f;
        renderFilters();
        renderGrid();
      });
      fbox.appendChild(b);
    });
  }

  function renderGrid() {
    var grid = $('grid');
    var empty = $('empty');
    grid.textContent = '';

    var q = sanitizeLine(search, 40).toLowerCase();
    var visible = DATA.filter(function (p) {
      if (active !== 'Todos' && p.t !== active) return false;
      if (q && p.n.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    if (!visible.length) { empty.hidden = false; return; }
    empty.hidden = true;

    visible.forEach(function (p, idx) {
      var card = el('article', 'card reveal in');
      card.setAttribute('aria-label', p.n + ', ' + p.t);
      card.dataset.idx = String(DATA.indexOf(p));

      // Imagen
      var wrap = el('div', 'bottle-wrap');
      var tagRow = el('div', 'tag-row');
      var tagCat = el('span', 'tag cat-' + p.t.toLowerCase(), p.t);
      var tagCom = el('span', 'tag combo-badge', 'Combo');
      tagRow.appendChild(tagCat);
      tagRow.appendChild(tagCom);
      wrap.appendChild(tagRow);

      if (p.img) {
        var img = document.createElement('img');
        img.src = p.img;
        img.alt = p.n;
        img.loading = 'lazy';
        img.onerror = function () { this.parentNode.replaceChild(buildBottleSVG(p.h), this); };
        wrap.appendChild(img);
      } else {
        wrap.appendChild(buildBottleSVG(p.h));
      }
      card.appendChild(wrap);

      // Body
      var body = el('div', 'body');
      body.appendChild(el('h3', '', p.n));
      body.appendChild(el('p', 'desc', p.desc || 'Fragancia de la colección de la temporada.'));
      var price = el('div', 'price', fmt(Math.floor(COMBO_PRECIO / 2)) + ' c/u');
      var small = el('small', '', 'o 2× ' + fmt(COMBO_PRECIO) + ' en combo');
      price.appendChild(small);
      body.appendChild(price);

      var row = el('div', 'row');
      var qty = cart[p.n] || 0;
      var pb = el('button', 'pick', qty ? ('En carrito (' + qty + ') +') : 'Añadir al carrito');
      if (qty) pb.classList.add('added');
      pb.type = 'button';
      pb.setAttribute('aria-pressed', String(qty > 0));
      pb.addEventListener('click', function (e) {
        e.stopPropagation();
        change(p.n, 1);
      });
      row.appendChild(pb);
      body.appendChild(row);
      card.appendChild(body);
      grid.appendChild(card);

      // Click en la card abre detalle (excepto botones)
      card.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        openProductDetail(p);
      });
    });
  }

  // ---------- Carrito ----------
  function change(name, d) {
    var safe = sanitizeLine(name, 80);
    var q = (cart[safe] || 0) + d;
    if (q <= 0) delete cart[safe];
    else cart[safe] = Math.min(q, 20);
    saveCart();
    renderGrid();
    renderCart();
  }
  function units() { var t = 0; Object.keys(cart).forEach(function (k) { t += cart[k]; }); return t; }

  function renderCart() {
    var cc = $('cc');
    var clist = $('clist');
    var csum = $('csum');
    var chint = $('chint');
    var wa = $('wa');
    var obar = $('orderbar');
    var oCount = $('obar-count');
    var oSub = $('obar-sub');
    var oBtn = $('obar-btn');

    // Purga huérfanos
    var validNames = {};
    DATA.forEach(function (p) { validNames[p.n] = p; });
    var changed = false;
    Object.keys(cart).forEach(function (k) {
      if (!(k in validNames)) { delete cart[k]; changed = true; }
    });
    if (changed) saveCart();

    var u = units();
    var combos = Math.floor(u / 2);
    var rem = u % 2;
    cc.textContent = u;
    oCount.textContent = u + (u === 1 ? ' fragancia' : ' fragancias');
    oSub.textContent = rem
      ? ('Te falta 1 para completar otro combo · ' + combos + (combos === 1 ? ' combo' : ' combos') + ' activo' + (combos === 1 ? '' : 's'))
      : (combos ? combos + (combos === 1 ? ' combo' : ' combos') + ' × ' + fmt(COMBO_PRECIO) + ' = ' + fmt(combos * COMBO_PRECIO) : 'Agrega 2 fragancias para activar el combo 2×' + fmt(COMBO_PRECIO));

    clist.textContent = '';
    var names = Object.keys(cart);
    if (!names.length) {
      clist.appendChild(el('p', 'empty-msg', 'Tu carrito está vacío. Agrega fragancias desde el catálogo.'));
    } else {
      names.forEach(function (n) {
        var r = el('div', 'crow');
        var left = el('div', 'name');
        var mini = el('div', 'mini');
        var product = validNames[n];
        if (product) {
          if (product.img) {
            var img = document.createElement('img');
            img.src = product.img;
            img.alt = '';
            img.onerror = function () { this.style.display = 'none'; };
            mini.appendChild(img);
          } else {
            mini.style.background = 'linear-gradient(160deg, hsl(' + product.h + ', 35%, 70%) 0%, hsl(' + product.h + ', 28%, 45%) 100%)';
          }
        }
        left.appendChild(mini);
        left.appendChild(el('span', '', n));
        r.appendChild(left);

        var q = el('div', 'q');
        var m = el('button', '', '−');
        m.type = 'button';
        m.setAttribute('aria-label', 'Quitar una unidad de ' + n);
        m.addEventListener('click', function () { change(n, -1); });
        var c = el('span', 'num', String(cart[n]));
        var pl = el('button', '', '+');
        pl.type = 'button';
        pl.setAttribute('aria-label', 'Añadir una unidad de ' + n);
        pl.addEventListener('click', function () { change(n, 1); });
        q.appendChild(m); q.appendChild(c); q.appendChild(pl);
        r.appendChild(q);
        clist.appendChild(r);
      });
    }

    csum.textContent = combos ? (combos + (combos === 1 ? ' combo' : ' combos') + ' × ' + fmt(COMBO_PRECIO) + ' = ' + fmt(combos * COMBO_PRECIO)) : '';
    chint.textContent = rem ? 'Te falta 1 fragancia para completar otro combo. El precio de fragancia suelta lo confirma el negocio por WhatsApp.' : '';

    // Link de WhatsApp
    if (isValidWhatsApp(WHATSAPP)) {
      var lines = names.map(function (n) { return '- ' + cart[n] + ' x ' + sanitizeLine(n, 60); }).join('\n');
      var msg = 'Hola, Mega Fragancia 👋\nQuiero hacer este pedido:\n' + (lines || '(sin productos)') +
        (combos ? '\n\nCombos 2×' + fmt(COMBO_PRECIO) + ': ' + combos : '') +
        '\n\n¿Confirman disponibilidad, envío y forma de pago?';
      if (msg.length > 800) msg = msg.slice(0, 790) + '...';
      wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      wa.removeAttribute('aria-disabled');
    } else {
      wa.removeAttribute('href');
      wa.setAttribute('aria-disabled', 'true');
    }
    oBtn.setAttribute('aria-disabled', u ? 'false' : 'true');
    if (u > 0) obar.classList.add('on'); else obar.classList.remove('on');
  }

  // ---------- Modal de detalle de producto ----------
  function openProductDetail(p) {
    productToOpen = p;
    var dp = $('dproduct');
    if (!dp) return;
    $('dp-title').textContent = p.n;

    var content = $('dp-content');
    content.textContent = '';

    var imgWrap = el('div', 'pd-image');
    if (p.img) {
      var img = document.createElement('img');
      img.src = p.img;
      img.alt = p.n;
      img.onerror = function () { this.parentNode.replaceChild(buildBottleSVG(p.h), this); };
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(buildBottleSVG(p.h));
    }
    content.appendChild(imgWrap);

    var info = el('div', 'pd-info');
    var h4 = el('h4', '', p.t);
    info.appendChild(h4);
    var h2 = el('h2', '', p.n);
    info.appendChild(h2);
    var price = el('div', 'price', fmt(Math.floor(COMBO_PRECIO / 2)) + ' c/u');
    var small = el('small', '', 'o 2× ' + fmt(COMBO_PRECIO) + ' en combo');
    price.appendChild(small);
    info.appendChild(price);
    var desc = el('p', 'desc', p.desc || 'Fragancia de la colección de la temporada.');
    info.appendChild(desc);
    content.appendChild(info);

    $('dp-n1').textContent = (p.a || []).join(', ') || '—';
    $('dp-n2').textContent = (p.b || []).join(', ') || '—';
    $('dp-n3').textContent = (p.c || []).join(', ') || '—';

    var addBtn = $('dp-add');
    addBtn.textContent = cart[p.n] ? 'Añadir otra unidad' : 'Añadir al carrito';

    if (typeof dp.showModal === 'function') dp.showModal();
  }

  $('dp-add').addEventListener('click', function () {
    if (productToOpen) change(productToOpen.n, 1);
    var dp = $('dproduct');
    if (dp && typeof dp.close === 'function') dp.close();
  });

  // ---------- Botón flotante de WhatsApp ----------
  function renderWAFAB() {
    var fab = $('wa-fab');
    if (!fab) return;
    if (isValidWhatsApp(WHATSAPP)) {
      var msg = 'Hola, Mega Fragancia. Quiero información sobre sus perfumes.';
      fab.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      fab.removeAttribute('aria-disabled');
    } else {
      fab.removeAttribute('href');
    }
  }
  renderWAFAB();

  // ---------- Hero WhatsApp + nosotros WhatsApp ----------
  var heroWa = $('hero-wa');
  if (heroWa && isValidWhatsApp(WHATSAPP)) {
    heroWa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, Mega Fragancia. Quiero información sobre sus perfumes.');
  }
  var nosotrosWa = $('nosotros-wa');
  if (nosotrosWa && isValidWhatsApp(WHATSAPP)) {
    nosotrosWa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, Mega Fragancia. Quiero más información.');
  }

  // ---------- Buscador ----------
  var searchInput = $('search');
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      search = e.target.value;
      renderGrid();
    });
  }

  // ---------- Carrito: abrir/cerrar ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#wa, #obar-btn');
    if (!t) return;
    if (t.getAttribute('aria-disabled') === 'true') e.preventDefault();
    if (t.id === 'obar-btn') {
      var d = $('dcart');
      if (d && typeof d.showModal === 'function') d.showModal();
    }
  });

  $('cartbtn').addEventListener('click', function () {
    var d = $('dcart');
    if (d && typeof d.showModal === 'function') d.showModal();
  });

  // Cerrar dialogs (botón X, backdrop, ESC)
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.closest('dialog');
      if (d && typeof d.close === 'function') d.close();
    });
  });
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d && typeof d.close === 'function') d.close();
    });
  });

  // Botón "lnk" en el footer abre dialogs
  document.querySelectorAll('[data-dlg]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-dlg');
      var d = document.getElementById(id);
      if (d && typeof d.showModal === 'function') d.showModal();
    });
  });

  // ---------- Sticky header ----------
  var hdr = $('hdr');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Reveal animation ----------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal:not(.in)').forEach(function (n) { io.observe(n); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('in'); });
  }

  // ---------- Año dinámico ----------
  var y = $('year');
  if (y) y.textContent = new Date().getFullYear();

  // ============================================================
  //                    PANEL DE ADMINISTRACIÓN
  // ============================================================

  function simpleHash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h = h & 0x7fffffff; }
    return h.toString(36);
  }
  var EXPECTED_PASS_HASH = simpleHash('mega2026');

  function checkPass(input) { return simpleHash(input) === EXPECTED_PASS_HASH; }

  var dadmin = $('dadmin');
  var adminBtn = $('adminbtn');

  if (adminBtn && dadmin) {
    adminBtn.addEventListener('click', function () {
      if (sessionStorage.getItem('mf_admin_ok') === '1') {
        showAdminPanel();
      } else {
        showAdminLogin();
      }
      if (typeof dadmin.showModal === 'function') dadmin.showModal();
    });

    // Login
    var adminForm = $('admin-form');
    if (adminForm) {
      adminForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var pass = $('admin-pass').value;
        if (checkPass(pass)) {
          sessionStorage.setItem('mf_admin_ok', '1');
          showAdminPanel();
          $('admin-pass').value = '';
          $('admin-error').hidden = true;
        } else {
          $('admin-error').hidden = false;
        }
      });
    }

    // Tabs
    document.querySelectorAll('.admin-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(function (t) { t.setAttribute('aria-pressed', String(t === tab)); });
        document.querySelectorAll('.admin-tab-panel').forEach(function (p) {
          p.classList.toggle('on', p.dataset.panel === target);
        });
      });
    });

    // Promo
    $('apromo-save').addEventListener('click', function () {
      promo = {
        activo: $('apromo-activo').checked,
        titulo: sanitizeLine($('apromo-titulo').value, 40) || PROMO_DEFAULT.titulo,
        subtitulo: sanitizeLine($('apromo-subtitulo').value, 60) || PROMO_DEFAULT.subtitulo,
        vigencia: sanitizeLine($('apromo-vigencia').value, 60) || PROMO_DEFAULT.vigencia,
        precio: (function () { var n = Number($('apromo-precio').value); return Number.isFinite(n) && n > 0 ? n : PROMO_DEFAULT.precio; })()
      };
      renderPromo();
      renderGrid();
      renderCart();
      showExportFeedback('apromo-feedback', '⏳ Guardando y sincronizando...');
      saveAndSync('mf_promo', promo, 'Update promo from admin').then(function (r) {
        if (r.ok) showExportFeedback('apromo-feedback', '✓ Guardado y sincronizado');
        else if (r.error === 'no_token') showExportFeedback('apromo-feedback', '⚠ Guardado local. Configura el token de GitHub para sincronizar.');
        else showExportFeedback('apromo-feedback', '⚠ Guardado local. Error al sincronizar: ' + r.error);
      });
    });

    $('apromo-reset').addEventListener('click', function () {
      if (confirm('¿Restablecer la promoción a los valores por defecto?')) {
        promo = Object.assign({}, PROMO_DEFAULT);
        renderPromo();
        renderGrid();
        renderCart();
        fillPromoForm();
        showExportFeedback('apromo-feedback', '⏳ Sincronizando...');
        saveAndSync('mf_promo', promo, 'Reset promo').then(function (r) {
          if (r.ok) showExportFeedback('apromo-feedback', '✓ Restablecido y sincronizado');
          else showExportFeedback('apromo-feedback', '⚠ Restablecido local. ' + (r.error || ''));
        });
      }
    });

    // Productos — agregar
    var npFile = $('np-file');
    var npPreview = $('np-preview');
    var npImageData = '';

    if (npFile) {
      npFile.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
          alert('La imagen es demasiado grande. Máximo 8MB.');
          return;
        }
        var reader = new FileReader();
        reader.onload = function (ev) {
          npImageData = ev.target.result;
          npPreview.textContent = '';
          var img = document.createElement('img');
          img.src = npImageData;
          npPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }

    $('np-save').addEventListener('click', function () {
      var nombre = sanitizeLine($('np-nombre').value, 60);
      if (!nombre) { alert('Ingresa un nombre para el producto.'); return; }
      var newP = {
        n: nombre,
        t: $('np-tipo').value,
        h: Math.floor(Math.random() * 360),
        desc: sanitizeLine($('np-desc').value, 200),
        a: sanitizeLine($('np-salida').value, 100).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
        b: sanitizeLine($('np-corazon').value, 100).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
        c: sanitizeLine($('np-fondo').value, 100).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
        img: npImageData
      };
      DATA.push(newP);
      renderGrid();
      renderProductsList();
      $('np-nombre').value = '';
      $('np-desc').value = '';
      $('np-salida').value = '';
      $('np-corazon').value = '';
      $('np-fondo').value = '';
      npImageData = '';
      npPreview.textContent = 'Sin imagen';
      showExportFeedback('np-feedback', '⏳ Guardando y sincronizando...');
      saveAndSync('mf_products', DATA, 'Add product: ' + newP.n).then(function (r) {
        if (r.ok) showExportFeedback('np-feedback', '✓ Producto guardado y sincronizado');
        else if (r.error === 'no_token') showExportFeedback('np-feedback', '⚠ Guardado local. Configura el token para sincronizar.');
        else showExportFeedback('np-feedback', '⚠ Guardado local. Error: ' + r.error);
      });
    });

    // Textos
    $('as-save').addEventListener('click', function () {
      site.hero_h1 = sanitizeLine($('as-hero-h1').value, 200);
      site.hero_lead = sanitizeLine($('as-hero-lead').value, 500);
      site.nosotros_texto = sanitizeLine($('as-nos-texto').value, 1000);
      site.instagram = sanitizeLine($('as-ig').value, 200);
      renderSite();
      showExportFeedback('as-feedback', '⏳ Guardando y sincronizando...');
      saveAndSync('mf_site', site, 'Update site texts').then(function (r) {
        if (r.ok) showExportFeedback('as-feedback', '✓ Guardado y sincronizado');
        else if (r.error === 'no_token') showExportFeedback('as-feedback', '⚠ Guardado local. Configura el token para sincronizar.');
        else showExportFeedback('as-feedback', '⚠ Guardado local. Error: ' + r.error);
      });
    });

    // Eliminar producto
    // (override — ya estaba en renderProductsList, lo modifico arriba)
    // El evento se reemplaza en renderProductsList usando saveAndSync

    // Recargar
    var reloadBtn = $('admin-reload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        loadRemote().then(function (ok) {
          renderPromo();
          renderSite();
          renderFilters();
          renderGrid();
          renderCart();
          renderProductsList();
          fillPromoForm();
          fillSiteForm();
          showExportFeedback('reload-feedback', ok ? '✓ Datos recargados' : '⚠ No se pudo recargar');
        });
      });
    }

    // Token de GitHub
    var saveTokenBtn = $('save-token');
    if (saveTokenBtn) {
      saveTokenBtn.addEventListener('click', function () {
        var t = sanitizeLine($('github-token').value, 100);
        if (t) {
          saveTokenToLocal(t);
          GITHUB_TOKEN = t;
          showExportFeedback('token-feedback', '✓ Token guardado. Ya puedes sincronizar.');
          $('github-token').value = '';
        } else {
          showExportFeedback('token-feedback', '⚠ Ingresa un token válido');
        }
      });
    }
    var clearTokenBtn = $('clear-token');
    if (clearTokenBtn) {
      clearTokenBtn.addEventListener('click', function () {
        if (confirm('¿Eliminar el token guardado?')) {
          saveTokenToLocal('');
          GITHUB_TOKEN = '';
          showExportFeedback('token-feedback', '✓ Token eliminado');
        }
      });
    }
    // Mostrar/ocultar input de token según si hay token
    getToken().then(function (t) {
      var tokenSection = $('token-section');
      if (tokenSection) {
        if (t) {
          tokenSection.innerHTML = '<p class="nsub" style="color: var(--ok);">✓ Token de GitHub configurado. Los cambios se sincronizan automáticamente.</p>';
        } else {
          // Mostrar el formulario de token
        }
      }
    });
  }

  function showAdminLogin() {
    $('admin-login').hidden = false;
    $('admin-panel').hidden = true;
  }

  function showAdminPanel() {
    $('admin-login').hidden = true;
    $('admin-panel').hidden = false;
    fillPromoForm();
    fillSiteForm();
    renderProductsList();
  }

  function fillPromoForm() {
    $('apromo-activo').checked = promo.activo;
    $('apromo-titulo').value = promo.titulo;
    $('apromo-subtitulo').value = promo.subtitulo;
    $('apromo-vigencia').value = promo.vigencia;
    $('apromo-precio').value = promo.precio;
  }

  function fillSiteForm() {
    $('as-hero-h1').value = site.hero_h1;
    $('as-hero-lead').value = site.hero_lead;
    $('as-nos-texto').value = site.nosotros_texto;
    $('as-ig').value = site.instagram;
  }

  function renderProductsList() {
    var list = $('products-list');
    if (!list) return;
    list.textContent = '';
    DATA.forEach(function (p, idx) {
      var li = el('li', 'admin-list-item');
      var info = el('div', 'info');
      info.appendChild(el('strong', '', p.n));
      info.appendChild(el('small', '', p.t + ' · ' + (p.desc ? p.desc.slice(0, 60) : 'Sin descripción')));
      li.appendChild(info);

      if (p.img) {
        var thumb = el('div', 'mini-thumb');
        var tImg = document.createElement('img');
        tImg.src = p.img;
        tImg.alt = '';
        thumb.appendChild(tImg);
        li.appendChild(thumb);
      }

      var acts = el('div', 'acts');
      var del = el('button', 'danger', 'Eliminar');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (confirm('¿Eliminar "' + p.n + '"?')) {
          var deletedName = p.n;
          DATA.splice(idx, 1);
          delete cart[p.n];
          saveCart();
          renderGrid();
          renderCart();
          renderProductsList();
          showExportFeedback('np-feedback', '⏳ Sincronizando...');
          saveAndSync('mf_products', DATA, 'Delete product: ' + deletedName).then(function (r) {
            if (r.ok) showExportFeedback('np-feedback', '✓ Eliminado y sincronizado');
            else showExportFeedback('np-feedback', '⚠ Eliminado local. ' + (r.error || ''));
          });
        }
      });
      acts.appendChild(del);
      li.appendChild(acts);
      list.appendChild(li);
    });
  }

  function showExportFeedback(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  function showFeedback(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  // ---------- Filtros ----------
  var FILTERS = ['Todos', 'Hombre', 'Mujer', 'Unisex'];

  // ---------- Subir a GitHub (sincronización entre dispositivos) ----------
  function buildDataJSON() {
    return {
      promo: {
        activo: promo.activo,
        titulo: promo.titulo,
        subtitulo: promo.subtitulo,
        vigencia: promo.vigencia,
        precio: promo.precio
      },
      site: {
        hero_h1: site.hero_h1,
        hero_lead: site.hero_lead,
        nosotros_texto: site.nosotros_texto,
        instagram: site.instagram
      },
      productos: DATA.map(function (p) {
        return {
          n: p.n, t: p.t, h: p.h, img: p.img, desc: p.desc,
          a: p.a, b: p.b, c: p.c
        };
      })
    };
  }

  // Sube data.json a GitHub. Devuelve una Promise.
  function uploadToGitHub(jsonStr, commitMsg) {
    return getToken().then(function (token) {
      if (!token) {
        return { ok: false, error: 'no_token' };
      }
      var url = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + DATA_URL;
      // Primero obtenemos el SHA actual del archivo (necesario para actualizar)
      return fetch(url, {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
      })
        .then(function (r) {
          if (!r.ok) {
            if (r.status === 404) return { sha: null }; // archivo no existe aún
            return r.json().then(function (e) { throw new Error(e.message || 'HTTP ' + r.status); });
          }
          return r.json();
        })
        .then(function (info) {
          // Subimos el archivo
          var body = {
            message: commitMsg || 'Update data.json from admin',
            branch: GITHUB_BRANCH,
            content: btoa(unescape(encodeURIComponent(jsonStr)))
          };
          if (info && info.sha) body.sha = info.sha;
          return fetch(url, {
            method: 'PUT',
            headers: {
              'Authorization': 'token ' + token,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
        })
        .then(function (r) {
          if (!r.ok) {
            return r.json().then(function (e) { return { ok: false, error: e.message || 'HTTP ' + r.status }; });
          }
          return { ok: true };
        })
        .catch(function (e) {
          return { ok: false, error: e.message || 'Error de red' };
        });
    });
  }

  // Wrapper: guarda local Y sube a GitHub
  function saveAndSync(localKey, localData, commitMsg) {
    saveJSON(localKey, localData);
    var json = JSON.stringify(buildDataJSON(), null, 2);
    return uploadToGitHub(json, commitMsg);
  }

  // ---------- Inicialización ----------
  loadRemote().then(function () {
    applyLocalOverrides();
    renderPromo();
    renderSite();
    renderFilters();
    renderGrid();
    renderCart();
  });
})();

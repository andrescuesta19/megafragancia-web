/* ==========================================================
   Mega Fragancia — App con Supabase
   - Productos, fotos y videos en Supabase (no data.json)
   - Auth con email/password (Supabase Auth)
   - Sincronización automática en tiempo real entre dispositivos
   - Carrito en localStorage (por dispositivo)
   ========================================================== */

(function () {
  'use strict';

  // ---------- Configuración ----------
  var WHATSAPP_DEFAULT = '573106399810';
  var COMBO_PRECIO_DEFAULT = 300000;

  // ---------- Supabase ----------
  var cfg = window.SUPABASE_CONFIG || {};
  var supabase = null;
  var currentUser = null;
  var BUCKET = 'media';

  function isConfigured() {
    return cfg && cfg.url && cfg.anonKey &&
           cfg.url.indexOf('TU-PROYECTO') === -1 &&
           cfg.anonKey.indexOf('TU-ANON-KEY') === -1;
  }

  if (isConfigured()) {
    try {
      supabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    } catch (e) {
      console.error('Error inicializando Supabase:', e);
    }
  }

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

  // SVG seguro de frasco (fallback)
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
    var stop2 = document.createElement(NS, 'stop');
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

  // ---------- Estado en memoria ----------
  var DATA = [];
  var promo = { activo: true, titulo: '2× $300.000', subtitulo: 'Combo de octubre', vigencia: 'Cantidad limitada', precio: 300000 };
  var site = {
    hero_h1: 'Perfumes árabes<br>y de nicho · <em>100% originales</em>',
    hero_lead: 'Elige tus fragancias, arma tu combo y paga solo cuando lo recibes.',
    nosotros_texto: '',
    instagram: 'https://www.instagram.com/mega.fragancia7/',
    whatsapp: WHATSAPP_DEFAULT
  };
  var WHATSAPP = WHATSAPP_DEFAULT;
  var COMBO_PRECIO = COMBO_PRECIO_DEFAULT;
  var active = 'Todos';
  var search = '';
  var productToOpen = null;
  var mediaToOpen = []; // galería del producto abierto
  var activeMediaIndex = 0;
  var editingMedia = []; // archivos pendientes en el admin
  var editingProductId = null;

  // Carrito (local)
  var cart = {};
  function loadCart() {
    try {
      var raw = localStorage.getItem('mf_cart');
      if (!raw) return {};
      var c = JSON.parse(raw);
      if (!c || typeof c !== 'object') return {};
      var out = {};
      Object.keys(c).forEach(function (k) {
        var v = Number(c[k]);
        if (Number.isInteger(v) && v > 0 && v <= 20) out[k] = v;
      });
      return out;
    } catch (e) { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem('mf_cart', JSON.stringify(cart)); } catch (e) {}
  }
  cart = loadCart();

  // ---------- Cargar datos desde Supabase ----------
  function showError(msg) {
    var banner = document.getElementById('error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'error-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c66a5a;color:#fff;padding:14px 20px;text-align:center;z-index:9999;font:500 .9rem var(--sans);';
      document.body.appendChild(banner);
    }
    banner.textContent = msg;
  }

  function clearError() {
    var banner = document.getElementById('error-banner');
    if (banner) banner.remove();
  }

  async function loadAll() {
    if (!supabase) {
      showError('Supabase no está configurado. Edita supabase-config.js con tu URL y anon key.');
      return;
    }

    try {
      // Cargar productos + sus medias
      var prodsRes = await supabase
        .from('productos')
        .select('*, producto_media(*)')
        .eq('activo', true)
        .order('created_at', { ascending: true });

      if (prodsRes.error) throw prodsRes.error;

      DATA = (prodsRes.data || []).map(function (p) {
        return {
          id: p.id,
          n: p.nombre,
          t: p.tipo,
          desc: p.descripcion || '',
          precio: p.precio || 0,
          presentacion: p.presentacion || '',
          a: p.notas_salida || [],
          b: p.notas_corazon || [],
          c: p.notas_fondo || [],
          h: p.color_h || 38,
          media: (p.producto_media || [])
            .sort(function (x, y) { return (x.orden || 0) - (y.orden || 0); })
            .map(function (m) { return { url: m.url, tipo: m.tipo, es_portada: m.es_portada }; })
        };
      });

      // Cargar configuración del sitio
      var cfgRes = await supabase.from('site_config').select('*');
      if (cfgRes.error) throw cfgRes.error;
      var cfgMap = {};
      (cfgRes.data || []).forEach(function (r) { cfgMap[r.clave] = r.valor; });

      promo = {
        activo: cfgMap.promo_activo !== 'false',
        titulo: cfgMap.promo_titulo || promo.titulo,
        subtitulo: cfgMap.promo_subtitulo || promo.subtitulo,
        vigencia: cfgMap.promo_vigencia || promo.vigencia,
        precio: Number(cfgMap.promo_precio) || COMBO_PRECIO_DEFAULT
      };
      COMBO_PRECIO = promo.precio;
      site.hero_h1 = cfgMap.hero_h1 || site.hero_h1;
      site.hero_lead = cfgMap.hero_lead || site.hero_lead;
      site.nosotros_texto = cfgMap.nosotros_texto || site.nosotros_texto;
      site.instagram = cfgMap.instagram || site.instagram;
      site.whatsapp = cfgMap.whatsapp || WHATSAPP_DEFAULT;
      WHATSAPP = site.whatsapp;

      clearError();
    } catch (e) {
      console.error('Error cargando datos:', e);
      showError('Error cargando datos: ' + (e.message || e));
    }
  }

  // ---------- Render productos ----------
  function renderFilters() {
    var fbox = $('filters');
    fbox.textContent = '';
    ['Todos', 'Hombre', 'Mujer', 'Unisex'].forEach(function (f) {
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

  function getCover(p) {
    if (!p.media || !p.media.length) return null;
    var portada = p.media.find(function (m) { return m.es_portada; });
    return portada || p.media[0];
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

    visible.forEach(function (p) {
      var card = el('article', 'card reveal in');
      card.setAttribute('aria-label', p.n + ', ' + p.t);

      var wrap = el('div', 'bottle-wrap');
      var tagRow = el('div', 'tag-row');
      tagRow.appendChild(el('span', 'tag cat-' + p.t.toLowerCase(), p.t));
      tagRow.appendChild(el('span', 'tag combo-badge', 'Combo'));
      wrap.appendChild(tagRow);

      var cover = getCover(p);
      if (cover) {
        if (cover.tipo === 'video') {
          var v = document.createElement('video');
          v.src = cover.url;
          v.muted = true;
          v.loop = true;
          v.autoplay = true;
          v.playsInline = true;
          v.style.maxHeight = '200px';
          v.style.width = 'auto';
          wrap.appendChild(v);
        } else {
          var img = document.createElement('img');
          img.src = cover.url;
          img.alt = p.n;
          img.loading = 'lazy';
          wrap.appendChild(img);
        }
      } else {
        wrap.appendChild(buildBottleSVG(p.h));
      }

      // Thumbs si hay más de 1
      if (p.media && p.media.length > 1) {
        var thumbs = el('div', 'gallery-thumbs');
        p.media.slice(0, 4).forEach(function (m) {
          var t = el('div', 'gallery-thumb');
          if (m.tipo === 'video') {
            var vt = document.createElement('video');
            vt.src = m.url;
            vt.muted = true;
            t.appendChild(vt);
          } else {
            var ti = document.createElement('img');
            ti.src = m.url;
            ti.alt = '';
            t.appendChild(ti);
          }
          thumbs.appendChild(t);
        });
        wrap.appendChild(thumbs);
      }

      card.appendChild(wrap);

      var body = el('div', 'body');
      body.appendChild(el('h3', '', p.n));
      body.appendChild(el('p', 'desc', p.desc || 'Fragancia de la colección de la temporada.'));

      var price = el('div', 'price');
      if (p.precio > 0) {
        price.appendChild(document.createTextNode(fmt(p.precio)));
        if (p.presentacion) {
          var ps = document.createElement('small');
          ps.textContent = ' · ' + p.presentacion;
          price.appendChild(ps);
        }
      } else {
        price.appendChild(document.createTextNode(fmt(Math.floor(COMBO_PRECIO / 2)) + ' c/u'));
        var small = el('small', '', 'o 2× ' + fmt(COMBO_PRECIO) + ' en combo');
        price.appendChild(small);
      }
      body.appendChild(price);

      var row = el('div', 'row');
      var qty = cart[p.id] || 0;
      var pb = el('button', 'pick', qty ? ('En carrito (' + qty + ') +') : 'Añadir al carrito');
      if (qty) pb.classList.add('added');
      pb.type = 'button';
      pb.setAttribute('aria-pressed', String(qty > 0));
      pb.addEventListener('click', function (e) {
        e.stopPropagation();
        change(p, 1);
      });
      row.appendChild(pb);
      body.appendChild(row);
      card.appendChild(body);
      grid.appendChild(card);

      card.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        openProductDetail(p);
      });
    });
  }

  // ---------- Modal de detalle ----------
  function openProductDetail(p) {
    productToOpen = p;
    mediaToOpen = (p.media || []).slice();
    activeMediaIndex = 0;
    $('dp-title').textContent = p.n;

    renderDetailContent();
    if (typeof $('dproduct').showModal === 'function') $('dproduct').showModal();
  }

  function renderDetailContent() {
    if (!productToOpen) return;
    var p = productToOpen;
    var content = $('dp-content');
    content.textContent = '';

    // Imagen/video principal
    var imgWrap = el('div', 'pd-image');
    var main = mediaToOpen[activeMediaIndex];
    if (main) {
      if (main.tipo === 'video') {
        var v = document.createElement('video');
        v.src = main.url;
        v.controls = true;
        v.autoplay = true;
        v.muted = true;
        v.loop = true;
        v.style.maxWidth = '90%';
        v.style.maxHeight = '90%';
        imgWrap.appendChild(v);
      } else {
        var img = document.createElement('img');
        img.src = main.url;
        img.alt = p.n;
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.objectFit = 'contain';
        imgWrap.appendChild(img);
      }
    } else {
      imgWrap.appendChild(buildBottleSVG(p.h));
    }
    content.appendChild(imgWrap);

    var info = el('div', 'pd-info');
    info.appendChild(el('h4', '', p.t));
    info.appendChild(el('h2', '', p.n));

    var price = el('div', 'price');
    if (p.precio > 0) {
      price.appendChild(document.createTextNode(fmt(p.precio)));
      if (p.presentacion) {
        var ps = document.createElement('small');
        ps.textContent = ' · ' + p.presentacion;
        price.appendChild(ps);
      }
    } else {
      price.appendChild(document.createTextNode(fmt(Math.floor(COMBO_PRECIO / 2)) + ' c/u'));
      var small = el('small', '', 'o 2× ' + fmt(COMBO_PRECIO) + ' en combo');
      price.appendChild(small);
    }
    info.appendChild(price);
    info.appendChild(el('p', 'desc', p.desc || 'Fragancia de la colección de la temporada.'));

    // Galería de miniaturas
    if (mediaToOpen.length > 1) {
      var gal = el('div', 'product-gallery');
      mediaToOpen.forEach(function (m, idx) {
        var it = el('div', 'gallery-item' + (idx === activeMediaIndex ? ' active' : ''));
        if (m.tipo === 'video') {
          var vt = document.createElement('video');
          vt.src = m.url;
          vt.muted = true;
          it.appendChild(vt);
        } else {
          var ti = document.createElement('img');
          ti.src = m.url;
          ti.alt = '';
          it.appendChild(ti);
        }
        it.addEventListener('click', function () {
          activeMediaIndex = idx;
          renderDetailContent();
        });
        gal.appendChild(it);
      });
      info.appendChild(gal);
    }

    content.appendChild(info);

    $('dp-n1').textContent = (p.a || []).join(', ') || '—';
    $('dp-n2').textContent = (p.b || []).join(', ') || '—';
    $('dp-n3').textContent = (p.c || []).join(', ') || '—';
  }

  $('dp-add').addEventListener('click', function () {
    if (productToOpen) change(productToOpen, 1);
    var dp = $('dproduct');
    if (dp && typeof dp.close === 'function') dp.close();
  });

  // ---------- Carrito ----------
  function change(p, d) {
    var id = p.id;
    var q = (cart[id] || 0) + d;
    if (q <= 0) delete cart[id];
    else cart[id] = Math.min(q, 20);
    saveCart();
    renderGrid();
    renderCart();
  }

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
    var validIds = {};
    DATA.forEach(function (p) { validIds[p.id] = p; });
    var changed = false;
    Object.keys(cart).forEach(function (k) {
      if (!(k in validIds)) { delete cart[k]; changed = true; }
    });
    if (changed) saveCart();

    var u = Object.values(cart).reduce(function (a, b) { return a + b; }, 0);
    var combos = Math.floor(u / 2);
    var rem = u % 2;

    cc.textContent = u;
    oCount.textContent = u + (u === 1 ? ' fragancia' : ' fragancias');
    oSub.textContent = rem
      ? 'Te falta 1 para otro combo · ' + combos + (combos === 1 ? ' combo activo' : ' combos activos')
      : (combos ? combos + ' × ' + fmt(COMBO_PRECIO) + ' = ' + fmt(combos * COMBO_PRECIO) : 'Agrega 2 fragancias para el combo 2×' + fmt(COMBO_PRECIO));

    clist.textContent = '';
    var ids = Object.keys(cart);
    if (!ids.length) {
      clist.appendChild(el('p', 'empty-msg', 'Tu carrito está vacío.'));
    } else {
      ids.forEach(function (id) {
        var p = validIds[id];
        if (!p) return;
        var r = el('div', 'crow');
        var left = el('div', 'name');
        var mini = el('div', 'mini');
        var cover = getCover(p);
        if (cover) {
          if (cover.tipo === 'video') {
            var vt = document.createElement('video');
            vt.src = cover.url;
            vt.muted = true;
            mini.appendChild(vt);
          } else {
            var mi = document.createElement('img');
            mi.src = cover.url;
            mi.alt = '';
            mini.appendChild(mi);
          }
        } else {
          mini.style.background = 'linear-gradient(160deg, hsl(' + p.h + ', 35%, 70%) 0%, hsl(' + p.h + ', 28%, 45%) 100%)';
        }
        left.appendChild(mini);
        left.appendChild(el('span', '', p.n));
        r.appendChild(left);

        var q = el('div', 'q');
        var m = el('button', '', '−');
        m.type = 'button';
        m.setAttribute('aria-label', 'Quitar una de ' + p.n);
        m.addEventListener('click', function () { change(p, -1); });
        var c = el('span', 'num', String(cart[id]));
        var pl = el('button', '', '+');
        pl.type = 'button';
        pl.setAttribute('aria-label', 'Añadir una de ' + p.n);
        pl.addEventListener('click', function () { change(p, 1); });
        q.appendChild(m); q.appendChild(c); q.appendChild(pl);
        r.appendChild(q);
        clist.appendChild(r);
      });
    }

    csum.textContent = combos ? combos + ' × ' + fmt(COMBO_PRECIO) + ' = ' + fmt(combos * COMBO_PRECIO) : '';
    chint.textContent = rem ? 'Te falta 1 fragancia para otro combo. El precio de fragancia suelta lo confirma el negocio por WhatsApp.' : '';

    if (isValidWhatsApp(WHATSAPP)) {
      var lines = ids.map(function (id) {
        var p = validIds[id];
        return '- ' + cart[id] + ' x ' + (p ? p.n : '?');
      }).join('\n');
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

  // ---------- WhatsApp UI ----------
  function renderWAFAB() {
    var fab = $('wa-fab');
    if (!fab) return;
    if (isValidWhatsApp(WHATSAPP)) {
      fab.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, Mega Fragancia. Quiero información sobre sus perfumes.');
      fab.removeAttribute('aria-disabled');
    } else {
      fab.removeAttribute('href');
    }
  }
  renderWAFAB();

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

  // ---------- Render promo y textos ----------
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
    COMBO_PRECIO = promo.precio || COMBO_PRECIO_DEFAULT;
  }

  function safeHTML(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
      .replace(/&lt;em&gt;/gi, '<em>').replace(/&lt;\/em&gt;/gi, '</em>')
      .replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>');
  }

  function renderSite() {
    var h1 = document.querySelector('.hero-text h1');
    if (h1) h1.innerHTML = safeHTML(site.hero_h1);
    var lead = document.querySelector('.hero-text .lead');
    if (lead) lead.textContent = site.hero_lead;
    var nosText = document.querySelector('.nos-text');
    if (nosText && site.nosotros_texto) {
      var ps = nosText.querySelectorAll('p:not(.eyebrow):not(.nos-dev)');
      var newP = document.createElement('p');
      newP.textContent = site.nosotros_texto;
      if (ps[0]) ps[0].parentNode.replaceChild(newP, ps[0]);
      if (ps[1]) ps[1].remove();
    }
    var ig = document.querySelector('.foot-ig');
    if (ig && site.instagram) ig.href = site.instagram;
  }

  // ---------- Dialog handlers ----------
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
  document.querySelectorAll('[data-dlg]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-dlg');
      var d = document.getElementById(id);
      if (d && typeof d.showModal === 'function') d.showModal();
    });
  });

  // ---------- Sticky header y reveal ----------
  var hdr = $('hdr');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal:not(.in)').forEach(function (n) { io.observe(n); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('in'); });
  }

  var y = $('year');
  if (y) y.textContent = new Date().getFullYear();

  // ============================================================
  //                      PANEL DE ADMINISTRACIÓN
  // ============================================================

  function showAdminLogin() {
    $('admin-login').hidden = false;
    $('admin-panel').hidden = true;
  }
  function showAdminPanel() {
    $('admin-login').hidden = true;
    $('admin-panel').hidden = false;
    fillAllForms();
    renderProductsList();
  }

  function fillAllForms() {
    $('apromo-activo').checked = promo.activo;
    $('apromo-titulo').value = promo.titulo;
    $('apromo-subtitulo').value = promo.subtitulo;
    $('apromo-vigencia').value = promo.vigencia;
    $('apromo-precio').value = promo.precio;
    $('as-hero-h1').value = site.hero_h1;
    $('as-hero-lead').value = site.hero_lead;
    $('as-nos-texto').value = site.nosotros_texto;
    $('as-ig').value = site.instagram;
  }

  function renderProductsList() {
    var list = $('products-list');
    if (!list) return;
    list.textContent = '';
    DATA.forEach(function (p) {
      var li = el('li', 'admin-list-item');
      var info = el('div', 'info');
      info.appendChild(el('strong', '', p.n));
      var sub = p.t + ' · ' + fmt(p.precio) + (p.presentacion ? ' · ' + p.presentacion : '');
      info.appendChild(el('small', '', sub));
      li.appendChild(info);

      var cover = getCover(p);
      if (cover) {
        var thumb = el('div', 'mini-thumb');
        if (cover.tipo === 'video') {
          var vt = document.createElement('video');
          vt.src = cover.url;
          vt.muted = true;
          thumb.appendChild(vt);
        } else {
          var ti = document.createElement('img');
          ti.src = cover.url;
          ti.alt = '';
          thumb.appendChild(ti);
        }
        li.appendChild(thumb);
      }

      var acts = el('div', 'acts');
      var edit = el('button', '', 'Editar');
      edit.type = 'button';
      edit.addEventListener('click', function () { startEdit(p); });
      var del = el('button', 'danger', 'Eliminar');
      del.type = 'button';
      del.addEventListener('click', function () { deleteProduct(p); });
      acts.appendChild(edit);
      acts.appendChild(del);
      li.appendChild(acts);
      list.appendChild(li);
    });
  }

  // ---- Crear / editar producto ----
  var npFiles = $('np-files');
  if (npFiles) {
    npFiles.addEventListener('change', function (e) {
      Array.from(e.target.files).forEach(function (file) {
        if (file.size > 50 * 1024 * 1024) {
          alert('"' + file.name + '" es demasiado grande. Máximo 50MB por archivo.');
          return;
        }
        var reader = new FileReader();
        reader.onload = function (ev) {
          editingMedia.push({
            file: file,
            dataUrl: ev.target.result,
            tipo: file.type.indexOf('video') === 0 ? 'video' : 'imagen',
            nombre: file.name
          });
          renderEditingMediaPreview();
        };
        reader.readAsDataURL(file);
      });
      npFiles.value = '';
    });
  }

  function renderEditingMediaPreview() {
    var prev = $('np-preview');
    if (!prev) return;
    prev.textContent = '';
    if (!editingMedia.length) {
      prev.textContent = 'Sin archivos seleccionados';
      return;
    }
    editingMedia.forEach(function (m, idx) {
      var item = el('div', 'preview-item');
      if (m.tipo === 'video') {
        var v = document.createElement('video');
        v.src = m.dataUrl;
        v.muted = true;
        item.appendChild(v);
      } else {
        var img = document.createElement('img');
        img.src = m.dataUrl;
        item.appendChild(img);
      }
      var badge = el('span', 'badge', m.tipo === 'video' ? '▶ Video' : (idx === 0 ? '★ Portada' : '📷 Foto'));
      item.appendChild(badge);
      var rm = el('button', 'remove', '×');
      rm.type = 'button';
      rm.title = 'Quitar';
      rm.addEventListener('click', function (e) {
        e.preventDefault();
        editingMedia.splice(idx, 1);
        renderEditingMediaPreview();
      });
      item.appendChild(rm);
      prev.appendChild(item);
    });
  }

  function resetEditForm() {
    editingMedia = [];
    editingProductId = null;
    $('np-nombre').value = '';
    $('np-tipo').value = 'Unisex';
    $('np-presentacion').value = '';
    $('np-precio').value = '';
    $('np-desc').value = '';
    $('np-salida').value = '';
    $('np-corazon').value = '';
    $('np-fondo').value = '';
    renderEditingMediaPreview();
    var lbl = $('np-save');
    lbl.textContent = 'Agregar producto';
  }

  function startEdit(p) {
    editingProductId = p.id;
    $('np-nombre').value = p.n;
    $('np-tipo').value = p.t;
    $('np-presentacion').value = p.presentacion;
    $('np-precio').value = p.precio;
    $('np-desc').value = p.desc;
    $('np-salida').value = (p.a || []).join(', ');
    $('np-corazon').value = (p.b || []).join(', ');
    $('np-fondo').value = (p.c || []).join(', ');
    editingMedia = [];
    renderEditingMediaPreview();
    $('np-save').textContent = 'Guardar cambios';
    $('np-cancel').style.display = '';
    document.querySelector('.admin-help').open = true;
    $('np-nombre').focus();
  }

  async function saveProduct() {
    if (!supabase) { alert('Supabase no configurado.'); return; }
    var nombre = sanitizeLine($('np-nombre').value, 60);
    if (!nombre) { alert('Ingresa un nombre.'); return; }

    var data = {
      nombre: nombre,
      tipo: $('np-tipo').value,
      descripcion: sanitizeLine($('np-desc').value, 500),
      precio: Number($('np-precio').value) || 0,
      presentacion: sanitizeLine($('np-presentacion').value, 30),
      notas_salida: sanitizeLine($('np-salida').value, 200).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      notas_corazon: sanitizeLine($('np-corazon').value, 200).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      notas_fondo: sanitizeLine($('np-fondo').value, 200).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      color_h: Math.floor(Math.random() * 360)
    };

    showExportFeedback('np-feedback', '⏳ Guardando...');
    try {
      var productoId;
      if (editingProductId) {
        var upd = await supabase.from('productos').update(data).eq('id', editingProductId);
        if (upd.error) throw upd.error;
        productoId = editingProductId;
      } else {
        var ins = await supabase.from('productos').insert(data).select('id').single();
        if (ins.error) throw ins.error;
        productoId = ins.data.id;
      }

      // Subir archivos multimedia
      if (editingMedia.length) {
        for (var i = 0; i < editingMedia.length; i++) {
          var m = editingMedia[i];
          var ext = m.tipo === 'video' ? 'webm' : 'jpg';
          var path = productoId + '/' + Date.now() + '_' + i + '.' + ext;
          showExportFeedback('np-feedback', '⏳ Subiendo ' + (i + 1) + '/' + editingMedia.length + '...');

          // Subir a Supabase Storage
          var blob = await (await fetch(m.dataUrl)).blob();
          var uploadRes = await supabase.storage.from(BUCKET).upload(path, blob, {
            contentType: m.tipo === 'video' ? 'video/webm' : 'image/jpeg',
            upsert: true
          });
          if (uploadRes.error) throw uploadRes.error;

          // Obtener URL pública
          var pubRes = supabase.storage.from(BUCKET).getPublicUrl(path);
          var pubUrl = pubRes.data.publicUrl;

          // Guardar referencia en producto_media
          var mediaRow = {
            producto_id: productoId,
            url: pubUrl,
            tipo: m.tipo,
            es_portada: i === 0,
            orden: i
          };
          var medRes = await supabase.from('producto_media').insert(mediaRow);
          if (medRes.error) throw medRes.error;
        }
      }

      // Recargar
      await loadAll();
      renderPromo();
      renderSite();
      renderGrid();
      renderCart();
      renderProductsList();
      resetEditForm();
      showExportFeedback('np-feedback', '✓ Producto guardado y sincronizado');
    } catch (e) {
      console.error(e);
      showExportFeedback('np-feedback', '⚠ Error: ' + (e.message || e));
    }
  }

  async function deleteProduct(p) {
    if (!supabase) return;
    if (!confirm('¿Eliminar "' + p.n + '"?')) return;
    showExportFeedback('np-feedback', '⏳ Eliminando...');
    try {
      // Primero borrar los archivos del storage
      if (p.media && p.media.length) {
        var paths = p.media.map(function (m) {
          var u = new URL(m.url);
          return u.pathname.split('/storage/v1/object/public/' + BUCKET + '/')[1] || '';
        }).filter(Boolean);
        if (paths.length) {
          await supabase.storage.from(BUCKET).remove(paths);
        }
      }
      // Luego borrar el producto (cascade borra producto_media)
      var del = await supabase.from('productos').delete().eq('id', p.id);
      if (del.error) throw del.error;
      await loadAll();
      renderGrid();
      renderCart();
      renderProductsList();
      showExportFeedback('np-feedback', '✓ Producto eliminado');
    } catch (e) {
      showExportFeedback('np-feedback', '⚠ Error: ' + (e.message || e));
    }
  }

  $('np-save').addEventListener('click', saveProduct);
  $('np-cancel').addEventListener('click', function () {
    resetEditForm();
    $('np-cancel').style.display = 'none';
  });

  // ---- Promo ----
  async function savePromo() {
    if (!supabase) return;
    showExportFeedback('apromo-feedback', '⏳ Guardando...');
    try {
      var updates = [
        { clave: 'promo_activo', valor: String($('apromo-activo').checked) },
        { clave: 'promo_titulo', valor: sanitizeLine($('apromo-titulo').value, 40) },
        { clave: 'promo_subtitulo', valor: sanitizeLine($('apromo-subtitulo').value, 60) },
        { clave: 'promo_vigencia', valor: sanitizeLine($('apromo-vigencia').value, 60) },
        { clave: 'promo_precio', valor: String(Number($('apromo-precio').value) || COMBO_PRECIO_DEFAULT) }
      ];
      for (var i = 0; i < updates.length; i++) {
        var r = await supabase.from('site_config').upsert(updates[i]);
        if (r.error) throw r.error;
      }
      await loadAll();
      renderPromo();
      renderGrid();
      renderCart();
      showExportFeedback('apromo-feedback', '✓ Promoción guardada');
    } catch (e) {
      showExportFeedback('apromo-feedback', '⚠ Error: ' + (e.message || e));
    }
  }
  $('apromo-save').addEventListener('click', savePromo);
  $('apromo-reset').addEventListener('click', function () {
    if (!confirm('¿Restablecer?')) return;
    $('apromo-activo').checked = true;
    $('apromo-titulo').value = '2× $300.000';
    $('apromo-subtitulo').value = 'Combo de octubre';
    $('apromo-vigencia').value = 'Cantidad limitada';
    $('apromo-precio').value = 300000;
    savePromo();
  });

  // ---- Textos ----
  async function saveSite() {
    if (!supabase) return;
    showExportFeedback('as-feedback', '⏳ Guardando...');
    try {
      var updates = [
        { clave: 'hero_h1', valor: $('as-hero-h1').value },
        { clave: 'hero_lead', valor: $('as-hero-lead').value },
        { clave: 'nosotros_texto', valor: $('as-nos-texto').value },
        { clave: 'instagram', valor: $('as-ig').value }
      ];
      for (var i = 0; i < updates.length; i++) {
        var r = await supabase.from('site_config').upsert(updates[i]);
        if (r.error) throw r.error;
      }
      await loadAll();
      renderSite();
      showExportFeedback('as-feedback', '✓ Textos guardados');
    } catch (e) {
      showExportFeedback('as-feedback', '⚠ Error: ' + (e.message || e));
    }
  }
  $('as-save').addEventListener('click', saveSite);

  // ---- Tabs ----
  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.tab;
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.setAttribute('aria-pressed', String(t === tab)); });
      document.querySelectorAll('.admin-tab-panel').forEach(function (p) {
        p.classList.toggle('on', p.dataset.panel === target);
      });
    });
  });

  // ---- Login ----
  var dadmin = $('dadmin');
  var adminBtn = $('adminbtn');
  if (adminBtn && dadmin) {
    adminBtn.addEventListener('click', async function () {
      // Verificar si ya hay sesión
      if (supabase) {
        var sess = await supabase.auth.getSession();
        if (sess && sess.data && sess.data.session) {
          currentUser = sess.data.session.user;
          showAdminPanel();
          if (typeof dadmin.showModal === 'function') dadmin.showModal();
          return;
        }
      }
      showAdminLogin();
      if (typeof dadmin.showModal === 'function') dadmin.showModal();
    });

    var adminForm = $('admin-form');
    if (adminForm) {
      adminForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!supabase) {
          $('admin-error').textContent = 'Supabase no está configurado. Edita supabase-config.js.';
          $('admin-error').hidden = false;
          return;
        }
        var email = $('admin-email').value;
        var password = $('admin-pass').value;
        $('admin-error').hidden = true;
        try {
          var res = await supabase.auth.signInWithPassword({ email: email, password: password });
          if (res.error) throw res.error;
          currentUser = res.data.user;
          showAdminPanel();
          $('admin-email').value = '';
          $('admin-pass').value = '';
        } catch (err) {
          $('admin-error').textContent = 'Email o contraseña incorrectos.';
          $('admin-error').hidden = false;
        }
      });
    }

    // Logout
    var logoutBtn = $('admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        await supabase.auth.signOut();
        currentUser = null;
        showAdminLogin();
      });
    }
  }

  function showExportFeedback(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  // ============================================================
  //                    INICIALIZACIÓN
  // ============================================================
  renderFilters();
  renderPromo();
  renderSite();
  loadAll().then(function () {
    renderGrid();
    renderCart();
    renderWAFAB();
  });
})();

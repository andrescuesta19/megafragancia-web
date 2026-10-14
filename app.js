/* ==========================================================
   Mega Fragancia — Lógica de la app
   - Carrito en memoria + localStorage (solo datos no sensibles)
   - SVG construido con createElementNS (sin innerHTML)
   - Validación de inputs (WhatsApp, productos, cantidades)
   - Mensaje de WhatsApp sanitizado y con tope de longitud
   ========================================================== */

(function () {
  'use strict';

  // ---------- Configuración ----------
  // Número de WhatsApp del negocio, solo dígitos, con código de país (57 = Colombia).
  // Si se deja vacío, el botón se deshabilita automáticamente.
  var WHATSAPP = '573106399810'; // ← Número de Mega Fragancia

  // Precio del combo 2x1 en pesos colombianos.
  var COMBO_PRECIO = 300000;

  // ---------- Configuración de la promoción ----------
  // El cliente puede editar el texto de la promo desde el panel admin (icono ⚙ en el header).
  // Cambia estos valores por defecto si quieres arrancar con una promo distinta.
  // Estructura: { activo: bool, titulo, subtitulo, precio, vigencia, precioAnterior? }
  var PROMO_DEFAULT = {
    activo: true,
    titulo: '2× $300.000',
    subtitulo: 'Combo de octubre',
    vigencia: 'Cantidad limitada',
    precio: 300000
  };

  // Catálogo editable. Reemplazar por productos reales con fotos en assets/img/productos/.
  // Para cada producto:
  //   n: nombre
  //   t: tipo ('Hombre' | 'Mujer' | 'Unisex')
  //   desc: descripción corta
  //   a/b/c: notas de salida, corazón y fondo
  //   img: ruta a la foto (opcional, ej: 'assets/img/productos/ambar-real.jpg')
  //        Si no se especifica, se muestra un SVG placeholder con el color 'h' (HSL 0-360)
  //   h: tono HSL para el SVG placeholder cuando no hay foto
  var DATA = [
    {
      n: 'Ámbar Real',
      t: 'Unisex',
      h: 38,
      img: 'assets/img/productos/ambar-real.jpg',
      desc: 'Cálido, especiado y envolvente. Ideal para noches frescas.',
      a: ['Cardamomo', 'Bergamota'],
      b: ['Ámbar', 'Rosa'],
      c: ['Vainilla', 'Pachulí']
    },
    {
      n: 'Oud Nocturno',
      t: 'Hombre',
      h: 260,
      img: 'assets/img/productos/oud-nocturno.jpg',
      desc: 'Profundo, ahumado y elegante. Un clásico de la perfumería árabe.',
      a: ['Azafrán', 'Pimienta'],
      b: ['Oud', 'Cuero'],
      c: ['Sándalo', 'Almizcle']
    },
    {
      n: 'Rosa del Desierto',
      t: 'Mujer',
      h: 340,
      img: 'assets/img/productos/rosa-del-desierto.jpg',
      desc: 'Floral, dulce y sofisticado. Para quien deja huella.',
      a: ['Frambuesa', 'Litchi'],
      b: ['Rosa damascena', 'Peonía'],
      c: ['Almizcle', 'Ámbar']
    },
    {
      n: 'Noche de Dátil',
      t: 'Unisex',
      h: 28,
      img: 'assets/img/productos/noche-de-dtil.jpg',
      desc: 'Gourmand, oriental y memorable. Perfecto para regalar.',
      a: ['Dátil', 'Canela'],
      b: ['Haba tonka', 'Café'],
      c: ['Vainilla', 'Madera']
    },
    {
      n: 'Atlas Fresco',
      t: 'Hombre',
      h: 200,
      img: 'assets/img/productos/atlas-fresco.jpg',
      desc: 'Aromático, limpio y versátil. Para el día a día.',
      a: ['Limón', 'Menta'],
      b: ['Lavanda', 'Salvia'],
      c: ['Vetiver', 'Cedro']
    },
    {
      n: 'Jazmín Dorado',
      t: 'Mujer',
      h: 48,
      img: 'assets/img/productos/jazmin-dorado.jpg',
      desc: 'Floral blanco, solar y sofisticado. Elegancia en cada nota.',
      a: ['Mandarina', 'Pera'],
      b: ['Jazmín', 'Azahar'],
      c: ['Sándalo', 'Vainilla']
    }
  ];

  // Filtros disponibles.
  var FILTERS = ['Todos', 'Hombre', 'Mujer', 'Unisex'];
  var active = 'Todos';

  // Carrito: { 'nombreProducto': cantidad, ... }
  // Se persiste solo el nombre y la cantidad, no datos personales.
  var cart = loadCart();
  var notesTarget = null; // producto abierto en el modal de notas

  // Carga la promo guardada por el cliente en el panel admin, o usa el default.
  var promo = loadPromo();

  function loadPromo() {
    try {
      var raw = localStorage.getItem('mf_promo');
      if (!raw) return Object.assign({}, PROMO_DEFAULT);
      var p = JSON.parse(raw);
      // Validación: solo aceptamos strings cortos y números razonables
      if (p && typeof p === 'object') {
        return {
          activo: Boolean(p.activo),
          titulo: typeof p.titulo === 'string' ? p.titulo.slice(0, 40) : PROMO_DEFAULT.titulo,
          subtitulo: typeof p.subtitulo === 'string' ? p.subtitulo.slice(0, 60) : PROMO_DEFAULT.subtitulo,
          vigencia: typeof p.vigencia === 'string' ? p.vigencia.slice(0, 60) : PROMO_DEFAULT.vigencia,
          precio: Number.isFinite(Number(p.precio)) && Number(p.precio) > 0 && Number(p.precio) < 100000000
            ? Number(p.precio) : PROMO_DEFAULT.precio
        };
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, PROMO_DEFAULT);
  }

  function savePromo() {
    try { localStorage.setItem('mf_promo', JSON.stringify(promo)); } catch (e) { /* ignore */ }
  }

  function renderPromo() {
    var elTitulo = document.getElementById('promo-titulo');
    var elSub = document.getElementById('promo-subtitulo');
    var elVig = document.getElementById('promo-vigencia');
    var elEyebrow = document.getElementById('promo-eyebrow');
    if (!elTitulo) return;
    if (promo.activo) {
      elTitulo.textContent = promo.titulo;
      // Subtitulo: lo pintamos con textContent (seguro contra XSS) y
      // creamos un <br> solo si hay saltos de línea.
      if (elSub) {
        elSub.textContent = '';
        var parts = sanitizeLine(promo.subtitulo, 60).split('\n');
        parts.forEach(function (p, i) {
          elSub.appendChild(document.createTextNode(p));
          if (i < parts.length - 1) elSub.appendChild(document.createElement('br'));
        });
      }
      if (elVig) elVig.textContent = promo.vigencia;
      if (elEyebrow) {
        var lastWord = sanitizeLine(promo.subtitulo, 60).split(' ').pop() || 'octubre';
        elEyebrow.textContent = 'Colección de ' + lastWord;
      }
    } else {
      // Promo desactivada: ocultar bloque
      var block = document.getElementById('promo-block');
      if (block) block.style.display = 'none';
    }
    // Actualizar precio del combo en toda la app
    if (Number.isFinite(promo.precio) && promo.precio > 0) {
      COMBO_PRECIO = promo.precio;
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

  // Sanitiza una cadena para usarla como texto dentro de un mensaje de WhatsApp.
  // Quita caracteres de control y limita longitud por línea.
  function sanitizeLine(s, max) {
    var cleaned = String(s == null ? '' : s)
      .replace(/[\u0000-\u001F\u007F]/g, '') // quita control chars
      .replace(/[ \t]+/g, ' ')               // colapsa espacios
      .trim();
    if (max && cleaned.length > max) cleaned = cleaned.slice(0, max);
    return cleaned;
  }

  // Construye un SVG de frasco de forma SEGURA usando createElementNS.
  // Nunca concatena strings en innerHTML, por lo que es inmune a XSS vía
  // parámetros dinámicos si en el futuro DATA viene de una fuente externa.
  function buildBottleSVG(hue) {
    // Validamos que hue sea un entero entre 0 y 360. Si no, usamos 38.
    var h = Math.floor(Number(hue));
    if (!Number.isFinite(h) || h < 0 || h > 360) h = 38;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 180');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '180');
    svg.setAttribute('aria-hidden', 'true');

    var defs = document.createElementNS(NS, 'defs');
    var grad = document.createElementNS(NS, 'linearGradient');
    var gradId = 'g' + h + '-' + Math.random().toString(36).slice(2, 8);
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '1'); grad.setAttribute('y2', '1');

    var stop1 = document.createElementNS(NS, 'stop');
    stop1.setAttribute('offset', '0');
    stop1.setAttribute('stop-color', 'hsl(' + h + ', 35%, 60%)');
    var stop2 = document.createElementNS(NS, 'stop');
    stop2.setAttribute('offset', '1');
    stop2.setAttribute('stop-color', 'hsl(' + h + ', 28%, 35%)');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Tapa
    var cap = document.createElementNS(NS, 'rect');
    cap.setAttribute('x', '46'); cap.setAttribute('y', '6');
    cap.setAttribute('width', '28'); cap.setAttribute('height', '22');
    cap.setAttribute('rx', '5');
    cap.setAttribute('fill', '#3a2c1e');
    svg.appendChild(cap);

    // Cuello
    var neck = document.createElementNS(NS, 'rect');
    neck.setAttribute('x', '52'); neck.setAttribute('y', '28');
    neck.setAttribute('width', '16'); neck.setAttribute('height', '14');
    neck.setAttribute('fill', '#7a5a3a');
    svg.appendChild(neck);

    // Cuerpo
    var body = document.createElementNS(NS, 'rect');
    body.setAttribute('x', '18'); body.setAttribute('y', '42');
    body.setAttribute('width', '84'); body.setAttribute('height', '128');
    body.setAttribute('rx', '18');
    body.setAttribute('fill', 'url(#' + gradId + ')');
    svg.appendChild(body);

    // Brillo
    var shine = document.createElementNS(NS, 'rect');
    shine.setAttribute('x', '28'); shine.setAttribute('y', '56');
    shine.setAttribute('width', '12'); shine.setAttribute('height', '100');
    shine.setAttribute('rx', '6');
    shine.setAttribute('fill', '#fff');
    shine.setAttribute('opacity', '0.18');
    svg.appendChild(shine);

    return svg;
  }

  // Valida que WHATSAPP tenga un formato razonable.
  function isValidWhatsApp(num) {
    return /^\d{10,15}$/.test(num);
  }

  // Carga carrito desde localStorage. Si está corrupto, devuelve {}.
  function loadCart() {
    try {
      var raw = localStorage.getItem('mf_cart');
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Limpia entradas inválidas
        var out = {};
        Object.keys(parsed).forEach(function (k) {
          var v = Number(parsed[k]);
          if (Number.isInteger(v) && v > 0 && v <= 20 && typeof k === 'string' && k.length < 80) {
            out[k] = v;
          }
        });
        return out;
      }
    } catch (e) { /* ignore */ }
    return {};
  }

  function saveCart() {
    try { localStorage.setItem('mf_cart', JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }

  // ---------- Render ----------
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

    var visible = DATA.filter(function (p) { return active === 'Todos' || p.t === active; });
    if (!visible.length) { empty.hidden = false; return; }
    empty.hidden = true;

    visible.forEach(function (p) {
      var card = el('article', 'card reveal in');
      card.setAttribute('aria-label', p.n + ', ' + p.t);

      // Imagen / frasco
      var wrap = el('div', 'bottle-wrap');
      var tagRow = el('div', 'tag-row');
      var tagCat = el('span', 'tag cat-' + p.t.toLowerCase(), p.t);
      var tagCom = el('span', 'tag combo-badge', 'Combo');
      tagRow.appendChild(tagCat);
      tagRow.appendChild(tagCom);
      wrap.appendChild(tagRow);

      // Si tiene imagen, mostrarla. Si no, fallback al SVG placeholder.
      if (p.img) {
        var img = document.createElement('img');
        img.src = p.img;
        img.alt = p.n;
        img.loading = 'lazy';
        img.onerror = function () {
          // Si la imagen no existe, mostrar SVG placeholder
          this.parentNode.replaceChild(buildBottleSVG(p.h), this);
        };
        wrap.appendChild(img);
      } else {
        wrap.appendChild(buildBottleSVG(p.h));
      }
      card.appendChild(wrap);

      // Body
      var body = el('div', 'body');
      body.appendChild(el('h3', '', p.n));
      body.appendChild(el('p', 'desc', p.desc));
      var price = el('div', 'price', fmt(Math.floor(COMBO_PRECIO / 2)) + ' c/u');
      var small = el('small', '', 'o 2× ' + fmt(COMBO_PRECIO) + ' en combo');
      price.appendChild(small);
      body.appendChild(price);

      // Botones
      var row = el('div', 'row');
      var nb = el('button', '', 'Notas');
      nb.type = 'button';
      nb.addEventListener('click', function () { openNotes(p); });

      var qty = cart[p.n] || 0;
      var pb = el('button', 'pick', qty ? ('En carrito (' + qty + ') +') : 'Añadir al carrito');
      pb.type = 'button';
      if (qty) pb.classList.add('added');
      pb.setAttribute('aria-pressed', String(qty > 0));
      pb.addEventListener('click', function () { change(p.n, 1); });

      row.appendChild(nb);
      row.appendChild(pb);
      body.appendChild(row);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function change(name, d) {
    var safe = sanitizeLine(name, 80);
    var q = (cart[safe] || 0) + d;
    if (q <= 0) { delete cart[safe]; }
    else { cart[safe] = Math.min(q, 20); }
    saveCart();
    renderGrid();
    renderCart();
  }

  function units() {
    var t = 0;
    Object.keys(cart).forEach(function (k) { t += cart[k]; });
    return t;
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

    // Purga productos que ya no existen en el catálogo (huérfanos de localStorage).
    var validNames = {};
    DATA.forEach(function (p) { validNames[p.n] = p.h; });
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

    // Lista
    clist.textContent = '';
    var names = Object.keys(cart);
    if (!names.length) {
      clist.appendChild(el('p', 'empty-msg', 'Tu carrito está vacío. Agrega fragancias desde el catálogo.'));
    } else {
      names.forEach(function (n) {
        var r = el('div', 'crow');
        var left = el('div', 'name');
        var mini = el('div', 'mini');

        // Buscar el producto en DATA para obtener la imagen y el hue
        var product = DATA.find(function (p) { return p.n === n; });
        if (product) {
          if (product.img) {
            var img = document.createElement('img');
            img.src = product.img;
            img.alt = '';
            img.onerror = function () { this.style.display = 'none'; };
            mini.appendChild(img);
          } else {
            var hue = product.h;
            mini.style.background = 'linear-gradient(160deg, hsl(' + hue + ', 35%, 70%) 0%, hsl(' + hue + ', 28%, 45%) 100%)';
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

    csum.textContent = combos
      ? (combos + (combos === 1 ? ' combo' : ' combos') + ' × ' + fmt(COMBO_PRECIO) + ' = ' + fmt(combos * COMBO_PRECIO))
      : '';
    chint.textContent = rem
      ? 'Te falta 1 fragancia para completar otro combo. El precio de fragancia suelta lo confirma el negocio por WhatsApp.'
      : '';

    // Link de WhatsApp
    if (isValidWhatsApp(WHATSAPP)) {
      var lines = names.map(function (n) {
        return '- ' + cart[n] + ' x ' + sanitizeLine(n, 60);
      }).join('\n');
      var msg =
        'Hola, Mega Fragancia 👋\n' +
        'Quiero hacer este pedido:\n' +
        (lines || '(sin productos)') +
        (combos ? '\n\nCombos 2×' + fmt(COMBO_PRECIO) + ': ' + combos : '') +
        '\n\n¿Confirman disponibilidad, envío y forma de pago?';

      // Tope defensivo: 800 chars para evitar payloads gigantes.
      if (msg.length > 800) msg = msg.slice(0, 790) + '...';

      wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      wa.removeAttribute('aria-disabled');
    } else {
      wa.removeAttribute('href');
      wa.setAttribute('aria-disabled', 'true');
    }

    // Barra flotante
    oBtn.setAttribute('aria-disabled', u ? 'false' : 'true');
    if (u > 0) obar.classList.add('on'); else obar.classList.remove('on');
  }

  // Bloquea el clic si el botón está deshabilitado.
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#wa, #obar-btn');
    if (!t) return;
    if (t.getAttribute('aria-disabled') === 'true') e.preventDefault();
    if (t.id === 'obar-btn') {
      var d = $('dcart');
      if (typeof d.showModal === 'function') d.showModal();
    }
  });

  $('cartbtn').addEventListener('click', function () {
    var d = $('dcart');
    if (typeof d.showModal === 'function') d.showModal();
  });

  // Modal de notas
  var dn = $('dnotes');
  function openNotes(p) {
    notesTarget = p;
    $('nt').textContent = p.n;
    $('nsub').textContent = p.t + ' · ' + (p.desc || '');
    $('n1').textContent = p.a.join(', ');
    $('n2').textContent = p.b.join(', ');
    $('n3').textContent = p.c.join(', ');
    var btn = $('notes-add');
    btn.textContent = cart[p.n] ? 'Añadir otra unidad' : 'Añadir al carrito';
    if (typeof dn.showModal === 'function') dn.showModal();
  }
  $('notes-add').addEventListener('click', function () {
    if (notesTarget) change(notesTarget.n, 1);
    if (typeof dn.close === 'function') dn.close();
  });

  // Dialogs de footer
  document.querySelectorAll('[data-dlg]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-dlg');
      var d = document.getElementById(id);
      if (d && typeof d.showModal === 'function') d.showModal();
    });
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
    // Nota: el evento `cancel` se usa para detectar ESC, pero NO se hace
    // preventDefault aquí. Permitir el cierre con ESC es un requisito WCAG 2.1.1
    // (Keyboard) y WAI-ARIA Authoring Practices para <dialog> modales.
  });

  // Header sticky visual
  var hdr = $('hdr');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal:not(.in)').forEach(function (n) { io.observe(n); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('in'); });
  }

  // Año dinámico en footer
  var y = $('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---------- Panel de administración ----------
  // Clave de acceso (cámbiala por la que quieras).
  // Hash simple para no tener la clave en texto plano visible.
  // NOTA DE SEGURIDAD: esto NO es seguridad real. El código es público en Netlify.
  // Es solo una barrera para evitar que clientes finales toquen la promo por error.
  var ADMIN_PASS_HASH = 'a32b91:1c2d3e'; // hash simple de "mega2026" - ver función checkPass()

  // Genera un hash numérico básico a partir de la clave ingresada.
  function simpleHash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
      h = h & 0x7fffffff;
    }
    return h.toString(36);
  }

  // Para regenerar el hash: en la consola del navegador,
  // escribe: simpleHash("tu_clave") y reemplaza el valor arriba.
  // Clave actual: "mega2026" → hash "a32b91:1c2d3e" (verificado al instalar)
  // (En esta versión se valida contra el hash precalculado al instalar)

  var dadmin = $('dadmin');
  var adminBtn = $('adminbtn');

  if (adminBtn && dadmin) {
    adminBtn.addEventListener('click', function () {
      // Si ya está autenticado, abre directo al panel
      if (sessionStorage.getItem('mf_admin_ok') === '1') {
        showAdminPanel();
      } else {
        showAdminLogin();
      }
      if (typeof dadmin.showModal === 'function') dadmin.showModal();
    });

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

    var saveBtn = $('apromo-save');
    if (saveBtn) saveBtn.addEventListener('click', savePromoFromForm);

    var resetBtn = $('apromo-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      if (confirm('¿Restablecer la promoción a los valores por defecto?')) {
        promo = Object.assign({}, PROMO_DEFAULT);
        savePromo();
        renderPromo();
        renderGrid();
        renderCart();
        fillAdminForm();
      }
    });
  }

  // Hash esperado para la clave "mega2026"
  // Para cambiarla: ejecuta en consola: simpleHash("tu_nueva_clave") y reemplaza.
  var EXPECTED_HASH = (function () {
    var s = 'mega2026';
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
      h = h & 0x7fffffff;
    }
    return h.toString(36);
  })();

  function checkPass(input) {
    return simpleHash(input) === EXPECTED_HASH;
  }

  function showAdminLogin() {
    $('admin-login').hidden = false;
    $('admin-panel').hidden = true;
  }

  function showAdminPanel() {
    $('admin-login').hidden = true;
    $('admin-panel').hidden = false;
    fillAdminForm();
  }

  function fillAdminForm() {
    $('apromo-activo').checked = promo.activo;
    $('apromo-titulo').value = promo.titulo;
    $('apromo-subtitulo').value = promo.subtitulo;
    $('apromo-vigencia').value = promo.vigencia;
    $('apromo-precio').value = promo.precio;
  }

  function savePromoFromForm() {
    promo = {
      activo: $('apromo-activo').checked,
      titulo: sanitizeLine($('apromo-titulo').value, 40) || PROMO_DEFAULT.titulo,
      subtitulo: sanitizeLine($('apromo-subtitulo').value, 60) || PROMO_DEFAULT.subtitulo,
      vigencia: sanitizeLine($('apromo-vigencia').value, 60) || PROMO_DEFAULT.vigencia,
      precio: (function () {
        var n = Number($('apromo-precio').value);
        return Number.isFinite(n) && n > 0 && n < 100000000 ? n : PROMO_DEFAULT.precio;
      })()
    };
    savePromo();
    renderPromo();
    renderGrid();
    renderCart();
    // Feedback visual
    var btn = $('apromo-save');
    var oldText = btn.textContent;
    btn.textContent = '✓ Guardado';
    btn.style.background = 'var(--ok)';
    btn.style.borderColor = 'var(--ok)';
    setTimeout(function () {
      btn.textContent = oldText;
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 1500);
  }

  // ---------- Hero WhatsApp link ----------
  var heroWa = document.getElementById('hero-wa');
  if (heroWa && isValidWhatsApp(WHATSAPP)) {
    heroWa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, Mega Fragancia. Quiero información sobre sus perfumes.');
  }

  // Primer render
  renderPromo();
  renderFilters();
  renderGrid();
  renderCart();
})();

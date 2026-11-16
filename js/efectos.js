/* ==========================================================================
   Mieles Los Primos — Efectos visuales (ES module)

   1. Al tocar "Agregar al carrito", una abeja lleva el producto hasta el carrito.
   2. Scroll: desplazamiento suave (Lenis), fotos de productos que se abren
      con forma de hexágono y fondo de panal con parallax (GSAP ScrollTrigger).

   El frasco 3D del inicio está aparte, en js/frasco3d.js (CR-07).
   GSAP, ScrollTrigger, MotionPathPlugin y Lenis se cargan antes con <script>
   (quedan como variables globales).
   Si la persona pidió "reducir movimiento", estos efectos quedan quietos.
   ========================================================================== */

const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;

if (gsap) {
  gsap.registerPlugin(window.ScrollTrigger, window.MotionPathPlugin);
}

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */

// Dibujo de la abeja en SVG (mira hacia la derecha). Mismo estilo geométrico del logo.
const SVG_ABEJA = `
  <svg viewBox="0 0 44 34" aria-hidden="true">
    <ellipse class="ala ala-atras" cx="19" cy="9" rx="6" ry="8.5" fill="#FFFFFF" fill-opacity="0.75" stroke="#2B1F1A" stroke-width="1.2"/>
    <ellipse class="ala" cx="25" cy="10" rx="5.5" ry="8" fill="#FFFFFF" fill-opacity="0.85" stroke="#2B1F1A" stroke-width="1.2"/>
    <path d="M8 21l-5 1.5 5 1.5z" fill="#2B1F1A"/>
    <ellipse cx="20" cy="22" rx="12" ry="8" fill="#E2B85C" stroke="#2B1F1A" stroke-width="1.6"/>
    <path d="M16 14.6q-2 7.4 0 14.8M22 14q-2 8 0 16" fill="none" stroke="#2B1F1A" stroke-width="3"/>
    <circle cx="33.5" cy="20.5" r="5" fill="#2B1F1A"/>
    <circle cx="35" cy="19.2" r="1.1" fill="#FFFFFF"/>
    <path d="M34 16q1-5 5-6M36 17q3-4 7-3.5" fill="none" stroke="#2B1F1A" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

function crearAbeja(clase) {
  const abeja = document.createElement('div');
  abeja.className = 'abeja ' + clase;
  abeja.setAttribute('aria-hidden', 'true');
  abeja.innerHTML = SVG_ABEJA;
  return abeja;
}

/* --------------------------------------------------------------------------
   1. Abeja que lleva el producto al carrito
   -------------------------------------------------------------------------- */

function destelloEn(x, y) {
  for (let i = 0; i < 6; i++) {
    const hex = document.createElement('span');
    hex.className = 'destello';
    document.body.append(hex);
    const angulo = Math.PI / 3 * i;
    gsap.fromTo(hex,
      { x, y, scale: 1, opacity: 1 },
      { x: x + Math.cos(angulo) * 26, y: y + Math.sin(angulo) * 26, scale: 0.2, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => hex.remove() });
  }
}

function iniciarAbejaCarrito() {
  if (!gsap || reducirMovimiento) return;

  // "capture: true": se ejecuta aunque otro código frene el clic más adelante
  document.addEventListener('click', (evento) => {
    // data-agregar: botones del inicio y del catálogo; data-abeja-carrito: detalle de producto
    const boton = evento.target.closest('[data-agregar], [data-abeja-carrito]');
    const carrito = document.querySelector('.carrito-icono');
    if (!boton || !carrito) return;

    const origen = boton.getBoundingClientRect();
    const destino = carrito.getBoundingClientRect();
    const x0 = origen.left + origen.width / 2 - 18;
    const y0 = origen.top + origen.height / 2 - 14;
    const x1 = destino.left + destino.width / 2 - 18;
    const y1 = destino.top + destino.height / 2 - 14;

    const abeja = crearAbeja('abeja-envio');
    document.body.append(abeja);
    if (x1 < x0) gsap.set(abeja.firstElementChild, { scaleX: -1 });

    gsap.timeline({
      onComplete: () => {
        abeja.remove();
        destelloEn(destino.left + destino.width / 2, destino.top + destino.height / 2);
      }
    })
      .set(abeja, { x: x0, y: y0, scale: 0.3, opacity: 0 })
      .to(abeja, { scale: 1, opacity: 1, duration: 0.2 })
      // Vuela en curva: sube por encima de los dos puntos y baja al carrito
      // (Math.max evita que la curva se salga por arriba de la pantalla)
      .to(abeja, {
        duration: 0.95,
        ease: 'power1.inOut',
        motionPath: {
          path: [{ x: x0, y: y0 }, { x: x0 + (x1 - x0) * 0.4, y: Math.max(24, Math.min(y0, y1) - 110) }, { x: x1, y: y1 }],
          curviness: 1.3
        }
      }, '<')
      .to(abeja, { scale: 0.2, opacity: 0, duration: 0.15 });
  }, { capture: true });
}

/* --------------------------------------------------------------------------
   2. Scroll: Lenis + ScrollTrigger
   -------------------------------------------------------------------------- */

function iniciarScroll() {
  if (!gsap || reducirMovimiento) return;
  const ScrollTrigger = window.ScrollTrigger;

  // Desplazamiento suave: Lenis calcula el scroll y GSAP lo sincroniza en cada cuadro
  if (window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((tiempo) => lenis.raf(tiempo * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Los títulos de sección suben y aparecen al llegar a ellos
  gsap.utils.toArray('.seccion-encabezado').forEach((encabezado) => {
    gsap.from(encabezado.children, {
      y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: encabezado, start: 'top 85%', once: true }
    });
  });

  // Fondo de panal de "Del monte a tu mesa": se mueve más lento que el scroll
  const pasos = document.querySelector('.pasos');
  if (pasos) {
    gsap.to(pasos, { '--panal-y': '-140px', ease: 'none', scrollTrigger: { trigger: pasos, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // Fotos de los productos: se abren desde un hexágono chico hasta verse enteras.
  // Los dos polígonos tienen 6 puntos, por eso GSAP puede animar entre ellos.
  const HEX_CHICO = 'polygon(50% 38%, 61% 44%, 61% 56%, 50% 62%, 39% 56%, 39% 44%)';
  const HEX_GRANDE = 'polygon(50% -60%, 160% 0%, 160% 100%, 50% 160%, -60% 100%, -60% 0%)';
  function revelarFotos() {
    document.querySelectorAll('.tarjeta-foto:not(.revelada)').forEach((foto) => {
      foto.classList.add('revelada');
      gsap.fromTo(foto, { clipPath: HEX_CHICO }, {
        clipPath: HEX_GRANDE, duration: 1.2, ease: 'power3.inOut', clearProps: 'clipPath',
        scrollTrigger: { trigger: foto, start: 'top 88%', once: true }
      });
    });
  }
  // Las tarjetas las crea js/catalogo.js después del fetch: se espera a que aparezcan
  const lista = document.querySelector('#lista-destacados');
  if (lista) {
    new MutationObserver(() => { revelarFotos(); ScrollTrigger.refresh(); }).observe(lista, { childList: true });
    revelarFotos();
  }
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */
iniciarAbejaCarrito();
iniciarScroll();

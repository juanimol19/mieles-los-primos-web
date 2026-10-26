/* ==========================================================================
   Mieles Los Primos — Efectos visuales (ES module)

   1. Panal 3D en el hero (Three.js): celdas de cera y miel que se mueven
      apenas y siguen al mouse. Se pausa cuando no está en pantalla.
   2. Abejas que vuelan en el hero (GSAP). Si hacés clic en una, da una vuelta.
   3. Al tocar "Agregar al carrito", una abeja lleva el producto hasta el carrito.
   4. Scroll: desplazamiento suave (Lenis), fotos de productos que se abren
      con forma de hexágono y fondo de panal con parallax (GSAP ScrollTrigger).

   GSAP, ScrollTrigger, MotionPathPlugin y Lenis se cargan antes con <script>
   (quedan como variables globales). Three.js se importa como módulo.
   Si la persona pidió "reducir movimiento", casi todo queda quieto.
   ========================================================================== */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

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
    <ellipse class="ala ala-atras" cx="19" cy="9" rx="6" ry="8.5" fill="#FFFFFF" fill-opacity="0.75" stroke="#3B2A1A" stroke-width="1.2"/>
    <ellipse class="ala" cx="25" cy="10" rx="5.5" ry="8" fill="#FFFFFF" fill-opacity="0.85" stroke="#3B2A1A" stroke-width="1.2"/>
    <path d="M8 21l-5 1.5 5 1.5z" fill="#3B2A1A"/>
    <ellipse cx="20" cy="22" rx="12" ry="8" fill="#F6C35A" stroke="#3B2A1A" stroke-width="1.6"/>
    <path d="M16 14.6q-2 7.4 0 14.8M22 14q-2 8 0 16" fill="none" stroke="#3B2A1A" stroke-width="3"/>
    <circle cx="33.5" cy="20.5" r="5" fill="#3B2A1A"/>
    <circle cx="35" cy="19.2" r="1.1" fill="#FFFFFF"/>
    <path d="M34 16q1-5 5-6M36 17q3-4 7-3.5" fill="none" stroke="#3B2A1A" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

function crearAbeja(clase) {
  const abeja = document.createElement('div');
  abeja.className = 'abeja ' + clase;
  abeja.setAttribute('aria-hidden', 'true');
  abeja.innerHTML = SVG_ABEJA;
  return abeja;
}

// Número al azar entre min y max
const azar = (min, max) => min + Math.random() * (max - min);

/* --------------------------------------------------------------------------
   1. Panal 3D (Three.js)
   -------------------------------------------------------------------------- */

// Contorno de un hexágono "con la punta arriba", de radio r
function formaHexagono(r) {
  const forma = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angulo = Math.PI / 3 * i + Math.PI / 6;
    const x = r * Math.cos(angulo);
    const y = r * Math.sin(angulo);
    if (i === 0) forma.moveTo(x, y); else forma.lineTo(x, y);
  }
  forma.closePath();
  return forma;
}

function iniciarPanal3D() {
  const visual = document.querySelector('.hero-visual');
  if (!visual) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'panal-3d';
  canvas.setAttribute('aria-hidden', 'true');
  visual.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (error) {
    canvas.remove(); // sin WebGL queda el hexágono SVG de siempre
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camara.position.set(0, 0, 17);

  // Luces: ambiente cálida, una principal arriba a la izquierda y un reflejo ámbar que gira
  escena.add(new THREE.HemisphereLight(0xfff4dc, 0x6b4a12, 1.1));
  const luzPrincipal = new THREE.DirectionalLight(0xffffff, 2.2);
  luzPrincipal.position.set(-6, 8, 10);
  escena.add(luzPrincipal);
  const reflejo = new THREE.PointLight(0xffb52e, 60, 30);
  escena.add(reflejo);

  // Materiales: cera (mate) y miel (brillante, con "barniz")
  const cera = new THREE.MeshStandardMaterial({ color: 0xf2c46b, roughness: 0.55 });
  const miel = new THREE.MeshPhysicalMaterial({
    color: 0xe0a023, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08,
    emissive: 0x7a4300, emissiveIntensity: 0.25
  });

  // Geometrías: la pared de la celda (hexágono con agujero) y el relleno de miel
  const R = 1;
  const pared = formaHexagono(R);
  pared.holes.push(formaHexagono(R * 0.88));
  const geoPared = new THREE.ExtrudeGeometry(pared, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 2 });
  const geoMiel = new THREE.ExtrudeGeometry(formaHexagono(R * 0.88), { depth: 0.3, bevelEnabled: false });

  // Grilla de panal en coordenadas "axiales" (q, r): la forma estándar de ubicar hexágonos
  const grupo = new THREE.Group();
  const celdas = [];
  const separacion = 1.06;
  const radioGrilla = 6;
  for (let q = -radioGrilla; q <= radioGrilla; q++) {
    for (let r = -radioGrilla; r <= radioGrilla; r++) {
      const s = -q - r;
      const distancia = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (distancia > radioGrilla) continue;
      // En el borde se saltean algunas celdas para que el contorno se vea natural
      if (distancia >= radioGrilla - 1 && Math.random() < 0.45) continue;

      const x = R * Math.sqrt(3) * (q + r / 2) * separacion;
      const y = R * 1.5 * r * separacion;

      const celda = new THREE.Group();
      celda.add(new THREE.Mesh(geoPared, cera));
      if (Math.random() < 0.35) {
        const relleno = new THREE.Mesh(geoMiel, miel);
        relleno.position.z = azar(0.1, 0.25);
        celda.add(relleno);
      }
      celda.position.set(x, y, azar(-0.3, 0.3));
      celda.userData = { zBase: celda.position.z, fase: Math.random() * Math.PI * 2 };
      grupo.add(celda);
      celdas.push(celda);
    }
  }
  grupo.rotation.set(-0.15, 0.2, 0);
  escena.add(grupo);

  // Ancho total del panal (en unidades de Three.js), para encuadrarlo
  const anchoPanal = (radioGrilla * 2 + 1) * R * Math.sqrt(3) * separacion;

  // El canvas toma el tamaño que le da el CSS. La cámara se aleja o se acerca
  // para que el panal ocupe todo el ancho y rodee la foto como un halo.
  function ajustarTamano() {
    const { clientWidth: ancho, clientHeight: alto } = canvas;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    const tangente = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    camara.position.z = anchoPanal / (2 * tangente * camara.aspect) * 0.95;
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(ajustarTamano).observe(canvas);
  ajustarTamano();

  // El mouse inclina el panal; el scroll lo sube un poco (parallax)
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (evento) => {
    mouse.x = evento.clientX / window.innerWidth - 0.5;
    mouse.y = evento.clientY / window.innerHeight - 0.5;
  });

  const reloj = new THREE.Clock();
  function dibujar() {
    const t = reloj.getElapsedTime();
    celdas.forEach((celda) => {
      celda.position.z = celda.userData.zBase + Math.sin(t * 0.9 + celda.userData.fase) * 0.12;
    });
    // "lerp": se acerca de a poco al valor buscado, así el movimiento es suave
    grupo.rotation.y += ((0.2 + mouse.x * 0.4 + Math.sin(t * 0.25) * 0.06) - grupo.rotation.y) * 0.04;
    grupo.rotation.x += ((-0.15 + mouse.y * 0.3) - grupo.rotation.x) * 0.04;
    grupo.position.y = Math.min(window.scrollY, 800) * 0.004;
    reflejo.position.set(Math.cos(t * 0.6) * 6, Math.sin(t * 0.6) * 5, 6);
    renderer.render(escena, camara);
  }

  // Solo se anima mientras el hero se ve en pantalla (ahorra batería)
  let animando = false;
  function bucle() {
    if (!animando) return;
    dibujar();
    requestAnimationFrame(bucle);
  }

  if (reducirMovimiento) {
    dibujar(); // una sola imagen quieta
  } else {
    new IntersectionObserver(([entrada]) => {
      const antes = animando;
      animando = entrada.isIntersecting;
      if (animando && !antes) bucle();
    }).observe(canvas);
  }

  visual.classList.add('con-3d');
  requestAnimationFrame(() => canvas.classList.add('listo'));
}

/* --------------------------------------------------------------------------
   2. Abejas que vuelan en el hero
   -------------------------------------------------------------------------- */

function iniciarAbejasHero() {
  const hero = document.querySelector('.hero');
  const visual = document.querySelector('.hero-visual');
  if (!hero || !visual || !gsap) return;

  const capa = document.createElement('div');
  capa.className = 'abejas-hero';
  hero.append(capa);

  // Zona de vuelo: alrededor de la foto (para no tapar el título)
  function zonaDeVuelo() {
    const h = hero.getBoundingClientRect();
    const v = visual.getBoundingClientRect();
    return {
      xMin: v.left - h.left - v.width * 0.15,
      xMax: v.right - h.left + v.width * 0.05 - 36,
      yMin: v.top - h.top - 20,
      yMax: v.bottom - h.top - 40
    };
  }

  function volar(abeja) {
    const zona = zonaDeVuelo();
    const x = azar(zona.xMin, zona.xMax);
    const y = azar(zona.yMin, zona.yMax);
    // La abeja mira hacia donde va
    const xActual = gsap.getProperty(abeja, 'x');
    gsap.to(abeja.firstElementChild, { scaleX: x < xActual ? -1 : 1, duration: 0.2 });
    gsap.to(abeja, {
      x, y,
      duration: azar(2.4, 4.2),
      ease: 'sine.inOut',
      overwrite: 'auto',
      onComplete: () => gsap.delayedCall(azar(0.2, 1.4), () => volar(abeja))
    });
  }

  const cantidad = window.innerWidth < 768 ? 1 : 2;
  for (let i = 0; i < cantidad; i++) {
    const abeja = crearAbeja('abeja-hero');
    capa.append(abeja);
    // Punto de partida: la primera arriba a la derecha de la foto, la segunda a la izquierda
    const zona = zonaDeVuelo();
    gsap.set(abeja, i === 0
      ? { x: zona.xMax - 10, y: zona.yMin + 40 }
      : { x: zona.xMin + 20, y: (zona.yMin + zona.yMax) / 2 });

    // Con "reducir movimiento" las abejas quedan posadas, sin volar
    if (reducirMovimiento) continue;

    // Flota un poquito arriba y abajo mientras vuela
    gsap.to(abeja.firstElementChild, { y: -5, duration: 0.45, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.delayedCall(i * 0.8, () => volar(abeja));

    // Clic en la abeja: da una vuelta en el aire y sigue volando
    abeja.addEventListener('click', () => {
      gsap.killTweensOf(abeja, 'x,y');
      gsap.timeline({ onComplete: () => volar(abeja) })
        .to(abeja, { rotation: 360, y: '-=40', duration: 0.7, ease: 'back.out(2)' })
        .set(abeja, { rotation: 0 });
    });
  }
}

/* --------------------------------------------------------------------------
   3. Abeja que lleva el producto al carrito
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
   4. Scroll: Lenis + ScrollTrigger
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
iniciarPanal3D();
iniciarAbejasHero();
iniciarAbejaCarrito();
iniciarScroll();

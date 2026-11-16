/* ==========================================================================
   Mieles Los Primos — Escena 3D del inicio (CR-07, ES module)

   Dos frascos de vidrio hechos con Three.js (miel y almendras en miel), cada
   uno con su etiqueta real. Mientras se scrollea por las cuatro pantallas de
   .escena, los frascos se mueven, giran y cambian de lugar, y el fondo cambia
   de color. También siguen un poco al mouse.

   Adaptado del prototipo "Los Primos · Hero 3D" de Claude chat.
   Los frascos son genéricos: cuando estén las fotos reales de los productos,
   se ajustan la forma (perfilFrasco) y las texturas (img/etiqueta-*.webp).

   Cómo funciona el scroll: "progreso" va de 0 (primera pantalla) a 3 (cuarta).
   Para cada frasco hay una "pose" por pantalla (posición, giro y tamaño) y
   entre una pantalla y otra se interpola (se calcula el punto intermedio).
   ========================================================================== */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const escena3d = document.querySelector('.escena');
const canvas = document.querySelector('.escena-canvas');

if (escena3d && canvas) {
  iniciarEscena();
}

function iniciarEscena() {
  const VUELTA = Math.PI * 2;

  /* ---------- Tarjetas que aparecen al llegar a cada pantalla ---------- */
  // La clase .con-js habilita la animación en el CSS: si el JS no carga,
  // las tarjetas se ven igual (no quedan escondidas).
  escena3d.classList.add('con-js');
  const observadorTarjetas = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) entrada.target.classList.add('visible');
    });
  }, { threshold: 0.25 });
  escena3d.querySelectorAll('.escena-tarjeta').forEach((tarjeta) => observadorTarjetas.observe(tarjeta));

  /* ---------- Renderer, escena y cámara ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (error) {
    // Sin WebGL: el CSS muestra las etiquetas como imagen en cada tarjeta
    escena3d.classList.add('sin-3d');
    return;
  }
  // En pantallas de alta densidad se limita a 1.5 para no exigir tanto a la placa de video
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camara.position.set(0, 0, 8);

  /* ---------- Entorno: lo que se refleja en el vidrio ---------- */
  // Se arma una esfera con un degradé (oscuro abajo, claro arriba) y algunos
  // paneles claros que hacen de "ventanas". PMREMGenerator la convierte en un
  // mapa de reflejos que usan los materiales de vidrio y metal.
  (function crearEntorno() {
    const generador = new THREE.PMREMGenerator(renderer);
    const entorno = new THREE.Scene();
    const esfera = new THREE.SphereGeometry(20, 32, 16);
    const posiciones = esfera.attributes.position;
    const colores = [];
    const abajo = new THREE.Color('#102418');
    const arriba = new THREE.Color('#d8e8d4');
    const color = new THREE.Color();
    for (let i = 0; i < posiciones.count; i++) {
      const altura = (posiciones.getY(i) / 20 + 1) / 2; // de 0 (abajo) a 1 (arriba)
      color.copy(abajo).lerp(arriba, Math.pow(altura, 1.4));
      colores.push(color.r, color.g, color.b);
    }
    esfera.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
    entorno.add(new THREE.Mesh(esfera, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));

    function panel(ancho, alto, x, y, z, brillo) {
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(brillo, brillo, brillo * 0.96), side: THREE.DoubleSide });
      const malla = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), material);
      malla.position.set(x, y, z);
      malla.lookAt(0, 0, 0);
      entorno.add(malla);
    }
    panel(9, 3, -9, 6, 7, 7);
    panel(3, 9, 10, 1, 5, 5);
    panel(12, 2.4, 0, 10, -2, 4);
    panel(5, 5, -4, -3, 9, 1.6);

    escena.environment = generador.fromScene(entorno, 0.03).texture;
    generador.dispose();
  })();

  /* ---------- Luces ---------- */
  escena.add(new THREE.AmbientLight(0xffffff, 0.3));
  const luzPrincipal = new THREE.DirectionalLight(0xfff1d6, 2.2);
  luzPrincipal.position.set(-4, 5, 6);
  escena.add(luzPrincipal);
  const luzContra = new THREE.DirectionalLight(0xffd9a0, 4.5); // contraluz cálida: hace brillar el borde del vidrio
  luzContra.position.set(5, 2, -4);
  escena.add(luzContra);

  /* ---------- Fondo: manchas de color desenfocadas ---------- */
  // Se dibuja en un <canvas> 2D chico y se usa como textura de un plano detrás
  // de los frascos. Así el vidrio "refracta" (deforma) los colores del fondo.
  // Un juego de colores por pantalla: verde del logo, beige con dorado suave
  // (miel), beige más tostado (almendras) y verde otra vez.
  const FONDOS = [
    { base: '#0d2216', manchas: ['#2f6a45', '#6f9a52', '#c9973a'] },
    { base: '#efe5cf', manchas: ['#e6c47e', '#fbf6ea', '#d8b06a'] },
    { base: '#ebe1cc', manchas: ['#d6bf98', '#f7f1e3', '#c8a473'] },
    { base: '#0d2216', manchas: ['#2f6a45', '#c9973a', '#5f8f4d'] }
  ].map((fondo) => ({
    base: new THREE.Color(fondo.base),
    manchas: fondo.manchas.map((hex) => new THREE.Color(hex))
  }));

  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = 288;
  const pincel = lienzo.getContext('2d');
  const texturaFondo = new THREE.CanvasTexture(lienzo);
  texturaFondo.colorSpace = THREE.SRGBColorSpace;
  const planoFondo = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texturaFondo, toneMapped: false })
  );
  planoFondo.position.z = -4;
  escena.add(planoFondo);

  const fondoActual = { base: new THREE.Color(), manchas: [new THREE.Color(), new THREE.Color(), new THREE.Color()] };
  const aRgb = (c, alfa) => `rgba(${(c.r * 255) | 0}, ${(c.g * 255) | 0}, ${(c.b * 255) | 0}, ${alfa})`;
  // Posición (x, y) y tamaño de cada mancha, en proporción al lienzo
  const MANCHAS = [[0.22, 0.3, 0.6], [0.78, 0.65, 0.7], [0.55, 0.18, 0.45], [0.12, 0.85, 0.5], [0.9, 0.15, 0.42]];

  function suavizar(u) {
    return u * u * (3 - 2 * u); // "smoothstep": arranca y termina despacio
  }

  function pintarFondo(progreso, tiempo) {
    const i = Math.min(FONDOS.length - 2, Math.max(0, Math.floor(progreso)));
    const u = suavizar(Math.min(1, Math.max(0, progreso - i)));
    fondoActual.base.copy(FONDOS[i].base).lerp(FONDOS[i + 1].base, u);
    for (let k = 0; k < 3; k++) {
      fondoActual.manchas[k].copy(FONDOS[i].manchas[k]).lerp(FONDOS[i + 1].manchas[k], u);
    }

    pincel.fillStyle = aRgb(fondoActual.base, 1);
    pincel.fillRect(0, 0, 512, 288);
    MANCHAS.forEach(([mx, my, tam], j) => {
      // Las manchas se mueven despacito en círculos
      const x = (mx + Math.sin(tiempo * 0.18 + j * 1.7) * 0.07) * 512;
      const y = (my + Math.cos(tiempo * 0.15 + j * 2.3) * 0.08) * 288;
      const color = fondoActual.manchas[j % 3];
      const degrade = pincel.createRadialGradient(x, y, 0, x, y, tam * 300);
      degrade.addColorStop(0, aRgb(color, 1));
      degrade.addColorStop(1, aRgb(color, 0));
      pincel.fillStyle = degrade;
      pincel.fillRect(0, 0, 512, 288);
    });
    // Viñeta: oscurece apenas los bordes
    const vineta = pincel.createRadialGradient(256, 144, 80, 256, 144, 320);
    vineta.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vineta.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
    pincel.fillStyle = vineta;
    pincel.fillRect(0, 0, 512, 288);
    texturaFondo.needsUpdate = true;
  }

  /* ---------- Frascos ---------- */
  // LatheGeometry hace un "torneado": gira un perfil (lista de puntos x, y)
  // alrededor del eje vertical, como un alfarero con el torno.
  function tornear(puntos) {
    return new THREE.LatheGeometry(puntos.map(([x, y]) => new THREE.Vector2(x, y)), 72);
  }

  // Perfil del vidrio: base con esquina redondeada, cuerpo recto, hombro y boca
  function perfilFrasco() {
    const puntos = [[0, -1], [0.6, -1]];
    const radio = 0.2;
    for (let i = 0; i <= 10; i++) {
      const angulo = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
      puntos.push([1 - radio + radio * Math.cos(angulo), -1 + radio + radio * Math.sin(angulo)]);
    }
    puntos.push([1, 0.7]);
    // Hombro: curva de Bézier cuadrática desde el cuerpo hasta el cuello
    for (let i = 1; i <= 14; i++) {
      const u = i / 14;
      const x = (1 - u) * (1 - u) * 1 + 2 * (1 - u) * u * 1 + u * u * 0.74;
      const y = (1 - u) * (1 - u) * 0.7 + 2 * (1 - u) * u * 1.02 + u * u * 1.14;
      puntos.push([x, y]);
    }
    puntos.push([0.74, 1.34], [0.78, 1.36]);
    return puntos;
  }

  // Perfil de la miel: un poco más chico que el vidrio, para que quede adentro
  function perfilMiel() {
    const puntos = [[0, -0.93], [0.55, -0.93]];
    const radio = 0.18;
    for (let i = 0; i <= 10; i++) {
      const angulo = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
      puntos.push([0.93 - radio + radio * Math.cos(angulo), -0.93 + radio + radio * Math.sin(angulo)]);
    }
    puntos.push([0.93, 0.8], [0.8, 0.84], [0, 0.84]);
    return puntos;
  }

  const geoVidrio = tornear(perfilFrasco());
  const geoMiel = tornear(perfilMiel());

  // La miel es más oscura abajo y más clara arriba (un color por vértice)
  (function degradeMiel() {
    const posiciones = geoMiel.attributes.position;
    const colores = [];
    const oscuro = new THREE.Color('#3a1500');
    const claro = new THREE.Color('#a45600');
    const color = new THREE.Color();
    for (let i = 0; i < posiciones.count; i++) {
      const altura = Math.min(1, Math.max(0, (posiciones.getY(i) + 0.93) / 1.77));
      color.copy(oscuro).lerp(claro, altura);
      colores.push(color.r, color.g, color.b);
    }
    geoMiel.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  })();

  const cargador = new THREE.TextureLoader();
  function textura(ruta) {
    const t = cargador.load(ruta);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  const TEXTURAS = {
    miel: textura('img/etiqueta-miel.webp'),
    almendras: textura('img/etiqueta-almendras.webp'),
    logo: textura('img/logo.webp')
  };

  // Etiqueta curva: un pedazo de cilindro apenas más grande que el frasco
  function etiqueta(radio, alto, largo, centro, mapa) {
    const angulo = largo / radio;
    return new THREE.Mesh(
      new THREE.CylinderGeometry(radio, radio, alto, 48, 1, true, centro - angulo / 2, angulo),
      new THREE.MeshStandardMaterial({ map: mapa, transparent: true, roughness: 0.62, envMapIntensity: 0.35 })
    );
  }

  function crearFrasco(texturaEtiqueta, tonoMiel) {
    const frasco = new THREE.Group();

    const miel = new THREE.Mesh(geoMiel, new THREE.MeshPhysicalMaterial({
      vertexColors: true, color: tonoMiel, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08,
      emissive: new THREE.Color('#8a4200'), emissiveIntensity: 0.5
    }));
    frasco.add(miel);

    // Vidrio: "transmission" deja pasar la luz y "ior" (1.5, como el vidrio real) la desvía
    const vidrio = new THREE.Mesh(geoVidrio, new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.8, ior: 1.5,
      envMapIntensity: 0.9, clearcoat: 1, clearcoatRoughness: 0.03
    }));
    frasco.add(vidrio);

    // Tapa dorada metálica, con un anillo más oscuro abajo
    const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.34, 72),
      new THREE.MeshStandardMaterial({ color: 0xc9973a, metalness: 1, roughness: 0.32, envMapIntensity: 1.4 }));
    tapa.position.y = 1.47;
    frasco.add(tapa);
    const anillo = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.07, 72),
      new THREE.MeshStandardMaterial({ color: 0x8a6420, metalness: 1, roughness: 0.4, envMapIntensity: 1.2 }));
    anillo.position.y = 1.31;
    frasco.add(anillo);
    const tapaArriba = new THREE.Mesh(new THREE.CircleGeometry(0.82, 64),
      new THREE.MeshStandardMaterial({ color: 0xd7a947, metalness: 1, roughness: 0.28, envMapIntensity: 1.4 }));
    tapaArriba.rotation.x = -Math.PI / 2;
    tapaArriba.position.y = 1.645;
    frasco.add(tapaArriba);

    // Etiqueta adelante y logo atrás (centro en Math.PI = media vuelta)
    const frente = etiqueta(1.016, 1.0, 1.62, 0, texturaEtiqueta);
    frente.position.y = -0.08;
    frasco.add(frente);
    const dorso = etiqueta(1.016, 0.8, 0.8, Math.PI, TEXTURAS.logo);
    dorso.position.y = -0.05;
    frasco.add(dorso);

    // El grupo "soporte" se mueve y gira; el frasco va un poco más abajo para que gire sobre su centro
    const soporte = new THREE.Group();
    frasco.position.y = -0.2;
    soporte.add(frasco);
    escena.add(soporte);
    return soporte;
  }

  const frascoMiel = crearFrasco(TEXTURAS.miel, new THREE.Color('#ffffff'));
  const frascoAlmendras = crearFrasco(TEXTURAS.almendras, new THREE.Color('#ffe2b0'));

  /* ---------- Polen flotante ---------- */
  const CANTIDAD_POLEN = window.innerWidth < 768 ? 60 : 110;
  const geoPolen = new THREE.BufferGeometry();
  const posPolen = new Float32Array(CANTIDAD_POLEN * 3);
  const fasePolen = [];
  for (let i = 0; i < CANTIDAD_POLEN; i++) {
    posPolen[i * 3] = (Math.random() - 0.5) * 14;
    posPolen[i * 3 + 1] = (Math.random() - 0.5) * 8;
    posPolen[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    fasePolen.push(Math.random() * VUELTA);
  }
  geoPolen.setAttribute('position', new THREE.BufferAttribute(posPolen, 3));
  // Cada grano es un puntito con brillo: un degradé radial dibujado en un canvas
  const granito = document.createElement('canvas');
  granito.width = granito.height = 64;
  const ctxGranito = granito.getContext('2d');
  const brillo = ctxGranito.createRadialGradient(32, 32, 0, 32, 32, 32);
  brillo.addColorStop(0, 'rgba(255, 225, 150, 1)');
  brillo.addColorStop(0.35, 'rgba(255, 200, 90, 0.5)');
  brillo.addColorStop(1, 'rgba(255, 200, 90, 0)');
  ctxGranito.fillStyle = brillo;
  ctxGranito.fillRect(0, 0, 64, 64);
  const polen = new THREE.Points(geoPolen, new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(granito), size: 0.16, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8
  }));
  polen.position.z = 0.5;
  escena.add(polen);

  /* ---------- Poses de cada frasco por pantalla ---------- */
  // Cada fila: [pantalla, x, y, z, giro en Y, inclinación en Z, escala].
  // En pantallas anchas los frascos van al costado de las tarjetas;
  // en el celular van arriba y las tarjetas abajo.
  let POSES;
  function calcularPoses(ancha, proporcion) {
    const X = ancha ? Math.min(2.3, 1.15 * proporcion) : 0;
    const Y = ancha ? 0 : 1.9;
    const juntos = ancha ? 1.55 : 1.25;
    return {
      miel: [
        [0, X, ancha ? -0.05 : Y, 0, 0.55, 0.05, 1.1],
        [1, X, Y, 0, 0.55 + VUELTA, -0.1, 1.12],
        [2, X + 5.5, 2.6, -1.5, 0.55 + VUELTA * 1.6, 0.7, 0.7], // se va por arriba a la derecha
        [3, -juntos, ancha ? 0.55 : 2.2, 0, VUELTA * 2 + 0.35, 0.1, ancha ? 0.74 : 0.62]
      ],
      almendras: [
        [0, -3, -7, -1, -1, 0, 0.8], // escondido abajo
        [1, -X - 4, -3.6, -1.5, -0.4 + VUELTA * 0.5, 0.3, 0.75],
        [2, -X, Y, 0, 0.45, 0.1, 1.12],
        [3, juntos, ancha ? 0.55 : 2.2, 0, VUELTA - 0.35, -0.1, ancha ? 0.74 : 0.62]
      ]
    };
  }

  // Devuelve la pose intermedia para un progreso dado (por ejemplo 1.5 = mitad entre pantalla 2 y 3)
  function poseEn(poses, progreso) {
    const ultima = poses.length - 1;
    if (progreso <= poses[0][0]) return poses[0];
    if (progreso >= poses[ultima][0]) return poses[ultima];
    let i = 0;
    while (progreso > poses[i + 1][0]) i++;
    const a = poses[i];
    const b = poses[i + 1];
    const u = suavizar((progreso - a[0]) / (b[0] - a[0]));
    return a.map((valor, k) => valor + (b[k] - valor) * u);
  }

  /* ---------- Tamaño ---------- */
  function ajustarTamano() {
    const ancho = canvas.clientWidth;
    const alto = canvas.clientHeight;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    // En pantallas angostas la cámara se aleja para que entren los frascos
    camara.position.z = Math.max(8, 6.7 / camara.aspect);
    camara.updateProjectionMatrix();
    // El plano del fondo tiene que tapar toda la vista de la cámara
    const distancia = camara.position.z - planoFondo.position.z;
    const altoVisible = 2 * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * distancia * 1.15;
    planoFondo.scale.set(altoVisible * camara.aspect, altoVisible, 1);
    POSES = calcularPoses(camara.aspect > 1.05, camara.aspect);
  }
  new ResizeObserver(ajustarTamano).observe(canvas);
  ajustarTamano();

  /* ---------- Mouse ---------- */
  const mouse = { x: 0, y: 0, objetivoX: 0, objetivoY: 0 };
  window.addEventListener('pointermove', (evento) => {
    mouse.objetivoX = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.objetivoY = (evento.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- Progreso del scroll ---------- */
  // 0 cuando la escena empieza arriba de la pantalla; 3 en la última pantalla
  function progresoScroll() {
    const arriba = escena3d.getBoundingClientRect().top;
    const altoPantalla = canvas.clientHeight || window.innerHeight;
    return Math.min(3, Math.max(0, -arriba / altoPantalla));
  }

  /* ---------- Bucle de animación ---------- */
  const reloj = new THREE.Clock();
  let progreso = progresoScroll();
  const actual = { miel: null, almendras: null };

  // Acerca el frasco a su pose de a poco ("amortiguación"): el movimiento queda suave.
  // Se usa el tiempo entre cuadros (dt) para que vaya igual a 30 o a 60 cuadros por segundo.
  function mover(frasco, nombre, objetivo, dt, tiempo) {
    if (!actual[nombre]) actual[nombre] = objetivo.slice();
    const pose = actual[nombre];
    const factor = 1 - Math.pow(0.0009, dt);
    for (let k = 1; k < 7; k++) pose[k] += (objetivo[k] - pose[k]) * factor;
    const flotar = Math.sin(tiempo * 1.1 + (nombre === 'almendras' ? 1.7 : 0)) * 0.05;
    frasco.position.set(pose[1], pose[2] + flotar, pose[3]);
    frasco.rotation.set(mouse.y * 0.22, pose[4] + mouse.x * 0.35, pose[5]);
    frasco.scale.setScalar(pose[6]);
  }

  function dibujar() {
    const dt = Math.min(0.05, reloj.getDelta());
    const tiempo = reloj.elapsedTime;

    progreso += (progresoScroll() - progreso) * (1 - Math.pow(0.0004, dt));
    mouse.x += (mouse.objetivoX - mouse.x) * 0.06;
    mouse.y += (mouse.objetivoY - mouse.y) * 0.06;

    mover(frascoMiel, 'miel', poseEn(POSES.miel, progreso), dt, tiempo);
    mover(frascoAlmendras, 'almendras', poseEn(POSES.almendras, progreso), dt, tiempo);
    pintarFondo(progreso, tiempo);

    // El polen sube despacio y, al salir por arriba, vuelve a aparecer abajo
    const p = geoPolen.attributes.position.array;
    for (let i = 0; i < CANTIDAD_POLEN; i++) {
      p[i * 3 + 1] += Math.sin(tiempo * 0.4 + fasePolen[i]) * 0.0016 + 0.0012;
      if (p[i * 3 + 1] > 4.2) p[i * 3 + 1] = -4.2;
    }
    geoPolen.attributes.position.needsUpdate = true;
    polen.rotation.y = Math.sin(tiempo * 0.1) * 0.15;

    renderer.render(escena, camara);
  }

  // Solo se dibuja mientras la escena se ve en pantalla (ahorra batería y procesador)
  let animando = false;
  function bucle() {
    if (!animando) return;
    dibujar();
    requestAnimationFrame(bucle);
  }
  new IntersectionObserver(([entrada]) => {
    const antes = animando;
    animando = entrada.isIntersecting;
    if (animando && !antes) {
      reloj.getDelta(); // descarta el tiempo que estuvo pausada
      bucle();
    }
  }).observe(escena3d);

  escena3d.classList.add('con-3d');
}

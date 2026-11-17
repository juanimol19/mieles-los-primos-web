/* ==========================================================================
   Mieles Los Primos — Escena 3D del inicio (CR-07, ES module)

   Los cuatro envases reales hechos con Three.js (botellas de miel líquida de
   800 g y 400 g, frasco de almendras en miel y frasco de polen), con sus
   medidas, tapa negra, tira de seguridad y etiqueta. Mientras se scrollea por
   las cinco pantallas de .escena, los envases se mueven, giran y cambian de
   lugar, y el fondo cambia de color. También siguen un poco al mouse.

   Adaptado del prototipo "Los Primos · Hero 3D" de Claude chat.

   Cómo funciona el scroll: "progreso" va de 0 (primera pantalla) a 4 (quinta).
   Para cada envase hay una "pose" por pantalla (posición, giro y tamaño) y
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
  // (miel), beige más tostado (almendras), beige amarillento (polen) y verde otra vez.
  const FONDOS = [
    { base: '#0d2216', manchas: ['#2f6a45', '#6f9a52', '#c9973a'] },
    { base: '#efe5cf', manchas: ['#e6c47e', '#fbf6ea', '#d8b06a'] },
    { base: '#ebe1cc', manchas: ['#d6bf98', '#f7f1e3', '#c8a473'] },
    { base: '#f0e7cd', manchas: ['#e8cf72', '#fbf6ea', '#d9b452'] },
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

  /* ---------- Envases (botellas y frascos reales) ---------- */
  // Todas las medidas van en centímetros, como las tomó Juana. Lo que ella midió
  // como "diámetro" es la vuelta del envase (el perímetro), así que el radio es
  // perímetro / (2 × π). Después cada envase se escala al tamaño que se ve en pantalla.

  // LatheGeometry hace un "torneado": gira un perfil (lista de puntos x, y)
  // alrededor del eje vertical, como un alfarero con el torno.
  function tornear(puntos, segmentos = 72) {
    return new THREE.LatheGeometry(puntos.map(([x, y]) => new THREE.Vector2(x, y)), segmentos);
  }

  // Ancho del perfil a una altura dada (sirve para apoyar la tira de seguridad sobre el vidrio)
  function anchoEn(perfil, y) {
    for (let i = 1; i < perfil.length; i++) {
      const [x0, y0] = perfil[i - 1];
      const [x1, y1] = perfil[i];
      if (y0 <= y && y <= y1 && y0 !== y1) return x0 + (x1 - x0) * ((y - y0) / (y1 - y0));
    }
    return perfil[perfil.length - 1][0];
  }

  // Esquina redondeada de la base: un cuarto de círculo de radio "curva"
  function base(radio, curva) {
    const puntos = [[0, 0], [radio - curva, 0]];
    for (let i = 1; i <= 8; i++) {
      const angulo = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
      puntos.push([radio - curva + curva * Math.cos(angulo), curva + curva * Math.sin(angulo)]);
    }
    return puntos;
  }

  // Botella: cuerpo recto, hombro largo (curva de Bézier cúbica) y cuello angosto
  function perfilBotella(radio, alto, inicioHombro, finHombro, radioCuello) {
    const puntos = base(radio, 0.55);
    puntos.push([radio, inicioHombro]);
    const c1 = inicioHombro + (finHombro - inicioHombro) * 0.55; // puntos de control de la curva
    const c2 = finHombro - (finHombro - inicioHombro) * 0.35;
    for (let i = 1; i <= 18; i++) {
      const u = i / 18;
      const m = 1 - u;
      const x = m * m * m * radio + 3 * m * m * u * radio + 3 * m * u * u * radioCuello + u * u * u * radioCuello;
      const y = m * m * m * inicioHombro + 3 * m * m * u * c1 + 3 * m * u * u * c2 + u * u * u * finHombro;
      puntos.push([x, y]);
    }
    puntos.push([radioCuello, alto], [radioCuello + 0.12, alto]);
    return puntos;
  }

  // Frasco bajo: cuerpo recto y un hombro corto hasta la boca ancha
  function perfilFrasco(radio, alto, radioBoca) {
    const puntos = base(radio, 0.7);
    const y0 = alto - 1.7;
    const y1 = alto - 0.35;
    puntos.push([radio, y0]);
    for (let i = 1; i <= 10; i++) {
      const u = i / 10;
      const m = 1 - u;
      puntos.push([
        m * m * radio + 2 * m * u * radio + u * u * radioBoca,
        m * m * y0 + 2 * m * u * (y0 + (y1 - y0) * 0.8) + u * u * y1
      ]);
    }
    puntos.push([radioBoca, alto], [radioBoca + 0.1, alto]);
    return puntos;
  }

  const cargador = new THREE.TextureLoader();
  function textura(ruta) {
    const t = cargador.load(ruta);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  const TEXTURAS = {
    liquida800: textura('img/etiqueta-liquida-800.webp'),
    liquida400: textura('img/etiqueta-liquida-400.webp'),
    almendras: textura('img/etiqueta-almendras.webp'),
    polen: textura('img/etiqueta-polen.webp'),
    sticker: textura('img/sticker-tapa.webp')
  };

  // Contenido de los frascos: almendras o granos de polen dibujados en un <canvas>
  function texturaContenido(tipo) {
    const lienzoContenido = document.createElement('canvas');
    lienzoContenido.width = 512;
    lienzoContenido.height = 256;
    const ctx = lienzoContenido.getContext('2d');
    if (tipo === 'almendras') {
      const degrade = ctx.createLinearGradient(0, 0, 0, 256);
      degrade.addColorStop(0, '#cf8a16');
      degrade.addColorStop(1, '#98520a');
      ctx.fillStyle = degrade;
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 46; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const giro = Math.random() * Math.PI;
        // Se dibuja también corrida 512 px a cada lado para que la textura empalme al dar la vuelta
        for (const corrimiento of [-512, 0, 512]) {
          ctx.save();
          ctx.translate(x + corrimiento, y);
          ctx.rotate(giro);
          ctx.beginPath();
          ctx.ellipse(0, 0, 36, 20, 0, 0, VUELTA);
          ctx.fillStyle = '#a45f2b';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#4f270a';
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(-7, -6, 18, 6, 0, 0, VUELTA);
          ctx.fillStyle = 'rgba(255, 215, 160, 0.2)';
          ctx.fill();
          ctx.restore();
        }
      }
    } else {
      ctx.fillStyle = '#7d4a06';
      ctx.fillRect(0, 0, 512, 256);
      const colores = ['#dca01a', '#e6b53a', '#c77016', '#8a4a10', '#e2bb48'];
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const r = 3 + Math.random() * 4.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, VUELTA);
        ctx.fillStyle = colores[(Math.random() * colores.length) | 0];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, VUELTA); // brillito de cada grano
        ctx.fillStyle = 'rgba(255, 240, 190, 0.28)';
        ctx.fill();
      }
    }
    const t = new THREE.CanvasTexture(lienzoContenido);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(2, 1);
    return t;
  }

  // Etiqueta curva: un pedazo de cilindro apenas más grande que el envase.
  // Las etiquetas de la miel líquida y del polen salen de fotos de frente, donde
  // los bordes se ven "aplastados": modo 'foto' reacomoda la textura para compensarlo.
  function crearEtiqueta(radio, alto, anguloMax, mapa, modo) {
    const geometria = new THREE.CylinderGeometry(radio, radio, alto, 56, 1, true, -anguloMax, 2 * anguloMax);
    if (modo === 'foto') {
      const pos = geometria.attributes.position;
      const uv = geometria.attributes.uv;
      const seno = Math.sin(anguloMax);
      for (let i = 0; i < pos.count; i++) {
        const angulo = Math.atan2(pos.getX(i), pos.getZ(i));
        uv.setX(i, (Math.sin(angulo) / seno + 1) / 2);
      }
      uv.needsUpdate = true;
    }
    return new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({
      map: mapa, transparent: true, alphaTest: 0.02, roughness: 0.6, envMapIntensity: 0.3
    }));
  }

  const COLOR_TIRA = '#22343a'; // tira de seguridad que cruza la tapa

  function crearEnvase(datos) {
    const envase = new THREE.Group();
    const perfil = datos.perfil;

    // 1. Contenido: el mismo perfil del vidrio, un poco más chico y hasta la altura de llenado
    const perfilContenido = perfil
      .filter(([, y]) => y <= datos.llenado)
      .map(([x, y]) => [Math.max(0, x - 0.25), Math.max(y, 0.25)]);
    const ultimo = perfilContenido[perfilContenido.length - 1];
    perfilContenido.push([ultimo[0], datos.llenado], [0, datos.llenado]);
    const geoContenido = tornear(perfilContenido, 64);
    let materialContenido;
    if (datos.contenido === 'miel') {
      // La miel es más oscura abajo y más clara arriba (un color por vértice)
      const pos = geoContenido.attributes.position;
      const colores = [];
      const oscuro = new THREE.Color('#4a2000');
      const claro = new THREE.Color('#c97a0a');
      const color = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        color.copy(oscuro).lerp(claro, Math.min(1, Math.max(0, pos.getY(i) / datos.llenado)));
        colores.push(color.r, color.g, color.b);
      }
      geoContenido.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
      materialContenido = new THREE.MeshPhysicalMaterial({
        vertexColors: true, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08,
        emissive: new THREE.Color('#8a4200'), emissiveIntensity: 0.5
      });
    } else {
      // Almendras o polen: la textura se estira de abajo (0) hasta el nivel de llenado (1)
      const uv = geoContenido.attributes.uv;
      const pos = geoContenido.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setY(i, pos.getY(i) / datos.llenado);
      uv.needsUpdate = true;
      const esAlmendra = datos.contenido === 'almendras';
      materialContenido = new THREE.MeshStandardMaterial({
        map: texturaContenido(datos.contenido), roughness: 0.4,
        emissive: new THREE.Color(esAlmendra ? '#6b3200' : '#4a2c00'), emissiveIntensity: esAlmendra ? 0.22 : 0.08
      });
    }
    envase.add(new THREE.Mesh(geoContenido, materialContenido));

    // 2. Vidrio: "transmission" deja pasar la luz e "ior" (índice de refracción) la desvía
    envase.add(new THREE.Mesh(tornear(perfil), new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: datos.grosor, ior: 1.45,
      envMapIntensity: 0.9, clearcoat: 1, clearcoatRoughness: 0.03
    })));

    // 3. Tapa negra
    const tapa = new THREE.Mesh(
      new THREE.CylinderGeometry(datos.radioTapa, datos.radioTapa, datos.altoTapa, 72),
      new THREE.MeshStandardMaterial({ color: 0x101112, roughness: 0.36, metalness: 0.55, envMapIntensity: 1.1 })
    );
    tapa.position.y = datos.alto + datos.altoTapa / 2;
    envase.add(tapa);

    // 4. Tira de seguridad: cruza la tapa por arriba, baja por el costado y sigue por el vidrio
    const arribaTapa = datos.alto + datos.altoTapa;
    const anchoTira = 0.45;
    const materialTira = new THREE.MeshStandardMaterial({ color: COLOR_TIRA, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide });
    const tiraArriba = new THREE.Mesh(new THREE.PlaneGeometry(anchoTira, datos.radioTapa * 1.96), materialTira);
    tiraArriba.rotation.x = -Math.PI / 2;
    tiraArriba.position.y = arribaTapa + 0.015;
    envase.add(tiraArriba);
    const anguloTapa = anchoTira / datos.radioTapa;
    const tiraCostado = new THREE.Mesh(
      new THREE.CylinderGeometry(datos.radioTapa + 0.03, datos.radioTapa + 0.03, datos.altoTapa, 10, 1, true, -anguloTapa / 2, anguloTapa),
      materialTira
    );
    tiraCostado.position.y = tapa.position.y;
    envase.add(tiraCostado);
    const perfilTira = perfil.filter(([, y]) => y >= datos.finTira).map(([x, y]) => [x + 0.035, y]);
    perfilTira.unshift([anchoEn(perfil, datos.finTira) + 0.035, datos.finTira]);
    const anguloVidrio = anchoTira / Math.max(datos.radioCuello, 2.2);
    envase.add(new THREE.Mesh(
      new THREE.LatheGeometry(perfilTira.map(([x, y]) => new THREE.Vector2(x, y)), 6, -anguloVidrio / 2, anguloVidrio),
      materialTira
    ));

    // 5. Sticker redondo con las abejas arriba de la tapa
    const sticker = new THREE.Mesh(
      new THREE.CircleGeometry(datos.radioTapa * 0.62, 48),
      new THREE.MeshStandardMaterial({ map: TEXTURAS.sticker, transparent: true, roughness: 0.7 })
    );
    sticker.rotation.x = -Math.PI / 2;
    sticker.position.y = arribaTapa + 0.03;
    envase.add(sticker);

    // 6. Etiqueta: su alto sale del ancho y de la proporción de la imagen
    const anchoEtiqueta = 2 * datos.radio * Math.sin(datos.anguloEtiqueta);
    const etiqueta = crearEtiqueta(datos.radio + 0.03, anchoEtiqueta / datos.proporcion, datos.anguloEtiqueta, datos.etiqueta, datos.modo);
    etiqueta.position.y = datos.alturaEtiqueta;
    envase.add(etiqueta);

    // El "soporte" es el que se mueve y gira; el envase va centrado para que gire sobre su mitad
    const soporte = new THREE.Group();
    envase.position.y = -arribaTapa / 2;
    soporte.add(envase);
    soporte.userData.alto = arribaTapa; // para escalarlo al tamaño que se ve en pantalla
    escena.add(soporte);
    return soporte;
  }

  // Medidas de Juana: alto del vidrio y vuelta (perímetro) en cm
  const R800 = 21.5 / VUELTA;
  const R400 = 18 / VUELTA;
  const RFRASCO = 21 / VUELTA;

  const ENVASES = {
    botella800: crearEnvase({
      contenido: 'miel', radio: R800, alto: 20, perfil: perfilBotella(R800, 20, 15.8, 18.6, 1.6), grosor: 3,
      radioTapa: 1.75, altoTapa: 1.4, radioCuello: 1.6, llenado: 19, finTira: 15.4,
      etiqueta: TEXTURAS.liquida800, modo: 'foto', anguloEtiqueta: Math.asin(0.83), proporcion: 0.563, alturaEtiqueta: 9.4
    }),
    botella400: crearEnvase({
      contenido: 'miel', radio: R400, alto: 15, perfil: perfilBotella(R400, 15, 11.4, 13.6, 1.95), grosor: 2.6,
      radioTapa: 2.15, altoTapa: 1.6, radioCuello: 1.95, llenado: 14, finTira: 11.5,
      etiqueta: TEXTURAS.liquida400, modo: 'foto', anguloEtiqueta: Math.asin(0.85), proporcion: 0.532, alturaEtiqueta: 6.9
    }),
    almendras: crearEnvase({
      contenido: 'almendras', radio: RFRASCO, alto: 8, perfil: perfilFrasco(RFRASCO, 8, 3), grosor: 1.4,
      radioTapa: 3.3, altoTapa: 1.3, radioCuello: 3, llenado: 7.2, finTira: 5.4,
      etiqueta: TEXTURAS.almendras, modo: 'plana', anguloEtiqueta: 1.12, proporcion: 1.616, alturaEtiqueta: 3.3
    }),
    polen: crearEnvase({
      contenido: 'polen', radio: RFRASCO, alto: 8, perfil: perfilFrasco(RFRASCO, 8, 3), grosor: 1.4,
      radioTapa: 3.3, altoTapa: 1.3, radioCuello: 3, llenado: 7.2, finTira: 6,
      etiqueta: TEXTURAS.polen, modo: 'foto', anguloEtiqueta: Math.asin(0.92), proporcion: 1.301, alturaEtiqueta: 3.6
    })
  };

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

  /* ---------- Poses de cada envase por pantalla ---------- */
  // Cada fila: [pantalla, x, y, z, giro en Y, inclinación en Z, alto en pantalla].
  // Pantallas: 0 inicio, 1 miel líquida, 2 almendras, 3 polen, 4 historia.
  // Un envase que "no está" en esa pantalla se esconde arriba (y = 6.5) o abajo (y = -7.5).
  // En pantallas anchas van al costado de las tarjetas; en el celular, arriba.
  let POSES;
  function calcularPoses(ancha, proporcion) {
    const V = VUELTA;
    if (ancha) {
      const X = Math.min(2.3, 1.15 * proporcion);
      return {
        botella800: [[0, X, -0.05, 0, 0.55, 0.05, 3.05], [1, X + 0.9, 0, 0, 0.55 + V, -0.08, 3.05], [2, X + 0.9, 6.5, -2, 0.55 + V * 1.6, 0.5, 2.4], [3, X + 0.9, 6.5, -2, 0.55 + V * 1.6, 0.5, 2.4], [4, -3.3, 1.02, 0, V * 2 + 0.4, 0.06, 1.95]],
        botella400: [[0, X - 0.95, -7.5, -1, 0.2, 0.2, 2.3], [1, X - 0.95, -0.05, 0, 0.5 + V * 0.7, 0.06, 2.3], [2, X - 0.95, 6.5, -2, 0.5 + V * 1.3, 0.3, 1.9], [3, X - 0.95, 6.5, -2, 0.5 + V * 1.3, 0.3, 1.9], [4, -1.1, 0.75, 0, V * 2 + 0.3, 0.05, 1.5]],
        almendras: [[0, -X, -7.5, -1, 0, 0, 2.4], [1, -X, -7.5, -1, 0, 0, 2.4], [2, -X, 0, 0, 0.45, 0.08, 2.7], [3, -X, 6.5, -2, 0.45 + V * 1.5, 0.5, 2.4], [4, 1.1, 0.55, 0, V * 2 - 0.35, -0.06, 1.05]],
        polen: [[0, X, -7.5, -1, 0, 0, 2.4], [1, X, -7.5, -1, 0, 0, 2.4], [2, X, -7.5, -1, 0, 0, 2.4], [3, X, 0, 0, -0.5, 0.06, 2.7], [4, 3.3, 0.55, 0, V - 0.4, -0.06, 1.05]]
      };
    }
    return {
      botella800: [[0, 0, 2, 0, 0.55, 0.05, 3.2], [1, 0.85, 2.2, 0, 0.55 + V, -0.08, 2.9], [2, 0.85, 6.5, -2, 0.55 + V * 1.6, 0.5, 2.6], [3, 0.85, 6.5, -2, 0.55 + V * 1.6, 0.5, 2.6], [4, -0.9, 2.45, 0, V * 2 + 0.4, 0.06, 2.5]],
      botella400: [[0, -0.95, -7.5, -1, 0.2, 0.2, 2.3], [1, -0.95, 1.95, 0, 0.5 + V * 0.7, 0.06, 2.3], [2, -0.95, 6.5, -2, 0.5 + V * 1.3, 0.3, 2.2], [3, -0.95, 6.5, -2, 0.5 + V * 1.3, 0.3, 2.2], [4, 0.9, 2.3, 0, V * 2 + 0.3, 0.05, 1.9]],
      almendras: [[0, 0, -7.5, -1, 0, 0, 2.9], [1, 0, -7.5, -1, 0, 0, 2.9], [2, 0, 2.1, 0, 0.45, 0.08, 2.9], [3, 0, 6.5, -2, 0.45 + V * 1.5, 0.5, 2.8], [4, -0.9, 0.1, 0, V * 2 - 0.35, -0.06, 1.15]],
      polen: [[0, 0, -7.5, -1, 0, 0, 3], [1, 0, -7.5, -1, 0, 0, 3], [2, 0, -7.5, -1, 0, 0, 3], [3, 0, 1.85, 0, -0.5, 0.06, 3.1], [4, 0.9, 0.1, 0, V - 0.4, -0.06, 1.15]]
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
    // En pantallas angostas la cámara se aleja para que entren los envases
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
  // 0 en la primera pantalla, 1 en la segunda... y 4 en la última. Se mide con la
  // posición real de cada .escena-paso: si una tarjeta es más alta que la ventana
  // (por ejemplo en una notebook chica), la pantalla mide más y el progreso igual coincide.
  const pasos = [...escena3d.querySelectorAll('.escena-paso')];
  function progresoScroll() {
    const arribaEscena = escena3d.getBoundingClientRect().top;
    const recorrido = -arribaEscena; // cuánto se scrolleó dentro de la escena
    const inicios = pasos.map((paso) => paso.getBoundingClientRect().top - arribaEscena);
    let i = 0;
    while (i < pasos.length - 1 && recorrido >= inicios[i + 1]) i++;
    if (i === pasos.length - 1) return i;
    const fraccion = (recorrido - inicios[i]) / (inicios[i + 1] - inicios[i]);
    return i + Math.min(1, Math.max(0, fraccion));
  }

  /* ---------- Bucle de animación ---------- */
  const reloj = new THREE.Clock();
  let progreso = progresoScroll();
  const actual = {}; // pose actual de cada envase (arranca vacía)

  // Acerca el envase a su pose de a poco ("amortiguación"): el movimiento queda suave.
  // Se usa el tiempo entre cuadros (dt) para que vaya igual a 30 o a 60 cuadros por segundo.
  function mover(envase, nombre, objetivo, dt, tiempo, numero) {
    if (!actual[nombre]) actual[nombre] = objetivo.slice();
    const pose = actual[nombre];
    const factor = 1 - Math.pow(0.0009, dt);
    for (let k = 1; k < 7; k++) pose[k] += (objetivo[k] - pose[k]) * factor;
    const flotar = Math.sin(tiempo * 1.1 + numero * 1.7) * 0.05; // cada uno flota con su propio ritmo
    envase.position.set(pose[1], pose[2] + flotar, pose[3]);
    envase.rotation.set(mouse.y * 0.22, pose[4] + mouse.x * 0.35, pose[5]);
    // pose[6] es el alto que se quiere ver en pantalla: se divide por el alto real del envase
    envase.scale.setScalar(pose[6] / envase.userData.alto);
  }

  function dibujar() {
    const dt = Math.min(0.05, reloj.getDelta());
    const tiempo = reloj.elapsedTime;

    progreso += (progresoScroll() - progreso) * (1 - Math.pow(0.0004, dt));
    mouse.x += (mouse.objetivoX - mouse.x) * 0.06;
    mouse.y += (mouse.objetivoY - mouse.y) * 0.06;

    Object.entries(ENVASES).forEach(([nombre, envase], numero) => {
      mover(envase, nombre, poseEn(POSES[nombre], progreso), dt, tiempo, numero);
    });
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

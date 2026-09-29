# Mieles Los Primos — Miel del Impenetrable

E-commerce del emprendimiento familiar apícola **Mieles Los Primos**, de Juan José Castelli, Chaco. Digitaliza el canal de venta de un negocio que hoy opera de forma presencial y por WhatsApp, ofreciendo miel multifloral, panal y polen del monte chaqueño.

## Proyecto Integrador

Trabajo práctico de 3.er año de la **Tecnicatura Superior en Desarrollo de Software** (IES "René Favaloro", Chaco), que integra cuatro materias:

- **Desarrollo de Sitios Web (DW)** — maquetación HTML/CSS del sitio.
- **Dirección y Gestión de Proyectos (DGP)** — planificación, cronograma y gestión de riesgos.
- **El Emprendedor Digital y el Contexto (EDC)** — modelo de negocio y estrategia digital.
- **Legislación Informática (LI)** — política de privacidad y licenciamiento del software.

**Autora:** Juana Molina.
**Docente:** Prof. Erick Gastón Ibáñez.

## Estado del proyecto

- **Sprint 1 (entregado):** `index.html` con estructura HTML5 semántica.
- **Sprint 2 (en curso, 14 sep – 2 oct 2026):** hoja de estilos externa (`css/styles.css`), catálogo de productos en JSON (`data/productos.json`), diseño responsive y páginas legales.

## Estructura del proyecto

```
mieles-los-primos-web/
├── index.html          (inicio: hero, catálogo de productos y beneficios)
├── catalogo.html       (catálogo con categorías)
├── producto.html       (detalle de un producto: producto.html?id=1)
├── origen.html         (historia del emprendimiento)
├── carrito.html        (carrito de compras)
├── checkout.html       (formulario de compra)
├── privacidad.html     (Política de Privacidad, Ley 25.326)
├── css/
│   └── styles.css
├── js/
│   └── producto.js     (arma el detalle leyendo data/productos.json)
├── data/
│   └── productos.json
├── img/
├── docs/
├── LICENSE
└── README.md
```

## Ver el sitio

**Online:** https://juanimol19.github.io/mieles-los-primos-web/ (GitHub Pages, publicado desde la rama `dev`).

## Cómo probarlo localmente

Usar la extensión Live Server de VS Code (o cualquier servidor local) y abrir `index.html`. La página de detalle (`producto.html`) lee el JSON con `fetch`, que no funciona abriendo el archivo con doble clic. Para revisar el diseño responsive, usar el modo dispositivo de las DevTools (F12).

## Licencia

El proyecto usa un esquema de licenciamiento por componentes (ver la justificación en el informe de Legislación Informática):

- **Código fuente** (HTML, CSS, JavaScript y estructura de `productos.json`): se distribuye bajo la licencia **GNU General Public License v3.0** (ver archivo [`LICENSE`](./LICENSE)).
- **Textos, fotografías e imágenes del sitio**: se distribuyen bajo la licencia **Creative Commons Atribución-NoComercial-SinDerivadas 4.0 Internacional (CC BY-NC-ND 4.0)**.
- **El nombre "Mieles Los Primos", el logotipo y la identidad visual** no están incluidos en estas licencias: todos los derechos reservados.

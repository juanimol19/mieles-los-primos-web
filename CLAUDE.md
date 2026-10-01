# CLAUDE.md — Mieles Los Primos (Proyecto Integrador EcoStart IA)

## Quién soy y cómo trabajar conmigo

Soy Juana Molina, estudiante de 3.er año de la Tecnicatura Superior en Desarrollo de Software (IES "René Favaloro", Chaco). Este es un **proyecto individual y académico**: tengo que poder explicar y defender cada línea de código ante el docente (Prof. Erick Gastón Ibáñez).

- Respondé y comentá siempre en **español**.
- Antes de hacer cambios grandes, explicá brevemente qué vas a hacer y por qué.
- Después de cada cambio, resumí qué se hizo para que yo pueda entenderlo y documentarlo.
- Preferí código claro y didáctico antes que soluciones "ingeniosas". Comentarios breves en español donde ayuden a entender.
- Proponé mensajes de commit en formato convencional (`feat:`, `fix:`, `style:`, `docs:`) y commits pequeños y separados por tema.

## El proyecto

E-commerce **"Mieles Los Primos" – Miel del Impenetrable**, un emprendimiento apícola familiar real de Juan José Castelli, Chaco. Hoy vende de manera informal (presencial y WhatsApp). El objetivo es digitalizar el canal de venta.

Integra 4 materias: Desarrollo de Sitios Web (DW), Dirección y Gestión de Proyectos (DGP), El Emprendedor Digital y el Contexto (EDC) y Legislación Informática (LI).

### Catálogo

| Producto | Presentación | Precio simulado |
|---|---|---|
| Miel pura multifloral del Impenetrable | 800 g | $8.850 |
| Miel pura multifloral del Impenetrable | 400 g | $6.600 |
| Polen apícola | — | $9.000 |
| Porción de panal con miel | — | $6.000 |

Proyección futura (no implementar todavía): Miel Orgánica Certificada.

La miel es multifloral de monte nativo: algarrobo, chañar, garabato, entre otras.

## Estado actual

- **Sprint 1 (entregado):** `index.html` con HTML5 semántico puro, sin CSS ni JS, con 4 secciones: 01 Inicio/Hero, 02 Catálogo, 03 Carrito, 04 Checkout.
- **Repositorio:** `github.com/juanimol19/mieles-los-primos-web`.
- **Sprint 2 (en curso):** el sitio se separó en páginas independientes (issue #38). El header y el footer están **repetidos en todos los `.html`**: si se cambian, hay que cambiarlos en todos los archivos. Los datos de contacto del footer (WhatsApp e Instagram) son de ejemplo y están marcados con `DATOS DE EJEMPLO`.
- **Imágenes:** WebP reales (no PNG renombrados), productos a ~600 px de ancho y hero a 1600 px, idealmente menos de 200 KB cada una.

## Sprint 2 — alcance técnico (14 Sep al 2 Oct 2026)

### Reglas obligatorias de la cátedra (Desarrollo Web)

1. **CSS externo** en `css/styles.css`, enlazado desde el HTML. Nada de estilos inline ni `<style>` en el HTML.
2. **Flexbox y CSS Grid obligatorios** para estructurar el Home, el catálogo y el formulario.
3. **Responsive**, que funcione en móvil y escritorio. Enfoque mobile-first con media queries.
4. **PROHIBIDO usar plantillas o frameworks de terceros**: nada de Bootstrap, Tailwind, Bulma ni temas descargados. Todo CSS escrito a mano.
5. **`data/productos.json`** con el catálogo completo. Campos obligatorios por producto:
   `id`, `nombre`, `descripcion`, `precio_simulado`, `imagen_ia_url`, `categoria`.
   - `precio_simulado`: número, sin símbolo ni puntos (ej.: `8850`).
   - `imagen_ia_url`: ruta a la imagen generada por IA (ej.: `img/miel-800g.webp`).
   - `categoria`: valores sugeridos `miel`, `panal`, `polen`.
   - Se pueden agregar campos extra (ej. `presentacion`), pero **nunca quitar** los obligatorios.
   - Validar que el JSON sea sintácticamente correcto.

### Fuera de alcance en este sprint

- **Vue.js**: la guía del Sprint 2 no lo pide y prohíbe frameworks externos para la maquetación. **No agregarlo** hasta que confirme con el docente.
- Backend (Laravel/PHP), MySQL y Mercado Pago corresponden al **Sprint 3**. No implementarlos ahora.

### Páginas o secciones legales (Legislación Informática)

Al cierre del sprint, el sitio tiene que incluir la **Política de Privacidad (Ley 25.326 / Habeas Data, derechos ARCO)** y la **licencia del software**. Opción sugerida: `privacidad.html`, un archivo `LICENSE` en el repo y links en el footer. El texto legal lo redacto yo; vos ayudás a maquetarlo.

**Licencia elegida** (informe de Licencia, issue #20): esquema por componentes. Código bajo **GNU GPL v3.0** (`LICENSE`), textos e imágenes bajo **CC BY-NC-ND 4.0**, y marca y logotipo con todos los derechos reservados. El logo lo diseñó el hermano de Juana, que es el dueño de la marca. Si se cambia algo, hay que mantener coherentes el informe, `LICENSE`, el README y el footer.

### JavaScript

Se permite **JavaScript puro, sin frameworks** (ej.: `js/producto.js` lee `data/productos.json` con `fetch`). Como `fetch` necesita un servidor local, hay que probar con Live Server.

## Estructura de carpetas

```
mieles-los-primos-web/
├── index.html             (inicio: hero, catálogo de productos y beneficios)
├── catalogo.html          (catálogo con categorías)
├── producto.html          (detalle de producto: producto.html?id=<id del JSON>)
├── origen.html            (historia del emprendimiento)
├── carrito.html           (carrito de compras)
├── checkout.html          (formulario de compra)
├── privacidad.html        (Política de Privacidad, Ley 25.326)
├── css/
│   └── styles.css
├── js/
│   └── producto.js        (detalle de producto con JS puro)
├── data/
│   └── productos.json
├── img/                   (imágenes IA de productos)
├── docs/                  (informes; los del Sprint 2 en docs/Sprint 2/ con formato APA 7)
├── LICENSE                (GNU GPL v3.0)
├── README.md
└── CLAUDE.md
```

## Criterios de estilo CSS

- Variables CSS en `:root` para colores, tipografías y espaciados. Paleta inspirada en la miel y el monte chaqueño: ámbar, dorado, marrón algarrobo y un verde monte suave.
- Unidades relativas (`rem`, `%`, `fr`), imágenes con `max-width: 100%`.
- Breakpoints sugeridos: base móvil, luego `min-width: 768px` (tablet) y `min-width: 1024px` (escritorio).
- Catálogo con **Grid** (`repeat(auto-fit, minmax(...))`). Header, nav y tarjetas con **Flexbox**.
- Accesibilidad: buen contraste, `alt` descriptivos, foco visible, no depender solo del color.
- Organizar `styles.css` en bloques comentados: variables, reset, base, header, hero, catálogo, origen, carrito, checkout, footer, páginas legales, media queries.
- Texto en ámbar sobre blanco: usar `--color-amber-texto` (#A0680F, 4.7:1). El ámbar claro (`--color-amber`) solo para fondos, bordes y decoración.

## Cronograma y entregables del Sprint 2

| Semana | Entregables |
|---|---|
| 4 (14-18 Sep) | Primer commit CSS en GitHub, Gantt base, Matriz de Riesgos inicial |
| 5 (21-25 Sep) | `productos.json` en GitHub, boceto responsive verificado, borradores de privacidad |
| 6 (28 Sep - 2 Oct) | **Entrega del portafolio**: CSS y JSON finales, Kanban actualizado, carpeta técnica con informes, privacidad y licencia en el sitio |

## Comandos útiles

```bash
git status
git add <archivo>
git commit -m "tipo: descripción"
git push
```

Para probar localmente, usar la extensión Live Server de VS Code (`producto.html` necesita un servidor por el `fetch`). Para probar el responsive, usar el modo dispositivo de las DevTools (F12).

## Flujo de trabajo: issues y ramas

- `main`: solo versiones entregables. Nunca commitear ni mergear sin que Juana lo pida.
- `dev`: integración del sprint. Nunca commitear directo en dev.
- Cada issue se trabaja en su propia rama creada desde `dev`:
  `feature/<n>-<descripcion-corta>` (ej. `feature/2-css-base`),
  `docs/<n>-...` para documentación, `fix/<n>-...` para correcciones.
- Antes de crear una rama: `git checkout dev` y `git pull`.
- Mensajes de commit con referencia a la issue: `feat: variables y reset CSS (#2)`.
- Al terminar: abrir un Pull Request hacia `dev` con `gh pr create --base dev`,
  con "Closes #<n>" en la descripción para que la issue se cierre sola al mergear.
  Juana autorizó que Claude mergee los PR hacia `dev` (29/09/2026).
- Después del merge: verificar que la issue quedó cerrada (si no, `gh issue close <n>`),
  borrar la rama local y la remota, y volver a `dev`.
- Trabajar una sola issue a la vez y marcar los checkboxes cumplidos en la issue.
- Tablero Kanban: https://github.com/users/juanimol19/projects/7 (proyecto #7, vinculado al repo).
  Columnas: Por hacer, En curso, En revisión y Hecho. Campo "Materia". Cada issue nueva se agrega con
  `gh project item-add 7 --owner juanimol19 --url <url de la issue>`. Los proyectos "Sprint 1/2/3" de la
  cuenta son de OTRO proyecto: no usarlos.
- Wiki: https://github.com/juanimol19/mieles-los-primos-web/wiki. Actualizarla cuando se cierren issues.

# Issues del Sprint 2 — Mieles Los Primos

Milestone: **Sprint 2**, vence el 2026-10-02.

Etiquetas a crear:

| Etiqueta | Uso |
|---|---|
| `setup` | Configuración |
| `css` | Estilos |
| `html` | Maquetación |
| `datos` | Datos (JSON) |
| `legal` | Legislación Informática |
| `documentacion` | Informes de DGP y EDC (fuera del código) |
| `prioridad-alta` | Primero |
| `prioridad-media` | Segundo |

Las issues están ordenadas por prioridad. Crearlas en este orden.

---

## 1. Configurar estructura del proyecto
**Etiquetas:** setup, prioridad-alta

Crear la estructura de carpetas definida en CLAUDE.md y los archivos base del repositorio.

- [ ] Carpetas `css/`, `data/`, `img/`, `docs/`
- [ ] `README.md` con la descripción del proyecto, las materias y la autora
- [ ] `.gitignore` básico (sistema, editor)
- [ ] Guardar `docs/Diseño_de_Interfaz.png` y `docs/Lienzo_de_Modelo_de_Negocios.png`

## 2. CSS base: variables, tipografías y reset
**Etiquetas:** css, prioridad-alta

Crear `css/styles.css` y enlazarlo desde `index.html`. Es el primer commit CSS del sprint, que estaba previsto para la semana 4.

- [ ] Variables en `:root`: paleta (ámbar `#E0A023`, hover `#C4861A`, crema `#FBF8F1`, marrón `#3B2A1A`, bordes `#EDE6DA`), tipografías y espaciados
- [ ] Lora (títulos) e Inter (texto) desde Google Fonts, con fuentes de respaldo
- [ ] Reset básico e `img { max-width: 100%; }`
- [ ] Bloques comentados para cada sección
- [ ] Sin estilos inline ni `<style>` en el HTML

## 3. Catálogo de datos en productos.json
**Etiquetas:** datos, prioridad-alta

Crear `data/productos.json` con el catálogo completo. Es entregable de la semana 5.

- [ ] Campos obligatorios en cada producto: `id`, `nombre`, `descripcion`, `precio_simulado` (número), `imagen_ia_url`, `categoria`
- [ ] Productos: miel 800 g ($8850), miel 400 g ($6600), polen ($9000), panal ($6000)
- [ ] Definir si se incluye la caja de madera con 3 frascos (consultar a Juana)
- [ ] Nombres unificados (frasco o botella, lo que decida Juana)
- [ ] JSON validado sin errores de sintaxis

## 4. Header y footer
**Etiquetas:** css, html, prioridad-alta

Estilizar el encabezado y el pie según el diseño, con Flexbox.

- [ ] Header: logo, nav (Inicio, Catálogo, Origen, Contacto) y carrito con contador
- [ ] Link activo resaltado en ámbar
- [ ] Footer con contacto, WhatsApp, Instagram y links legales (privacidad y licencia)
- [ ] Botón flotante de WhatsApp
- [ ] Versión móvil del menú

## 5. Hero y franja de beneficios
**Etiquetas:** css, html, prioridad-alta

- [ ] Hero con imagen de fondo, degradado oscuro, título, subtítulo y botón "Ver catálogo"
- [ ] Franja de 4 beneficios con íconos SVG: 100% natural, Del Impenetrable Chaqueño, Producción artesanal y Compra segura
- [ ] Grid de 4 columnas en escritorio, 2 en tablet y 1 en móvil

## 6. Home: sección "Nuestros productos"
**Etiquetas:** css, html, prioridad-media

- [ ] Título con líneas decorativas y subtítulo
- [ ] Tarjetas de productos con Grid `auto-fit` / `minmax`
- [ ] Sombra suave y bordes redondeados como en el diseño

## 7. Catálogo: categorías y grilla de productos
**Etiquetas:** css, html, prioridad-alta

- [ ] Layout Grid: barra lateral de categorías (Todos, Miel, Panal, Polen) y grilla de productos
- [ ] Tarjeta con imagen, nombre, precio y botón "Agregar al carrito"
- [ ] En móvil, las categorías pasan a botones horizontales arriba

## 8. Imágenes de productos generadas con IA
**Etiquetas:** datos, prioridad-media

- [ ] Imágenes `.webp` en `img/` para cada producto y para el hero
- [ ] Rutas coincidentes con `imagen_ia_url` del JSON
- [ ] Textos `alt` descriptivos en el HTML

## 9. Carrito de compras
**Etiquetas:** css, html, prioridad-media

Maquetación estática, sin lógica JS en este sprint.

- [ ] Tabla de productos (imagen, precio, cantidad con + y −, subtotal y eliminar) y resumen del pedido
- [ ] Grid `2fr 1fr` en escritorio
- [ ] En móvil, cada producto como tarjeta apilada y el resumen abajo
- [ ] Aviso de envíos a todo el país

## 10. Checkout: formulario de compra
**Etiquetas:** css, html, prioridad-media

- [ ] Bloques: datos del comprador, dirección de entrega, método de envío y método de pago (Mercado Pago o transferencia)
- [ ] Resumen de compra lateral y botón "Pagar con Mercado Pago"
- [ ] Sub-grid de 2 o 3 columnas para los campos en escritorio y 1 columna en móvil
- [ ] Labels asociados a cada input y campos obligatorios marcados

## 11. Sección "Origen"
**Etiquetas:** html, css, prioridad-media

Sección nueva: está en el menú del diseño, pero no en el HTML del Sprint 1. Conecta con la propuesta de valor del Canvas.

- [ ] Historia del emprendimiento familiar en Castelli y el monte nativo (algarrobo, chañar, garabato)
- [ ] Texto redactado por Juana

## 12. Ajustes responsive y pruebas de usabilidad
**Etiquetas:** css, prioridad-alta

Entregable de la semana 6.

- [ ] Breakpoints en 768 px y 1024 px revisados en todas las secciones
- [ ] Prueba en DevTools con 360 px, 768 px y 1280 px
- [ ] Sin scroll horizontal en ninguna vista
- [ ] Capturas guardadas en `docs/pruebas/` para el portafolio

## 13. Página de Política de Privacidad
**Etiquetas:** legal, html, prioridad-alta

- [ ] `privacidad.html` con el mismo header, footer y estilos del sitio
- [ ] Texto redactado por Juana (Ley 25.326, Habeas Data, derechos ARCO)
- [ ] Link desde el footer y desde el formulario de checkout

## 14. Licencia del software
**Etiquetas:** legal, prioridad-media

- [ ] Archivo `LICENSE` con la licencia elegida por Juana
- [ ] Sección "Licencia" en el README
- [ ] Mención en el footer del sitio

---

## Issues de documentación
Se trabajan fuera del código. Solo llevan rama si el archivo se guarda en `docs/`.

## 15. Diagrama de Gantt y control de desvíos
**Etiquetas:** documentacion, prioridad-alta

- [ ] Cronograma planificado frente al real, con dependencias críticas
- [ ] Desvíos documentados con causa y compensación (por ejemplo, el primer commit CSS que pasó de la semana 4 a la 5)

## 16. Matriz y registro de riesgos
**Etiquetas:** documentacion, prioridad-alta

- [ ] Mínimo 5 riesgos, con probabilidad, impacto y prioridad
- [ ] Plan de acción y plan de contingencia para cada uno
- [ ] Cierre de riesgos en la semana 6

## 17. Informe comparativo: Startup vs. Empresa Tradicional
**Etiquetas:** documentacion, prioridad-alta

- [ ] Costos transaccionales, logística y flexibilidad (WhatsApp y presencial frente a e-commerce)
- [ ] Escalabilidad del software
- [ ] Impacto ambiental positivo argumentado

## 18. Estrategia de canales y embudo de conversión
**Etiquetas:** documentacion, prioridad-media

- [ ] Flujo Instagram → landing → catálogo → checkout
- [ ] Coherente con los canales del Canvas

## 19. Redacción de la Política de Privacidad
**Etiquetas:** legal, documentacion, prioridad-alta

- [ ] Finalidad del tratamiento de datos de la simulación de compra
- [ ] Mecanismos de protección del lado del cliente
- [ ] Derechos ARCO
- [ ] Alimenta la issue 13

## 20. Justificación del modelo de licenciamiento
**Etiquetas:** legal, documentacion, prioridad-media

- [ ] Comparación de código cerrado frente a GNU GPL y Creative Commons
- [ ] Licencia elegida y justificada
- [ ] Alimenta la issue 14

## 21. Portafolio Sprint 2
**Etiquetas:** documentacion, prioridad-alta

- [ ] Nombre y roles asignados por tarea
- [ ] Links al repo y al Kanban actualizado
- [ ] Carpeta técnica con todos los informes
- [ ] Entrega el 2 de octubre

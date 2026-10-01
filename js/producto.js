/* ==========================================================================
   Mieles Los Primos — Detalle de producto (producto.html)
   JavaScript puro, sin frameworks.

   Cómo funciona:
   1. Lee el id de la URL (ej.: producto.html?id=2 → id = 2).
   2. Pide data/productos.json con fetch() y busca el producto con ese id.
   3. Arma el detalle y la sección "Otros productos" creando los elementos
      con JavaScript (createElement + textContent).

   Necesita js/carrito.js cargado antes: de ahí usa crear(), formatearPrecio()
   y agregarAlCarrito().

   Importante: fetch() necesita un servidor local (Live Server o similar).
   Si se abre el archivo con doble clic (file://), el navegador bloquea la
   lectura del JSON y se muestra un mensaje de error.
   ========================================================================== */

// DATOS DE EJEMPLO: reemplazar por el número real de WhatsApp (igual que en el footer)
const WHATSAPP_NUMERO = '5493644000000';

// Nombres para mostrar de cada categoría del JSON
const CATEGORIAS = { miel: 'Miel', panal: 'Panal', polen: 'Polen' };

const detalle = document.querySelector('#producto-detalle');

/* --------------------------------------------------------------------------
   Funciones auxiliares
   -------------------------------------------------------------------------- */

// crear() y formatearPrecio() están en js/carrito.js (las usan las dos páginas)

// Texto del precio: algunos productos todavía no tienen precio definido
function textoPrecio(producto) {
  return producto.precio_a_confirmar ? 'Precio a confirmar' : formatearPrecio(producto.precio_simulado);
}

// Link de WhatsApp con un mensaje ya escrito sobre el producto
function linkWhatsApp(producto) {
  const mensaje = `¡Hola! Quiero consultar por: ${producto.nombre} (${producto.presentacion}).`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

// Reemplaza el contenido del detalle por un mensaje (error o aviso)
function mostrarMensaje(texto) {
  detalle.replaceChildren();
  const parrafo = crear('p', 'producto-mensaje', texto + ' ');
  const link = crear('a', null, 'Volver al catálogo');
  link.href = 'catalogo.html';
  parrafo.append(link);
  detalle.append(parrafo);
}

/* --------------------------------------------------------------------------
   Detalle del producto
   -------------------------------------------------------------------------- */

function mostrarDetalle(producto) {
  // Título de la pestaña y última miga de pan con el nombre del producto
  document.title = `${producto.nombre} - Mieles Los Primos`;
  document.querySelector('#migas-actual').textContent = producto.nombre;

  // Columna izquierda: imagen grande
  const figura = crear('figure', 'producto-imagen');
  const imagen = document.createElement('img');
  imagen.src = producto.imagen_ia_url;
  imagen.alt = producto.imagen_alt;
  figura.append(imagen);

  // Columna derecha: información
  const info = crear('div', 'producto-info');
  info.append(
    crear('span', 'producto-categoria', CATEGORIAS[producto.categoria]),
    crear('h1', null, producto.nombre),
    crear('p', 'producto-presentacion', 'Presentación: ' + producto.presentacion),
    crear('p', 'producto-precio', textoPrecio(producto))
  );

  if (producto.precio_mayorista) {
    info.append(crear('p', 'producto-mayorista', 'Precio por mayor: ' + formatearPrecio(producto.precio_mayorista)));
  }

  info.append(crear('p', 'producto-descripcion', producto.descripcion));

  // Compra: solo si el producto tiene precio. Si no, se consulta por WhatsApp.
  if (!producto.precio_a_confirmar) {
    info.append(crearFormularioCompra(producto));
  }

  const whatsapp = crear('a', 'boton boton-secundario', 'Consultar por WhatsApp');
  whatsapp.href = linkWhatsApp(producto);
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener';
  info.append(whatsapp);

  detalle.replaceChildren(figura, info);
}

// Selector de cantidad (− [1] +) y botón "Agregar al carrito".
// Reutiliza la clase .cantidad del carrito.
function crearFormularioCompra(producto) {
  const compra = crear('div', 'producto-compra');

  const selector = crear('div', 'cantidad');
  const restar = crear('button', null, '−');
  const sumar = crear('button', null, '+');
  const cantidad = document.createElement('input');

  restar.type = 'button';
  sumar.type = 'button';
  restar.setAttribute('aria-label', 'Restar una unidad');
  sumar.setAttribute('aria-label', 'Sumar una unidad');
  cantidad.type = 'number';
  cantidad.value = 1;
  cantidad.min = 1;
  cantidad.max = 20;
  cantidad.setAttribute('aria-label', 'Cantidad de ' + producto.nombre);

  // Los botones cambian la cantidad sin salir del rango 1 a 20
  restar.addEventListener('click', () => {
    cantidad.value = Math.max(1, Number(cantidad.value) - 1);
  });
  sumar.addEventListener('click', () => {
    cantidad.value = Math.min(20, Number(cantidad.value) + 1);
  });

  selector.append(restar, cantidad, sumar);

  const agregar = crear('button', 'boton', 'Agregar al carrito');
  agregar.type = 'button';

  // Mensaje de confirmación. role="status" hace que se anuncie en lectores de pantalla.
  const aviso = crear('p', 'producto-aviso');
  aviso.setAttribute('role', 'status');

  // Guarda el producto en el carrito (js/carrito.js), que también actualiza el contador del header
  agregar.addEventListener('click', () => {
    const unidades = Math.min(20, Math.max(1, Number(cantidad.value) || 1));
    cantidad.value = unidades;
    agregarAlCarrito(producto.id, unidades);
    aviso.textContent = `Agregaste ${unidades} × ${producto.nombre} al carrito.`;
  });

  compra.append(selector, agregar, aviso);
  return compra;
}

/* --------------------------------------------------------------------------
   Otros productos (todas las tarjetas menos la del producto actual)
   -------------------------------------------------------------------------- */

function mostrarOtros(productos, idActual) {
  const lista = document.querySelector('#otros-productos-lista');

  productos
    .filter((producto) => producto.id !== idActual)
    .forEach((producto) => {
      const tarjeta = crear('article', 'tarjeta tarjeta-link');

      const imagen = document.createElement('img');
      imagen.src = producto.imagen_ia_url;
      imagen.alt = producto.imagen_alt;

      const texto = crear('div', 'tarjeta-texto');
      const titulo = crear('h3');
      const link = crear('a', null, producto.nombre);
      link.href = 'producto.html?id=' + producto.id;
      titulo.append(link);
      texto.append(titulo, crear('p', 'precio', textoPrecio(producto)));

      tarjeta.append(imagen, texto);
      lista.append(tarjeta);
    });

  document.querySelector('#otros-productos').hidden = false;
}

/* --------------------------------------------------------------------------
   Inicio: leer el id y cargar el JSON
   -------------------------------------------------------------------------- */

// URLSearchParams lee los parámetros de la URL: "?id=2" → "2" (texto) → 2 (número)
const id = Number(new URLSearchParams(window.location.search).get('id'));

fetch('data/productos.json')
  .then((respuesta) => {
    if (!respuesta.ok) throw new Error('No se pudo leer el catálogo');
    return respuesta.json();
  })
  .then((productos) => {
    const producto = productos.find((p) => p.id === id);

    if (!producto) {
      mostrarMensaje('No encontramos ese producto.');
      return;
    }

    mostrarDetalle(producto);
    mostrarOtros(productos, producto.id);
  })
  .catch(() => {
    mostrarMensaje('No se pudo cargar el producto. Si abriste el archivo directamente, usá un servidor local (por ejemplo, Live Server).');
  });

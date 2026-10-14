/* ==========================================================================
   Mieles Los Primos — Carrito de compras (ES module)
   JavaScript puro, sin frameworks. Se carga en todas las páginas.

   Cómo funciona:
   1. El carrito se guarda en localStorage (memoria del navegador), así no se
      pierde al cambiar de página ni al cerrar la pestaña.
      Formato: [{ "id": 1, "cantidad": 2 }, { "id": 4, "cantidad": 1 }]
      Solo se guardan el id y la cantidad: el nombre, el precio y la imagen
      se leen siempre de data/productos.json (js/productos.js).
   2. En todas las páginas actualiza el contador del header.
   3. Los botones con el atributo data-agregar="<id>" suman ese producto
      (también los que crea js/catalogo.js después de cargar la página).
   4. En carrito.html arma la tabla y el resumen; en checkout.html, el resumen.

   Importante: fetch() necesita un servidor local (Live Server o similar).
   ========================================================================== */

import { crear, formatearPrecio } from './utilidades.js';
import { obtenerProductos } from './productos.js';

const CLAVE_CARRITO = 'carrito-los-primos'; // nombre con el que se guarda en localStorage
const MAXIMO_POR_PRODUCTO = 20;             // mismo tope que el selector de cantidad

/* --------------------------------------------------------------------------
   Guardar y leer el carrito
   -------------------------------------------------------------------------- */

// Devuelve el carrito guardado, o una lista vacía si no hay nada.
// try/catch: si el navegador bloquea localStorage o el dato está dañado, no se rompe la página.
function leerCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    return Array.isArray(guardado) ? guardado : [];
  } catch (error) {
    return [];
  }
}

function guardarCarrito(carrito) {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch (error) {
    // Sin localStorage el carrito no se puede guardar, pero el sitio sigue funcionando
  }
  actualizarContador();
}

// Suma unidades de un producto. Si ya estaba en el carrito, aumenta su cantidad.
// "export" permite usarla desde js/producto.js
export function agregarAlCarrito(id, unidades) {
  const carrito = leerCarrito();
  const item = carrito.find((p) => p.id === id);

  if (item) {
    item.cantidad = Math.min(MAXIMO_POR_PRODUCTO, item.cantidad + unidades);
  } else {
    carrito.push({ id: id, cantidad: Math.min(MAXIMO_POR_PRODUCTO, unidades) });
  }

  guardarCarrito(carrito);
}

// Cambia la cantidad de un producto (+1 o −1) sin bajar de 1 ni pasar el tope
function cambiarCantidad(id, diferencia) {
  const carrito = leerCarrito();
  const item = carrito.find((p) => p.id === id);
  if (!item) return;

  item.cantidad = Math.min(MAXIMO_POR_PRODUCTO, Math.max(1, item.cantidad + diferencia));
  guardarCarrito(carrito);
}

function eliminarDelCarrito(id) {
  guardarCarrito(leerCarrito().filter((p) => p.id !== id));
}

// Total de unidades (2 botellas + 1 panal = 3)
function contarUnidades() {
  return leerCarrito().reduce((total, item) => total + item.cantidad, 0);
}

/* --------------------------------------------------------------------------
   Contador del header (en todas las páginas)
   -------------------------------------------------------------------------- */

function actualizarContador() {
  const unidades = contarUnidades();

  document.querySelectorAll('.carrito-contador').forEach((contador) => {
    contador.textContent = unidades;
    // El aria-label del link es lo que lee un lector de pantalla
    contador.closest('a').setAttribute('aria-label', `Carrito: ${unidades} ${unidades === 1 ? 'producto' : 'productos'}`);
  });
}

/* --------------------------------------------------------------------------
   Botones "Agregar al carrito" del catálogo (data-agregar="<id>")
   -------------------------------------------------------------------------- */

// Delegación de eventos: en vez de darle un evento a cada botón, se escucha
// el clic en todo el documento y se revisa si vino de un botón data-agregar.
// Así funcionan también los botones de las tarjetas creadas con JavaScript.
document.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-agregar]');
  if (!boton || boton.dataset.estado === 'agregado') return;

  agregarAlCarrito(Number(boton.dataset.agregar), 1);

  // Confirmación: el botón cambia de texto durante un segundo y medio
  const textoOriginal = boton.textContent;
  boton.dataset.estado = 'agregado';
  boton.textContent = '¡Agregado! ✓';
  setTimeout(() => {
    boton.textContent = textoOriginal;
    delete boton.dataset.estado;
  }, 1500);
});

/* --------------------------------------------------------------------------
   Datos de los productos: se leen del JSON
   -------------------------------------------------------------------------- */

// Junta cada item del carrito con su producto del JSON: { producto, cantidad }.
// Si un id ya no existe en el catálogo, se descarta.
async function cargarItems() {
  const productos = await obtenerProductos();
  return leerCarrito()
    .map((item) => ({ producto: productos.find((p) => p.id === item.id), cantidad: item.cantidad }))
    .filter((item) => item.producto);
}

function calcularTotal(items) {
  return items.reduce((total, item) => total + item.producto.precio_simulado * item.cantidad, 0);
}

/* --------------------------------------------------------------------------
   Página del carrito (carrito.html)
   -------------------------------------------------------------------------- */

// Una fila de la tabla. Los data-label son los títulos que se ven en móvil (CSS td::before).
function crearFilaCarrito(item) {
  const { producto, cantidad } = item;
  const fila = document.createElement('tr');

  // Producto: imagen y nombre (la imagen es decorativa porque el nombre está al lado)
  const celdaProducto = crear('td', 'carrito-producto');
  celdaProducto.dataset.label = 'Producto';
  const imagen = document.createElement('img');
  imagen.src = producto.imagen_ia_url;
  imagen.alt = '';
  imagen.width = 56;
  imagen.height = 56;
  celdaProducto.append(imagen, crear('span', null, producto.nombre));

  const celdaPrecio = crear('td', null, formatearPrecio(producto.precio_simulado));
  celdaPrecio.dataset.label = 'Precio unitario';

  // Cantidad: − [n] +
  const celdaCantidad = crear('td');
  celdaCantidad.dataset.label = 'Cantidad';
  const selector = crear('div', 'cantidad');
  const restar = crear('button', null, '−');
  const sumar = crear('button', null, '+');
  const campo = document.createElement('input');
  restar.type = 'button';
  sumar.type = 'button';
  restar.setAttribute('aria-label', 'Restar una unidad de ' + producto.nombre);
  sumar.setAttribute('aria-label', 'Sumar una unidad de ' + producto.nombre);
  campo.type = 'number';
  campo.value = cantidad;
  campo.readOnly = true;
  campo.setAttribute('aria-label', 'Cantidad de ' + producto.nombre);
  restar.disabled = cantidad <= 1;
  sumar.disabled = cantidad >= MAXIMO_POR_PRODUCTO;
  restar.addEventListener('click', () => {
    cambiarCantidad(producto.id, -1);
    mostrarCarrito();
  });
  sumar.addEventListener('click', () => {
    cambiarCantidad(producto.id, 1);
    mostrarCarrito();
  });
  selector.append(restar, campo, sumar);
  celdaCantidad.append(selector);

  const celdaSubtotal = crear('td', null, formatearPrecio(producto.precio_simulado * cantidad));
  celdaSubtotal.dataset.label = 'Subtotal';

  // Eliminar (el ícono es decorativo; el aria-label dice qué hace)
  const celdaAccion = crear('td');
  celdaAccion.dataset.label = 'Acción';
  const eliminar = crear('button', 'boton-eliminar');
  eliminar.type = 'button';
  eliminar.setAttribute('aria-label', `Eliminar ${producto.nombre} del carrito`);
  const icono = crear('span', null, '🗑️');
  icono.setAttribute('aria-hidden', 'true');
  eliminar.append(icono);
  eliminar.addEventListener('click', () => {
    eliminarDelCarrito(producto.id);
    mostrarCarrito();
  });
  celdaAccion.append(eliminar);

  fila.append(celdaProducto, celdaPrecio, celdaCantidad, celdaSubtotal, celdaAccion);
  return fila;
}

// Vuelve a dibujar la tabla y el resumen cada vez que cambia el carrito
async function mostrarCarrito() {
  const aviso = document.querySelector('#carrito-vacio');

  try {
    const items = await cargarItems();
    const vacio = items.length === 0;

    // Con el carrito vacío se ocultan la tabla y el resumen, y se muestra el aviso
    aviso.hidden = !vacio;
    document.querySelector('.carrito-tabla').hidden = vacio;
    document.querySelector('.carrito-resumen').hidden = vacio;

    document.querySelector('#carrito-lista').replaceChildren(...items.map(crearFilaCarrito));

    const unidades = items.reduce((total, item) => total + item.cantidad, 0);
    const total = formatearPrecio(calcularTotal(items));
    document.querySelector('#resumen-unidades').textContent = `Subtotal (${unidades} ${unidades === 1 ? 'producto' : 'productos'})`;
    document.querySelector('#resumen-subtotal').textContent = total;
    document.querySelector('#resumen-total').textContent = total;
  } catch (error) {
    console.error(error);
    aviso.textContent = 'No se pudo cargar el carrito. Si abriste el archivo directamente, usá un servidor local (por ejemplo, Live Server).';
    aviso.hidden = false;
  }
}

/* --------------------------------------------------------------------------
   Resumen del checkout (checkout.html)
   -------------------------------------------------------------------------- */

// Una línea del resumen: "Botella de miel 800 g ×2 ...... $17.700"
function crearFilaResumen(item) {
  const fila = crear('li', 'resumen-fila');
  fila.append(
    crear('span', null, `${item.producto.nombre} ×${item.cantidad}`),
    crear('span', null, formatearPrecio(item.producto.precio_simulado * item.cantidad))
  );
  return fila;
}

async function mostrarResumenCheckout() {
  const lista = document.querySelector('#checkout-items');
  const botonPagar = document.querySelector('.checkout-resumen button[type="submit"]');

  try {
    const items = await cargarItems();

    if (items.length === 0) {
      const vacio = crear('li', null, 'Tu carrito está vacío. ');
      const link = crear('a', null, 'Ver catálogo');
      link.href = 'catalogo.html';
      vacio.append(link);
      lista.replaceChildren(vacio);
    } else {
      lista.replaceChildren(...items.map(crearFilaResumen));
    }

    // Sin productos no se puede pagar (y si se agregan desde otra pestaña, se vuelve a habilitar)
    botonPagar.disabled = items.length === 0;

    const total = formatearPrecio(calcularTotal(items));
    document.querySelector('#checkout-subtotal').textContent = total;
    document.querySelector('#checkout-total').textContent = total;
  } catch (error) {
    console.error(error);
    lista.replaceChildren(crear('li', 'resumen-fila', 'No se pudo cargar el carrito.'));
    botonPagar.disabled = true;
  }
}

/* --------------------------------------------------------------------------
   Inicio: se ejecuta al cargar cualquier página
   -------------------------------------------------------------------------- */

// Muestra el carrito guardado en lo que exista en la página
function actualizarPagina() {
  actualizarContador();

  // Cada página tiene sus propios elementos: solo se arma lo que existe
  if (document.querySelector('#carrito-lista')) mostrarCarrito();
  if (document.querySelector('#checkout-items')) mostrarResumenCheckout();
}

actualizarPagina();

// Al volver con el botón "Atrás", el navegador puede mostrar la página tal como
// la dejamos, guardada en memoria (bfcache), sin volver a ejecutar este archivo.
// El contador quedaría con el número viejo: "pageshow" avisa ese regreso
// (evento.persisted es true) y se vuelve a leer el carrito.
window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) actualizarPagina();
});

// Con el sitio abierto en dos pestañas: cuando una cambia el carrito, el navegador
// avisa a las demás con el evento "storage", y se actualizan en tiempo real.
window.addEventListener('storage', (evento) => {
  if (evento.key === CLAVE_CARRITO) actualizarPagina();
});

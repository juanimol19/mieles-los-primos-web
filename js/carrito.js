/* ==========================================================================
   Mieles Los Primos — Carrito de compras
   JavaScript puro, sin frameworks. Se carga en todas las páginas.

   Cómo funciona:
   1. El carrito se guarda en localStorage (memoria del navegador), así no se
      pierde al cambiar de página ni al cerrar la pestaña.
      Formato: [{ "id": 1, "cantidad": 2 }, { "id": 4, "cantidad": 1 }]
      Solo se guardan el id y la cantidad: el nombre, el precio y la imagen
      se leen siempre de data/productos.json.
   2. En todas las páginas actualiza el contador del header.
   3. Los botones con el atributo data-agregar="<id>" suman ese producto.
   4. En carrito.html arma la tabla y el resumen; en checkout.html, el resumen.

   Importante: fetch() necesita un servidor local (Live Server o similar).
   ========================================================================== */

const CLAVE_CARRITO = 'carrito-los-primos'; // nombre con el que se guarda en localStorage
const MAXIMO_POR_PRODUCTO = 20;             // mismo tope que el selector de cantidad

/* --------------------------------------------------------------------------
   Funciones compartidas (también las usa js/producto.js)
   -------------------------------------------------------------------------- */

// Crea un elemento con una clase y un texto opcionales.
// Usar textContent (y no innerHTML) evita que un texto se interprete como HTML.
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto) elemento.textContent = texto;
  return elemento;
}

// 8850 → "$8.850" (formato argentino, con punto de miles)
function formatearPrecio(numero) {
  return '$' + numero.toLocaleString('es-AR');
}

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
function agregarAlCarrito(id, unidades) {
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

document.querySelectorAll('[data-agregar]').forEach((boton) => {
  const textoOriginal = boton.textContent;

  boton.addEventListener('click', () => {
    agregarAlCarrito(Number(boton.dataset.agregar), 1);

    // Confirmación: el botón cambia de texto durante un segundo y medio
    boton.textContent = '¡Agregado! ✓';
    setTimeout(() => {
      boton.textContent = textoOriginal;
    }, 1500);
  });
});

/* --------------------------------------------------------------------------
   Datos de los productos: se leen del JSON
   -------------------------------------------------------------------------- */

// Junta cada item del carrito con su producto del JSON: { producto, cantidad }.
// Si un id ya no existe en el catálogo, se descarta.
function cargarItems() {
  return fetch('data/productos.json')
    .then((respuesta) => {
      if (!respuesta.ok) throw new Error('No se pudo leer el catálogo');
      return respuesta.json();
    })
    .then((productos) =>
      leerCarrito()
        .map((item) => ({ producto: productos.find((p) => p.id === item.id), cantidad: item.cantidad }))
        .filter((item) => item.producto)
    );
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
function mostrarCarrito() {
  cargarItems()
    .then((items) => {
      const vacio = items.length === 0;

      // Con el carrito vacío se ocultan la tabla y el resumen, y se muestra el aviso
      document.querySelector('#carrito-vacio').hidden = !vacio;
      document.querySelector('.carrito-tabla').hidden = vacio;
      document.querySelector('.carrito-resumen').hidden = vacio;

      document.querySelector('#carrito-lista').replaceChildren(...items.map(crearFilaCarrito));

      const unidades = items.reduce((total, item) => total + item.cantidad, 0);
      const total = formatearPrecio(calcularTotal(items));
      document.querySelector('#resumen-unidades').textContent = `Subtotal (${unidades} ${unidades === 1 ? 'producto' : 'productos'})`;
      document.querySelector('#resumen-subtotal').textContent = total;
      document.querySelector('#resumen-total').textContent = total;
    })
    .catch(() => {
      const aviso = document.querySelector('#carrito-vacio');
      aviso.textContent = 'No se pudo cargar el carrito. Si abriste el archivo directamente, usá un servidor local (por ejemplo, Live Server).';
      aviso.hidden = false;
    });
}

/* --------------------------------------------------------------------------
   Resumen del checkout (checkout.html)
   -------------------------------------------------------------------------- */

function mostrarResumenCheckout() {
  const lista = document.querySelector('#checkout-items');

  cargarItems()
    .then((items) => {
      if (items.length === 0) {
        const vacio = crear('li', null, 'Tu carrito está vacío. ');
        const link = crear('a', null, 'Ver catálogo');
        link.href = 'catalogo.html';
        vacio.append(link);
        lista.replaceChildren(vacio);
        // Sin productos no se puede pagar
        document.querySelector('.checkout-resumen button[type="submit"]').disabled = true;
      } else {
        lista.replaceChildren(
          ...items.map((item) => {
            const fila = crear('li', 'resumen-fila');
            fila.append(
              crear('span', null, `${item.producto.nombre} ×${item.cantidad}`),
              crear('span', null, formatearPrecio(item.producto.precio_simulado * item.cantidad))
            );
            return fila;
          })
        );
      }

      const total = formatearPrecio(calcularTotal(items));
      document.querySelector('#checkout-subtotal').textContent = total;
      document.querySelector('#checkout-total').textContent = total;
    })
    .catch(() => {
      lista.replaceChildren(crear('li', 'resumen-fila', 'No se pudo cargar el carrito.'));
    });
}

/* --------------------------------------------------------------------------
   Inicio: se ejecuta al cargar cualquier página
   -------------------------------------------------------------------------- */

actualizarContador();

// Cada página tiene sus propios elementos: solo se arma lo que existe
if (document.querySelector('#carrito-lista')) mostrarCarrito();
if (document.querySelector('#checkout-items')) mostrarResumenCheckout();

/* ==========================================================================
   Mieles Los Primos — Botón de Arrepentimiento (arrepentimiento.html, ES module)
   JavaScript puro, sin frameworks.

   Cómo funciona:
   1. Agrega al selector "Producto" las opciones de data/productos.json.
   2. Al enviar el formulario (los campos ya los valida el navegador con
      required y type="email"), genera un código de arrepentimiento simulado
      y muestra la confirmación con el aviso de las 24 horas
      (Res. SCI 424/2020 y Términos y Condiciones, cláusula 9.3).

   Es una simulación académica: los datos no se envían a ningún servidor
   ni se guardan.
   ========================================================================== */

import { crear } from './utilidades.js';
import { obtenerProductos } from './productos.js';

const formulario = document.querySelector('#form-arrepentimiento');
const selectorProducto = document.querySelector('#arr-producto');
const confirmacion = document.querySelector('#arrepentimiento-confirmacion');

/* --------------------------------------------------------------------------
   Opciones del selector de productos
   -------------------------------------------------------------------------- */

// Si el JSON no carga, el formulario sigue funcionando con la opción
// "Todos los productos del pedido": el derecho no puede depender de eso.
async function cargarProductos() {
  try {
    const productos = await obtenerProductos();
    productos.forEach((producto) => {
      const opcion = crear('option', null, producto.nombre);
      opcion.value = producto.id;
      selectorProducto.append(opcion);
    });
  } catch (error) {
    console.error(error);
  }
}

/* --------------------------------------------------------------------------
   Código de arrepentimiento (simulado)
   -------------------------------------------------------------------------- */

// Formato: ARR-AAAAMMDD-XXXX → ej.: ARR-20261014-K7P3
// La fecha dice cuándo se pidió; las 4 letras y números son al azar.
// Se dejan afuera los caracteres que se confunden (0 y O, 1 e I).
function generarCodigo() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let azar = '';
  for (let i = 0; i < 4; i++) {
    azar += caracteres[Math.floor(Math.random() * caracteres.length)];
  }

  const hoy = new Date();
  const fecha =
    hoy.getFullYear() +
    String(hoy.getMonth() + 1).padStart(2, '0') +
    String(hoy.getDate()).padStart(2, '0');

  return `ARR-${fecha}-${azar}`;
}

/* --------------------------------------------------------------------------
   Envío del formulario
   -------------------------------------------------------------------------- */

formulario.addEventListener('submit', (evento) => {
  // Evita que el navegador recargue la página: el envío es simulado
  evento.preventDefault();

  // FormData lee los campos por su atributo name
  const datos = new FormData(formulario);
  const email = datos.get('email').trim();

  document.querySelector('#arrepentimiento-codigo').textContent = generarCodigo();
  document.querySelector('#arrepentimiento-mensaje').textContent =
    `Dentro de las 24 horas te lo vamos a enviar por el mismo medio por el que hiciste la solicitud: tu correo ${email}. Guardalo para hacer el seguimiento de la devolución.`;

  // Se oculta el formulario y se muestra la confirmación.
  // El foco pasa al título para que el teclado y el lector de pantalla sigan ahí.
  formulario.hidden = true;
  confirmacion.hidden = false;
  confirmacion.querySelector('h3').focus();
});

cargarProductos();

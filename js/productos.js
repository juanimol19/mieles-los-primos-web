/* ==========================================================================
   Mieles Los Primos — Datos de los productos (ES module)
   Único lugar del sitio que lee data/productos.json. El catálogo, el detalle
   de producto y el carrito piden los productos con obtenerProductos().

   Importante: fetch() necesita un servidor local (Live Server o similar).
   Si se abre el archivo con doble clic (file://), el navegador bloquea la
   lectura del JSON y la función lanza un error.
   ========================================================================== */

import { formatearPrecio } from './utilidades.js';

const RUTA_PRODUCTOS = 'data/productos.json';

// Los productos se guardan después de la primera lectura para no pedir
// el mismo archivo varias veces en la misma página
let productosGuardados = null;

// Devuelve la lista de productos del JSON.
// async/await: "await" espera la respuesta del servidor sin bloquear la página.
// Si algo falla, lanza un error que atrapa quien la llama (con try/catch).
export async function obtenerProductos() {
  if (productosGuardados) return productosGuardados;

  const respuesta = await fetch(RUTA_PRODUCTOS);

  // fetch no falla con un 404: hay que revisar respuesta.ok a mano
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer el catálogo (error ${respuesta.status})`);
  }

  productosGuardados = await respuesta.json();
  return productosGuardados;
}

// Texto del precio: algunos productos todavía no tienen precio definido
export function textoPrecio(producto) {
  return producto.precio_a_confirmar ? 'Precio a confirmar' : formatearPrecio(producto.precio_simulado);
}

// Nombre para mostrar de una categoría del JSON: "miel" → "Miel"
export function nombreCategoria(categoria) {
  return categoria.charAt(0).toUpperCase() + categoria.slice(1);
}

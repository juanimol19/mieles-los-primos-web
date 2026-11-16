/* ==========================================================================
   Mieles Los Primos — Historial de pedidos (ES module, CR-07)
   JavaScript puro, sin frameworks.

   Cómo funciona:
   1. checkout.js llama a guardarPedido() al confirmar una compra: el pedido
      se guarda en localStorage (memoria del navegador), igual que el carrito.
   2. En pedidos.html ("Mis pedidos") se listan los pedidos guardados, del más
      nuevo al más viejo, con su estado y el Botón de Arrepentimiento.
   3. El estado del seguimiento es simulado: avanza una etapa cada
      SEGUNDOS_POR_ETAPA desde la compra (para poder mostrarlo en la presentación).

   Privacidad (Ley 25.326): solo se guardan el número, la fecha, los productos,
   el total y el tipo de entrega. Nada de nombre, email, teléfono ni dirección.
   El botón "Borrar mi historial" elimina todo (derecho de supresión).
   ========================================================================== */

import { crear, formatearPrecio } from './utilidades.js';

const CLAVE_PEDIDOS = 'pedidos-los-primos';
export const SEGUNDOS_POR_ETAPA = 4;

// Textos de cada etapa según el tipo de entrega
export const ETAPAS = {
  domicilio: ['Pedido confirmado', 'Preparando tu miel', 'En camino', 'Entregado'],
  sucursal: ['Pedido confirmado', 'Preparando tu miel', 'Listo para retirar', 'Retirado']
};

/* --------------------------------------------------------------------------
   Guardar y leer
   -------------------------------------------------------------------------- */

// try/catch: si el navegador bloquea localStorage o el dato está dañado, no se rompe la página
export function leerPedidos() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_PEDIDOS));
    return Array.isArray(guardado) ? guardado : [];
  } catch (error) {
    return [];
  }
}

export function guardarPedido(pedido) {
  try {
    const pedidos = leerPedidos();
    pedidos.unshift(pedido); // unshift lo agrega al principio: el más nuevo primero
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
  } catch (error) {
    // Sin localStorage el historial no se guarda, pero la compra se confirma igual
    console.error(error);
  }
}

function borrarHistorial() {
  try {
    localStorage.removeItem(CLAVE_PEDIDOS);
  } catch (error) {
    console.error(error);
  }
}

// Etapa actual (de 0 a 3) según los segundos que pasaron desde la compra
export function etapaDelPedido(pedido) {
  const segundos = (Date.now() - new Date(pedido.fecha).getTime()) / 1000;
  return Math.min(3, Math.max(0, Math.floor(segundos / SEGUNDOS_POR_ETAPA)));
}

// Link al Botón de Arrepentimiento con el número de pedido ya cargado
export function linkArrepentimiento(numero) {
  return 'arrepentimiento.html?pedido=' + encodeURIComponent(numero);
}

/* --------------------------------------------------------------------------
   Página "Mis pedidos" (pedidos.html)
   -------------------------------------------------------------------------- */

const lista = document.querySelector('#lista-pedidos');

// Línea de tiempo compacta: los mismos estilos que el seguimiento del checkout, sin la abeja
function crearSeguimiento(pedido) {
  const etapas = ETAPAS[pedido.entrega] || ETAPAS.domicilio;
  const actual = etapaDelPedido(pedido);

  const pista = crear('div', 'seguimiento-pista seguimiento-pista-compacta');
  pista.style.setProperty('--avance', actual / (etapas.length - 1));
  const ol = crear('ol', 'seguimiento-etapas');
  etapas.forEach((texto, i) => {
    const li = crear('li', i < actual ? 'hecha' : i === actual ? 'actual' : null);
    if (i === actual) li.setAttribute('aria-current', 'step');
    const punto = crear('span', 'seguimiento-punto');
    punto.setAttribute('aria-hidden', 'true');
    li.append(punto, crear('span', 'seguimiento-texto', texto));
    ol.append(li);
  });
  pista.append(ol);
  return pista;
}

function crearTarjetaPedido(pedido) {
  const tarjeta = crear('article', 'tarjeta pedido');
  const etapas = ETAPAS[pedido.entrega] || ETAPAS.domicilio;

  // Encabezado: número, fecha y estado
  const encabezado = crear('div', 'pedido-encabezado');
  const titulo = crear('h2', 'pedido-numero', pedido.numero);
  const fecha = crear('p', 'pedido-fecha', new Date(pedido.fecha).toLocaleDateString('es-AR'));
  const estado = crear('p', 'pedido-estado', etapas[etapaDelPedido(pedido)]);
  encabezado.append(titulo, fecha, estado);

  // Productos y total
  const items = crear('ul', 'resumen-items');
  pedido.items.forEach((item) => {
    const fila = crear('li', 'resumen-fila');
    fila.append(crear('span', null, `${item.nombre} ×${item.cantidad}`), crear('span', null, formatearPrecio(item.subtotal)));
    items.append(fila);
  });
  const total = crear('p', 'resumen-fila resumen-total');
  total.append(crear('span', null, 'Total'), crear('span', null, formatearPrecio(pedido.total)));

  const entrega = crear('p', 'pedido-entrega', pedido.entrega === 'sucursal' ? 'Retiro en sucursal' : `Envío a domicilio${pedido.destino ? ' · ' + pedido.destino : ''}`);

  // Botón de Arrepentimiento con el número de pedido ya cargado
  const boton = crear('a', 'boton boton-secundario boton-arrepentimiento', 'Botón de Arrepentimiento');
  boton.href = linkArrepentimiento(pedido.numero);

  tarjeta.append(encabezado, crearSeguimiento(pedido), items, total, entrega, boton);
  return tarjeta;
}

function mostrarPedidos() {
  const pedidos = leerPedidos();
  const botonBorrar = document.querySelector('#borrar-historial');
  botonBorrar.hidden = pedidos.length === 0;

  if (pedidos.length === 0) {
    const vacio = crear('p', 'catalogo-mensaje', 'Todavía no hiciste ninguna compra desde este navegador. ');
    const link = crear('a', null, 'Ver catálogo');
    link.href = 'catalogo.html';
    vacio.append(link);
    lista.replaceChildren(vacio);
    return;
  }
  lista.replaceChildren(...pedidos.map(crearTarjetaPedido));
}

if (lista) {
  mostrarPedidos();

  document.querySelector('#borrar-historial').addEventListener('click', () => {
    borrarHistorial();
    mostrarPedidos();
    document.querySelector('#pedidos-aviso').textContent = 'Se borró tu historial de pedidos de este navegador.';
  });

  // Mientras la página está abierta, el estado de los pedidos recientes se actualiza solo
  setInterval(() => {
    if (leerPedidos().some((pedido) => etapaDelPedido(pedido) < 3)) mostrarPedidos();
  }, 1000);
}

/* ==========================================================================
   Mieles Los Primos — Tarjetas de productos (ES module)
   JavaScript puro, sin frameworks.

   Cómo funciona:
   1. Pide los productos a data/productos.json (obtenerProductos, con async/await).
   2. En catalogo.html arma los botones de categoría y la grilla de tarjetas.
   3. En index.html arma "Nuestros productos".
   Nada está escrito a mano en el HTML: nombre, precio, imagen y categoría
   salen siempre del JSON.

   Los botones "Agregar al carrito" llevan data-agregar="<id>";
   el clic lo atiende js/carrito.js.
   ========================================================================== */

import { crear } from './utilidades.js';
import { obtenerProductos, textoPrecio, nombreCategoria } from './productos.js';

// Contenedores del HTML (cada página tiene solo algunos: si no existe, queda en null)
const grilla = document.querySelector('#grilla-productos');
const listaCategorias = document.querySelector('#lista-categorias');
const destacados = document.querySelector('#lista-destacados');

/* --------------------------------------------------------------------------
   Tarjetas
   -------------------------------------------------------------------------- */

// Imagen del producto, con el texto alternativo que viene del JSON
function crearImagen(producto) {
  const imagen = document.createElement('img');
  imagen.src = producto.imagen_ia_url;
  imagen.alt = producto.imagen_alt;
  return imagen;
}

// Título con el link al detalle. El ::after del link (CSS .tarjeta-link)
// hace que toda la tarjeta sea clickeable.
function crearTitulo(etiqueta, producto) {
  const titulo = crear(etiqueta);
  const link = crear('a', null, producto.nombre);
  link.href = 'producto.html?id=' + producto.id;
  titulo.append(link);
  return titulo;
}

// "Ver detalle →" al pie de la tarjeta: solo visual (el clic lo toma el link)
function crearVerDetalle() {
  const ver = crear('span', 'tarjeta-ver', 'Ver detalle →');
  ver.setAttribute('aria-hidden', 'true');
  return ver;
}

// Tarjeta del catálogo: imagen, nombre, precio y botón "Agregar al carrito".
// Si el producto no tiene precio, no se puede agregar: se consulta desde el detalle.
function crearTarjetaCatalogo(producto) {
  const tarjeta = crear('article', 'tarjeta tarjeta-producto tarjeta-link');
  const texto = crear('div', 'tarjeta-texto');

  texto.append(crearTitulo('h2', producto), crear('p', 'precio', textoPrecio(producto)));

  if (producto.precio_a_confirmar) {
    texto.append(crearVerDetalle());
  } else {
    const boton = crear('button', 'boton', 'Agregar al carrito');
    boton.type = 'button';
    boton.dataset.agregar = producto.id;
    texto.append(boton);
  }

  tarjeta.append(crearImagen(producto), texto);
  return tarjeta;
}

// Tarjeta de "Nuestros productos" (inicio): imagen, nombre, bajada corta y precio
function crearTarjetaInicio(producto) {
  const tarjeta = crear('article', 'tarjeta tarjeta-link');
  const texto = crear('div', 'tarjeta-texto');

  texto.append(crearTitulo('h3', producto));
  if (producto.resumen) texto.append(crear('p', null, producto.resumen));
  texto.append(crear('p', 'precio', textoPrecio(producto)), crearVerDetalle());

  tarjeta.append(crearImagen(producto), texto);
  return tarjeta;
}

// Reemplaza el contenido de un contenedor por un mensaje (cargando, error o lista vacía)
function mostrarMensaje(contenedor, texto) {
  contenedor.replaceChildren(crear('p', 'catalogo-mensaje', texto));
}

/* --------------------------------------------------------------------------
   Catálogo (catalogo.html): grilla y filtro por categoría
   -------------------------------------------------------------------------- */

function mostrarGrilla(productos) {
  if (productos.length === 0) {
    mostrarMensaje(grilla, 'No hay productos en esta categoría.');
    return;
  }
  grilla.replaceChildren(...productos.map(crearTarjetaCatalogo));
}

// Crea un botón de filtro. aria-pressed indica cuál está activo
// (el CSS lo pinta de ámbar y los lectores de pantalla lo anuncian).
function crearBotonFiltro(texto, categoria, productos) {
  const boton = crear('button', 'categoria-boton', texto);
  boton.type = 'button';
  boton.setAttribute('aria-pressed', categoria === 'todos' ? 'true' : 'false');

  boton.addEventListener('click', () => {
    listaCategorias.querySelectorAll('.categoria-boton').forEach((otro) => {
      otro.setAttribute('aria-pressed', otro === boton ? 'true' : 'false');
    });

    const filtrados = categoria === 'todos' ? productos : productos.filter((p) => p.categoria === categoria);
    mostrarGrilla(filtrados);
  });

  const item = crear('li');
  item.append(boton);
  return item;
}

// Los botones se arman con las categorías que hay en el JSON, en orden alfabético.
// new Set() elimina las repetidas: ["miel", "miel", "polen", "panal", "miel"] → miel, polen, panal
// y sort() las ordena: miel, panal, polen
function crearFiltros(productos) {
  const categorias = [...new Set(productos.map((p) => p.categoria))].sort();

  listaCategorias.replaceChildren(
    crearBotonFiltro('Todos', 'todos', productos),
    ...categorias.map((categoria) => crearBotonFiltro(nombreCategoria(categoria), categoria, productos))
  );
}

/* --------------------------------------------------------------------------
   Inicio: leer el JSON y armar lo que exista en la página
   -------------------------------------------------------------------------- */

async function iniciar() {
  try {
    const productos = await obtenerProductos();

    if (grilla) {
      crearFiltros(productos);
      mostrarGrilla(productos);
    }
    if (destacados) {
      destacados.replaceChildren(...productos.map(crearTarjetaInicio));
    }
  } catch (error) {
    console.error(error);
    const texto = 'No se pudieron cargar los productos. Si abriste el archivo directamente, usá un servidor local (por ejemplo, Live Server).';
    if (grilla) mostrarMensaje(grilla, texto);
    if (destacados) mostrarMensaje(destacados, texto);
  }
}

iniciar();

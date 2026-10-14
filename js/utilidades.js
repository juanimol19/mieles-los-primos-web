/* ==========================================================================
   Mieles Los Primos — Utilidades compartidas (ES module)
   Funciones chicas que usan varios scripts del sitio. Cada una se exporta
   con "export" y se importa donde se necesita con "import".
   ========================================================================== */

// Crea un elemento con una clase y un texto opcionales.
// Usar textContent (y no innerHTML) evita que un texto se interprete como HTML.
export function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto) elemento.textContent = texto;
  return elemento;
}

// Formato de moneda argentina (ARS) con la API Intl del navegador:
// punto de miles y sin decimales, porque los precios son enteros.
const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

// 8850 → "$ 8.850" (el espacio es "duro": el precio no se corta en dos líneas)
export function formatearPrecio(numero) {
  return formatoPesos.format(numero);
}

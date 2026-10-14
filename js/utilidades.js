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

// 8850 → "$8.850" (formato argentino, con punto de miles)
export function formatearPrecio(numero) {
  return '$' + numero.toLocaleString('es-AR');
}

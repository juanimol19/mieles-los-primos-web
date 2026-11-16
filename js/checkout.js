/* ==========================================================================
   Mieles Los Primos — Validación del checkout y confirmación simulada (ES module)
   JavaScript puro, sin frameworks. Se carga solo en checkout.html.

   Cómo funciona:
   1. Captura el envío (submit) del formulario y revisa los datos con JS.
      Si algo está mal, muestra el error debajo del campo y no confirma.
   2. La dirección solo es obligatoria si se elige "Envío a domicilio".
   3. La casilla de Términos y Condiciones y Política de Privacidad
      es obligatoria (Anexo B, ítem 2).
   4. Si todo está bien, muestra la confirmación con el N.º de pedido,
      el detalle, el total y la leyenda de los 10 días (ítems 5 y 7),
      y vacía el carrito.
   5. Al elegir la provincia, sugiere sus localidades (data/localidades.json).
   6. En la confirmación, un seguimiento simulado del pedido: una abeja
      avanza por cuatro etapas, y el pedido se guarda en "Mis pedidos"
      (js/pedidos.js, CR-07).

   Es una simulación académica: los datos no se envían a ningún servidor.
   Solo se guarda en el navegador el resumen del pedido, sin datos personales.
   ========================================================================== */

import { crear, formatearPrecio } from './utilidades.js';
import { cargarItems, calcularTotal, crearFilaResumen, vaciarCarrito } from './carrito.js';
import { ETAPAS, SEGUNDOS_POR_ETAPA, guardarPedido, linkArrepentimiento } from './pedidos.js';

const formulario = document.querySelector('#form-checkout');
const seccionCheckout = document.querySelector('#checkout');
const confirmacion = document.querySelector('#checkout-confirmacion');

// formulario.elements permite leer cada campo por su atributo name
const campos = formulario.elements;

// Con JS funcionando, la validación la hace este archivo (con mensajes propios).
// Si el JS no carga, noValidate queda en false y valida el navegador
// con los atributos required y pattern del HTML.
formulario.noValidate = true;

/* --------------------------------------------------------------------------
   Reglas de validación
   -------------------------------------------------------------------------- */

// Expresiones regulares: describen el formato que tiene que tener un texto
const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;           // algo@algo.com
const PATRON_TELEFONO = /^[0-9 +()-]{8,20}$/;                    // igual que el pattern del HTML
const PATRON_CP = /^([0-9]{4}|[A-Za-z][0-9]{4}[A-Za-z]{3})$/;    // 3705 o H3705ABC

function eligioEnvioADomicilio() {
  return campos.envio.value === 'domicilio';
}

/* --------------------------------------------------------------------------
   Mensajes de error debajo de cada campo
   -------------------------------------------------------------------------- */

// aria-invalid y aria-describedby hacen que el lector de pantalla
// anuncie que el campo tiene un error y lea el mensaje.
function mostrarError(campo, mensaje) {
  const contenedor = campo.closest('.campo, .casilla');
  let error = contenedor.querySelector('.campo-error');

  if (!error) {
    error = crear('p', 'campo-error');
    error.id = 'error-' + campo.id;
    contenedor.append(error);
  }

  error.textContent = mensaje;
  campo.setAttribute('aria-invalid', 'true');
  campo.setAttribute('aria-describedby', error.id);
}

function limpiarError(campo) {
  const contenedor = campo.closest('.campo, .casilla');
  const error = contenedor && contenedor.querySelector('.campo-error');
  if (error) error.remove();
  campo.removeAttribute('aria-invalid');
  campo.removeAttribute('aria-describedby');
}

// Revisa todos los campos y devuelve la lista de los que tienen error
function validarFormulario() {
  const conError = [];

  // Si la condición no se cumple, marca el campo; si se cumple, le saca el error
  function revisar(campo, esValido, mensaje) {
    if (esValido) {
      limpiarError(campo);
    } else {
      mostrarError(campo, mensaje);
      conError.push(campo);
    }
  }

  // trim() saca los espacios del principio y del final: "   " cuenta como vacío
  const valor = (campo) => campo.value.trim();

  // 1. Datos del comprador
  revisar(campos.nombre, valor(campos.nombre).length >= 3, 'Ingresá tu nombre y apellido.');
  revisar(campos.email, PATRON_EMAIL.test(valor(campos.email)), 'Ingresá un email válido (ej.: ejemplo@correo.com).');
  revisar(campos.telefono, PATRON_TELEFONO.test(valor(campos.telefono)), 'Ingresá un teléfono de 8 a 20 caracteres (números, espacios, +, guiones o paréntesis).');

  // 2. Dirección: solo si se eligió envío a domicilio
  const direccion = [campos.provincia, campos.localidad, campos.direccion, campos.cp];
  if (eligioEnvioADomicilio()) {
    revisar(campos.provincia, campos.provincia.value !== '', 'Elegí tu provincia.');
    revisar(campos.localidad, valor(campos.localidad) !== '', 'Ingresá tu localidad.');
    revisar(campos.direccion, valor(campos.direccion) !== '', 'Ingresá la calle y el número.');
    revisar(campos.cp, PATRON_CP.test(valor(campos.cp)), 'Ingresá 4 números (ej.: 3705) o el CPA completo (ej.: H3705ABC).');
  } else {
    // Con retiro en sucursal esos campos no se piden: se borran los errores viejos
    direccion.forEach(limpiarError);
  }

  // 3. Aceptación expresa de los Términos y Condiciones y la Política de Privacidad
  revisar(campos.acepto_terminos, campos.acepto_terminos.checked, 'Para confirmar la compra tenés que aceptar los Términos y Condiciones y la Política de Privacidad.');

  return conError;
}

// Cuando se corrige un campo marcado, el error se saca enseguida.
// Si sigue mal, vuelve a aparecer al intentar confirmar otra vez.
formulario.addEventListener('input', (evento) => {
  if (evento.target.hasAttribute('aria-invalid')) limpiarError(evento.target);
});
formulario.addEventListener('change', (evento) => {
  if (evento.target.hasAttribute('aria-invalid')) limpiarError(evento.target);
});

/* --------------------------------------------------------------------------
   Localidades según la provincia
   -------------------------------------------------------------------------- */

// Las localidades se piden una sola vez y quedan guardadas en esta variable
let localidadesPorProvincia = null;

async function cargarLocalidades() {
  if (!localidadesPorProvincia) {
    const respuesta = await fetch('data/localidades.json');
    if (!respuesta.ok) throw new Error('No se pudieron cargar las localidades');
    localidadesPorProvincia = await respuesta.json();
  }
  return localidadesPorProvincia;
}

// Llena el <datalist> con las localidades de la provincia elegida.
// El navegador las muestra como sugerencias al escribir o hacer clic en el campo.
campos.provincia.addEventListener('change', async () => {
  const lista = document.querySelector('#lista-localidades');
  campos.localidad.value = ''; // la localidad anterior puede no ser de esta provincia
  lista.replaceChildren();

  if (campos.provincia.value === '') {
    campos.localidad.placeholder = 'Elegí primero la provincia';
    return;
  }

  try {
    const localidades = await cargarLocalidades();
    const deLaProvincia = localidades[campos.provincia.value] || [];
    lista.replaceChildren(...deLaProvincia.map((nombre) => {
      const opcion = document.createElement('option');
      opcion.value = nombre;
      return opcion;
    }));
    campos.localidad.placeholder = deLaProvincia.length > 0
      ? `Ej.: ${deLaProvincia[0]} (o escribí la tuya)`
      : 'Escribí tu localidad';
  } catch (error) {
    // Si el JSON no carga, el campo sigue funcionando como texto libre
    console.error(error);
    campos.localidad.placeholder = 'Escribí tu localidad';
  }
});

/* --------------------------------------------------------------------------
   Seguimiento simulado del pedido
   -------------------------------------------------------------------------- */

// Las etapas y su duración están en js/pedidos.js: así "Mis pedidos" muestra el mismo estado
function iniciarSeguimiento() {
  const etapas = ETAPAS[eligioEnvioADomicilio() ? 'domicilio' : 'sucursal'];
  const pista = document.querySelector('.seguimiento-pista');
  const items = [...document.querySelectorAll('#seguimiento-etapas li')];
  const estado = document.querySelector('#seguimiento-estado');

  items.forEach((item, i) => {
    item.querySelector('.seguimiento-texto').textContent = etapas[i];
  });

  let actual = 0;
  function mostrarEtapa() {
    // --avance va de 0 a 1: el CSS lo usa para mover la abeja y llenar la línea
    pista.style.setProperty('--avance', actual / (etapas.length - 1));
    items.forEach((item, i) => {
      item.classList.toggle('hecha', i < actual);
      item.classList.toggle('actual', i === actual);
      // aria-current="step" indica la etapa actual al lector de pantalla
      if (i === actual) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    estado.textContent = `Estado: ${etapas[actual]}`;
  }

  mostrarEtapa();
  // Cada pocos segundos pasa a la etapa siguiente, hasta la última
  const intervalo = setInterval(() => {
    actual++;
    mostrarEtapa();
    if (actual === etapas.length - 1) clearInterval(intervalo);
  }, SEGUNDOS_POR_ETAPA * 1000);
}

/* --------------------------------------------------------------------------
   Confirmación simulada
   -------------------------------------------------------------------------- */

// Formato: LP-000000 → ej.: LP-004821 (6 números al azar).
// Es el mismo formato que pide el formulario del Botón de Arrepentimiento.
function generarNumeroPedido() {
  const numero = Math.floor(Math.random() * 1000000);
  return 'LP-' + String(numero).padStart(6, '0');
}

// Texto visible de la opción elegida en un select o en un grupo de radios
function textoProvincia() {
  return campos.provincia.selectedOptions[0].textContent;
}

function textoOpcionElegida(nombre) {
  const elegido = formulario.querySelector(`input[name="${nombre}"]:checked`);
  return formulario.querySelector(`label[for="${elegido.id}"] strong`).textContent;
}

function textoEntrega() {
  if (!eligioEnvioADomicilio()) return 'Retiro en sucursal';

  const { direccion, localidad, cp } = campos;
  return `Envío a domicilio: ${direccion.value.trim()}, ${localidad.value.trim()}, ${textoProvincia()} (CP ${cp.value.trim().toUpperCase()})`;
}

function mostrarConfirmacion(items) {
  const total = formatearPrecio(calcularTotal(items));

  const numero = generarNumeroPedido();
  document.querySelector('#confirmacion-numero').textContent = numero;
  // Botón de Arrepentimiento con el número de pedido ya cargado en el formulario
  document.querySelector('#confirmacion-arrepentimiento').href = linkArrepentimiento(numero);
  document.querySelector('#confirmacion-items').replaceChildren(...items.map(crearFilaResumen));
  document.querySelector('#confirmacion-subtotal').textContent = total;
  document.querySelector('#confirmacion-costo-envio').textContent = eligioEnvioADomicilio() ? 'A calcular' : 'No corresponde';
  document.querySelector('#confirmacion-total').textContent = total;

  document.querySelector('#confirmacion-fecha').textContent = new Date().toLocaleDateString('es-AR');
  document.querySelector('#confirmacion-comprador').textContent = `${campos.nombre.value.trim()} (${campos.email.value.trim()})`;
  document.querySelector('#confirmacion-entrega').textContent = textoEntrega();
  document.querySelector('#confirmacion-pago').textContent = textoOpcionElegida('pago');

  // Se oculta el checkout y se muestra la confirmación.
  // El foco pasa al título para que el teclado y el lector de pantalla sigan ahí.
  seccionCheckout.hidden = true;
  confirmacion.hidden = false;
  confirmacion.querySelector('h1').focus();
  iniciarSeguimiento();

  // Se guarda en el historial de "Mis pedidos" (sin datos personales)
  guardarPedido({
    numero,
    fecha: new Date().toISOString(),
    items: items.map((item) => ({
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      subtotal: item.producto.precio_simulado * item.cantidad
    })),
    total: calcularTotal(items),
    entrega: eligioEnvioADomicilio() ? 'domicilio' : 'sucursal',
    destino: eligioEnvioADomicilio() ? `${campos.localidad.value.trim()}, ${textoProvincia()}` : ''
  });
}

/* --------------------------------------------------------------------------
   Envío del formulario
   -------------------------------------------------------------------------- */

formulario.addEventListener('submit', async (evento) => {
  // Evita que el navegador recargue la página: la compra es simulada
  evento.preventDefault();

  const conError = validarFormulario();
  if (conError.length > 0) {
    // El foco va al primer campo con error (y la página se desplaza hasta él)
    conError[0].focus();
    return;
  }

  try {
    const items = await cargarItems();
    if (items.length === 0) return; // sin productos no hay compra (el botón ya está deshabilitado)

    mostrarConfirmacion(items);
    vaciarCarrito();
  } catch (error) {
    console.error(error);
  }
});

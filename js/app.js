
const CLAVE_CARRITO = "nutripro-carrito";
const CLAVE_PRECIOS = "nutripro-precios";

// URL pública de Google Sheets (CSV)
const URL_PRECIOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSW09va7RGzhWnH_5R7Cm98fNuEEWS_pdBdq3GwFLJdY7yu6q2lK1tETYtpZJ2TLq-0VJxAKb-Ksl1y/pub?gid=0&single=true&output=csv";

// Intervalo de actualización: 5 minutos
const INTERVALO_PRECIOS = 5 * 60 * 1000;


// ELEMENTOS DEL HTML

const botonAbrir = document.getElementById("abrir-carrito");
const botonCerrar = document.getElementById("cerrar-carrito");
const fondoCarrito = document.getElementById("carrito-fondo");
const panelCarrito = document.getElementById("carrito-panel");
const listaProductos = document.getElementById("carrito-productos");
const contadorCarrito = document.getElementById("carrito-contador");
const totalCarrito = document.getElementById("carrito-total");
const botonPedido = document.getElementById("realizar-pedido");


// OBTENER Y GUARDAR EL CARRITO

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}


// OBTENER Y GUARDAR LOS PRECIOS

function obtenerPreciosGuardados() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_PRECIOS)) || {};
    } catch {
        return {};
    }
}

function guardarPrecios(precios) {
    localStorage.setItem(CLAVE_PRECIOS, JSON.stringify(precios));
}


// FORMATEAR PRECIOS

function formatearPrecio(precio) {
    return precio.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    });
}

function convertirPrecio(valor) {
    const numero = Number(String(valor).replace(/\D/g, ""));

    return Number.isFinite(numero) && numero > 0
        ? numero
        : null;
}


// LEER EL ARCHIVO CSV

function leerCSV(texto) {
    const filas = [];
    let fila = [];
    let campo = "";
    let entreComillas = false;

    for (let i = 0; i < texto.length; i++) {
        const caracter = texto[i];

        if (caracter === '"') {
            if (entreComillas && texto[i + 1] === '"') {
                campo += '"';
                i++;
            } else {
                entreComillas = !entreComillas;
            }
        } else if (caracter === "," && !entreComillas) {
            fila.push(campo);
            campo = "";
        } else if (caracter === "\n" && !entreComillas) {
            fila.push(campo);
            filas.push(fila);

            fila = [];
            campo = "";
        } else if (caracter !== "\r" || entreComillas) {
            campo += caracter;
        }
    }

    if (campo !== "" || fila.length > 0) {
        fila.push(campo);
        filas.push(fila);
    }

    return filas.filter(fila =>
        fila.some(celda => celda.trim() !== "")
    );
}


// CONVERTIR EL CSV EN UNA LISTA DE PRECIOS

function obtenerPreciosCSV(texto) {
    const filas = leerCSV(texto);

    if (filas.length < 2) {
        throw new Error("El archivo CSV no contiene productos.");
    }

    const encabezados = filas[0].map(celda =>
        celda.replace(/^\uFEFF/, "").trim().toLowerCase()
    );

    const columnaID = encabezados.indexOf("id");
    const columnaPrecio = encabezados.indexOf("precio");

    if (columnaID === -1 || columnaPrecio === -1) {
        throw new Error("No se encontraron las columnas ID y Precio.");
    }

    const precios = {};

    for (let i = 1; i < filas.length; i++) {
        const id = filas[i][columnaID]?.trim();
        const precio = convertirPrecio(filas[i][columnaPrecio]);

        if (id && precio !== null) {
            precios[id] = precio;
        }
    }

    if (Object.keys(precios).length === 0) {
        throw new Error("No se encontraron precios válidos.");
    }

    return precios;
}


// ACTUALIZAR LOS PRECIOS DE LAS TARJETAS

function aplicarPreciosTarjetas(precios) {
    document.querySelectorAll(".card[data-id]").forEach(tarjeta => {
        const id = tarjeta.dataset.id;
        const precio = precios[id];

        if (precio === undefined) return;

        const elementoPrecio = tarjeta.querySelector(".precio");

        if (elementoPrecio) {
            elementoPrecio.textContent = formatearPrecio(precio);
        }
    });
}


// ACTUALIZAR LOS PRECIOS DEL CARRITO

function sincronizarPreciosCarrito(precios) {
    const carrito = obtenerCarrito();

    carrito.forEach(producto => {
        if (precios[producto.id] !== undefined) {
            producto.precio = precios[producto.id];
        }
    });

    guardarCarrito(carrito);
    actualizarCarrito();
}


// CONSULTAR GOOGLE SHEETS

async function actualizarPrecios() {
    try {
        const respuesta = await fetch(
            `${URL_PRECIOS}&t=${Date.now()}`,
            { cache: "no-store" }
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar Google Sheets.");
        }

        const texto = await respuesta.text();
        const preciosNuevos = obtenerPreciosCSV(texto);

        const preciosGuardados = obtenerPreciosGuardados();

        // Actualizar los precios recibidos y conservar los demás.
        Object.assign(preciosGuardados, preciosNuevos);

        guardarPrecios(preciosGuardados);

        aplicarPreciosTarjetas(preciosGuardados);
        sincronizarPreciosCarrito(preciosGuardados);

        console.log("Precios actualizados correctamente.");

    } catch (error) {
        console.error("Error al actualizar los precios:", error);

        // Se mantienen los últimos precios guardados.
    }
}


// INICIALIZAR LOS PRECIOS

function inicializarPrecios() {
    const preciosGuardados = obtenerPreciosGuardados();

    // Si todavía no hay un precio guardado para un producto,
    // se utiliza el precio que figura en su HTML.
    document.querySelectorAll(".card[data-id]").forEach(tarjeta => {
        const id = tarjeta.dataset.id;

        if (preciosGuardados[id] !== undefined) return;

        const elementoPrecio = tarjeta.querySelector(".precio");

        if (!elementoPrecio) return;

        const precio = convertirPrecio(elementoPrecio.textContent);

        if (precio !== null) {
            preciosGuardados[id] = precio;
        }
    });

    guardarPrecios(preciosGuardados);

    aplicarPreciosTarjetas(preciosGuardados);
    sincronizarPreciosCarrito(preciosGuardados);

    // Primera consulta a Google Sheets.
    actualizarPrecios();

    // Consultas posteriores cada 5 minutos.
    setInterval(actualizarPrecios, INTERVALO_PRECIOS);
}


// AGREGAR UN PRODUCTO AL CARRITO

function agregarAlCarrito(producto) {
    const carrito = obtenerCarrito();

    const existente = carrito.find(item => item.id === producto.id);

    if (existente) {
        existente.cantidad++;
        existente.precio = producto.precio;
    } else {
        carrito.push({
            ...producto,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    actualizarCarrito();
}


// MODIFICAR CANTIDAD

function modificarCantidad(id, cambio) {
    const carrito = obtenerCarrito();
    const producto = carrito.find(item => item.id === id);

    if (!producto) return;

    producto.cantidad += cambio;

    const carritoActualizado = carrito.filter(
        item => item.cantidad > 0
    );

    guardarCarrito(carritoActualizado);
    actualizarCarrito();
}


// ELIMINAR PRODUCTO

function eliminarProducto(id) {
    const carrito = obtenerCarrito().filter(
        item => item.id !== id
    );

    guardarCarrito(carrito);
    actualizarCarrito();
}


// ACTUALIZAR EL CARRITO

function actualizarCarrito() {
    if (!listaProductos) return;

    const carrito = obtenerCarrito();

    listaProductos.innerHTML = "";

    let total = 0;
    let cantidadTotal = 0;

    carrito.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;

        total += subtotal;
        cantidadTotal += producto.cantidad;

        const elemento = document.createElement("article");
        elemento.className = "carrito-producto";

        elemento.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}">

            <div class="carrito-producto-info">
                <h3>${producto.nombre}</h3>

                <p>${producto.descripcion}</p>

                <p class="carrito-producto-precio">
                    ${formatearPrecio(subtotal)}
                </p>

                <div class="carrito-producto-acciones">
                    <button data-accion="restar"
                        data-id="${producto.id}"
                        aria-label="Restar una unidad">−</button>

                    <span>${producto.cantidad}</span>

                    <button data-accion="sumar"
                        data-id="${producto.id}"
                        aria-label="Sumar una unidad">+</button>

                    <button class="carrito-eliminar"
                        data-accion="eliminar"
                        data-id="${producto.id}">
                        Eliminar
                    </button>
                </div>
            </div>
        `;

        listaProductos.appendChild(elemento);
    });

    if (carrito.length === 0) {
        listaProductos.innerHTML = `
            <p class="carrito-vacio">
                Tu carrito está vacío.
            </p>
        `;
    }

    if (contadorCarrito) {
        contadorCarrito.textContent = cantidadTotal;
    }

    if (totalCarrito) {
        totalCarrito.textContent = formatearPrecio(total);
    }

    if (botonPedido) {
        botonPedido.disabled = carrito.length === 0;
    }
}


// ABRIR Y CERRAR EL CARRITO

function abrirCarrito() {
    if (!panelCarrito || !fondoCarrito || !botonAbrir) return;

    panelCarrito.classList.add("abierto");
    fondoCarrito.classList.add("activo");

    botonAbrir.setAttribute("aria-expanded", "true");
    panelCarrito.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}

function cerrarCarrito() {
    if (!panelCarrito || !fondoCarrito || !botonAbrir) return;

    panelCarrito.classList.remove("abierto");
    fondoCarrito.classList.remove("activo");

    botonAbrir.setAttribute("aria-expanded", "false");
    panelCarrito.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}


// EVENTOS DEL CARRITO

if (botonAbrir) {
    botonAbrir.addEventListener("click", abrirCarrito);
}

if (botonCerrar) {
    botonCerrar.addEventListener("click", cerrarCarrito);
}

if (fondoCarrito) {
    fondoCarrito.addEventListener("click", cerrarCarrito);
}

document.addEventListener("keydown", function(evento) {
    if (evento.key === "Escape") {
        cerrarCarrito();
    }
});


// EVENTOS DE LOS PRODUCTOS DEL CARRITO

if (listaProductos) {
    listaProductos.addEventListener("click", function(evento) {
        const boton = evento.target.closest("button");

        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.accion;

        if (accion === "sumar") {
            modificarCantidad(id, 1);
        } else if (accion === "restar") {
            modificarCantidad(id, -1);
        } else if (accion === "eliminar") {
            eliminarProducto(id);
        }
    });
}


// AGREGAR PRODUCTOS DESDE LAS TARJETAS

document.addEventListener("click", function(evento) {
    const boton = evento.target.closest(".productos .boton");

    if (!boton) return;

    evento.preventDefault();

    const tarjeta = boton.closest(".card");

    if (!tarjeta) return;

    const id = tarjeta.dataset.id;

    if (!id) return;

    const nombre = tarjeta.querySelector("h2")?.textContent.trim();

    const descripcion = tarjeta
        .querySelector("p:not(.precio)")?.textContent.trim();

    const textoPrecio = tarjeta
        .querySelector(".precio")?.textContent.trim();

    const precio = convertirPrecio(textoPrecio);

    const imagen = tarjeta.querySelector("img")?.getAttribute("src");

    if (!nombre || !descripcion || precio === null || !imagen) {
        return;
    }

    agregarAlCarrito({
        id,
        nombre,
        descripcion,
        precio,
        imagen
    });

    abrirCarrito();
});


// REALIZAR PEDIDO POR WHATSAPP

if (botonPedido) {
    botonPedido.addEventListener("click", function() {
        const carrito = obtenerCarrito();

        if (carrito.length === 0) return;

        let mensaje = "¡Hola! Quiero realizar el siguiente pedido:\n\n";

        carrito.forEach(producto => {
            const subtotal = producto.precio * producto.cantidad;

            mensaje += `${producto.nombre}\n`;
            mensaje += `Cantidad: ${producto.cantidad}\n`;
            mensaje += `Subtotal: ${formatearPrecio(subtotal)}\n\n`;
        });

        const total = carrito.reduce(
            (suma, producto) => suma + producto.precio * producto.cantidad,
            0
        );

        mensaje += `TOTAL: ${formatearPrecio(total)}\n\n`;
        mensaje += "¡Gracias!";

        const telefono = "5493517660848";

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

        window.open(url, "_blank");
    });
}


// INICIAR

actualizarCarrito();
inicializarPrecios();


// SERVICE WORKER

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js")
            .catch(error => {
                console.error("Error al registrar el service worker:", error);
            });
    });
}

console.log("NutriPro - versión actualizada");
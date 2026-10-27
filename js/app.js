
// const CLAVE_CARRITO = "carrito";

// function obtenerCarrito() {
//     return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
// }

// function guardarCarrito(carrito) {
//     localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
// }

// function agregarAlCarrito(producto) {
//     const carrito = obtenerCarrito();

//     const productoExistente = carrito.find(
//         item => item.id === producto.id
//     );

//     if (productoExistente) {
//         productoExistente.cantidad++;
//     } else {
//         producto.cantidad = 1;
//         carrito.push(producto);
//     }

//     guardarCarrito(carrito);
// }

// document.querySelector(".productos").addEventListener("click", function(evento) {
//     const boton = evento.target.closest(".boton");

//     if (!boton) return;

//     evento.preventDefault();

//     const tarjeta = boton.closest(".card");

//     const id = tarjeta.dataset.id;

//     if (!id) return;

//     const nombre = tarjeta.querySelector("h2").textContent.trim();
//     const descripcion = tarjeta.querySelector("p:not(.precio)").textContent.trim();
//     const precio = Number(tarjeta.querySelector(".precio").textContent.trim());
//     const imagen = tarjeta.querySelector("img").getAttribute("src");

//     if (!nombre || !descripcion || !Number.isFinite(precio) || precio <= 0) {
//         return;
//     }

//     agregarAlCarrito({
//         id: id,
//         nombre: nombre,
//         descripcion: descripcion,
//         precio: precio,
//         imagen: imagen
//     });

//     console.log(obtenerCarrito());
// });

const CLAVE_CARRITO = "nutripro-carrito";

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


// FORMATEAR PRECIOS
function formatearPrecio(precio) {
    return precio.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    });
}


// AGREGAR UN PRODUCTO
function agregarAlCarrito(producto) {
    const carrito = obtenerCarrito();

    const existente = carrito.find(item => item.id === producto.id);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            ...producto,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    actualizarCarrito();
}


// ACTUALIZAR CANTIDAD O ELIMINAR PRODUCTOS
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

function eliminarProducto(id) {
    const carrito = obtenerCarrito().filter(
        item => item.id !== id
    );

    guardarCarrito(carrito);
    actualizarCarrito();
}


// MOSTRAR EL CARRITO EN PANTALLA
function actualizarCarrito() {
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

    contadorCarrito.textContent = cantidadTotal;
    totalCarrito.textContent = formatearPrecio(total);
    botonPedido.disabled = carrito.length === 0;
}


// ABRIR Y CERRAR EL PANEL
function abrirCarrito() {
    panelCarrito.classList.add("abierto");
    fondoCarrito.classList.add("activo");

    botonAbrir.setAttribute("aria-expanded", "true");
    panelCarrito.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}

function cerrarCarrito() {
    panelCarrito.classList.remove("abierto");
    fondoCarrito.classList.remove("activo");

    botonAbrir.setAttribute("aria-expanded", "false");
    panelCarrito.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

botonAbrir.addEventListener("click", abrirCarrito);
botonCerrar.addEventListener("click", cerrarCarrito);
fondoCarrito.addEventListener("click", cerrarCarrito);

document.addEventListener("keydown", function(evento) {
    if (evento.key === "Escape") {
        cerrarCarrito();
    }
});


// DETECTAR CLICS EN LOS BOTONES DEL CARRITO
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


// DETECTAR CLICS EN LOS BOTONES DE LOS PRODUCTOS
document.querySelector(".productos").addEventListener(
    "click",
    function(evento) {
        const boton = evento.target.closest(".boton");

        if (!boton) return;

        evento.preventDefault();

        const tarjeta = boton.closest(".card");
        const id = tarjeta.dataset.id;

        // Ignorar las tarjetas sin producto asignado.
        if (!id) return;

        const nombre = tarjeta.querySelector("h2").textContent.trim();

        const descripcion = tarjeta
            .querySelector("p:not(.precio)")
            .textContent.trim();

        const textoPrecio = tarjeta
            .querySelector(".precio")
            .textContent.trim();

        const precio = Number(textoPrecio.replace(/\D/g, ""));
        const imagen = tarjeta.querySelector("img").getAttribute("src");

        if (!nombre || !descripcion || !Number.isFinite(precio) || precio <= 0) {
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
    }
);


// GENERAR PEDIDO PARA WHATSAPP
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


// MOSTRAR LOS PRODUCTOS GUARDADOS AL CARGAR LA PÁGINA
actualizarCarrito();


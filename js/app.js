// MODO OSCURO

const CLAVE_TEMA = "nutripro-tema";

const botonTema = document.getElementById("boton-tema");

function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;

    localStorage.setItem(CLAVE_TEMA, tema);

    if (botonTema) {
        botonTema.textContent = tema === "oscuro" ? "☀️" : "🌙";

        botonTema.setAttribute(
            "aria-label",
            tema === "oscuro" ? "Activar modo claro" : "Activar modo oscuro"
        );
    }
}

aplicarTema(localStorage.getItem(CLAVE_TEMA) || "claro");

if (botonTema) {
    botonTema.addEventListener("click", function() {
        const temaActual = document.documentElement.dataset.tema;

        aplicarTema(temaActual === "oscuro" ? "claro" : "oscuro");
    });
}


const CLAVE_CARRITO = "nutripro-carrito";
const CLAVE_CATALOGO = "nutripro-catalogo";

const URL_CATALOGO = "https://script.google.com/macros/s/AKfycby8oWnbG7SjRa_Rt1LBPNxZuWNZV7JFfPz08aX9-O1Nbagn51yXfAu20XwfCrYZstpi/exec";

const INTERVALO_CATALOGO = 5 * 60 * 1000;


// ELEMENTOS DEL HTML

const botonAbrir = document.getElementById("abrir-carrito");
const botonCerrar = document.getElementById("cerrar-carrito");
const fondoCarrito = document.getElementById("carrito-fondo");
const panelCarrito = document.getElementById("carrito-panel");
const listaProductos = document.getElementById("carrito-productos");
const contadorCarrito = document.getElementById("carrito-contador");
const totalCarrito = document.getElementById("carrito-total");
const botonPedido = document.getElementById("realizar-pedido");
const contenedorProductos = document.querySelector(".productos");
const buscador = document.getElementById("search-input");
const tituloResultados = document.getElementById("titulo-resultados");
const contadorResultados = document.getElementById("contador-resultados");


// CARRITO

function obtenerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
    } catch {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}


// PRECIOS

function convertirPrecio(valor) {
    const numero = Number(String(valor).replace(/\D/g, ""));

    return Number.isFinite(numero) && numero > 0
        ? numero
        : null;
}

function formatearPrecio(precio) {
    return Number(precio).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    });
}

function normalizarTexto(texto) {
    return String(texto)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// BUSCADOR

function buscarProductos(texto, catalogo) {
    const busqueda = normalizarTexto(texto);

    return catalogo.filter(producto => {
        const campos = [
            producto.nombre,
            producto.descripcion,
            producto.categoria,
            producto.info
        ];

        return campos.some(campo =>
            normalizarTexto(campo).includes(busqueda)
        );
    });
}


function ejecutarBusqueda(texto) {
    const busqueda = texto.trim();

    if (busqueda === "") return;

    const rutaResultados = location.pathname.toLowerCase().includes("/pages/")
        ? "resultados.html"
        : "pages/resultados.html";

    const url = new URL(rutaResultados, location.href);

    url.searchParams.set("buscar", busqueda);

    location.href = url.href;
}


if (buscador) {
    buscador.addEventListener("keydown", function(evento) {
        if (evento.key === "Enter") {
            evento.preventDefault();
            ejecutarBusqueda(buscador.value);
        }
    });
}


// CONVERTIR ENLACES DE GOOGLE DRIVE

function convertirImagenDrive(url) {
    const enlace = String(url).trim();

    if (!enlace.includes("drive.google.com")) {
        return enlace;
    }

    let id = null;

    const archivo = enlace.match(/\/file\/d\/([^/]+)/);
    const parametro = enlace.match(/[?&]id=([^&]+)/);

    if (archivo) {
        id = archivo[1];
    } else if (parametro) {
        id = parametro[1];
    }

    if (!id) return enlace;

    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}


// OBTENER EL CATÁLOGO

function validarProductos(datos) {
    if (!Array.isArray(datos)) {
        throw new Error("La respuesta no contiene una lista de productos.");
    }

    return datos
        .filter(producto => {
            return producto &&
                producto.id !== undefined &&
                producto.producto &&
                producto.descripcion &&
                producto.categoria &&
                producto.info &&
                producto.imagen &&
                producto.precio !== undefined &&
                String(producto.id).trim() !== "" &&
                String(producto.producto).trim() !== "" &&
                String(producto.descripcion).trim() !== "" &&
                String(producto.categoria).trim() !== "" &&
                String(producto.info).trim() !== "" &&
                String(producto.imagen).trim() !== "" &&
                convertirPrecio(producto.precio) !== null;
        })
        .map(producto => ({
            id: String(producto.id).trim(),
            nombre: String(producto.producto).trim(),
            descripcion: String(producto.descripcion).trim(),
            categoria: String(producto.categoria).trim(),
            info: String(producto.info).trim(),
            imagen: convertirImagenDrive(producto.imagen),
            precio: convertirPrecio(producto.precio)
        }));
}


// DETECTAR LA CATEGORÍA DE LA PÁGINA

function obtenerCategoriaPagina() {
    const pagina = location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    if (pagina === "creatinas.html") {
        return "creatinas";
    }

    if (pagina === "proteinas.html") {
        return "proteinas";
    }

    if (pagina === "mas-productos.html") {
        return "mas productos";
    }

    return "inicio";
}


// CREAR LAS CARDS

function crearTarjeta(producto) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "card";
    tarjeta.dataset.id = producto.id;
    tarjeta.dataset.info = producto.info;

    const imagen = document.createElement("img");
    imagen.src = producto.imagen;
    
    imagen.alt = producto.nombre;
    imagen.loading = "lazy";

    imagen.classList.add("imagen-info");
    imagen.dataset.info = producto.info;

    const nombre = document.createElement("h2");
    nombre.textContent = producto.nombre;

    const descripcion = document.createElement("p");
    descripcion.className = "descripcion";
    descripcion.textContent = producto.descripcion;

    const precio = document.createElement("p");
    precio.className = "precio";
    precio.textContent = formatearPrecio(producto.precio);

    const boton = document.createElement("a");
    boton.href = "#";
    boton.className = "boton";
    boton.textContent = "AGREGAR AL CARRITO";

    tarjeta.append(
        imagen,
        nombre,
        descripcion,
        precio,
        boton
    );

    return tarjeta;
}

// MOSTRAR INFO AL TOCAR LA IMAGEN

document.addEventListener("click", function(evento) {
    const imagen = evento.target.closest(".productos .imagen-info");

    if (!imagen) return;

    const tarjeta = imagen.closest(".card");

    if (!tarjeta) return;

    mostrarInfoProducto(
    tarjeta.querySelector("h2").textContent,
    tarjeta.querySelector(".descripcion").textContent,
    imagen.dataset.info
    );
});

// MOSTRAR INFO DEL PRODUCTO

function mostrarInfoProducto(nombre, descripcion, info) {
    let dialogo = document.getElementById("dialogo-info");

    if (!dialogo) {
        dialogo = document.createElement("dialog");
        dialogo.id = "dialogo-info";
        dialogo.className = "dialogo-info";

        const encabezado = document.createElement("div");
        encabezado.className = "dialogo-encabezado";

        const titulo = document.createElement("h2");
        titulo.id = "dialogo-titulo";

        const botonCerrar = document.createElement("button");
        botonCerrar.type = "button";
        botonCerrar.className = "dialogo-cerrar";
        botonCerrar.textContent = "×";
        botonCerrar.setAttribute("aria-label", "Cerrar");

        const descripcionElemento = document.createElement("p");
        descripcionElemento.id = "dialogo-descripcion";

        const contenido = document.createElement("p");
        contenido.id = "dialogo-contenido";

        botonCerrar.addEventListener("click", () => {
            dialogo.close();
        });

        encabezado.append(titulo, botonCerrar);
        dialogo.append(encabezado, descripcionElemento, contenido);

        dialogo.addEventListener("click", evento => {
            if (evento.target === dialogo) {
                dialogo.close();
            }
        });

        document.body.appendChild(dialogo);
    }

    document.getElementById("dialogo-titulo").textContent = nombre;
    document.getElementById("dialogo-descripcion").textContent = descripcion;
    document.getElementById("dialogo-contenido").textContent = info;

    dialogo.showModal();
}

// MOSTRAR LOS PRODUCTOS

function mostrarProductos(catalogo) {
    if (!contenedorProductos) return;

    const pagina = location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const categoriaPagina = obtenerCategoriaPagina();

    let productosFiltrados = [];

    // PÁGINA DE RESULTADOS

    if (pagina === "resultados.html") {

        const parametros = new URLSearchParams(location.search);
        const busqueda = parametros.get("buscar") || "";

        if (buscador) {
            buscador.value = busqueda;
        }

        if (busqueda === "") {
            if (tituloResultados) {
                tituloResultados.textContent = "Resultados de búsqueda";
            }

            contenedorProductos.innerHTML = `
                <p class="productos-vacios">
                    Ingresá un término en el buscador para encontrar productos.
                </p>
            `;

            if (contadorResultados) {
                contadorResultados.textContent = "";
            }

            return;
        }

        productosFiltrados = buscarProductos(busqueda, catalogo);

        if (tituloResultados) {
            tituloResultados.textContent = `Resultados para: "${busqueda}"`;
        }

        if (contadorResultados) {
            contadorResultados.textContent =
                `${productosFiltrados.length} productos encontrados`;
        }

    // PÁGINA DE INICIO

    } else if (categoriaPagina === "inicio") {

        productosFiltrados = [...catalogo];

        productosFiltrados.sort(() => Math.random() - 0.5);

        productosFiltrados = productosFiltrados.slice(0, 8);

    // PÁGINAS DE CATEGORÍAS

    } else {

        productosFiltrados = catalogo.filter(producto =>
            normalizarTexto(producto.categoria) === categoriaPagina
        );
    }

    // MOSTRAR RESULTADOS

    contenedorProductos.innerHTML = "";

    productosFiltrados.forEach(producto => {
        contenedorProductos.appendChild(crearTarjeta(producto));
    });

    if (productosFiltrados.length === 0) {
        contenedorProductos.innerHTML = `
            <p class="productos-vacios">
                No se encontraron productos que coincidan con tu búsqueda.
            </p>
        `;
    }
}


// ACTUALIZAR PRECIOS DEL CARRITO

function sincronizarPreciosCarrito(catalogo) {
    const carrito = obtenerCarrito();

    carrito.forEach(productoCarrito => {
        const productoActual = catalogo.find(
            producto => producto.id === productoCarrito.id
        );

        if (productoActual) {
            productoCarrito.precio = productoActual.precio;
            productoCarrito.imagen = productoActual.imagen;
            productoCarrito.nombre = productoActual.nombre;
            productoCarrito.descripcion = productoActual.descripcion;
        }
    });

    guardarCarrito(carrito);
    actualizarCarrito();
}


// CONSULTA DEL CATÁLOGO

async function actualizarCatalogo() {
    try {
        const respuesta = await fetch(
            `${URL_CATALOGO}?t=${Date.now()}`,
            { cache: "no-store" }
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar el catálogo.");
        }

        const datos = await respuesta.json();
        const catalogo = validarProductos(datos);

        if (catalogo.length === 0) {
            throw new Error("No se encontraron productos válidos.");
        }

        localStorage.setItem(
            CLAVE_CATALOGO,
            JSON.stringify(catalogo)
        );

        mostrarProductos(catalogo);
        sincronizarPreciosCarrito(catalogo);

        console.log("Catálogo actualizado correctamente.");

    } catch (error) {
        console.error("Error al actualizar el catálogo:", error);

        const catalogoGuardado = JSON.parse(
            localStorage.getItem(CLAVE_CATALOGO) || "[]"
        );

        if (catalogoGuardado.length > 0) {
            mostrarProductos(catalogoGuardado);
        }
    }
}


// AGREGAR PRODUCTO AL CARRITO

function agregarAlCarrito(producto) {
    const carrito = obtenerCarrito();

    const existente = carrito.find(
        item => item.id === producto.id
    );

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
            <img src="${producto.imagen}" alt="">

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
                Tu carrito está vacío. ¡Agregá productos para comenzar tu pedido!
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


// AGREGAR PRODUCTOS DESDE LAS CARDS

document.addEventListener("click", function(evento) {
    const boton = evento.target.closest(".productos .boton");

    if (!boton) return;

    evento.preventDefault();

    const tarjeta = boton.closest(".card");

    if (!tarjeta) return;

    const id = tarjeta.dataset.id;
    const catalogo = JSON.parse(
        localStorage.getItem(CLAVE_CATALOGO) || "[]"
    );

    const producto = catalogo.find(item => item.id === id);

    if (!producto) return;

    agregarAlCarrito(producto);
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

            mensaje += `${producto.descripcion}\n`;
            mensaje += `Cantidad: ${producto.cantidad}\n`;
            mensaje += `Subtotal: ${formatearPrecio(subtotal)}\n\n`;
        });

        const total = carrito.reduce(
            (suma, producto) =>
                suma + producto.precio * producto.cantidad,
            0
        );

        mensaje += `TOTAL: ${formatearPrecio(total)}\n\n`;
        mensaje += "¡Gracias!";

        const telefono = "5493516362669";

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

        window.open(url, "_blank");
    });
}


// INICIAR

actualizarCarrito();

const catalogoInicial = JSON.parse(
    localStorage.getItem(CLAVE_CATALOGO) || "[]"
);

if (catalogoInicial.length > 0) {
    mostrarProductos(catalogoInicial);
}

actualizarCatalogo();

setInterval(actualizarCatalogo, INTERVALO_CATALOGO);


// SERVICE WORKER

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js")
            .catch(error => {
                console.error(
                    "Error al registrar el service worker:",
                    error
                );
            });
    });
}

// REGISTRO DE USUARIO

const formularioRegistro = document.getElementById("form-registro");

if (formularioRegistro) {
    formularioRegistro.addEventListener("submit", function(evento) {
        evento.preventDefault();

        const usuario = {
            nombre: document.getElementById("nombre").value.trim(),
            apellido: document.getElementById("apellido").value.trim(),
            email: document.getElementById("email").value.trim().toLowerCase(),
            password: document.getElementById("password").value,
            fechaNacimiento: document.getElementById("fecha_nacimiento").value
        };

        sessionStorage.setItem("nutripro-usuario", JSON.stringify(usuario));

        alert("¡Te registraste correctamente! Ya podés iniciar sesión.");

        location.href = "login.html";
    });
}


// INICIO DE SESIÓN

const formularioLogin = document.getElementById("form-login");

if (formularioLogin) {
    formularioLogin.addEventListener("submit", function(evento) {
        evento.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        const usuarioGuardado = sessionStorage.getItem("nutripro-usuario");

        if (!usuarioGuardado) {
            alert("No se encontró ningún usuario registrado con esos datos.");
            return;
        }

        const usuario = JSON.parse(usuarioGuardado);

        if (email === usuario.email && password === usuario.password) {

            const sesion = {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email
            };

            sessionStorage.setItem("nutripro-sesion", JSON.stringify(sesion));

            location.href = "../index.html";

        } else {
            alert("El email o la contraseña son incorrectos.");
        }
    });
}

// ACTUALIZAR ENCABEZADO SEGÚN LA SESIÓN


function actualizarHeaderUsuario() {

    const contenedorUsuario = document.getElementById("usuario-header");

    if (!contenedorUsuario) return;

    const estaEnPages = location.pathname.toLowerCase().includes("/pages/");
    const rutaBase = estaEnPages ? "" : "./pages/";

    const sesionGuardada = sessionStorage.getItem("nutripro-sesion");

    if (sesionGuardada) {

        const usuario = JSON.parse(sesionGuardada);

        contenedorUsuario.innerHTML = `
            <span>Hola, ${usuario.nombre}</span>
            <a href="#" id="cerrar-sesion">Cerrar sesión</a>
        `;

        document.getElementById("cerrar-sesion").addEventListener("click", function(evento) {

            evento.preventDefault();

            sessionStorage.removeItem("nutripro-sesion");

            location.reload();

        });

    } else {

        contenedorUsuario.innerHTML = `
            <a href="${rutaBase}login.html">Iniciar sesión</a>
            <a href="${rutaBase}registro.html">Registrarse</a>
        `;

    }
}

actualizarHeaderUsuario();
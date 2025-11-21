'use strict';

// Variables globales
let productos = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Elementos del DOM
const catalogoDiv = document.getElementById('catalogo');
const listaCarrito = document.getElementById('listaCarrito');
const total = document.getElementById('total');
const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
const finalizarCompraBtn = document.getElementById('finalizarCompra');
const formProducto = document.getElementById('formProducto');
const nombreProductoInput = document.getElementById('nombreProducto');
const precioProductoInput = document.getElementById('precioProducto');
const imagenProductoInput = document.getElementById('imagenProducto');

// Elementos de Filtro
const filtroCilindrada = document.getElementById('filtroCilindrada');
const filtroUso = document.getElementById('filtroUso');
const resetFiltrosBtn = document.getElementById('resetFiltros');

//Carga de Datos y Persistencia 

async function cargarProductos() {
    try {
                const res = await fetch('data/productos.json'); 
        const data = await res.json();
        productos = data;

                const productosLocales = JSON.parse(localStorage.getItem('productos'));
        if (productosLocales) {
            productos = productosLocales;
        }
        
                aplicarFiltros(); 
        mostrarCarrito();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Carga',
            text: 'No se pudo cargar el catálogo de productos inicial. ' + error.message,
        });
    }
}

//Lógica para filtrar 

filtroCilindrada.addEventListener('change', aplicarFiltros);
filtroUso.addEventListener('change', aplicarFiltros);
resetFiltrosBtn.addEventListener('click', () => {
    filtroCilindrada.value = 'todos';
    filtroUso.value = 'todos';
    aplicarFiltros();
});

function aplicarFiltros() {
    const valorCilindrada = filtroCilindrada.value;
    const valorUso = filtroUso.value;

    let productosFiltrados = productos;

    // Filtrar por Cilindrada
    if (valorCilindrada !== 'todos') {
        productosFiltrados = productosFiltrados.filter(p => p.cilindrada === valorCilindrada);
    }

    // Filtrar por Uso
    if (valorUso !== 'todos') {
        productosFiltrados = productosFiltrados.filter(p => p.uso === valorUso);
    }

    // Renderizar la lista filtrada
    mostrarCatalogo(productosFiltrados);
}

// 3. Mostrar Catálogo (HTML Interactivo)

function mostrarCatalogo(listaAMostrar) {
    catalogoDiv.innerHTML = '';
    
    if (listaAMostrar.length === 0) {
        catalogoDiv.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color: #888;">No se encontraron motos con los filtros seleccionados.</p>';
        return;
    }

    listaAMostrar.forEach(p => {
        const imgUrl = p.imagenURL || 'https://via.placeholder.com/200/bdc3c7/000000?text=Moto+SportXpress'; 
        
        // Template string para generar la tarjeta del producto
        const htmlProducto = `
            <div class="producto-card">
                <img src="${imgUrl}" alt="${p.nombre}" class="producto-img">
                <strong>${p.nombre} (${p.marca})</strong>
                <p>Uso: ${p.uso} | Cilindrada: ${p.cilindrada}</p>
                <p class="precio">$${p.precio.toFixed(2)}</p>
                <button class="btn-agregar btn-primary" data-id="${p.id}">Añadir al Carrito</button>
            </div>`;
        catalogoDiv.insertAdjacentHTML('beforeend', htmlProducto);
    });

    // Reasignación de eventos a los botones del catálogo
    document.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const productoSeleccionado = productos.find(p => p.id === id);
            if (productoSeleccionado) {
                agregarAlCarrito(productoSeleccionado);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `¡${productoSeleccionado.nombre} añadido!`,
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    });
}

//Lógica del Carrito y Compra 

function agregarAlCarrito(producto) {
    carrito.push(producto);
    guardarCarrito();
    mostrarCarrito();
}

function mostrarCarrito() {
    listaCarrito.innerHTML = '';
    
    // Uso de REDUCE para calcular el total
    const totalCompra = carrito.reduce((acc, p) => acc + p.precio, 0);

    if (carrito.length === 0) {
        listaCarrito.innerHTML = '<p style="text-align: center; color: #888;">El carrito está vacío.</p>';
        finalizarCompraBtn.disabled = true;
    } else {
        finalizarCompraBtn.disabled = false;
        carrito.forEach((p, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${p.nombre} - <strong>$${p.precio.toFixed(2)}</strong>`;

            const btnQuitar = document.createElement('button');
            btnQuitar.textContent = 'Quitar';
            btnQuitar.classList.add('btn-quitar');
            btnQuitar.addEventListener('click', () => quitarDelCarrito(index));

            li.appendChild(btnQuitar);
            listaCarrito.appendChild(li);
        });
    }

    total.textContent = `Total: $${totalCompra.toFixed(2)}`;
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    mostrarCarrito();
}

finalizarCompraBtn.addEventListener('click', finalizarCompra);

function finalizarCompra() {
    if (carrito.length === 0) {
        Swal.fire('Carrito Vacío', 'Por favor, agrega motos antes de finalizar la compra.', 'info');
        return;
    }

    const totalCompra = carrito.reduce((acc, p) => acc + p.precio, 0).toFixed(2);

    // SweetAlert2 con formulario para simulación de transacción
    Swal.fire({
        title: 'Confirmar Compra',
        html: `
            <p>El total a pagar es: <strong>$${totalCompra}</strong></p>
            <p>Datos de Contacto:</p>
            <input type="text" id="swal-nombre" class="swal2-input" placeholder="Nombre completo">
            <input type="email" id="swal-email" class="swal2-input" placeholder="Correo electrónico">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Pagar ahora',
        preConfirm: () => {
            const nombre = Swal.getPopup().querySelector('#swal-nombre').value;
            const email = Swal.getPopup().querySelector('#swal-email').value;
            if (!nombre || !email || !email.includes('@')) {
                Swal.showValidationMessage(`Por favor, rellena todos los campos con datos válidos.`);
            }
            return { nombre: nombre, email: email };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Procesando pago...',
                timer: 2000,
                timerProgressBar: true,
                didOpen: () => { Swal.showLoading(); }
            }).then(() => {
                
                // Final exitoso
                Swal.fire({
                    title: '¡Compra Exitosa!',
                    html: `Gracias por tu compra, **${result.value.nombre}**. Te contactaremos en ${result.value.email} para la entrega.`,
                    icon: 'success'
                });
                
                // Resetear carrito
                carrito = [];
                guardarCarrito();
                mostrarCarrito();
            });
        }
    });
}

// Funciones de Guardado y Carga Inicial
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function guardarProductos() {
    localStorage.setItem('productos', JSON.stringify(productos));
}

// Evento de Vaciar Carrito usando SweetAlert2 para confirmación
vaciarCarritoBtn.addEventListener('click', () => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Se eliminarán todas las motos del carrito.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, vaciarlo',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            carrito = [];
            guardarCarrito();
            mostrarCarrito();
            Swal.fire('¡Vaciado!', 'Tu carrito ha sido vaciado.', 'success');
        }
    });
});

// Inicia la carga de productos al iniciar la aplicación
cargarProductos();
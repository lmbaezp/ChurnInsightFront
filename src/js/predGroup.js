import {
    generarCardPrediccion,
    manejarErrorAPI
} from '/src/js/predictionUtils.js';

import {
    convertirDatosATabla,
    descargarCSV
} from '/src/js/exportUtils.js';

// Variable para almacenar los datos
let datosPredicciones = [];

const formGroupPred = document.getElementById('form-group-pred');

formGroupPred?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const resultContainer = document.getElementById('result-group-pred');
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    const fileInputHelp = document.getElementById('csvFileHelp');

    // Limpiar estados previos
    resultContainer.innerHTML = '';
    fileInput.classList.remove('border', 'border-danger');
    fileInputHelp.classList.remove('text-danger');

    // Validaciones
    if (!validarArchivo(file, fileInput, fileInputHelp)) {
        return;
    }

    // Preparar y enviar petición
    const formData = new FormData();
    formData.append("file", file);

    const token = getValidAuthToken();

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/batch-predict`, {
            method: "POST",
            headers: {
                "Authorization": token ? `Bearer ${token}` : ''
            },
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            Swal.fire({
                icon: "error",
                title: "Error en la predicción",
                text: "Revisa los requerimientos del archivo o contacta a soporte",
            });
            return;
        }

        datosPredicciones = data;

        fileInputHelp.textContent = 'El archivo debe ser CSV';
        fileInput.value = '';
        mostrarResultados(data, resultContainer);

    } catch (err) {
        manejarErrorAPI(err, "predicción por lotes");
    }
});

/**
 * Valida el archivo CSV
 */
function validarArchivo(file, fileInput, fileInputHelp) {
    if (!file) {
        fileInput.classList.add('border', 'border-danger');
        fileInput.focus();
        fileInputHelp.classList.add('text-danger');
        fileInputHelp.textContent = 'Debe cargar un archivo';
        return false;
    }

    if (file.type !== 'text/csv') {
        fileInputHelp.classList.add('text-danger');
        return false;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        Swal.fire({
            icon: "warning",
            title: "Archivo muy grande",
            text: "El archivo no debe superar los 2 MB",
        });
        return false;
    }

    return true;
}

/**
 * Muestra los resultados en el contenedor con Swiper
 */
function mostrarResultados(data, resultContainer) {
    const contentCards = data.map((pred, index) => {
        const cardHTML = generarCardPrediccion(pred, `-${index}`);
        return `<div class="swiper-slide">${cardHTML}</div>`;
    });

    resultContainer.classList.add('col-12', 'mt-5');
    resultContainer.innerHTML = `
        <div class="d-flex justify-content-end mb-3">
            <button id="btn-export-csv" class="btn btn-success">
                <i class="bi bi-file-earmark-spreadsheet"></i> Descargar CSV
            </button>
        </div>

        <div class="col-12 swiper mySwiper my-3">
            <div class="swiper-pagination"></div>    
            <div class="swiper-wrapper mt-3">
                ${contentCards.join("")}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
            
        </div>
    `;

    const btnCSV = document.getElementById('btn-export-csv');
    if (btnCSV) {
        btnCSV.addEventListener('click', () => {
            const datosTabla = convertirDatosATabla(datosPredicciones);
            descargarCSV(datosTabla, 'predicciones_churn');
        });
    }

    inicializarSwiper();

    resultContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
    
    setTimeout(() => {
        resultContainer.focus({ preventScroll: true });
    }, 300);
}

/**
 * Inicializa el carrusel Swiper
 */
function inicializarSwiper() {
    setTimeout(() => {
        const swiper = new Swiper(".mySwiper", {
            autoHeight: true,
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
                renderBullet: function (index, className) {
                    return `<span class="${className}">${index + 1}</span>`;
                },
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
        });

        // CLAVE: Actualizar altura cuando los acordeones cambian
        const acordeones = document.querySelectorAll('.accordion-collapse');
        
        acordeones.forEach(acordeon => {
            // Escuchar cuando se MUESTRA el acordeón
            acordeon.addEventListener('shown.bs.collapse', () => {
                swiper.updateAutoHeight(300); // 300ms de animación suave
            });
            
            // Escuchar cuando se OCULTA el acordeón
            acordeon.addEventListener('hidden.bs.collapse', () => {
                swiper.updateAutoHeight(300);
            });
        });
    }, 0);
}
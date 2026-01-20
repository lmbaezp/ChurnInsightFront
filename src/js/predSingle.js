import {
    generarCardPrediccion,
    manejarErrorAPI
} from './predictionUtils.js';

const formSinglePred = document.getElementById('form-single-pred');

formSinglePred?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const resultContainer = document.getElementById('result-single-pred');
    resultContainer.innerHTML = '';

    // Limpiar errores previos
    limpiarErrores();

    // Obtener y validar campos
    const inputs = formSinglePred.querySelectorAll("input[type='number']");
    const selects = formSinglePred.querySelectorAll("select");

    const validacion = validarFormulario(inputs, selects);
    
    if (!validacion.esValido) {
        manejarErrorValidacion(validacion.primerError);
        return;
    }

    // Preparar datos
    const bodyRequest = construirBodyRequest(inputs, selects);
    const token = getValidAuthToken();

    try {
        const response = await fetch("http://127.0.0.1:8080/api/v1/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(bodyRequest)
        });

        const data = await response.json();

        if (data.error) {
            Swal.fire({
                icon: "error",
                title: "Predicción no disponible",
                text: "Intenta más tarde o contacta a soporte",
            });
            return;
        }

        mostrarResultado(data, resultContainer);

    } catch (err) {
        manejarErrorAPI(err, "predicción individual");
    }
});

/**
 * Limpia todos los mensajes de error
 */
function limpiarErrores() {
    document.querySelectorAll(".errorMsg").forEach(e => e.innerHTML = '');
    document.querySelectorAll(".helpMsg").forEach(e => e.classList.remove('text-danger'));
    
    const campos = formSinglePred.querySelectorAll("input[type='number'], select");
    campos.forEach(e => e.classList.remove('border', 'border-danger'));
}

/**
 * Valida el formulario completo
 */
function validarFormulario(inputs, selects) {
    const reglas = {
        antiguedad: { min: 0, max: 120 },
        facturasImpagas: { min: 0, max: 10 },
        frecuenciaUso: { min: 0, max: 30 },
        ticketsSoporte: { min: 0, max: 50 },
        cambiosPlan: { min: 0, max: 5 }
    };

    let primerError = null;

    // Validar inputs numéricos
    inputs.forEach(input => {
        const regla = reglas[input.name];
        if (!regla) return;

        const valor = input.value;
        const divHelp = document.getElementById(`${input.name}Help`);

        if (valor === '') {
            marcarError(input);
            if (!primerError) primerError = input;
            return;
        }

        const num = Number(valor);
        if (num < regla.min || num > regla.max) {
            marcarError(input, divHelp);
            if (!primerError) primerError = input;
        }
    });

    // Validar selects
    selects.forEach(select => {
        const divError = document.getElementById(`${select.name}Error`);

        if (select.value === "0") {
            marcarError(select);
            divError.innerHTML = `<p class="text-danger">Debe seleccionar una opción válida</p>`;
            if (!primerError) primerError = select;
        } else {
            divError.innerHTML = '';
        }
    });

    return {
        esValido: primerError === null,
        primerError
    };
}

/**
 * Marca un campo con error
 */
function marcarError(elemento, divHelp = null) {
    elemento.classList.add('border', 'border-danger');
    if (divHelp) {
        divHelp.classList.add('text-danger');
    }
}

/**
 * Maneja el scroll y focus al primer error
 */
function manejarErrorValidacion(elemento) {
    if (!elemento) return;

    elemento.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    setTimeout(() => {
        elemento.focus({ preventScroll: true });
    }, 300);
}

/**
 * Construye el objeto para enviar a la API
 */
function construirBodyRequest(inputs, selects) {
    return [...inputs, ...selects].reduce((acc, field) => {
        acc[field.name] = field.type === 'number' 
            ? Number(field.value) 
            : field.value;
        return acc;
    }, {});
}

/**
 * Muestra el resultado de la predicción
 */
function mostrarResultado(data, resultContainer) {
    const cardHTML = generarCardPrediccion(data, '-single');
    resultContainer.innerHTML = cardHTML;
}
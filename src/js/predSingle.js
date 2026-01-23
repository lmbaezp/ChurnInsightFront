// Formulario de predicción individual
import {
    limpiarTodosErrores,
    marcarCampoConError,
    manejarErrorValidacion,
    validarRangoNumerico,
    validarSelect,
    construirObjetoDesdeFormulario,
    limpiarFormulario,
    scrollHaciaElemento
} from './formUtils.js';

import {
    generarCardPrediccion,
    manejarErrorAPI
} from './predictionUtils.js';

// =================== CONFIGURACIÓN ===================

const REGLAS_VALIDACION = {
    antiguedad: { min: 0, max: 120 },
    facturasImpagas: { min: 0, max: 10 },
    frecuenciaUso: { min: 0, max: 30 },
    ticketsSoporte: { min: 0, max: 50 },
    cambiosPlan: { min: 0, max: 5 }
};

// =================== VALIDACIÓN DEL FORMULARIO ===================

/**
 * Valida el formulario completo de predicción
 */
function validarFormularioPrediccion(inputs, selects) {
    let primerError = null;

    // Validar inputs numéricos
    inputs.forEach(input => {
        const regla = REGLAS_VALIDACION[input.name];
        if (!regla) return;

        const esValido = validarRangoNumerico(input, regla.min, regla.max);
        
        if (!esValido && !primerError) {
            primerError = input;
        }
    });

    // Validar selects
    selects.forEach(select => {
        const esValido = validarSelect(select, '0');
        
        if (!esValido && !primerError) {
            primerError = select;
        }
    });

    return {
        esValido: primerError === null,
        primerError
    };
}

// =================== MANEJO DE PREDICCIÓN ===================

/**
 * Procesa la predicción individual
 */
async function procesarPrediccion(bodyRequest, token) {
    const response = await fetch(`${API_BASE_URL}/api/v1/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(bodyRequest)
    });

    const data = await response.json();

    if (data.error) {
        throw new Error('Predicción no disponible. Intenta más tarde o contacta a soporte');
    }

    return data;
}

/**
 * Muestra el resultado de la predicción
 */
function mostrarResultadoPrediccion(data, resultContainer) {
    const cardHTML = generarCardPrediccion(data, '-single');
    resultContainer.innerHTML = cardHTML;
    scrollHaciaElemento('card-title-pred');
}

// =================== INICIALIZACIÓN ===================

function inicializarFormularioPrediccion() {
    const formSinglePred = document.getElementById('form-single-pred');
    if (!formSinglePred) return;

    const resultContainer = document.getElementById('result-single-pred');

    formSinglePred.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar resultados y errores previos
        resultContainer.innerHTML = '';
        limpiarTodosErrores(formSinglePred);

        // Obtener campos
        const inputs = formSinglePred.querySelectorAll("input[type='number']");
        const selects = formSinglePred.querySelectorAll("select");

        // Validar formulario
        const validacion = validarFormularioPrediccion(inputs, selects);

        if (!validacion.esValido) {
            manejarErrorValidacion(validacion.primerError);
            return;
        }

        // Preparar datos
        const bodyRequest = construirObjetoDesdeFormulario([...inputs, ...selects]);
        const token = getValidAuthToken();

        try {
            // Hacer predicción
            const data = await procesarPrediccion(bodyRequest, token);

            // Limpiar formulario y mostrar resultado
            limpiarFormulario(formSinglePred);
            mostrarResultadoPrediccion(data, resultContainer);

        } catch (error) {
            console.error('Error en predicción:', error);
            manejarErrorAPI(error, "predicción individual");
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarFormularioPrediccion);
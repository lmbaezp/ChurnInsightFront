// predictionUtils.js - Funciones compartidas para predicciones

/**
 * Formatea un nombre reemplazando guiones bajos por espacios
 */
export function formatearNombre(nombre) {
    return nombre.replace(/_/g, " ").trim().toUpperCase();
}

/**
 * Obtiene el nivel de riesgo basado en la probabilidad
 */
export function obtenerNivelRiesgo(probabilidad) {
    if (probabilidad < 0.3) {
        return { texto: 'Bajo', clase: 'bg-success' };
    } else if (probabilidad <= 0.7) {
        return { texto: 'Medio', clase: 'bg-warning' };
    } else {
        return { texto: 'Alto', clase: 'bg-danger' };
    }
}

/**
 * Obtiene el impacto de riesgo
 */
export function obtenerImpactoRiesgo(impacto) {
    const impactos = {
        'alto_riesgo': { texto: 'Alto', clase: 'bg-danger' },
        'medio_riesgo': { texto: 'Medio', clase: 'bg-warning' },
        'default': { texto: 'Bajo', clase: 'bg-success' }
    };
    return impactos[impacto] || impactos.default;
}

/**
 * Genera el HTML de las filas de riesgo
 */
export function generarFilasRiesgo(topFeatures) {
    if (!topFeatures || topFeatures.length === 0) return '';

    return topFeatures.map(f => {
        const impacto = obtenerImpactoRiesgo(f.impacto);
        return `
            <div class="row border-bottom mb-2">
                <div class="col">
                    <p class="text-end m-0">${formatearNombre(f.feature)}</p>
                </div>
                <div class="col">
                    <h4>
                        <span class="badge ${impacto.clase}">
                            ${impacto.texto}
                        </span>
                    </h4>
                </div>
            </div>
        `;
    }).join("");
}

/**
 * Obtiene los datos del estado del cliente
 */
export function obtenerDatosEstado(prediccion) {
    const esNoChurn = prediccion === "no_cancelara";
    return {
        esNoChurn,
        estadoTexto: esNoChurn ? "No cancelará" : "Cancelará",
        estadoIcono: esNoChurn
            ? `<i class="bi bi-check-circle-fill text-success fs-2"></i>`
            : `<i class="bi bi-x-circle-fill text-danger fs-2"></i>`,
        estadoColor: esNoChurn ? "text-success" : "text-danger",
        accionRecomendada: esNoChurn
            ? "No requiere acción inmediata"
            : "Contactar al cliente y ofrecer retención"
    };
}

/**
 * Genera el HTML completo de una card de predicción
 */
export function generarCardPrediccion(data, uniqueId = '') {
    const estado = obtenerDatosEstado(data.prediccion);
    const probabilidad = Math.round(data.probabilidadChurn * 100);
    const riesgoCliente = obtenerNivelRiesgo(data.probabilidadChurn);
    const filasRiesgoHTML = generarFilasRiesgo(data.topFeatures);

    return `
        <div class="card shadow-lg">
            <div class="card-body p-0">
                <h5 class="card-title-pred card-title p-3 text-white fs-4">
                    Resultado de la predicción
                </h5>

                <div class="accordion m-3" id="accordionPanels${uniqueId}">
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="fw-bold accordion-button" type="button" 
                                data-bs-toggle="collapse" 
                                data-bs-target="#collapse-general${uniqueId}" 
                                aria-expanded="true">
                                1. Revisar datos generales
                            </button>
                        </h2>
                        <div id="collapse-general${uniqueId}" 
                            class="accordion-collapse collapse show">
                            <div class="accordion-body">
                                <div class="m-1">
                                    <div class="border-bottom mb-3 p-2">
                                        <p class="card-text fst-italic m-0">Estado del cliente:</p>
                                        <p class="fs-2 m-0 ${estado.estadoColor} fw-semibold fst-italic text-center">
                                            ${estado.estadoIcono} ${estado.estadoTexto}
                                        </p>
                                    </div>
                                    <div class="border-bottom mb-3 p-2">
                                        <p class="card-text fst-italic m-0">Probabilidad de churn:</p>
                                        <p class="fs-1 fst-italic text-center m-0">${probabilidad}%</p>
                                    </div>
                                    <div class="border-bottom mb-3 p-2">
                                        <p class="card-text fst-italic m-0">Nivel de riesgo:</p>
                                        <h4 class="fs-1 fst-italic text-center m-0 px-3 py-1">
                                            <span class="badge ${riesgoCliente.clase}">
                                                ${riesgoCliente.texto}
                                            </span>
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="fw-bold accordion-button collapsed" type="button"
                                data-bs-toggle="collapse" 
                                data-bs-target="#collapse-riesgo${uniqueId}"
                                aria-expanded="false">
                                2. Ver que factores generan más riesgo
                            </button>
                        </h2>
                        <div id="collapse-riesgo${uniqueId}" 
                            class="accordion-collapse collapse">
                            <div class="accordion-body">
                                <div class="container">
                                    ${filasRiesgoHTML}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="fw-bold accordion-button collapsed" type="button"
                                data-bs-toggle="collapse" 
                                data-bs-target="#collapse-accion${uniqueId}"
                                aria-expanded="false">
                                3. Evaluar la acción recomendada
                            </button>
                        </h2>
                        <div id="collapse-accion${uniqueId}" 
                            class="accordion-collapse collapse">
                            <div class="accordion-body">
                                <p class="text-secondary m-1 text-center">
                                    ${estado.accionRecomendada}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Maneja errores de API
 */
export function manejarErrorAPI(error, contexto = "la operación") {
    console.error(`Error en ${contexto}:`, error);
    Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor. Intenta nuevamente.",
    });
}

/**
 * Realiza una petición a la API de predicción
 */
export async function realizarPrediccion(endpoint, body, token) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });

    return response.json();
}
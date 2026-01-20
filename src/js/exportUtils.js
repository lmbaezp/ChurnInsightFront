// exportUtils.js

/**
 * Convierte los datos de predicción a formato tabla
 */
export function convertirDatosATabla(data) {
    return data.map((pred, index) => {
        const esNoChurn = pred.prediccion === "no_cancelara";
        const probabilidad = Math.round(pred.probabilidadChurn * 100);

        let nivelRiesgo;
        if (pred.probabilidadChurn < 0.3) {
            nivelRiesgo = 'Bajo';
        } else if (pred.probabilidadChurn <= 0.7) {
            nivelRiesgo = 'Medio';
        } else {
            nivelRiesgo = 'Alto';
        }

        const topFactores = {};
        pred.topFeatures?.slice(0, 3)
            .forEach((f, index) => {
                const nombreFormateado = f.feature.replace(/_/g, ' ').toUpperCase();
                let nivelImpacto;

                if (f.impacto === 'alto_riesgo') {
                    nivelImpacto = 'Alto';
                } else if (f.impacto === 'medio_riesgo') {
                    nivelImpacto = 'Medio';
                } else {
                    nivelImpacto = 'Bajo';
                }

                topFactores[`Factor_${index + 1}`] = `${nombreFormateado} (${nivelImpacto})`

            });

        return {
            'Número': index + 1,
            'Predicción': esNoChurn ? "No cancelará" : "Cancelará",
            'Probabilidad': `${probabilidad}%`,
            'Nivel de Riesgo': nivelRiesgo,
            ...topFactores,
            'Acción Recomendada': esNoChurn ? "No requiere acción" : "Contactar cliente",
        };
    });
}


/**
 * Convierte los datos del resultado de un filtro a formato tabla
 */
export function convertirDatosFiltradosATabla(data) {
    return data.map((pred, index) => {
        const error = pred.errorMessage === "DS no disponible: DS respondió con error HTTP: 422 UNPROCESSABLE_ENTITY";
        const probabilidad = Math.round(pred.probabilidadChurn * 100);
        const fechaPred = pred.timestamp.split('T')[0];
        const usuario = pred.usuario;

        let prediccion;
        if (pred.prediccion == "cancelara") {
            prediccion = 'Cancelará';
        } else if (pred.prediccion == "no_cancelara") {
            prediccion = 'No cancelará';
        } else {
            prediccion = 'Sin predicción';
        }


        let nivelRiesgo;
        if (pred.probabilidadChurn == 0) {
            nivelRiesgo = 'NA';
        } else if (pred.probabilidadChurn < 0.3) {
            nivelRiesgo = 'Bajo';
        } else if (pred.probabilidadChurn <= 0.7) {
            nivelRiesgo = 'Medio';
        } else {
            nivelRiesgo = 'Alto';
        }

        return {
            'Número': index + 1,
            'Error': error ? 'DS no disponible' : 'No error',
            'Predicción': prediccion,
            'Probabilidad': `${probabilidad}%`,
            'Nivel de Riesgo': nivelRiesgo,
            'Fecha de cálculo': fechaPred,
            'Usuario': usuario,
        };
    });
}

/**
 * Genera y descarga un archivo CSV
 */
export function descargarCSV(datos, nombreArchivo = 'predicciones') {
    if (!datos || datos.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Acción errónea',
            text: 'No hay datos para descargar',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    // Obtener los encabezados
    const headers = Object.keys(datos[0]);

    // Crear el contenido CSV
    let csvContent = headers.join(',') + '\n';

    datos.forEach(row => {
        const valores = headers.map(header => {
            const valor = row[header];
            // Escapar comas y comillas en los valores
            if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
                return `"${valor.replace(/"/g, '""')}"`;
            }
            return valor;
        });
        csvContent += valores.join(',') + '\n';
    });

    // Crear el blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fecha = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}_${fecha}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
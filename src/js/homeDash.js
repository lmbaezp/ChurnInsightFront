// homeDash.js - Dashboard con métricas y filtros
import { convertirDatosFiltradosATabla, descargarCSV } from '/src/js/exportUtils.js';

// =================== CONFIGURACIÓN GLOBAL ===================
const token = getValidAuthToken();
const userRol = getUserRol();

// Referencias DOM
const numPred = document.getElementById('numPred');
const fechaPred = document.getElementById('fechaPred');
const minMaxProb = document.getElementById('minMaxProb');

// Estado de gráficos
let gaugeChurn = null;
let valorActualGauge = 0;
let chartPie = null;
let chartBar = null;

// =================== UTILIDADES ===================

function sacarFecha(fecha) {
    return fecha.toISOString().split('T')[0];
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}

function mostrarInfo(titulo, mensaje) {
    Swal.fire({
        icon: 'info',
        title: titulo,
        text: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
    });
}

// =================== SINCRONIZACIÓN DE CAMPOS ===================

function sincronizarCampos(origenId, destinoId) {
    const origen = document.getElementById(origenId);
    const destino = document.getElementById(destinoId);

    if (!origen || !destino) return;

    origen.addEventListener('change', function () {
        destino.value = this.value;
    });
}

function sincronizarTodosCampos() {
    sincronizarCampos('usuario-big', 'usuario-small');
    sincronizarCampos('usuario-small', 'usuario-big');
    sincronizarCampos('fechaInicioBig', 'fechaInicioSmall');
    sincronizarCampos('fechaInicioSmall', 'fechaInicioBig');
    sincronizarCampos('fechaFinBig', 'fechaFinSmall');
    sincronizarCampos('fechaFinSmall', 'fechaFinBig');
}

// =================== GESTIÓN DE FECHAS ===================

function inicializarFechas(fechaInicio, fechaFin, min, max) {
    fechaInicio.forEach(f => {
        f.setAttribute('min', min);
        f.setAttribute('max', max);
        f.value = min;
    });

    fechaFin.forEach(f => {
        f.setAttribute('min', min);
        f.setAttribute('max', max);
        f.value = max;
    });
}

function configurarValidacionFechas(fechaInicio) {
    fechaInicio.forEach(f => {
        f.addEventListener('change', function () {
            const fechaInicioValor = this.value;

            if (fechaInicioValor) {
                const fechaFinElement = f.nextElementSibling?.nextElementSibling;

                if (fechaFinElement) {
                    fechaFinElement.setAttribute('min', fechaInicioValor);

                    if (fechaFinElement.value && fechaFinElement.value < fechaInicioValor) {
                        fechaFinElement.value = fechaInicioValor;
                        mostrarInfo('Fecha ajustada', 'La fecha fin se ajustó automáticamente');
                    }
                }
            }
        });
    });
}

// =================== CÁLCULO DE MÉTRICAS ===================

function calcularMetricas(predicciones) {
    if (!Array.isArray(predicciones) || predicciones.length === 0) {
        return obtenerMetricasVacias();
    }

    const { sinError, conError } = separarPorError(predicciones);
    const prediccionesOrdenadas = ordenarPorFecha(predicciones);

    const estadisticas = calcularEstadisticas(sinError);

    return {
        totalPredicciones: predicciones.length,
        fechaPrimerPrediccion: prediccionesOrdenadas[0]?.timestamp || null,
        totalErrorPrediccion: conError.length,
        ...estadisticas
    };
}

function obtenerMetricasVacias() {
    return {
        totalPredicciones: 0,
        fechaPrimerPrediccion: null,
        probabilidadChurnPromedio: 0,
        valorMinimoProbabilidad: 0,
        valorMaximoProbabilidad: 0,
        totalCancelara: 0,
        totalNoCancelara: 0,
        totalErrorPrediccion: 0,
        totalRiesgoAlto: 0,
        totalRiesgoMedio: 0,
        totalRiesgoBajo: 0
    };
}

function separarPorError(predicciones) {
    return predicciones.reduce((acc, item) => {
        acc[item.errorMessage === null ? 'sinError' : 'conError'].push(item);
        return acc;
    }, { sinError: [], conError: [] });
}

function ordenarPorFecha(predicciones) {
    return [...predicciones].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );
}

function calcularEstadisticas(prediccionesSinError) {
    if (prediccionesSinError.length === 0) {
        return {
            probabilidadChurnPromedio: 0,
            valorMinimoProbabilidad: 0,
            valorMaximoProbabilidad: 0,
            totalCancelara: 0,
            totalNoCancelara: 0,
            totalRiesgoAlto: 0,
            totalRiesgoMedio: 0,
            totalRiesgoBajo: 0
        };
    }

    let sumaProbabilidades = 0;
    let minProbabilidad = Infinity;
    let maxProbabilidad = -Infinity;
    let totalCancelara = 0;
    let totalNoCancelara = 0;
    let totalRiesgoAlto = 0;
    let totalRiesgoMedio = 0;
    let totalRiesgoBajo = 0;

    prediccionesSinError.forEach(prediccion => {
        const probabilidad = prediccion.probabilidadChurn;

        sumaProbabilidades += probabilidad;
        minProbabilidad = Math.min(minProbabilidad, probabilidad);
        maxProbabilidad = Math.max(maxProbabilidad, probabilidad);

        // Clasificación de predicción
        if (prediccion.prediccion === 'cancelara') {
            totalCancelara++;
        } else if (prediccion.prediccion === 'no_cancelara') {
            totalNoCancelara++;
        }

        // Clasificación de riesgo
        if (probabilidad >= 0.7) {
            totalRiesgoAlto++;
        } else if (probabilidad >= 0.3) {
            totalRiesgoMedio++;
        } else {
            totalRiesgoBajo++;
        }
    });

    const probabilidadChurnPromedio = sumaProbabilidades / prediccionesSinError.length;

    if (minProbabilidad === Infinity) minProbabilidad = 0;
    if (maxProbabilidad === -Infinity) maxProbabilidad = 0;

    return {
        probabilidadChurnPromedio: parseFloat(probabilidadChurnPromedio.toFixed(4)),
        valorMinimoProbabilidad: parseFloat(minProbabilidad.toFixed(4)),
        valorMaximoProbabilidad: parseFloat(maxProbabilidad.toFixed(4)),
        totalCancelara,
        totalNoCancelara,
        totalRiesgoAlto,
        totalRiesgoMedio,
        totalRiesgoBajo
    };
}

// =================== VISUALIZACIÓN DE DATOS ===================

function datosComunes(datos) {
    numPred.textContent = datos.totalPredicciones;
    fechaPred.textContent = datos.fechaPrimerPrediccion
        ? `Desde ${datos.fechaPrimerPrediccion.split("T")[0]}`
        : 'Sin datos';

    valorActualGauge = Math.round(datos.probabilidadChurnPromedio * 100);
    inicializarGauge(valorActualGauge);

    const minProb = Math.round(datos.valorMinimoProbabilidad * 100);
    const maxProb = Math.round(datos.valorMaximoProbabilidad * 100);
    minMaxProb.textContent = `Valor mínimo: ${minProb}% - Valor máximo: ${maxProb}%`;

    inicializarGraficoPie(datos.totalCancelara, datos.totalNoCancelara, datos.totalErrorPrediccion);
    inicializarGraficoBar(datos.totalRiesgoAlto, datos.totalRiesgoMedio, datos.totalRiesgoBajo);
}

// =================== GRÁFICOS ===================

function inicializarGauge(avg) {
    const container = document.getElementById('gauge');
    if (container) {
        container.innerHTML = '';
    }

    gaugeChurn = new JustGage({
        id: "gauge",
        value: avg,
        min: 0,
        max: 100,
        title: "Probabilidad de Cancelación",
        label: "%",
        gaugeWidthScale: 1.2,
        counter: true,
        levelColors: ["#198754", "#ffc107", "#dc3545"],
        formatNumber: true,
        pointer: true,
        pointerOptions: {
            color: "#8e2de2",
            toplength: 14,
            bottomlength: 27,
            bottomwidth: 4
        },
        startAnimationTime: 1000,
        startAnimationType: '>',
        refreshAnimationTime: 700,
        refreshAnimationType: 'bounce'
    });

    valorActualGauge = avg;
}

function inicializarGraficoPie(churn, noChurn, error) {
    const ctx = document.getElementById('myChart');

    if (chartPie) {
        chartPie.data.datasets[0].data = [churn, noChurn, error];
        chartPie.update();
    } else {
        chartPie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cancelará', 'No cancelará', 'Error en predicción'],
                datasets: [{
                    data: [churn, noChurn, error],
                    backgroundColor: ['rgb(255, 99, 132)', '#4bc0c0', 'rgb(54, 162, 235)'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        formatter: (value, context) => {
                            const total = context.chart.data.datasets[0].data
                                .reduce((a, b) => a + b, 0);
                            const percentage = (value / total * 100).toFixed(1);
                            return percentage + '%';
                        }
                    }
                }
            }
        });
    }
}

function inicializarGraficoBar(alto, medio, bajo) {
    const ctx2 = document.getElementById('myChart2');

    if (chartBar) {
        chartBar.data.datasets[0].data = [alto, medio, bajo];
        chartBar.update();
    } else {
        chartBar = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Alto', 'Medio', 'Bajo'],
                datasets: [{
                    data: [alto, medio, bajo],
                    backgroundColor: ['rgb(255, 99, 132)', '#ffcd56', '#4bc0c0'],
                    borderWidth: 0,
                    borderRadius: 5,
                    barThickness: 80
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    datalabels: {
                        anchor: 'center',
                        align: 'top',
                        color: '#000',
                        font: {
                            weight: 'bold'
                        },
                        formatter: (value, context) => {
                            const data = context.chart.data.datasets[0].data;
                            const total = data.reduce((a, b) => a + b, 0);
                            return ((value / total) * 100).toFixed(1) + '%';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e0e0e0' },
                        ticks: { font: { size: 12 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 13, weight: 'bold' } }
                    }
                }
            }
        });
    }
}

// Resize handler para gauge
let resizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        if (gaugeChurn && valorActualGauge !== 0) {
            inicializarGauge(valorActualGauge);
        }
    }, 250);
});

// =================== DASHBOARD ADMIN ===================

async function inicializarDashboardAdmin() {
    const cardMetricas = document.getElementById('card-metricas');
    const valoresFiltro = document.getElementById('valoresFiltro');
    const filtroBig = document.getElementById('filtros');
    const filtroSmall = document.getElementById('filtrosSmall');

    filtroSmall?.classList.remove('d-none');
    filtroSmall?.classList.add('d-block', 'd-md-none');
    filtroBig?.classList.add('d-md-block');

    const select = document.querySelectorAll('.usuario');
    const hoy = sacarFecha(new Date());
    const fechaInicio = document.querySelectorAll('.fechaInicio');
    const fechaFin = document.querySelectorAll('.fechaFin');
    const formFiltros = document.getElementById('filtros-admin');
    const formFiltrosSmall = document.getElementById('filtros-admin-small');

    // Cargar usuarios en select
    await cargarUsuarios(select);

    // Configurar sincronización
    sincronizarTodosCampos();
    configurarValidacionFechas(fechaInicio);

    // Cargar dashboard general
    async function dashboardGral() {
        try {
            const data = await obtenerLogs();

            cardMetricas?.classList.remove('d-none');
            valoresFiltro?.classList.add('d-none');

            datosComunes(data);

            select.forEach(s => s.value = '0');

            const minFecha = data.fechaPrimerPrediccion
                ? data.fechaPrimerPrediccion.split('T')[0]
                : hoy;
            inicializarFechas(fechaInicio, fechaFin, minFecha, hoy);

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            mostrarError('Error al cargar el dashboard');
        }
    }

    // Función para limpiar filtros
    function cleanFiltros() {
        document.querySelectorAll(".btn-filtrosCSV").forEach(btn => btn.remove());
        dashboardGral();
    }

    // Configurar formularios
    configurarFormularioFiltros(formFiltros, valoresFiltro, cleanFiltros);
    configurarFormularioFiltros(formFiltrosSmall, valoresFiltro, cleanFiltros);

    // Cargar dashboard inicial
    await dashboardGral();
}

async function cargarUsuarios(selectElements) {
    try {
        const usuarios = await obtenerUsuarios();

        usuarios.forEach(u => {
            selectElements.forEach(s => {
                const option = document.createElement("option");
                option.value = u.usuario;
                option.textContent = u.usuario.toUpperCase();
                s.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        mostrarError('Error al cargar la lista de usuarios');
    }
}

function configurarFormularioFiltros(form, valoresFiltro, cleanFiltros) {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar botones anteriores
        document.querySelectorAll(".btn-filtrosCSV").forEach(btn => btn.remove());

        const usuario = form.elements['usuario'];
        const fechaIniForm = form.elements['fechaInicio'];
        const fechaFinForm = form.elements['fechaFin'];

        // Validar fechas
        if (fechaFinForm.value && fechaFinForm.value < fechaIniForm.value) {
            mostrarError('La fecha final no puede ser menor a la fecha inicial');
            return;
        }

        try {
            const data = await filtrarLogs(
                usuario.value,
                fechaIniForm.value,
                fechaFinForm.value
            );

            // Mostrar valores del filtro
            if (valoresFiltro) {
                valoresFiltro.classList.remove('d-none');
                valoresFiltro.textContent =
                    `USUARIO: ${usuario.value !== '0' ? usuario.value.toUpperCase() : 'TODOS'} - ` +
                    `FECHA INICIO: ${fechaIniForm.value} - ` +
                    `FECHA FIN: ${fechaFinForm.value}`;
            }

            // Calcular y mostrar métricas
            const metricas = calcularMetricas(data);
            datosComunes(metricas);

            // Configurar botones de limpieza
            document.querySelectorAll(".cleanFiltros").forEach(btn => {
                btn.addEventListener("click", cleanFiltros);
            });

            // Agregar botón de descarga
            agregarBotonDescarga(data, usuario.value !== 0 ? usuario.value : 'TODOS', fechaIniForm.value, fechaFinForm.value);

        } catch (error) {
            console.error('Error aplicando filtros:', error);
            mostrarError('Error al aplicar los filtros');
        }
    });
}

function agregarBotonDescarga(data, usuario, fechaInicio, fechaFin) {
    const btnsFiltroCSV = document.querySelectorAll('.divFiltros');
    const btnHTML = `
        <button type="button" 
                class="btn-filtrosCSV btn btn-secondary w-100 mt-3 fw-bold">
            DESCARGAR DATOS
        </button>
    `;

    btnsFiltroCSV.forEach(div => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = btnHTML;
        div.appendChild(wrapper.firstElementChild);
    });

    document.querySelectorAll('.btn-filtrosCSV').forEach(btn => {
        btn.addEventListener('click', () => {
            const datosTabla = convertirDatosFiltradosATabla(data);
            const nombreArchivo = `${usuario.toUpperCase()}_${fechaInicio}_${fechaFin}`;
            descargarCSV(datosTabla, nombreArchivo);
        });
    });
}

// =================== DASHBOARD USUARIO ===================

async function inicializarDashboardUsuario() {
    const userName = getUserName();

    try {
        const data = await obtenerLogsPorUsuario(userName);
        datosComunes(data);
    } catch (error) {
        console.error('Error cargando datos de usuario:', error);
        mostrarError('Error al cargar tus datos');
    }
}

// =================== INICIALIZACIÓN ===================

if (token && userRol === 'ADMIN') {
    inicializarDashboardAdmin();
}

if (token && userRol === 'USUARIO') {
    inicializarDashboardUsuario();
}

Chart.register(ChartDataLabels);

const formSinglePred = document.getElementById('form-single-pred');

formSinglePred?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const resultContainer = document.getElementById('result-single-pred');
    resultContainer.innerHTML = '';

    const all_error = document.querySelectorAll(".errorMsg");
    all_error.forEach(e => {
        e.innerHTML = '';
    });

    const inputs = formSinglePred.querySelectorAll("input[type='number']");
    const selects = formSinglePred.querySelectorAll("select");

    const reglas = {
        antiguedad: {
            min: 0,
            max: 120
        },
        facturasImpagas: {
            min: 0,
            max: 10
        },
        frecuenciaUso: {
            min: 0,
            max: 30
        },
        ticketsSoporte: {
            min: 0,
            max: 50
        },
        cambiosPlan: {
            min: 0,
            max: 5
        }
    };

    let hasError = false;

    inputs.forEach(input => {
        const nombre = input.name;
        const valor = input.value;
        const regla = reglas[nombre];
        const divError = document.getElementById(`${nombre}Error`);

        if (!regla) return;

        if (valor === '') {
            hasError = true;
            divError.innerHTML = `<p class="text-danger fs-6">Campo obligatorio</p>`;
            return;
        }

        const num = Number(valor);

        if (num < regla.min || num > regla.max) {
            hasError = true;
            divError.innerHTML = `<p class="text-danger fs-6">El valor debe estar entre ${regla.min} y ${regla.max}</p>`;
        } else {
            divError.innerHTML = '';
        }
    });

    selects.forEach(select => {
        const nombre = select.name;
        const valor = select.value;
        const divError = document.getElementById(`${nombre}Error`);

        if (valor === "0") {
            hasError = true;
            divError.innerHTML = `<p class="text-danger fs-6">Debe seleccionar una opción válida</p>`;
        } else {
            divError.innerHTML = '';
        }
    });

    if (hasError) return;

    const bodyRequest = [...inputs, ...selects].reduce((acc, field) => {
        acc[field.name] =
            field.type === 'number'
                ? Number(field.value)
                : field.value;
        return acc;
    }, {});

    const token = getAuthToken();
    const authorization = token ? `Bearer ${token}` : '';

    fetch("http://127.0.0.1:8080/api/v1/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `${authorization}`
        },
        body: JSON.stringify(bodyRequest)
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.error) {
                Swal.fire({
                    icon: "error",
                    title: "Predicción no disponible",
                    text: "Intenta más tarde o contacta a soporte",
                });
                return
            }
            const esNoChurn = data.prediccion === "no_cancelara";

            const estadoTexto = esNoChurn ? "No cancelará" : "Cancelará";
            const estadoIcono = esNoChurn
                ? `<i class="bi bi-check-circle-fill text-success fs-2"></i>`
                : `<i class="bi bi-x-circle-fill text-danger fs-2"></i>`;

            const estadoColor = esNoChurn ? "text-success" : "text-danger";

            const probabilidad = Math.round(data.probabilidadChurn * 100);

            let riesgoClienteTexto;
            let riesgoClienteBg;
            if (data.probabilidadChurn < 3) {
                riesgoClienteTexto = 'Bajo';
                riesgoClienteBg = 'bg-success'
            } else if (data.probabilidadChurn >= 0.3 && probabilidad <= 0.7) {
                riesgoClienteTexto = 'Medio';
                riesgoClienteBg = 'bg-warning'
            } else {
                riesgoClienteTexto = 'Alto';
                riesgoClienteBg = 'bg-danger'
            }

            function formatearNombre(nombre) {
                return nombre
                    .replace(/_/g, " ")
                    .trim()
                    .toUpperCase();
            }

            const riesgoNombre = [];
            const riesgoTexto = [];
            const riesgoBadge = [];

            data.topFeatures?.forEach(f => {
                riesgoNombre.push(formatearNombre(f.feature));
                if (f.impacto == 'alto_riesgo') {
                    riesgoTexto.push('Alto')
                    riesgoBadge.push("bg-danger")
                }
                else if (f.impacto == 'medio_riesgo') {
                    riesgoTexto.push('Medio')
                    riesgoBadge.push("bg-warning")
                } else {
                    riesgoTexto.push('Bajo')
                    riesgoBadge.push("bg-success")
                }
            });

            const filasRiesgoHTML = riesgoNombre.map((nombre, index) => `
                <div class="row border-bottom mb-2">
                    <div class="col">
                        <p class="text-end m-0">${nombre}</p>
                    </div>
                    <div class="col">
                        <h4>
                            <span class="badge ${riesgoBadge[index]}">
                                ${riesgoTexto[index]}
                            </span>
                        </h4>
                    </div>
                </div>
            `).join("");


            resultContainer.innerHTML = `
                <div class="card shadow-lg">
                    <div class="card-body p-0">
                        <h5 id="card-title-pred" class="card-title p-3 text-white fs-4">Resultado de la
                            predicción</h5>

                        <div class="accordion m-3" id="accordionPanelsStayOpenExample">
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="panelsStayOpen-headingOne">
                                    <button class="fw-bold accordion-button" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#panelsStayOpen-collapseOne" aria-expanded="true"
                                        aria-controls="panelsStayOpen-collapseOne">
                                        1. Revisar datos generales
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseOne" class="accordion-collapse collapse show"
                                    aria-labelledby="panelsStayOpen-headingOne">
                                    <div class="accordion-body">
                                        <div class="m-1">
                                            <div class="border-bottom mb-3 p-2">
                                                <p class="card-text fst-italic m-0">Estado del cliente:</p>
                                                <p
                                                    class="fs-2 m-0 text ${estadoColor} fw-semibold fst-italic text-center">
                                                    ${estadoIcono}
                                                    ${estadoTexto}
                                                </p>
                                            </div>
                                            <div class="border-bottom mb-3 p-2">
                                                <p class="card-text fst-italic m-0">Probabilidad de churn:</p>
                                                <p class="fs-1 text fst-italic text-center m-0"> ${probabilidad}% </p>
                                            </div>
                                            <div class="border-bottom mb-3 p-2">
                                                <p class="card-text fst-italic m-0">Nivel de riesgo:</p>
                                                <h4 class="fs-1 text fst-italic text-center m-0  px-3 py-1">
                                                    <span class="badge ${riesgoClienteBg}">
                                                        ${riesgoClienteTexto}
                                                    </span>
                                                </h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="panelsStayOpen-headingTwo">
                                    <button class="fw-bold accordion-button collapsed" type="button"
                                        data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseTwo"
                                        aria-expanded="false" aria-controls="panelsStayOpen-collapseTwo">
                                        2. Ver que factores generan más riesgo 
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseTwo" class="accordion-collapse collapse"
                                    aria-labelledby="panelsStayOpen-headingTwo">
                                    <div class="accordion-body">
                                        <div class="container">
                                            ${filasRiesgoHTML}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="panelsStayOpen-headingThree">
                                    <button class="fw-bold accordion-button collapsed" type="button"
                                        data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseThree"
                                        aria-expanded="false" aria-controls="panelsStayOpen-collapseThree">
                                        3. Evaluar la acción recomendada
                                    </button>
                                </h2>
                                <div id="panelsStayOpen-collapseThree" class="accordion-collapse collapse"
                                    aria-labelledby="panelsStayOpen-headingThree">
                                    <div class="accordion-body">
                                        <p class="text-secondary m-1 text-center">
                                            ${esNoChurn
                    ? "No requiere acción inmediata"
                    : "Contactar al cliente y ofrecer retención"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `
        });

});

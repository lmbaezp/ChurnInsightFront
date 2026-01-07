const formSinglePred = document.getElementById('form-single-pred');

formSinglePred?.addEventListener('submit', async (e) => {
    e.preventDefault();

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
        factImpagas: {
            min: 0,
            max: 10
        },
        frecUso: {
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

        if (select.value === "0") {
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


    // fetch("http://127.0.0.1:8000/predict", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({bodyRequest})
    // })
    //     .then(res => res.json())
    //     .then(data => {
    //         console.log(data);
    //     });

});

// formUtils.js - Utilidades compartidas para formularios

// =================== GESTIÓN DE ERRORES VISUALES ===================

/**
 * Limpia errores visuales de un input
 */
export function limpiarErrorInput(input) {
    const errorDiv = document.getElementById(`${input.id}Error`);
    input.classList.remove('border', 'border-danger');
    if (errorDiv) {
        errorDiv.textContent = '';
    }
}

/**
 * Muestra error visual en un input
 */
export function mostrarErrorInput(input, mensaje) {
    const errorDiv = document.getElementById(`${input.id}Error`);
    input.classList.add('border', 'border-danger');
    if (errorDiv) {
        errorDiv.textContent = mensaje;
    }
}

/**
 * Marca un campo con error (versión genérica)
 */
export function marcarCampoConError(elemento, mensaje = null, divHelp = null) {
    elemento.classList.add('border', 'border-danger');
    
    if (divHelp) {
        divHelp.classList.add('text-danger');
    }
    
    if (mensaje) {
        const errorDiv = document.getElementById(`${elemento.id}Error`) || 
                        document.getElementById(`${elemento.name}Error`);
        if (errorDiv) {
            errorDiv.innerHTML = `<p class="text-danger">${mensaje}</p>`;
        }
    }
}

/**
 * Limpia todos los errores de un formulario
 */
export function limpiarTodosErrores(formulario) {
    // Limpiar mensajes de error
    formulario.querySelectorAll('.errorMsg').forEach(e => e.innerHTML = '');
    
    // Limpiar clases de ayuda
    formulario.querySelectorAll('.helpMsg').forEach(e => e.classList.remove('text-danger'));
    
    // Limpiar bordes rojos
    const campos = formulario.querySelectorAll('input, select, textarea');
    campos.forEach(e => e.classList.remove('border', 'border-danger'));
}

// =================== NAVEGACIÓN Y FOCUS ===================

/**
 * Maneja el scroll y focus al primer error
 */
export function manejarErrorValidacion(elemento) {
    if (!elemento) return;

    elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    setTimeout(() => {
        elemento.focus({ preventScroll: true });
    }, 300);
}

/**
 * Scroll hacia un elemento específico
 */
export function scrollHaciaElemento(elementoId) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;

    elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    setTimeout(() => {
        elemento.focus({ preventScroll: true });
    }, 300);
}

// =================== VALIDACIONES GENERALES ===================

/**
 * Valida campos vacíos de un array de inputs
 */
export function validarCamposVacios(inputs, mensajeError = 'Campo obligatorio') {
    let primerError = null;
    let hasError = false;

    inputs.forEach(input => {
        limpiarErrorInput(input);

        const valor = input.value ? input.value.trim() : '';
        
        if (valor === '') {
            hasError = true;
            primerError ??= input;
            mostrarErrorInput(input, mensajeError);
        }
    });

    return { hasError, primerError };
}

/**
 * Valida que un select tenga una opción válida seleccionada
 */
export function validarSelect(select, valorInvalido = '0', mensajeError = 'Debe seleccionar una opción válida') {
    const errorDiv = document.getElementById(`${select.id}Error`) || 
                     document.getElementById(`${select.name}Error`);

    if (select.value === valorInvalido) {
        marcarCampoConError(select, mensajeError);
        return false;
    } else {
        if (errorDiv) {
            errorDiv.innerHTML = '';
        }
        select.classList.remove('border', 'border-danger');
        return true;
    }
}

/**
 * Valida un campo numérico dentro de un rango
 */
export function validarRangoNumerico(input, min, max) {
    const valor = input.value;
    const divHelp = document.getElementById(`${input.name}Help`) || 
                    document.getElementById(`${input.id}Help`);

    // Campo vacío
    if (valor === '') {
        marcarCampoConError(input, 'Campo obligatorio');
        return false;
    }

    // Fuera de rango
    const num = Number(valor);
    if (num < min || num > max) {
        marcarCampoConError(input, null, divHelp);
        return false;
    }

    // Válido
    input.classList.remove('border', 'border-danger');
    if (divHelp) {
        divHelp.classList.remove('text-danger');
    }
    return true;
}

// =================== ALERTAS (SWEETALERT) ===================

/**
 * Muestra alerta de éxito
 */
export function mostrarExito(mensaje, callback = null) {
    Swal.fire({
        icon: 'success',
        title: mensaje,
        showConfirmButton: false,
        timer: 1500
    }).then(() => {
        if (callback) callback();
    });
}

/**
 * Muestra alerta de error
 */
export function mostrarError(titulo, mensaje) {
    Swal.fire({
        icon: 'error',
        title: titulo,
        text: mensaje
    });
}

/**
 * Muestra alerta de información
 */
export function mostrarInfo(titulo, mensaje, duracion = 2000) {
    Swal.fire({
        icon: 'info',
        title: titulo,
        text: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: duracion
    });
}

// =================== TOGGLE DE CONTRASEÑA ===================

/**
 * Configura el toggle de visibilidad de contraseña
 */
export function configurarTogglePassword(inputElement, toggleButton) {
    if (!inputElement || !toggleButton) return;

    toggleButton.addEventListener('click', () => {
        if (inputElement.type === 'password' && inputElement.value.length > 0) {
            inputElement.type = 'text';
            toggleButton.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
            inputElement.type = 'password';
            toggleButton.innerHTML = '<i class="bi bi-eye"></i>';
        }
    });
}

// =================== CONSTRUCCIÓN DE DATOS ===================

/**
 * Construye un objeto a partir de campos de formulario
 */
export function construirObjetoDesdeFormulario(campos) {
    return campos.reduce((acc, field) => {
        const valor = field.value ? field.value.trim() : field.value;
        
        acc[field.name] = field.type === 'number' 
            ? Number(valor) 
            : valor;
        
        return acc;
    }, {});
}

/**
 * Limpia los valores de un formulario
 */
export function limpiarFormulario(formulario) {
    const inputs = formulario.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"]');
    const selects = formulario.querySelectorAll('select');
    const textareas = formulario.querySelectorAll('textarea');

    inputs.forEach(input => input.value = '');
    selects.forEach(select => select.value = '0');
    textareas.forEach(textarea => textarea.value = '');
}

// =================== VALIDACIONES ESPECÍFICAS ===================

/**
 * Valida formato de email
 */
export function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida longitud de string
 */
export function validarLongitud(valor, min, max) {
    const longitud = valor.trim().length;
    return longitud >= min && longitud <= max;
}
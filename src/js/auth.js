// auth.js - Gestión de autenticación (Login y Registro)
import {
    limpiarErrorInput,
    mostrarErrorInput,
    manejarErrorValidacion,
    mostrarExito,
    mostrarError,
    configurarTogglePassword,
    validarCamposVacios
} from './formUtils.js';

// =================== CONFIGURACIÓN ===================

const REGEX = {
    user: /^[a-zA-Z0-9]{4,8}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6}$/
};

const MENSAJES_ERROR = {
    usuarioIncorrecto: 'Usuario o contraseña incorrecta',
    passwordNoCoincide: 'Las contraseñas no coinciden',
    usuarioExistente: 'El nombre de usuario o el email ya están registrados'
};

// =================== UTILIDADES ESPECÍFICAS ===================

/**
 * Verifica si hay un usuario con sesión activa
 */
function verificarSesionActiva() {
    const current = JSON.parse(localStorage.getItem('CURRENT_USER') || 'null');
    if (current) {
        window.location.href = '/src/views/home_dash.html';
        return true;
    }
    return false;
}

// =================== VALIDACIONES ESPECÍFICAS ===================

/**
 * Valida el formato de los campos según las reglas
 */
function validarFormatos(formData) {
    const errores = [];

    if (formData.usuario && !REGEX.user.test(formData.usuario)) {
        errores.push({
            campo: 'user',
            mensaje: 'Usuario debe tener 4-8 caracteres alfanuméricos'
        });
    }

    if (formData.email && !REGEX.email.test(formData.email)) {
        errores.push({
            campo: 'email',
            mensaje: 'Email no válido'
        });
    }

    if (formData.password && !REGEX.password.test(formData.password)) {
        errores.push({
            campo: 'pass1',
            mensaje: 'Contraseña no cumple requisitos'
        });
    }

    if (formData.password2 && formData.password !== formData.password2) {
        errores.push({
            campo: 'pass2',
            mensaje: MENSAJES_ERROR.passwordNoCoincide
        });
    }

    return errores;
}

/**
 * Muestra errores de validación en el formulario
 */
function mostrarErroresValidacion(errores) {
    let primerError = null;

    errores.forEach(error => {
        const input = document.getElementById(error.campo);
        if (input) {
            mostrarErrorInput(input, error.mensaje);
            primerError ??= input;
        }
    });

    return primerError;
}

// =================== LOGIN ===================

function inicializarLogin() {
    const formLogin = document.getElementById('form-login');
    if (!formLogin) return;

    // Configurar toggle de contraseña
    const inputPass = document.getElementById('loginPass');
    const togglePass = document.getElementById('togglePass');
    configurarTogglePassword(inputPass, togglePass);

    // Manejar submit
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Verificar si ya hay sesión activa
        if (verificarSesionActiva()) return;

        const usuarioInput = document.getElementById('loginUser');
        const passwordInput = document.getElementById('loginPass');

        // Validar campos vacíos
        const { hasError, primerError } = validarCamposVacios([usuarioInput, passwordInput]);

        if (hasError) {
            manejarErrorValidacion(primerError);
            return;
        }

        const usuario = usuarioInput.value.trim();
        const password = passwordInput.value;

        try {
            const data = await login({ usuario, password });

            if (data.error) {
                mostrarErrorInput(usuarioInput, MENSAJES_ERROR.usuarioIncorrecto);
                mostrarErrorInput(passwordInput, MENSAJES_ERROR.usuarioIncorrecto);
                return;
            }

            // Guardar token
            const currentUser = { jwt: data.token };
            localStorage.setItem('CURRENT_USER', JSON.stringify(currentUser));

            // Mostrar éxito y redirigir
            mostrarExito('Bienvenido', () => {
                window.location.href = '/src/views/home_dash.html';
            });

        } catch (error) {
            console.error('Error en login:', error);
            mostrarError('Error de conexión', error.message);
        }
    });
}

// =================== REGISTRO ===================

function inicializarRegistro() {
    const formSignup = document.getElementById('form-signup');
    if (!formSignup) return;

    // Configurar toggle de contraseñas
    const inputPass1 = document.getElementById('pass1');
    const togglePass1 = document.getElementById('togglePass');
    configurarTogglePassword(inputPass1, togglePass1);

    const inputPass2 = document.getElementById('pass2');
    const togglePass2 = document.getElementById('togglePass2');
    configurarTogglePassword(inputPass2, togglePass2);

    // Manejar submit
    formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputs = formSignup.querySelectorAll('input');

        // Validar campos vacíos
        const { hasError: camposVacios, primerError: errorVacio } = validarCamposVacios(inputs);

        if (camposVacios) {
            manejarErrorValidacion(errorVacio);
            return;
        }

        // Obtener valores
        const formData = {
            usuario: document.getElementById('user').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('pass1').value,
            password2: document.getElementById('pass2').value
        };

        // Validar formatos
        const erroresValidacion = validarFormatos(formData);

        if (erroresValidacion.length > 0) {
            const primerError = mostrarErroresValidacion(erroresValidacion);
            manejarErrorValidacion(primerError);
            return;
        }

        try {
            const data = await registrarUsuario({
                usuario: formData.usuario,
                email: formData.email,
                password: formData.password
            });

            if (data.error) {
                mostrarError('Error en los datos', MENSAJES_ERROR.usuarioExistente);
                return;
            }

            // Mostrar éxito y redirigir
            mostrarExito('Registro exitoso', () => {
                window.location.href = '/index.html';
            });

        } catch (error) {
            console.error('Error en registro:', error);
            mostrarError('Error de conexión', error.message);
        }
    });
}

// =================== INICIALIZACIÓN ===================

document.addEventListener('DOMContentLoaded', () => {
    inicializarLogin();
    inicializarRegistro();
});
// api.js - Servicios para consultas HTTP

// =================== CONFIGURACIÓN ===================
// const API_BASE_URL = 'http://127.0.0.1:8080';
const API_BASE_URL = 'https://backend-churninsight-app-1.onrender.com'

const ENDPOINTS = {
    // Auth
    login: '/auth/login',
    register: '/auth/register',

    // Logs
    logs: '/logs',
    logsByUser: (username) => `/logs/user/${username}`,
    logsFilterByFechaUser: (username) => `/logs/filter/fecha/${username}`,
    logsFilterByFecha: () => '/logs',

    // Usuarios
    usuarios: '/usuarios'
};

// =================== CACHE EN MEMORIA ===================
let cachedToken = null;
let cachedDecodedToken = null;
let cachedUser = null;

// =================== GESTIÓN DE TOKEN ===================

function getCurrentUser() {
    if (cachedToken) {
        return cachedToken;
    }

    const stored = localStorage.getItem("CURRENT_USER");
    if (!stored) return null;

    cachedToken = JSON.parse(stored);
    return cachedToken;
}

function getAuthToken() {
    const token = getCurrentUser();
    return token?.jwt;
}

function getValidAuthToken() {
    const token = getAuthToken();
    if (!token) return null;

    if (isTokenExpired(decodeJWT(token))) {
        logout();
        return null;
    }

    return token;
}

function getUserName() {
    if (cachedUser) {
        return cachedUser;
    }

    const token = getValidAuthToken();
    if (!token) return null;

    const decodedToken = decodeJWT(token);
    cachedUser = decodedToken.sub;

    return cachedUser?.trim();
}

function getUserRol() {
    const token = getValidAuthToken();
    if (!token) return null;

    const decoded = decodeJWT(token);
    return decoded?.role?.slice(5);
}

// =================== DECODIFICACIÓN JWT ===================

function decodeJWT(token) {
    try {
        if (cachedDecodedToken && cachedDecodedToken.token === token) {
            return cachedDecodedToken.data;
        }

        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Token inválido');

        const payload = parts[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const decoded = JSON.parse(jsonPayload);

        cachedDecodedToken = {
            token: token,
            data: decoded
        };

        return decoded;

    } catch (error) {
        console.error('Error decodificando JWT:', error);
        return null;
    }
}

// =================== VALIDACIÓN DE EXPIRACIÓN ===================

function isTokenExpired(decodedToken) {
    if (!decodedToken || !decodedToken.exp) {
        return true;
    }

    const ahora = Math.floor(Date.now() / 1000);
    return decodedToken.exp < ahora;
}

function getTokenExpirationTime(decodedToken) {
    if (!decodedToken?.exp) return null;
    return new Date(decodedToken.exp * 1000);
}

function getTimeUntilExpiration(decodedToken) {
    if (!decodedToken?.exp) return 0;

    const ahora = Math.floor(Date.now() / 1000);
    const segundosRestantes = decodedToken.exp - ahora;

    return {
        segundos: segundosRestantes,
        minutos: Math.floor(segundosRestantes / 60),
        horas: Math.floor(segundosRestantes / 3600),
        fechaExpiracion: new Date(decodedToken.exp * 1000)
    };
}

// =================== CHECK Y REDIRECCIÓN ===================

function checkTokenAndRedirect() {
    const token = getValidAuthToken();
    const content = document.getElementById("unautAccess");

    if (!token && content) {
        mostrarMensajeNoAutorizado(content, 'ACCESO NO AUTORIZADO');
        setTimeout(logout, 1000);
        return;
    }

    const decoded = decodeJWT(token);

    if (isTokenExpired(decoded) && content) {
        mostrarMensajeNoAutorizado(content, 'VALIDACIÓN DE SESIÓN VENCIDA, INGRESE NUEVAMENTE');
        setTimeout(logout, 1000);
    } else {
        const tiempo = getTimeUntilExpiration(decoded);
        console.log(`Token válido por ${tiempo.minutos} minutos más`);
    }
}

function mostrarMensajeNoAutorizado(content, mensaje) {
    content.innerHTML = '';
    content.className = '';
    content.classList.add('d-flex', 'flex-column', 'justify-content-center', 'align-items-center');
    content.innerHTML = `
        <h3 class="mt-5">${mensaje}</h3>
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
        </div>
    `;
}

// Verificar token al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    checkTokenAndRedirect();
    setInterval(checkTokenAndRedirect, 60 * 1000);
});

// =================== UTILIDADES DE ROL ===================

function isAdmin() {
    return getUserRol() === 'ADMIN';
}

function isUser() {
    return getUserRol() === 'USUARIO';
}

function requireAuth(requiredRole = null) {
    const token = getAuthToken();

    if (!token) {
        window.location.href = '/login';
        return false;
    }

    const decoded = decodeJWT(token);

    if (isTokenExpired(decoded)) {
        logout();
        return false;
    }

    if (requiredRole && decoded.role !== requiredRole) {
        alert(`Acceso denegado. Se requiere rol: ${requiredRole}`);
        return false;
    }

    return true;
}

// =================== FUNCIÓN FETCH CENTRALIZADA ===================

async function fetchAPI(endpoint, options = {}) {
    const token = getValidAuthToken();

    const defaultOptions = {
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error en API:', error);
        throw error;
    }
}

// =================== AUTENTICACIÓN ===================

async function registrarUsuario(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.register}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            return await response.json();
        } else {
            const errorText = await response.text();
            return { error: true, message: errorText || 'Error desconocido' };
        }
    } catch (error) {
        console.error('Error en registro:', error);
        throw new Error('No se pudo conectar con el servidor');
    }
}

async function login(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            return await response.json();
        } else if (response.status === 401) {
            return { error: true, message: 'Credenciales incorrectas' };
        } else {
            const errorText = await response.text();
            return { error: true, message: errorText || 'Error desconocido' };
        }
    } catch (error) {
        console.error('Error en login:', error);
        throw new Error('No se pudo conectar con el servidor');
    }
}

function logout() {
    cachedToken = null;
    cachedDecodedToken = null;
    cachedUser = null;

    localStorage.removeItem("CURRENT_USER");
    window.location.href = '/index.html';
}

// =================== SERVICIOS DE LOGS ===================

async function obtenerLogs() {
    return await fetchAPI(ENDPOINTS.logs, { method: 'GET' });
}

async function obtenerLogsPorUsuario(username) {
    return await fetchAPI(ENDPOINTS.logsByUser(username), { method: 'GET' });
}

async function filtrarLogs(username, fechaDesde, fechaHasta) {
    if (username === '0') {
        return await fetchAPI(ENDPOINTS.logsFilterByFecha(), {
        method: 'POST',
        body: JSON.stringify({
            fechaDesde: `${fechaDesde}T00:00:00Z`,
            fechaHasta: `${fechaHasta}T23:59:59Z`
        })
    });
    }

    return await fetchAPI(ENDPOINTS.logsFilterByFechaUser(username), {
        method: 'POST',
        body: JSON.stringify({
            fechaDesde: `${fechaDesde}T00:00:00Z`,
            fechaHasta: `${fechaHasta}T23:59:59Z`
        })
    });
}

// =================== SERVICIOS DE USUARIOS ===================

async function obtenerUsuarios() {
    return await fetchAPI(ENDPOINTS.usuarios, { method: 'GET' });
}
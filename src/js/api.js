// api.js - Servicios para consultas HTTP
const API_BASE_URL = 'http://localhost:8080/api';

// =================== AUXILIARES ===================
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("CURRENT_USER"));
}

function getAuthToken() {
    const user = getCurrentUser();
    return user?.jwt || null;
}

function getUserName() {
    const user = getCurrentUser();
    if (!user || !user.user) return null;
    return user.user.trim().toUpperCase();
}

// Validación inicial del token
if (!getAuthToken()) {
    const content = document.getElementById("unautAccess");
    if (content) {
        content.innerHTML = '';
        content.className = '';
        content.classList.add('d-flex', 'flex-column', 'justify-content-center', 'align-items-center');
        content.innerHTML = `
            <h3 class="mt-5">ACCESO NO AUTORIZADO</h3>
            <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
            </div>
            `
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }
}

// =========================== AUTENTICACIÓN ===============================

// Register
async function registrarUsuario(userData) {
    try {
        const response = await fetch("http://localhost:8080/auth/register", {
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
        console.error('Error en login:', error);
        throw new Error('No se pudo conectar con el servidor');
    }
}
// Login
async function login(credentials) {
    try {
        const response = await fetch("http://localhost:8080/auth/login", {
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

// Logout

function logOut() {
    localStorage.removeItem('CURRENT_USER');
    window.location.href = '/index.html';
}

// =========================== PREDICCIÓN ===============================

// Individual
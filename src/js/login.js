document.addEventListener('DOMContentLoaded', () => {

    // ========================= SIGN IN ====================================
    const inputPass = document.getElementById("loginPass");
    const togglePass = document.getElementById("togglePass");

    togglePass?.addEventListener("click", () => {
        if (inputPass.type === "password" && inputPass.value.length > 0) {
            inputPass.type = "text"; // muestra caracteres
            togglePass.innerHTML = `<i class="bi bi-eye-slash"></i>`;
        } else {
            inputPass.type = "password"; // muestra puntos
            togglePass.innerHTML = `<i class="bi bi-eye"></i>`;
        }
    });


    const formLogin = document.getElementById('form-login');

    formLogin?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validaciones básicas
        const usuario = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value;
        const user_error = document.getElementById('userError');
        const pass_error = document.getElementById('passError');

        user_error.innerHTML = '';
        pass_error.innerHTML = '';
        const regexID = /^[a-zA-Z0-9]{4,}$/;
        const regexPass = /^[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{6}$/;
        let hasError = false;


        if (usuario === '') {
            user_error.innerHTML = `<p class="text-danger fs-6">Campo obligatorio</p>`;
            hasError = true;
        } else if (!regexID.test(usuario)) {
            user_error.innerHTML = `<p class="text-danger fs-6">Valor incorrecto</p>`;
            hasError = true;
        }
        if (password === '') {
            pass_error.innerHTML = `<p class="text-danger fs-6">Campo obligatorio</p>`;
            hasError = true;
        } else if (!regexPass.test(password)) {
            pass_error.innerHTML = `<p class="text-danger fs-6">Valor incorrecto</p>`;
            hasError = true;
        }

        if (hasError) return;

        let current = JSON.parse(localStorage.getItem('CURRENT_USER') || 'null'); 
        if (current) {
            window.location.href = '/src/views/home_dash.html';
        }

        login({ usuario, password })
            .then(data => {
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error en el login',
                        text: 'Credenciales inválidas'
                    });
                    return;
                }

                const currentUser = {
                    jwt: data.token
                };
                localStorage.setItem("CURRENT_USER", JSON.stringify(currentUser));

                Swal.fire({
                    icon: 'success',
                    title: `Bienvenido`,
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    window.location.href = '/src/views/home_dash.html';

                });
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: error.message
                });
            });

    });

    // ========================= SIGN UP ====================================
    const inputPassDos = document.getElementById("signupPass2");
    const togglePassDos = document.getElementById("togglePass2");

    togglePassDos?.addEventListener("click", () => {
        if (inputPassDos.type === "password" && inputPassDos.value.length > 0) {
            inputPassDos.type = "text"; // muestra caracteres
            togglePassDos.innerHTML = `<i class="bi bi-eye-slash"></i>`;
        } else {
            inputPassDos.type = "password"; // muestra puntos
            togglePassDos.innerHTML = `<i class="bi bi-eye"></i>`;
        }
    });

    const formSignup = document.getElementById('form-signup');

    formSignup?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validaciones básicas
        const usuario = document.getElementById('nombreUsuario').value.trim();
        const email = document.getElementById('emailUsuario').value.trim();
        const password = document.getElementById('loginPass').value;
        const password2 = document.getElementById('signupPass2').value;
        const user_info = document.getElementById('userNameInfo');
        const pass_info = document.getElementById('passInfo');
        const user_error = document.getElementById('userError');
        const email_error = document.getElementById('emailError');
        const pass_error = document.getElementById('passError');
        const passdos_error = document.getElementById('pass2Error');

        user_error.innerHTML = '';
        email_error.innerHTML = '';
        pass_error.innerHTML = '';
        passdos_error.innerHTML = '';

        const regexUser = /^[a-zA-Z0-9]{4,8}$/;
        const regexPass = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6}$/;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let hasError = false;


        if (usuario === '') {
            user_error.innerHTML = `<p class="text-danger fs-6">Campo obligatorio</p>`;
            hasError = true;
        } else if (!regexUser.test(usuario)) {
            user_error.innerHTML = `<p class="text-danger fs-6">Valor incorrecto</p>`;
            hasError = true;
        }
        if (email === '') {
            email_error.innerHTML = `<p class="text-danger fs-6">Campo obligatorio</p>`;
            hasError = true;
        } else if (!regexEmail.test(email)) {
            email_error.innerHTML = `<p class="text-danger fs-6">Valor incorrecto</p>`;
            hasError = true;
        }
        if (password === '') {
            pass_error.innerHTML = `<p class="text-danger fs-6">Campo obligatorio</p>`;
            hasError = true;
        } else if (!regexPass.test(password)) {
            pass_error.innerHTML = `<p class="text-danger fs-6">Valor incorrecto</p>`;
            hasError = true;
        }
        if (password2 === '') {
            passdos_error.innerHTML = `<p class="text-danger fs-6">Campo obligatorio</p>`;
            hasError = true;
        } else if (password2 !== password) {
            passdos_error.innerHTML = `<p class="text-danger fs-6">Contraseñas no coinciden</p>`;
            hasError = true;
        }

        if (hasError) return;

        registrarUsuario({ usuario, email, password })
            .then(data => {
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error en los datos',
                        text: 'El nombre de usuario o el email ya se encuentran registrados'
                    });
                    return;
                }

                Swal.fire({
                    icon: 'success',
                    title: `Bienvenido`,
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    window.location.href = '/index.html';

                });
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: error.message
                });
            });

    });

});


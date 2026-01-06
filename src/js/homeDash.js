const hasToken = JSON.parse(localStorage.getItem('jwt') || 'null');
if (!hasToken) {
  const content = document.getElementById("body-dashboard");
  content.innerHTML = '';
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

function logOut() {
  localStorage.removeItem('jwt');
  window.location.href = '/index.html';
}
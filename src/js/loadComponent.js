function loadComponent(id, url, callback) {
  fetch(url)
    .then(r => r.text())
    .then(html => {
      const element = document.getElementById(id);
      element.innerHTML = html;
      if (callback) callback();
    });
}

function renderUserName() {
  const userNameElement = document.getElementById("userName");
  if (!userNameElement) return;

  const user = getUserName();

  if (user) {
    userNameElement.textContent = user.toUpperCase();
  }
}

// Cargar componentes con callback
loadComponent('header-navbar', '/src/views/header_navbar.html', () => {
  renderUserName();
});
loadComponent('footer', '/src/views/footer.html');

document.addEventListener('DOMContentLoaded', function () {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  tooltipTriggerList.forEach(el => {
    new bootstrap.Tooltip(el)
  })
})
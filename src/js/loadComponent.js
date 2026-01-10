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

    const user = JSON.parse(localStorage.getItem("CURRENT_USER"));
    if (user?.user) {
        userNameElement.textContent = user.user.toUpperCase();
    }
}

// Cargar componentes con callback
loadComponent('header-navbar', '/src/views/header_navbar.html', () => {
  renderUserName();
});
loadComponent('footer', '/src/views/footer.html');

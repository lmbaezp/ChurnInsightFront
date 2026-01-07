function loadComponent(id, url) {
  fetch(url)
    .then(r => r.text())
    .then(html => document.getElementById(id).innerHTML = html);
}

loadComponent('header-navbar', '/src/views/header_navbar.html');
loadComponent('footer', '/src/views/footer.html'); 


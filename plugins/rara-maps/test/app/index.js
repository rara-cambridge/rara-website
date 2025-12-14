window.raraMapsData = { baseUrl: 'http://localhost:3000' };

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');

  setTimeout(() => {
    header.classList.add('hidden');
  }, 1000);

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;

    console.log('currentY', currentY);

    if (currentY > lastScrollY) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }

    lastScrollY = currentY;
  });
});

window.createToolbar = function (name) {
  function addToolbarItem(path, text, active) {
    const link = document.createElement('a');
    link.href = path;
    link.textContent = text;
    link.className = active ? 'active' : '';

    const toolbar = document.getElementById('toolbar');
    toolbar.appendChild(link);
  }

  new Map([
    ['./attractions.html', 'Attractions'],
    ['./improvements.html', 'Improvements'],
    ['./history.html', 'History'],
    ['./heritage_trail.html', 'Heritage trail'],
    ['./boundary_radius.html', 'Boundary radius'],
    ['./boundary_tangent.html', 'Boundary tangent'],
    ['./vector.html', 'Vector'],
    ['./globe.html', 'Globe'],
    ['./raster.html', 'Raster'],
    ['../lib/index.html', 'Lib'],
  ]).forEach(function (value, key) {
    addToolbarItem(key, value, key === name);
  });
};

import { createMap } from './map';
import { flyRouteRadius } from './fly_radius';
import { absUrl } from './url';

const containerId = 'rara-maps-lib-root';
const viewName = 'boundary_radius';

async function loadMap() {
  try {
    const response = await fetch(absUrl('%{RARA_MAPS}/build/data.json'));
    if (!response.ok) {
      throw new Error('Network error');
    }
    const data = await response.json();

    const config = {
      ...data,
      view: data.views.find((view) => view.id === viewName),
    };

    const line = config.lines.find(
      (line) => (line?.properties?.id ?? null) === config.view.app.route
    );

    const map = createMap(containerId, config, {});

    flyRouteRadius(map, config.view.config.center, line.geometry.coordinates);
  } catch (err) {
    console.log(`Network error: ${err}`);
  }
}

function mount() {
  loadMap();
}

// Automatically mount when the page loads
document.addEventListener('DOMContentLoaded', mount);

export { mount };

import { AttributionControl, Map } from 'maplibre-gl';

const attributions = [];
let attributionControl = null;

const position = 'bottom-left';

export function addAttribution(map: Map, attribution: string) {
  if (!attributions.includes(attribution)) {
    attributions.push(attribution);
  }

  if (map && attributionControl) {
    map.removeControl(attributionControl);
  }

  attributionControl = new AttributionControl({
    compact: true,
    customAttribution: `<br>${attributions.join('<br>')}`,
  });

  map.addControl(attributionControl, position);

  // Collapse the control
  const controlElem: Element = document.getElementsByClassName(`maplibregl-ctrl-${position}`)[0];
  const containerElem: Element = controlElem.getElementsByTagName('details')[0];
  containerElem.classList.remove('maplibregl-compact-show');
  containerElem.removeAttribute('open');
}

// Add 3D buildings

import { LayerSpecification, Map } from 'maplibre-gl';

export function addBuildingsLayer(map: Map, id: string, { visible = true }) {
  map.on('load', () => {
    // Insert the layer beneath any symbol layer.
    const layers: LayerSpecification[] = map.getStyle().layers;
    let labelLayerId: string;
    for (let i: number = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol' && 'layout' in layers[i] && layers[i].layout['text-field']) {
        labelLayerId = layers[i].id;
        break;
      }
    }

    map.addSource(id, {
      url: `https://tiles.openfreemap.org/planet`,
      type: 'vector',
    });

    map.addLayer(
      {
        id,
        source: id,
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 15,
        filter: ['!=', ['get', 'hide_3d'], true],
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'render_height'],
            0,
            'lightgray',
            200,
            'royalblue',
            400,
            'lightblue',
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            16,
            ['get', 'render_height'],
          ],
          'fill-extrusion-base': [
            'case',
            ['>=', ['get', 'zoom'], 16],
            ['get', 'render_min_height'],
            0,
          ],
        },
      },
      labelLayerId
    );
  });
}

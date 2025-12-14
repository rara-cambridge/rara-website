// Add a map layer which shows a line

import { Feature } from 'geojson';
import { Map } from 'maplibre-gl';

export function addLineLayer(
  map: Map,
  id: string,
  data: Feature,
  zOrder: string,
  { color = 'black', dashed = false, visible = true }
) {
  map.on('load', () => {
    map.addSource(id, {
      type: 'geojson',
      data,
    });

    map.addLayer(
      {
        id,
        type: 'line',
        source: id,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'line-color': color,
          'line-width': 6,
          'line-dasharray': [3, dashed ? 3 : 0],
        },
      },
      zOrder
    );
  });
}

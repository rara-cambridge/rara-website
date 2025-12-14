// Add a map layer which shows an image

import { Position } from 'geojson';
import { Map } from 'maplibre-gl';

import { addAttribution } from './attribution';

export function addOverlayLayer(
  map: Map,
  id: string,
  url: string,
  coordinates: Array<Array<Position>>,
  zOrder: string,
  {
    attribution = null,
    opacity = 1.0,
    visible = true,
  }: {
    attribution?: string;
    opacity?: number;
    visible?: boolean;
  }
) {
  map.on('load', () => {
    // Add image source
    map.addSource(id, {
      type: 'image',
      url,
      // @ts-expect-error
      coordinates,
    });

    // Add raster layer using that source
    map.addLayer(
      {
        id,
        type: 'raster',
        source: id,
        paint: {
          'raster-opacity': opacity ?? 0.5,
        },
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
      },
      zOrder
    );

    if (attribution) {
      addAttribution(map, attribution);
    }
  });
}

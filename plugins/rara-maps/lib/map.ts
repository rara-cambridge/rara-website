// Map component

import { Feature, FeatureCollection } from 'geojson';

import { getMapLibre } from './externals';
const { Map, NavigationControl, FullscreenControl, ScaleControl } = getMapLibre();

import { PopupManager } from './popup';
import { ZOrder } from './zorder';

import { addBuildingsLayer } from './buildings';
import { addLineLayer } from './line';
import { addLocationsLayer } from './locations';
import { addOverlayLayer } from './overlay';

import { absUrl } from './url';

type Config = {
  center: [number, number];
  style: string;
  zoom: number;
  [key: string]: unknown;
};

type Layer = {
  id: string;
  type: string;
  visible: boolean;
  color?: string;
};

type View = {
  id: string;
  config: Config;
  layers: Array<Layer>;
};

export type Data = {
  attributions: Record<string, string>;
  lines: Array<Feature>;
  locations: Record<string, FeatureCollection>;
  overlays: FeatureCollection;
  view: View;
};

/**
 * Create the map
 * @param {Object} args The arguments
 * @return Map
 */
export function createMap(
  container: string,
  data,
  {
    onLocationClick = null,
    onLocationEnter = null,
    onLocationLeave = null,
  }: {
    onLocationClick?: (id: string) => void;
    onLocationEnter?: (id: string) => void;
    onLocationLeave?: (id: string) => void;
  }
) {
  // Create maplibregl Map

  const config = {
    ...data.view.config,
    style:
      typeof data.view.config.style === 'string'
        ? absUrl(data.view.config.style)
        : data.view.config.style,
    container: container,
    attributionControl: false,
  };

  const map = new Map(config);

  // Create application-related objects

  const attributions = data.attributions;

  const popupManager = new PopupManager(map);

  const zOrder = new ZOrder(
    map,
    data.view.layers.map((layer) => layer.id)
  );

  // Add map controls

  map.addControl(
    new NavigationControl({
      visualizePitch: true,
      visualizeRoll: true,
      showZoom: true,
      showCompass: true,
    })
  );

  map.addControl(new FullscreenControl());

  map.addControl(new ScaleControl(), 'bottom-right');

  // Create layers

  data.view.layers.forEach((element) => {
    if (element.type === 'buildings') {
      addBuildingsLayer(map, element.id, { visible: element.visible });
    }

    if (element.type === 'line') {
      const layerData: Feature = data.lines.find(
        (line) => (line?.properties?.id ?? null) === element.id
      );
      addLineLayer(map, element.id, layerData, zOrder.getPosition(element.id), {
        color: element.color,
        dashed: element.dashed,
        visible: element.visible,
      });
    }

    if (element.type === 'locations') {
      const layerData: FeatureCollection = data.locations[element.id];
      addLocationsLayer(map, element.id, layerData, zOrder.getPosition(element.id), {
        color: element.color,
        visible: element.visible,
        onClick: onLocationClick ?? null,
        onEnter: onLocationEnter ?? null,
        onLeave: onLocationLeave ?? null,
      });
    }

    if (element.type === 'overlay') {
      const overlay: Feature = data.overlays.features.find(
        (o) => (o?.properties?.id ?? null) === element.id
      );
      if (overlay.geometry.type === 'Polygon') {
        addOverlayLayer(
          map,
          element.id,
          absUrl(overlay.properties.url),
          overlay.geometry.coordinates,
          zOrder.getPosition(element.id),
          {
            attribution: overlay.properties.attribution
              ? attributions[overlay.properties.attribution]
              : null,
            opacity: 1.0,
            visible: element.visible,
          }
        );
      }
    }

    if (element.type === 'point') {
      map.on('load', () => {
        map.addSource(element.id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [0.0, 0.0],
            },
          },
        });

        map.addLayer(
          {
            id: element.id,
            source: element.id,
            type: 'circle',
            paint: {
              'circle-radius': 10,
              'circle-color': '#ff0000',
              'circle-stroke-width': 2,
              'circle-stroke-color': 'white',
            },
          },
          zOrder.getPosition(element.id)
        );
      });
    }
  });

  return map;
}

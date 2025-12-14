// Add a map layer which shows locations

import { FeatureCollection, Geometry, Position } from 'geojson';
import { Map, MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl';

import { getPopupManager, PopupManager } from './popup';
import { absUrl } from './url';

export function addLocationsLayer(
  map: Map,
  id: string,
  data: FeatureCollection,
  zOrder: string,
  {
    color = 'black',
    onEnter = null,
    onLeave = null,
    onClick = null,
    staticPopups = false,
    visible = true,
  }: {
    color?: string;
    onEnter?: (id: string) => void;
    onLeave?: (id: string) => void;
    onClick?: (id: string) => void;
    staticPopups?: boolean;
    visible?: boolean;
  }
) {
  map.on('load', async () => {
    const image = await map.loadImage(absUrl(`%{RARA_MAPS}/assets/icons/pin-${color}.png`));
    map.addImage(id, image.data);

    const popupManager: PopupManager = getPopupManager(map);

    data.features.forEach((feature) => {
      const id = feature?.properties?.id ?? null;
      if (id) {
        const popup = popupManager.getPopup(id);
        popup.setData(feature);
        if (staticPopups) {
          popup.visibleStatic = true;
        }
      }
    });

    map.addSource(id, {
      type: 'geojson',
      data: data,
    });

    map.addLayer(
      {
        id,
        type: 'symbol',
        source: id,
        layout: {
          'icon-image': id,
          'icon-size': 1.0,
          'icon-allow-overlap': true,
          visibility: visible ? 'visible' : 'none',
        },
      },
      zOrder
    );

    if (!staticPopups) {
      // Make sure to detect marker change for overlapping markers
      // and use mousemove instead of mouseenter event
      let currentFeatureId: string;
      let currentFeatureCoordinates: string;
      map.on('mousemove', id, (e: MapLayerMouseEvent) => {
        const feature: MapGeoJSONFeature = e.features[0];
        const geometry: Geometry = feature.geometry;

        if (geometry.type === 'Point') {
          const featureCoordinates: string = geometry.coordinates.toString();
          if (currentFeatureCoordinates !== featureCoordinates) {
            currentFeatureCoordinates = featureCoordinates;

            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';

            const coordinates: Position = geometry.coordinates.slice();

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            if (currentFeatureId) {
              popupManager.getPopup(currentFeatureId).visibleDynamic = false;
            }

            currentFeatureId = feature?.properties?.id ?? null;
            if (currentFeatureId) {
              popupManager.getPopup(currentFeatureId).visibleDynamic = true;

              if (onEnter) {
                onEnter(currentFeatureId);
              }
            }
          }
        }
      });

      map.on('mouseleave', id, () => {
        const featureId: string = currentFeatureId;

        map.getCanvas().style.cursor = '';
        popupManager.getPopup(currentFeatureId).visibleDynamic = false;
        currentFeatureId = undefined;
        currentFeatureCoordinates = undefined;

        if (onLeave) {
          onLeave(featureId);
        }
      });
    }

    if (onClick) {
      map.on('click', id, (e: MapLayerMouseEvent) => {
        const feature: MapGeoJSONFeature = e.features[0];
        const id: string = feature?.properties?.id ?? null;
        if (id) {
          onClick(id);
        }
      });
    }
  });
}

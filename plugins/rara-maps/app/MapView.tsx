import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Feature } from 'geojson';
import type { Map as MaplibreMap } from 'maplibre-gl';

import styles from './styles/Map.module.css';

import { useMapHooks } from './MapHooks';

import { flyRouteRadius } from '../lib/fly_radius';
import { Route, flyRouteTangent } from '../lib/fly_tangent';
import { Data, createMap } from '../lib/map';
import { getPopupManager } from '../lib/popup';

/**
 * React component which wraps a maplibregl Map.
 */
const MapView = forwardRef(function MapView(
  {
    paddingTop,
    paddingBottom,
    paddingChanging,
    config,
    routeCoords,
    onLocationClick,
    activeLocation,
    flyRadiusEnabled,
    flyTangentEnabled,
  }: {
    paddingTop: number;
    paddingBottom: number;
    paddingChanging: boolean;
    config: Data;
    routeCoords: Array<[number, number]>;
    onLocationClick: (id: string) => void;
    activeLocation: Feature;
    flyRadiusEnabled: boolean;
    flyTangentEnabled: boolean;
  },
  ref
) {
  const mapRef = useRef<MaplibreMap>();

  const { setLayerOpacity, setLayerVisibility } = useMapHooks(mapRef);

  const mapElemRef = useRef<HTMLDivElement>();

  const ctrlElemTopLeft = document.querySelector('.maplibregl-ctrl-top-left') as HTMLElement | null;

  const ctrlElemTopRight = document.querySelector(
    '.maplibregl-ctrl-top-right'
  ) as HTMLElement | null;

  const ctrlElemBottomLeft = document.querySelector(
    '.maplibregl-ctrl-bottom-left'
  ) as HTMLElement | null;

  const ctrlElemBottomRight = document.querySelector(
    '.maplibregl-ctrl-bottom-right'
  ) as HTMLElement | null;

  const oldActiveLocationRef = useRef<string>();
  const oldActivePopupRef = useRef<Object>();

  const routeRef = useRef<Object>();

  const [oldPaddingBottom, setOldPaddingBottom] = useState<number>();

  // Load map on component mount
  useEffect(() => {
    if (!mapElemRef.current) return;

    mapRef.current = createMap('map', config, {
      onLocationClick: onLocationClick,
    });

    setOldPaddingBottom(paddingBottom);

    return () => mapRef.current?.remove();
  }, []);

  // Expose imperative functions to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      setLayerVisibility,
      setLayerOpacity,
    }),
    []
  );

  // Adjust position of map controls
  useEffect(() => {
    if (ctrlElemTopLeft) {
      ctrlElemTopLeft.style.top = `${paddingTop}px`;
    }
    if (ctrlElemTopRight) {
      ctrlElemTopRight.style.top = `${paddingTop}px`;
    }
    if (ctrlElemBottomLeft) {
      ctrlElemBottomLeft.style.bottom = `${paddingBottom}px`;
    }
    if (ctrlElemBottomRight) {
      ctrlElemBottomRight.style.bottom = `${paddingBottom}px`;
    }
  }, [paddingTop, paddingBottom]);

  /**
   * Calculate map coordinates which appear at a given screen offset from a specified starting point coordinates
   * @param lngLat {Tuple<number, number>} coordinates of point
   * @param offset {number} y offset in screen space
   * @returns
   */
  function offsetCoordinates(lngLat, offset) {
    // Project point into screen coordinates
    const point = mapRef.current.project(lngLat);

    // Apply offset
    const newPoint = point;
    newPoint.y += offset;

    // Project back into map coordinates
    const newLngLat = mapRef.current.unproject(newPoint);

    return newLngLat;
  }

  // Adjust center in response to padding changes
  useEffect(() => {
    if (oldPaddingBottom && !paddingChanging && mapRef.current && !mapRef.current.isMoving()) {
      const lngLat = mapRef.current.getCenter();

      const offset = (paddingBottom - oldPaddingBottom) / 2;

      mapRef.current.easeTo({
        center: offsetCoordinates(lngLat, offset),
        duration: 1000,
      });

      setOldPaddingBottom(paddingBottom);
    }
  }, [paddingChanging, paddingBottom]);

  // Create Route
  useEffect(() => {
    if (routeCoords && mapRef.current) {
      routeRef.current = new Route(mapRef.current, routeCoords);
    }
  }, [routeCoords, mapRef]);

  // Update active location
  useEffect(() => {
    console.log('Map activeLocation=', activeLocation, 'routeRef=', routeRef.current);

    if (!mapRef.current) return;

    if (oldActivePopupRef.current) {
      oldActivePopupRef.current.visibleStatic = false;
      oldActivePopupRef.current = null;
    }

    if (activeLocation) {
      const id = activeLocation?.properties?.id ?? null;
      const popup = getPopupManager(mapRef.current)?.getPopup(id);
      if (popup) {
        popup.visibleStatic = true;
        oldActivePopupRef.current = popup;
      }

      if (activeLocation.geometry.type === 'Point') {
        const coordinates = activeLocation.geometry.coordinates;

        if (routeRef.current && oldActiveLocationRef.current) {
          const fromCoord = oldActiveLocationRef.current.geometry.coordinates;
          const toCoord = activeLocation.geometry.coordinates;
          console.log(
            `Fly from ${oldActiveLocationRef} ${fromCoord} to ${activeLocation.properties.id} ${toCoord}`
          );

          routeRef.current.fly(fromCoord, toCoord, paddingBottom / 2);
        } else {
          mapRef.current.flyTo({
            center: offsetCoordinates(coordinates, paddingBottom / 2),
          });
        }
      }
    }

    oldActiveLocationRef.current = activeLocation;
  }, [activeLocation]);

  // Fly around boundary, with camera pointing to center
  useEffect(() => {
    console.log(`Map flyRadiusEnabled=${flyRadiusEnabled}`);
    if (flyRadiusEnabled && routeCoords) {
      flyRouteRadius(mapRef.current, config.view.config.center, routeCoords);
    }
  }, [flyRadiusEnabled, routeCoords]);

  // Fly around boundary, with camera pointing along route
  useEffect(() => {
    console.log(`flyTangentEnabled=${flyTangentEnabled}`);
    if (flyTangentEnabled && routeCoords) {
      flyRouteTangent(mapRef.current, routeCoords);
    }
  }, [flyTangentEnabled, routeCoords]);

  return <div ref={mapElemRef} id="map" className={`${styles.map}`}></div>;
});

export default MapView;

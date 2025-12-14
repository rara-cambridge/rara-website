// Component which allows camera to fly along a radius

import type { Feature, LineString, Point, Position } from 'geojson';
import { LngLat, Map } from 'maplibre-gl';

import { getTurf } from './externals';
const turf = getTurf();

export function flyRouteRadius(map: Map, center: Position, route: Array<Position>) {
  let start: number = null;
  const playtime: number = 30000;
  const line: Feature<LineString> = turf.lineString(route);

  const centerPt: Feature<Point> = turf.point(center);

  const altitude: number = 300; // m
  const extend: number = 500; // m

  const animate = () => {
    start = start || Date.now();
    const progress: number = (Date.now() - start) % playtime;
    const boundaryPt: Position = turf.along(line, (turf.length(line) * progress) / playtime)
      .geometry.coordinates;

    // Compute distance (in km) and bearing between them
    const dist: number = turf.distance(centerPt, boundaryPt, { units: 'meters' });
    const bearing: number = turf.bearing(centerPt, boundaryPt);

    // Extend the line
    const extendedDist: number = dist + extend;

    // Compute the new point 200 m beyond 'boundary' along the same bearing
    const extendedPt: Feature<Point> = turf.destination(centerPt, extendedDist, bearing, {
      units: 'meters',
    });

    // Extract as [lng, lat]
    const extendedLngLat: Position = extendedPt.geometry.coordinates;

    map.jumpTo(
      map.calculateCameraOptionsFromTo(
        new LngLat(extendedLngLat[0], extendedLngLat[1]),
        altitude,
        new LngLat(center[0], center[1])
      )
    );

    requestAnimationFrame(animate);
  };

  animate();
}

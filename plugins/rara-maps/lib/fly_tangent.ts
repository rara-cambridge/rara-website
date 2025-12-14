// Component which allows camera to fly along a route

import { Feature, LineString, Point, Position } from 'geojson';
import {
  GeoJSONSource,
  LngLat,
  LngLatLike,
  Map,
  Point as MapPoint,
  MercatorCoordinate,
} from 'maplibre-gl';

import { getTurf } from './externals';
const turf = getTurf();

function toPosition(coord: LngLatLike): Position {
  if (Array.isArray(coord)) {
    return coord;
  }

  return [coord[0], coord[1]];
}

/**
 * Fly along a route, with camera pointing along the tangent
 */
export class Route {
  #camera: {
    altitude: number;
    coord: MercatorCoordinate;
    distance: number;
  };

  #distance: number;
  #map: Map;
  #route: Feature<LineString>;

  #startTime: number;
  #startCoord: LngLatLike;
  #startDistance: number;

  #stopCoord: LngLatLike;
  #stopDistance: number;
  #reachedStopDistance: boolean;

  #speed: number;
  #direction: number;

  #yOffset: number;

  constructor(
    map: Map,
    route: Array<Position>,
    { altitude = 500, distance = 500, autoStart = false } = {}
  ) {
    this.#camera = {
      altitude: altitude,
      coord: null,
      distance: null,
    };

    this.#distance = distance;
    this.#map = map;
    this.#speed = 0.0001;
    this.#yOffset = null;

    this.#init(route, autoStart);
  }

  #init(coordinates: Array<Position>, autoStart) {
    console.log('Route loaded');

    this.#route = turf.lineString(coordinates);

    const next = turf.along(this.#route, turf.length(this.#route) / 4).geometry.coordinates;

    const startLngLat = new LngLat(coordinates[0][0], coordinates[0][1]);

    // Calculate camera startpoint
    //  - compute the direction of the first quater of the route
    //  - and place the camera in to opposite direction of this point
    const a = MercatorCoordinate.fromLngLat(startLngLat);
    const b = MercatorCoordinate.fromLngLat(new LngLat(next[0], next[1]));
    const dx = b.x - a.x,
      dy = b.y - a.y;
    this.#camera.distance = this.#distance ?? Math.hypot(dx, dy);
    this.#camera.coord = new MercatorCoordinate(a.x - dx, a.y - dy);

    // FIXME! when using flyTo the positioning is not correct
    this.#map.jumpTo(
      this.#map.calculateCameraOptionsFromTo(
        this.#camera.coord.toLngLat(),
        this.#camera.altitude,
        startLngLat
      )
    );

    if (autoStart) {
      console.log('Automatically starting');
      this.#start();
    }
  }

  #start() {
    console.log('Route.start');

    this.#startDistance = 0;
    this.#stopDistance = null;
    this.#reachedStopDistance = false;
    this.#direction = 1;

    if (this.#startCoord) {
      console.log('Start coordinates:', this.#startCoord);
      const startPoint: Feature<Point> = turf.point(toPosition(this.#startCoord));
      const snappedStartPoint: Feature<Point> = turf.nearestPointOnLine(this.#route, startPoint);
      this.#startDistance = snappedStartPoint.properties.location;
      console.log('Start distance (km):', this.#startDistance);
    }

    if (this.#stopCoord) {
      console.log('Stop coordinates:', this.#stopCoord);
      const stopPoint: Feature<Point> = turf.point(toPosition(this.#stopCoord));
      const snappedStopPoint: Feature<Point> = turf.nearestPointOnLine(this.#route, stopPoint);
      this.#stopDistance = snappedStopPoint.properties.location;
      console.log('Stop distance (km):', this.#stopDistance);
    }

    if (this.#stopDistance && this.#stopDistance < this.#startDistance) {
      this.#direction = -1;
    }

    this.#startTime = Date.now();

    this.#advance();
  }

  #advance() {
    if (this.#reachedStopDistance) {
      return;
    }

    const now: number = Date.now();
    const elapsedTime: number = now - this.#startTime;
    let currentDistance = this.#startDistance + elapsedTime * this.#speed * this.#direction;

    if (!this.#stopDistance) {
      const totalDistance: number = turf.length(this.#route);
      currentDistance = currentDistance % totalDistance;
    }

    const pos: Position = turf.along(this.#route, currentDistance).geometry.coordinates;

    const point: GeoJSONSource = this.#map.getSource('point');
    if (point) {
      point.setData({ type: 'Point', coordinates: pos });
    }

    // Let the camera follow the route
    const lngLat = new LngLat(pos[0], pos[1]);
    const coord = MercatorCoordinate.fromLngLat(lngLat);
    const dx = coord.x - this.#camera.coord.x,
      dy = coord.y - this.#camera.coord.y;
    const delta = Math.hypot(dx, dy) - this.#camera.distance;
    if (delta > 0) {
      const a = Math.atan2(dy, dx);
      this.#camera.coord.x += Math.cos(a) * delta;
      this.#camera.coord.y += Math.sin(a) * delta;
    }
    // FIXME! when using easeTo the positioning is not correct
    this.#map.jumpTo(
      this.#map.calculateCameraOptionsFromTo(
        this.#camera.coord.toLngLat(),
        this.#camera.altitude,
        lngLat
      )
    );

    if (this.#yOffset !== null) {
      // Correct for yOffset
      const centerPoint: MapPoint = this.#map.project(this.#map.getCenter());
      centerPoint.y += this.#yOffset;
      const newLngLat: LngLat = this.#map.unproject(centerPoint);
      this.#map.setCenter(newLngLat);
    }

    // Determine whether stop point has been reached
    if (
      this.#stopDistance !== null &&
      ((this.#direction > 0 && currentDistance >= this.#stopDistance) ||
        (this.#direction < 0 && currentDistance <= this.#stopDistance))
    ) {
      this.#reachedStopDistance = true;
      console.log('Stopped at distance:', this.#stopDistance);
      return;
    }

    requestAnimationFrame(() => {
      this.#advance();
    });
  }

  /**
   * Fly from start position to stop position
   */
  fly(startPos: LngLatLike, stopPos: LngLatLike, yOffset: number = 0) {
    console.log(`Fly from ${startPos} to ${stopPos} yOffset ${yOffset}`);

    this.#startCoord = startPos;
    this.#stopCoord = stopPos;
    this.#yOffset = yOffset;

    this.#reachedStopDistance = false;

    if (this.#route) {
      this.#start();
    }
  }
}

/**
 * Fly along a route, with camera pointing along the tangent
 */
export function flyRouteTangent(map: Map, route: Array<Position>, { autoStart = true } = {}) {
  new Route(map, route, { autoStart: autoStart });
}

import type * as MapLibre from 'maplibre-gl';
import type * as Turf from '@turf/turf';

declare global {
  interface Window {
    maplibregl?: typeof MapLibre;
    turf?: typeof Turf;
  }
}

export {};

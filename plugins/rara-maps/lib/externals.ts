/**
 * TypeSript-safe loader for external dependencies loaded from CDN
 *
 * Instead of e.g.
 *     import { Map } from 'maplibregl';
 *
 * Write this:
 *     import { getMapLibre } from './externals';
 *     const { Map } = getMapLibre();
 */

import type * as MapLibre from 'maplibre-gl';
import type * as Turf from '@turf/turf';

function assert<T>(value: T | undefined, name: string): T {
  if (!value) {
    throw new Error(`${name} is not available on window (CDN not loaded)`);
  }
  return value;
}

export function getMapLibre(): typeof MapLibre {
  return assert(window.maplibregl, 'maplibregl');
}

export function getTurf(): typeof Turf {
  return assert(window.turf, 'turf');
}

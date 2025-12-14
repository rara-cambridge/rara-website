// Layer component

import { Map } from 'maplibre-gl';

/**
 * Class for managing z-order of a stack of layers
 * Based on https://qubika.com/blog/effectively-manage-layer-order-mapbox-gl-js/
 */
export class ZOrder {
  #order: Array<string>;

  /**
   * Create a ZOrder
   * @param {maplibregl.Map} map   The map
   * @param {Array<string>}  order List of layer IDs, lowest to highest
   */
  constructor(map: Map, order: Array<string>) {
    this.#order = order;

    console.log('order', order);

    map.on('load', () => {
      map.addSource('empty', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Add placeholder layers, to reserve positions in the z-order stack
      for (let i = this.#order.length - 1; i >= 0; i--) {
        map.addLayer(
          {
            id: `z-${i}`,
            type: 'symbol',
            source: 'empty',
          },
          i === this.#order.length - 1 ? undefined : `z-${i + 1}`
        );
      }
    });
  }

  /**
   * Get index of layer
   * @param {string} layerId
   * @return Index of layer
   */
  getPosition(layerId: string): string {
    if (!this.#order.includes(layerId)) {
      throw new Error(`Layer ${layerId} not included as a sortable layer`);
    }

    return `z-${this.#order.indexOf(layerId)}`;
  }
}

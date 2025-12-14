import { useCallback, useEffect, useRef, MutableRefObject } from 'react';

import type { Map as MaplibreMap } from 'maplibre-gl';

/**
 * Hook that provides two safe layer-control functions:
 *   const { setOpacity, setVisibility } = useSafeLayerControls(mapRef);
 */
export function useMapHooks(mapRef: MutableRefObject<MaplibreMap>) {
  const pendingOpacityRef = useRef(new Map()); // layerId -> numeric opacity (0..1)
  const pendingVisRef = useRef(new Map()); // layerId -> boolean visible
  const timerRef = useRef(null);

  // Wait until map.loaded() && map.getLayer(layerId) is true (or timeout)
  function waitForLayerReady(map, layerId, timeout = 3000) {
    return new Promise<void>((resolve, reject) => {
      const check = () => {
        try {
          if (map && map.loaded && map.loaded() && map.getLayer(layerId)) {
            resolve();
            return true;
          }
        } catch (e) {
          // Intermittent errors: ignore and keep retrying until timeout
        }
        return false;
      };

      if (check()) return;

      const events = ['load', 'styledata', 'sourcedata', 'idle'];
      const onEvent = () => {
        if (check()) cleanup();
      };

      const cleanup = () => {
        clearTimeout(timer);
        events.forEach((e) => map.off(e, onEvent));
      };

      events.forEach((e) => map.on(e, onEvent));

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for layer "${layerId}"`));
      }, timeout);
    });
  }

  // Safely set raster opacity (0..1). Returns true on success, false otherwise.
  async function safeSetRasterOpacity(map, layerId, opacity01 = 1) {
    if (!map) return false;
    try {
      await waitForLayerReady(map, layerId, 3000);

      // clamp to 0..1
      let v = Number(opacity01);
      if (Number.isNaN(v)) v = 1;
      v = Math.max(0, Math.min(1, v));

      // Only set paint property if layer still exists and is raster
      const layerDef = map.getStyle?.().layers?.find((l) => l.id === layerId);
      if (!layerDef) {
        console.warn('useMapHooks: layer not found after ready:', layerId);
        return false;
      }

      // If it is not raster, still try to set raster-opacity won't do anything,
      // but we allow caller to use the function for rasters. You can change to enforce type.
      map.setPaintProperty(layerId, 'raster-opacity', v);
      return true;
    } catch (err) {
      console.warn('useMapHooks failed for', layerId, err);
      return false;
    }
  }

  // Safely set layer visibility (visible => 'visible' else 'none')
  async function safeSetVisibility(map, layerId, visible) {
    if (!map) return false;
    try {
      await waitForLayerReady(map, layerId, 3000);

      const layerDef = map.getStyle?.().layers?.find((l) => l.id === layerId);
      if (!layerDef) {
        console.warn('useMapHooks: layer not found after ready:', layerId);
        return false;
      }

      const visValue = visible ? 'visible' : 'none';
      map.setLayoutProperty(layerId, 'visibility', visValue);
      return true;
    } catch (err) {
      console.warn('useMapHooks failed for', layerId, err);
      return false;
    }
  }

  // Flush pending operations (applies latest value for each pending layer)
  const flush = useCallback(async () => {
    const map = mapRef?.current;
    if (!map) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Snapshot and clear pending maps
    const opacityEntries = Array.from(pendingOpacityRef.current.entries());
    pendingOpacityRef.current.clear();

    const visEntries = Array.from(pendingVisRef.current.entries());
    pendingVisRef.current.clear();

    // Apply visibility first (so if layer was hidden then opacity change won't be visible until visible)
    await Promise.all(
      visEntries.map(async ([layerId, visible]) => {
        try {
          await safeSetVisibility(map, layerId, visible);
        } catch (e) {
          console.warn('Error applying visibility for', layerId, e);
        }
      })
    );

    // Then apply opacity
    await Promise.all(
      opacityEntries.map(async ([layerId, opacity]) => {
        try {
          // Accept 0..1 or 0..100 values. Normalize:
          let v = Number(opacity);
          if (Number.isNaN(v)) v = 1;
          if (v > 1) v = v / 100;
          await safeSetRasterOpacity(map, layerId, v);
        } catch (e) {
          console.warn('Error applying opacity for', layerId, e);
        }
      })
    );
  }, [mapRef]);

  // Public: request a debounced opacity change
  const setLayerOpacity = useCallback(
    (layerId, opacity) => {
      console.log('Map setLayerOpacity', layerId, opacity);

      pendingOpacityRef.current.set(layerId, opacity);

      // debounce flush
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), 100);
    },
    [flush]
  );

  // Public: request a debounced visibility change
  const setLayerVisibility = useCallback(
    (layerId, visible) => {
      console.log('Map setLayerVisibility', layerId, visible);

      pendingVisRef.current.set(layerId, !!visible);

      // debounce flush
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), 100);
    },
    [flush]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      pendingOpacityRef.current.clear();
      pendingVisRef.current.clear();
    };
  }, []);

  return { setLayerOpacity, setLayerVisibility };
}

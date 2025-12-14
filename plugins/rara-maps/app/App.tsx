import { useEffect, useRef, useState } from 'react';

import { Feature } from 'geojson';
import { Map } from 'maplibre-gl';

import HeaderHandle from './HeaderHandle';
import ContentPanel from './ContentPanel';
import MapView from './MapView';
import { LayerConfig, SettingsPanel } from './SettingsPanel';
import styles from './styles/App.module.css';
import { useViewportHeight, getCssVarPx } from './utils';

import { Data } from '../lib/map';
import { absUrl } from '../lib/url';

export default function App({ footer, viewName }: { footer: HTMLElement; viewName: string }) {
  const viewportHeight: number = useViewportHeight();
  const dashboardHeight: number = getCssVarPx('--dashboardHeight');

  // Static app configuration
  const [config, setConfig] = useState<Data>(null);

  const headerHeight: number = getCssVarPx('--headerHeight');
  const [headerHidden, setHeaderHidden] = useState<boolean>(false);

  const [routeCoords, setRouteCoords] = useState<Object>(null);
  const [activeLocation, setActiveLocation] = useState<string>(null);

  const mapRef = useRef<Map>(null);

  const contentPanelEnabled: boolean = document.querySelector('.rara-maps-content') !== null;
  const [contentPanelLoaded, setContentPanelLoaded] = useState<boolean>(false);

  const minContentPanelTop: number = 100;
  const maxContentPanelTop: number = viewportHeight - dashboardHeight;
  const [contentPanelTop, setContentPanelTop] = useState<number>(maxContentPanelTop);
  const [contentPanelDragTop, setContentPanelDragTop] = useState<number>(null);
  const [contentPanelTopChanging, setContentPanelTopChanging] = useState<boolean>(false);

  const [contentTabId, setContentTabId] = useState<string>(null);
  const [contentTabIndex, setContentTabIndex] = useState<number>(null);
  const [contentTitle, setContentTitle] = useState<string>(null);

  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);

  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const prevLayerVisibilityRef = useRef(layerVisibility);

  const [overlayOpacity, setOverlayOpacity] = useState<number>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch(absUrl('%{RARA_MAPS}/build/data.json'));
        if (!response.ok) {
          throw new Error('Network error');
        }
        const data = await response.json();

        if (!cancelled) {
          setConfig({
            ...data,
            view: data.views.find((view) => view.id === viewName),
          });
        }
      } catch (err) {
        console.log(`Network error: ${err}`);
      }
    }

    fetchData();

    // Cleanup to avoid setting state after unmount
    return () => {
      cancelled = true;
    };
  }, []); // Run once on mount

  useEffect(() => {
    if (!config) return;

    // Set initial layer visibility
    let visibility = {};
    config.view.layers.forEach((layer) => {
      if (layer.type !== 'point') {
        visibility[layer.id] = layer.visible;
      }
    });
    setLayerVisibility(visibility);

    // Set initial overlay opacity
    config.view.layers.forEach((layer) => {
      if (layer.type === 'overlay') {
        setOverlayOpacity(1.0);
      }
    });

    // Set initial tab index
    if (config.view.app.binding === 'overlay') {
      setContentTabIndex(0);
    }
    if (config.view.app.route) {
      const line = config.lines.find(
        (line) => (line?.properties?.id ?? null) === config.view.app.route
      );
      setRouteCoords(line?.geometry?.coordinates ?? null);
      setContentTabIndex(0);
    }
  }, [config]);

  // Set just one overlay visible
  function setActiveOverlayFromId(id) {
    setLayerVisibility(
      Object.fromEntries(
        Object.keys(layerVisibility).map((id) => {
          const layer = config.view.layers.find((layer) => layer.id === id);
          return [id, layer.type === 'overlay' ? id === contentTabId : layerVisibility[id]];
        })
      )
    );
  }

  function setActiveLocationFromId(id) {
    for (const locations of Object.values(config.locations)) {
      // @ts-expect-error
      const loc: Feature = locations.features.find((el) => (el?.properties?.id ?? null) === id);
      if (loc) {
        setActiveLocation(loc);
      }
    }
  }

  // React to change of layer visibility
  useEffect(() => {
    const prevValues = prevLayerVisibilityRef.current;

    Object.keys(layerVisibility).forEach((id) => {
      const visible = layerVisibility[id];
      if (visible !== prevValues[id]) {
        mapRef.current.setLayerVisibility(id, visible);
      }
    });

    prevLayerVisibilityRef.current = layerVisibility;
  }, [layerVisibility]);

  // React to change of overlay opacity
  useEffect(() => {
    Object.keys(layerVisibility).forEach((id) => {
      const layer = config.view.layers.find((layer) => layer.id === id);
      if (layer.type === 'overlay') {
        mapRef.current.setLayerOpacity(id, overlayOpacity);
      }
    });
  }, [overlayOpacity]);

  // React to change of content tab
  useEffect(() => {
    console.log(`App contentTabId=${contentTabId}`);

    if (!contentTabId) return;

    if (config.view.app.binding === 'location') {
      setActiveLocationFromId(contentTabId);
    }

    if (config.view.app.binding === 'overlay') {
      setActiveOverlayFromId(contentTabId);
    }
  }, [contentTabId]);

  // React to click on a location
  function onLocationClick(id) {
    if (config.view.app.binding === 'location') {
      setContentTabId(id);
    } else {
      setActiveLocationFromId(id);
    }
  }

  // React to change of active location
  useEffect(() => {
    console.log('App activeLocation=', activeLocation);

    if (config?.view.app.binding === 'location') {
      setContentTitle(activeLocation?.properties?.title ?? '');
    }
  }, [activeLocation]);

  // Compute layer configuration

  const layerConfig: Record<string, LayerConfig> = config
    ? config.view.layers.reduce<Record<string, LayerConfig>>((entry, layer) => {
        const label =
          layer.title ??
          (layer.type === 'buildings'
            ? 'Buildings'
            : layer.type === 'line'
              ? config.lines.find((line) => line.properties?.id === layer.id)?.properties?.title
              : layer.type === 'locations'
                ? config.locations[layer.id]?.properties?.title
                : layer.type === 'overlay'
                  ? config.overlays.features.find((feature) => feature.properties?.id === layer.id)
                      ?.properties?.title
                  : undefined) ??
          layer.id;

        entry[layer.id] = {
          color: layer.color,
          label,
        };

        return entry;
      }, {})
    : {};

  // Render
  return (
    <div className={styles.app}>
      <HeaderHandle headerHidden={headerHidden} setHeaderHidden={setHeaderHidden} />

      {config && (!contentPanelEnabled || contentPanelLoaded) && (
        <MapView
          ref={mapRef}
          paddingTop={headerHidden ? 0 : headerHeight}
          paddingBottom={viewportHeight - contentPanelDragTop}
          paddingChanging={contentPanelTopChanging}
          config={config}
          routeCoords={routeCoords}
          onLocationClick={onLocationClick}
          activeLocation={activeLocation}
          flyRadiusEnabled={(config.view.app.auto ?? null) === 'fly_radius'}
          flyTangentEnabled={(config.view.app.auto ?? null) === 'fly_tangent'}
        />
      )}

      <SettingsPanel
        visible={showSettingsPanel}
        setVisible={setShowSettingsPanel}
        layerConfig={layerConfig}
        layerVisibility={layerVisibility}
        setLayerVisibility={(id, visible) => {
          setLayerVisibility((prev) => ({
            ...prev,
            [id]: visible,
          }));
        }}
        overlayOpacity={overlayOpacity}
        setOverlayOpacity={setOverlayOpacity}
      />

      {contentPanelEnabled && (
        <ContentPanel
          panelTop={contentPanelTop}
          setPanelTop={setContentPanelTop}
          minPanelTop={minContentPanelTop}
          maxPanelTop={maxContentPanelTop}
          dragTop={contentPanelDragTop}
          setDragTop={setContentPanelDragTop}
          setPanelTopChanging={setContentPanelTopChanging}
          tabId={contentTabId}
          setTabId={setContentTabId}
          tabIndex={contentTabIndex}
          setTabIndex={setContentTabIndex}
          tabTitle={contentTitle}
          setTabTitle={setContentTitle}
          showSettingsPanel={showSettingsPanel}
          setShowSettingsPanel={setShowSettingsPanel}
          footer={footer}
          onLoad={() => {
            setContentPanelLoaded(true);
          }}
        />
      )}
    </div>
  );
}

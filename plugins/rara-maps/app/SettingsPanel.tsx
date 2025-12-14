import { useEffect, useRef } from 'react';

import panelStyles from './styles/Panel.module.css';
import styles from './styles/SettingsPanel.module.css';

import { absUrl } from '../lib/url';

export type LayerConfig = {
  color: string;
  label: string;
};

export function SettingsPanel({
  visible,
  setVisible,
  layerConfig,
  layerVisibility,
  setLayerVisibility,
  overlayOpacity,
  setOverlayOpacity,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  layerConfig: Record<string, LayerConfig>;
  layerVisibility: Record<string, boolean>;
  setLayerVisibility: (id: string, visible: boolean) => void;
  overlayOpacity: number | null;
  setOverlayOpacity: (number) => void;
}) {
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      settingsPanelRef.current?.focus();
    } else {
      settingsPanelRef.current?.blur();
    }
  }, [visible]);

  const handleKeyDown = (event) => {
    if (event.key == 'Escape') {
      close();
    }
  };

  function close() {
    setVisible(false);
  }

  return (
    <div
      ref={settingsPanelRef}
      className={`${panelStyles.panel} ${styles.panel} ${visible ? '' : styles.closed}`}
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <div className={`${styles.row} ${styles.closeButtonContainer}`}>
        <div className={`${panelStyles.button} ${styles.closeButton}`} onClick={close}>
          <img
            src={`${absUrl('%{RARA_MAPS}/assets/icons/cross.svg')}`}
            style={{ transform: 'scale(0.75)' }}
          ></img>
        </div>
      </div>

      <>
        {Object.entries(layerVisibility).map(([id, value]) => {
          const layer = layerConfig[id];

          const keyStyle = layer.color
            ? {
                backgroundColor: layer.color,
              }
            : {
                visibility: 'hidden',
              };

          return (
            <div key={id} className={`${styles.row}`}>
              <label
                className={`${styles.toggleSwitch}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span className={`${styles.colorBox}`} style={keyStyle}></span>
                <span style={{ flex: 1 }}>{layer.label ?? id}</span>
                <input
                  key={id}
                  value={value}
                  onChange={(e) => setLayerVisibility(id, e.target.checked)}
                  type="checkbox"
                  aria-label={`Toggle ${id}`}
                  checked={value}
                />
                <span className={`${styles.toggleSlider}`}></span>
              </label>
            </div>
          );
        })}
      </>

      {overlayOpacity !== null && (
        <div key={'opacity'} className={`${styles.row}`}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>{'Overlay opacity'}</span>
            <input
              type="range"
              aria-label={'Set overlay opacity'}
              min={0.0}
              max={1.0}
              step={0.01}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              className={`${styles.rangeSlider}`}
            />
          </label>
        </div>
      )}
    </div>
  );
}

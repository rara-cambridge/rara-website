import { useRef } from 'react';

import panelStyles from './styles/Panel.module.css';
import styles from './styles/ContentPanel.module.css';

import { absUrl } from '../lib/url';

export default function Dashboard({
  title,
  showPrevButton,
  onPrev,
  onToggle,
  showNextButton,
  onNext,
  showSettingsPanel,
  onSettingsToggle,
}: {
  title: string;
  showPrevButton: boolean;
  onPrev: () => void;
  onToggle: () => void;
  showNextButton: boolean;
  onNext: () => void;
  showSettingsPanel: boolean;
  onSettingsToggle: () => void;
}) {
  const dashboardElemRef = useRef<HTMLDivElement>(null);

  dashboardElemRef.current?.focus();

  function handleClick() {
    onToggle?.();
  }

  function handleClickPrev(event) {
    onPrev?.();
    event.stopPropagation();
  }

  function handleClickNext(event) {
    onNext?.();
    event.stopPropagation();
  }

  function handleClickSettings(event) {
    onSettingsToggle?.();
    event.stopPropagation();
  }

  const handleKeyDown = (event) => {
    if (event.key == 'ArrowLeft') {
      onPrev?.();
    }
    if (event.key == 'ArrowRight') {
      onNext?.();
    }
    if (event.key == 'ArrowUp' || event.key == 'ArrowDown') {
      onToggle?.();
    }
  };

  return (
    <div
      ref={dashboardElemRef}
      tabIndex="0"
      className={`${styles.dashboard}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={`${styles.buttonGroupContainer} ${styles.left}`}>
        <div className={`${styles.buttonContainer}`}>
          {showPrevButton && (
            <div className={`${panelStyles.button}`} onClick={handleClickPrev}>
              <img
                src={`${absUrl('%{RARA_MAPS}/assets/icons/caret.svg')}`}
                style={{ transform: 'rotate(-90deg)' }}
              ></img>
            </div>
          )}
        </div>
        <div className={`${styles.buttonContainer}`}></div>
      </div>
      <div className={`${styles.titleContainer}`}>
        <div id="content-handle" className={styles.handle}>
          <div className={styles.handleDot}></div>
        </div>
        <div className={`${styles.titleContainer}`}>{title}</div>
      </div>
      <div className={`${styles.buttonGroupContainer} ${styles.right}`}>
        <div className={`${styles.buttonContainer}`}>
          {showNextButton && (
            <div className={`${panelStyles.button}`} onClick={handleClickNext}>
              <img
                src={`${absUrl('%{RARA_MAPS}/assets/icons/caret.svg')}`}
                style={{ transform: 'rotate(90deg)' }}
              ></img>
            </div>
          )}
        </div>
        <div className={`${styles.buttonContainer}`}>
          <div
            className={`${panelStyles.button} ${showSettingsPanel ? panelStyles.active : ''}`}
            onClick={handleClickSettings}
          >
            <img
              src={`${
                showSettingsPanel
                  ? absUrl('%{RARA_MAPS}/assets/icons/slider-invert.svg')
                  : absUrl('%{RARA_MAPS}/assets/icons/slider.svg')
              }`}
              style={{ transform: 'scale(0.75)' }}
            ></img>
          </div>
        </div>
      </div>
    </div>
  );
}

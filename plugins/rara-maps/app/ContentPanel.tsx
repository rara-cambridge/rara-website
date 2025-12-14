import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';

import Dashboard from './Dashboard';
import { getCssVarPx } from './utils';

import panelStyles from './styles/Panel.module.css';
import contentPanelStyles from './styles/ContentPanel.module.css';

export default function ContentPanel({
  panelTop,
  setPanelTop,
  minPanelTop,
  maxPanelTop,
  dragTop,
  setDragTop,
  setPanelTopChanging,
  tabId,
  setTabId,
  tabTitle,
  setTabTitle,
  tabIndex,
  setTabIndex,
  footer,
  onLoad,
  showSettingsPanel,
  setShowSettingsPanel,
}: {
  panelTop: number;
  setPanelTop: (top: number) => void;
  minPanelTop: number;
  maxPanelTop: number;
  dragTop: number;
  setDragTop: (top: number) => void;
  setPanelTopChanging: (changing: boolean) => void;
  tabId: string;
  setTabId: (top: string) => void;
  tabTitle: string;
  setTabTitle: (title: string) => void;
  tabIndex: number;
  setTabIndex: (index: number) => void;
  footer: HTMLElement;
  onLoad: () => void;
  showSettingsPanel: boolean;
  setShowSettingsPanel: (visible: boolean) => void;
}) {
  const contentElem = document.querySelector('.rara-maps-content') as HTMLElement | null;

  const tabElems = contentElem?.querySelectorAll(
    '.rara-maps-content-tab'
  ) as NodeListOf<HTMLElement> | null;

  const tabElemRef = useRef<HTMLElement>(null);

  const footerHeight: number = getCssVarPx('--footerHeight');

  const panelElemRef = useRef<HTMLDivElement>(null);
  const panelBodyElemRef = useRef<HTMLDivElement>(null);
  const panelBodyContentElemRef = useRef<HTMLDivElement>(null);

  const [bodyHeight, setBodyHeight] = useState<number>(null);
  const [targetPanelTop, setTargetPanelTop] = useState<Number>(null);
  const animationRef = useRef<number | null>(null);

  const [dragging, setDragging] = useState<boolean>(false);

  const midPanelTop: number = 0.5 * (maxPanelTop - minPanelTop);

  // DOM reorganisation

  useEffect(() => {
    if (panelBodyContentElemRef.current && contentElem) {
      panelBodyContentElemRef.current.appendChild(contentElem);
    }

    if (panelElemRef.current && footer) {
      panelBodyElemRef.current.appendChild(footer);

      const prePaintStyle = document.getElementById('hide-footer-prepaint');
      if (prePaintStyle) {
        prePaintStyle.remove(); // or prePaintStyle.parentNode.removeChild(prePaintStyle)
      }
    }

    if (onLoad) {
      onLoad();
    }
  }, []);

  // Tab navigation

  useEffect(() => {
    console.log(`ContentPanel tabId=${tabId}`);

    if (tabElemRef.current) {
      tabElemRef.current.classList.add('hidden');
    }

    tabElemRef.current = document.querySelector('#' + tabId);

    if (tabElemRef.current) {
      tabElemRef.current.classList.remove('hidden');

      const title = tabElemRef.current.getAttribute('title');
      if (title) {
        setTabTitle(title);
      }
    }

    const index = Array.prototype.indexOf.call(tabElems, tabElemRef.current);
    setTabIndex(index >= 0 ? index : null);
  }, [tabId]);

  useEffect(() => {
    console.log(`ContentPanel tabIndex=${tabIndex}`);

    if (tabIndex !== null) {
      setTabId(tabElems[tabIndex].id);
    }
  }, [tabIndex]);

  function onPrev() {
    setTabIndex(tabIndex - 1);
  }

  function onNext() {
    setTabIndex(tabIndex + 1);
  }

  // Panel open / close / drag

  function getPanelTop(): number {
    return panelElemRef?.current.getBoundingClientRect().top ?? null;
  }

  function getPanelTopFraction(value: number): number {
    return (value - minPanelTop) / (maxPanelTop - minPanelTop);
  }

  function togglePanel() {
    const fraction = getPanelTopFraction(getPanelTop());
    setTargetPanelTop(fraction > 0.75 ? midPanelTop : maxPanelTop);
  }

  function closePanel() {
    setTargetPanelTop(maxPanelTop);
  }

  function onDragStart() {
    setDragging(true);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      setPanelTop(getPanelTop());
    }
  }

  function onDragMove() {
    setDragTop(getPanelTop());
  }

  function onDragStop() {
    setDragging(false);

    if (panelElemRef.current) {
      const dragFraction = getPanelTopFraction(dragTop);
      const snapTop =
        dragFraction < 0.25 ? minPanelTop : dragFraction > 0.75 ? maxPanelTop : midPanelTop;
      setPanelTop(dragTop);
      setTargetPanelTop(snapTop);
    }
  }

  function easeOutQuad(t: number) {
    return t * (2 - t);
  }

  function onAnimationStop() {
    setTargetPanelTop(null);
  }

  // Animate top of panel to target value
  useEffect(() => {
    if (targetPanelTop !== null) {
      const startTop = panelTop;
      const startTime = performance.now();
      const duration = 300; // ms

      function animate(time: number) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0 -> 1
        const easedTop = startTop + (targetPanelTop - startTop) * easeOutQuad(progress);
        setPanelTop(easedTop);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onAnimationStop();
        }
      }

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
          onAnimationStop();
        }
      };
    }
  }, [targetPanelTop]);

  useEffect(() => {
    if (dragTop !== null && panelBodyElemRef.current) {
      setBodyHeight(maxPanelTop - dragTop);
    }
  }, [dragTop]);

  useEffect(() => {
    if (panelTop !== null && panelBodyElemRef.current) {
      setBodyHeight(maxPanelTop - panelTop);
      setDragTop(panelTop);
    }

    const changing = dragging || (targetPanelTop !== null && panelTop != targetPanelTop);
    setPanelTopChanging(changing);

    if (!changing && !targetPanelTop && panelTop < maxPanelTop) {
      setShowSettingsPanel(false);
    }
  }, [panelTop]);

  // Settings panel open / close

  useEffect(() => {
    if (showSettingsPanel) {
      closePanel();
    }
  }, [showSettingsPanel]);

  function onSettingsToggle() {
    setShowSettingsPanel(!showSettingsPanel);
  }

  return (
    <Draggable
      axis="y"
      bounds={{
        top: -1 * maxPanelTop,
        bottom: 0,
      }}
      position={{
        x: 0,
        y: panelTop - maxPanelTop,
      }}
      handle="#content-handle"
      nodeRef={panelElemRef}
      onStart={onDragStart}
      onDrag={onDragMove}
      onStop={onDragStop}
    >
      <div ref={panelElemRef} className={`${panelStyles.panel} ${contentPanelStyles.panel}`}>
        <Dashboard
          title={tabTitle}
          showPrevButton={tabIndex > 0}
          onPrev={onPrev}
          onToggle={togglePanel}
          showNextButton={tabElemRef.current && tabIndex + 1 < tabElems.length}
          onNext={onNext}
          showSettingsPanel={showSettingsPanel}
          onSettingsToggle={onSettingsToggle}
        />

        <div
          ref={panelBodyElemRef}
          className={`${contentPanelStyles.panelBody}`}
          style={{ height: bodyHeight }}
        >
          <div ref={panelBodyContentElemRef} style={{ minHeight: bodyHeight - footerHeight }}></div>
        </div>
      </div>
    </Draggable>
  );
}

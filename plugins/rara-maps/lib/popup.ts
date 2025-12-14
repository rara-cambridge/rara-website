// Popup component

import { Feature } from 'geojson';
import { LngLat, Map, Popup } from 'maplibre-gl';

class PopupContainer {
  #id: string;
  #manager: PopupManager;
  #popup: Popup;
  #visibleDynamic: boolean;
  #visibleStatic: boolean;

  /**
   * Create a Popup
   * @param {PopupManager} manager The parent manager
   * @param {string}          id   The location ID
   */
  constructor(manager: PopupManager, id: string) {
    //console.log(`Popup.create id=${id}`);
    this.#id = id;
    this.#manager = manager;
    this.#popup = null;
    this.#visibleDynamic = false;
    this.#visibleStatic = false;
  }

  get visibleDynamic(): boolean {
    return this.#visibleDynamic;
  }

  set visibleDynamic(visible: boolean) {
    //console.log(`Popup.setVisibleDynamic id=${this.#id} visible=${visible}`);
    this.#visibleDynamic = visible;
    this.#onPopupVisibleChange();
  }

  get visibleStatic(): boolean {
    return this.#visibleStatic;
  }

  set visibleStatic(visible: boolean) {
    //console.log(`Popup.setVisibleStatic id=${this.#id} visible=${visible}`);
    this.#visibleStatic = visible;
    this.#onPopupVisibleChange();
  }

  setData(data: Feature) {
    if (data.geometry.type === 'Point') {
      //console.log(`Popup.setData id=${this.#id} data=${data}`);
      this.#popup = new Popup({
        closeButton: false,
        closeOnClick: false,
      });

      this.#popup
        .setLngLat(new LngLat(data.geometry.coordinates[0], data.geometry.coordinates[1]))
        .setHTML(data.properties.title)
        .addTo(this.#manager.map);

      this.#onPopupVisibleChange();
    }
  }

  #onPopupVisibleChange() {
    const visible = this.visibleDynamic || this.visibleStatic;
    /*
    console.log(
      `Popup.onPopupVisibleChange id=${this.#id} dynamic=${this.visibleDynamic} static=${this.visibleStatic} visible=${visible} popup=${this.#popup}`
    );
    */
    if (this.#popup) {
      this.#popup.getElement()!.style!.visibility = visible ? 'visible' : 'hidden';
    }
  }
}

const popupManagerMap = new WeakMap<Map, PopupManager>();

function setPopupManager(map: Map, popupManager: PopupManager) {
  popupManagerMap.set(map, popupManager);
}

export function getPopupManager(map: Map): PopupManager | undefined {
  return popupManagerMap.get(map);
}

/**
 * Manager of a set of popups
 */
export class PopupManager {
  #popups: Record<string, PopupContainer>;
  #map: Map;

  constructor(map: Map) {
    this.#popups = {};
    this.#map = map;
    setPopupManager(map, this);
  }

  get map(): Map {
    return this.#map;
  }

  getPopup(id: string): PopupContainer {
    if (!(id in this.#popups)) {
      this.#addPopup(id);
    }
    return this.#popups[id];
  }

  #addPopup(id: string): PopupContainer {
    //console.log('PopupManager.addPopup', id);
    const popup = new PopupContainer(this, id);
    this.#popups[id] = popup;
    return popup;
  }
}

import { useEffect } from 'react';

import styles from './styles/HeaderHandle.module.css';

import { absUrl } from '../lib/url';

export default function HeaderHandle({
  headerHidden,
  setHeaderHidden,
}: {
  headerHidden: boolean;
  setHeaderHidden: (hidden: boolean) => void;
}) {
  const headerElem = document.querySelector('.site-header') as HTMLElement;

  useEffect(() => {
    // Observe changes to the "hidden" class of the headerElem
    if (!headerElem) return;

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setHeaderHidden(headerElem.classList.contains('hidden'));
        }
      }
    });

    observer.observe(headerElem, { attributes: true });

    return () => observer.disconnect();
  }, []);

  function handleClick() {
    if (headerElem) headerElem.classList.toggle('hidden');
  }

  return (
    <div
      className={`${styles.handle} ${headerHidden ? styles.headerClosed : ''}`}
      onClick={handleClick}
    >
      <img src={`${absUrl('%{RARA_MAPS}/assets/icons/caret-invert.svg')}`}></img>
    </div>
  );
}

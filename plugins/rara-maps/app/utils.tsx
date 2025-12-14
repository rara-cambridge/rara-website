import { useState, useEffect } from 'react';

export function useViewportHeight(): number {
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    function handleResize() {
      setVh(window.innerHeight);
    }

    window.addEventListener('resize', handleResize);

    // cleanup when component unmounts
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return vh;
}

export function getCssVarRaw(name): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getCssVarPx(name): number {
  return parseInt(getCssVarRaw(name), 10);
}

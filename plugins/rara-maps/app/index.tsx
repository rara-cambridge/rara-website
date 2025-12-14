import { createRoot } from 'react-dom/client';

import './styles/global.css';

import App from './App';

function mount() {
  const container = document.getElementById('rara-maps-app-root') as HTMLElement;
  if (!container) {
    return;
  }

  const viewName = container.getAttribute('view-name');

  // HACK: get the WordPress header out of the way
  const header = document.querySelector('#masthead') as HTMLElement;
  if (header) {
    header.style.top = '-80px';
  }

  // The footer element is passed into the App so that it can be relocated
  // within the DOM, using a React effect callback.
  const footer = document.querySelector('.site-footer') as HTMLElement;

  const root = createRoot(container);
  root.render(<App footer={footer} viewName={viewName} />);
}

// Automatically mount when the page loads
document.addEventListener('DOMContentLoaded', mount);

// Export so that other scripts can call it manually if needed
export { mount };

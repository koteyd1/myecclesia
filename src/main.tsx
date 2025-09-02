import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { initPerformanceObserver } from './utils/performance'

// Initialize performance monitoring
initPerformanceObserver();

const root = document.getElementById("root")!;
const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Check if the root element has pre-rendered content
const hasSSRContent = root.innerHTML.trim() !== '' && 
                      !root.innerHTML.includes('<!--app-html-->') &&
                      root.querySelector('[data-reactroot], [data-reactroot] *, .react-root, main, section') !== null;

// Use hydration in production when there's pre-rendered content
if (import.meta.env.PROD && hasSSRContent) {
  try {
    console.log('Hydrating pre-rendered content');
    hydrateRoot(root, app);
  } catch (error) {
    console.warn('Hydration failed, falling back to createRoot:', error);
    // Clear the root and use createRoot as fallback
    root.innerHTML = '';
    createRoot(root).render(app);
  }
} else {
  console.log('Using createRoot for client-side rendering');
  createRoot(root).render(app);
}

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
const hasSSRContent = root.innerHTML.includes('<!--app-html-->') === false && 
                      root.innerHTML.trim() !== '' && 
                      root.innerHTML.length > 50;

// Always use createRoot to avoid hydration mismatches during development
// Only use hydration in production when we're sure there's SSR content
if (import.meta.env.PROD && hasSSRContent) {
  try {
    hydrateRoot(root, app);
  } catch (error) {
    console.warn('Hydration failed, falling back to createRoot:', error);
    createRoot(root).render(app);
  }
} else {
  createRoot(root).render(app);
}

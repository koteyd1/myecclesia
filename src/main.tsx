import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPerformanceObserver } from './utils/performance'

// Initialize performance monitoring
initPerformanceObserver();

createRoot(document.getElementById("root")!).render(<App />);

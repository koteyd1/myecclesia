// Performance monitoring and optimization utilities

export const performanceUtils = {
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    }) as T;
  },

  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let lastCall = 0;
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(null, args);
      }
    }) as T;
  },

  // Measure and log performance
  measurePerformance: (name: string, fn: () => void | Promise<void>) => {
    const start = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then(() => {
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
      });
    } else {
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
    }
  },

  // Preload critical resources
  preloadResource: (href: string, as: 'script' | 'style' | 'image' | 'font' = 'image') => {
    if (typeof document === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  },

  // Optimize images for different screen sizes
  getResponsiveImageSrc: (baseSrc: string, screenWidth: number): string => {
    if (baseSrc.includes('evbuc.com') || baseSrc.includes('eventbrite')) {
      const url = new URL(baseSrc);
      
      // Determine optimal width based on screen size
      let width = 400;
      if (screenWidth > 1200) width = 600;
      else if (screenWidth > 768) width = 500;
      else if (screenWidth > 480) width = 400;
      else width = 300;
      
      url.searchParams.set('w', width.toString());
      url.searchParams.set('auto', 'format,compress');
      url.searchParams.set('q', '80');
      
      return url.toString();
    }
    
    return baseSrc;
  },

  // Detect connection speed and adjust quality accordingly
  adaptToConnection: () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return { imageQuality: 60, preload: false };
        case '3g':
          return { imageQuality: 70, preload: true };
        case '4g':
        default:
          return { imageQuality: 80, preload: true };
      }
    }
    
    return { imageQuality: 80, preload: true };
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Virtual scrolling helper for large lists
  calculateVisibleItems: (
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    overscan = 5
  ) => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
    
    return {
      start: Math.max(0, visibleStart - overscan),
      end: visibleEnd + overscan,
      visibleStart,
      visibleEnd
    };
  },

  // Bundle splitting helper
  loadComponentLazy: <T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T }>) => {
    return React.lazy(importFn);
  }
};

// Performance observer for Core Web Vitals
export const initPerformanceObserver = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  });
  
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      console.log('FID:', entry.processingStart - entry.startTime);
    });
  });
  
  fidObserver.observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  const clsObserver = new PerformanceObserver((list) => {
    let clsValue = 0;
    list.getEntries().forEach((entry) => {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    });
    console.log('CLS:', clsValue);
  });
  
  clsObserver.observe({ entryTypes: ['layout-shift'] });
};

// React import for lazy loading
import React from 'react';
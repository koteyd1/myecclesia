import { useEffect } from 'react';

// Component for core SEO optimizations
export const SEOOptimizations = () => {
  useEffect(() => {
    // Add performance and accessibility meta tags
    const addMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      const existingTag = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (existingTag) {
        existingTag.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Core web performance tags
    addMetaTag('theme-color', '#2563eb');
    addMetaTag('msapplication-TileColor', '#2563eb');
    
    // Security and performance headers
    addMetaTag('referrer', 'origin-when-cross-origin');
    addMetaTag('format-detection', 'telephone=no');
    
    // Social media optimization
    addMetaTag('twitter:card', 'summary_large_image');
    addMetaTag('twitter:site', '@MyEcclesia');
    addMetaTag('twitter:creator', '@MyEcclesia');
    
    // Open Graph locale
    addMetaTag('og:locale', 'en_GB', true);
    addMetaTag('og:site_name', 'MyEcclesia', true);
    
    // App-specific meta tags
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    addMetaTag('apple-mobile-web-app-title', 'MyEcclesia');
    
    // Google-specific optimizations
    addMetaTag('google', 'notranslate');
    addMetaTag('googlebot', 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');
    
    // Add viewport meta tag if not exists
    let viewportTag = document.querySelector('meta[name="viewport"]');
    if (!viewportTag) {
      viewportTag = document.createElement('meta');
      viewportTag.setAttribute('name', 'viewport');
      viewportTag.setAttribute('content', 'width=device-width,initial-scale=1,viewport-fit=cover');
      document.head.appendChild(viewportTag);
    }
    
    // Add DNS prefetch for performance
    const addDNSPrefetch = (href: string) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    };
    
    // Prefetch common external domains
    addDNSPrefetch('//fonts.googleapis.com');
    addDNSPrefetch('//fonts.gstatic.com');
    
  }, []);

  return null;
};
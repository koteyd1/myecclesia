import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface CanonicalOptions {
  customUrl?: string;
  forceTrailingSlash?: boolean;
}

export const useCanonical = (options: CanonicalOptions = {}) => {
  const location = useLocation();
  
  useEffect(() => {
    const { customUrl, forceTrailingSlash = false } = options;
    
    // Base URL for your domain
    const baseUrl = 'https://myecclesia.com';
    
    // Get current path and clean it
    let canonicalPath = location.pathname;
    
    // Remove trailing slash unless it's the root or forced
    if (canonicalPath !== '/' && canonicalPath.endsWith('/') && !forceTrailingSlash) {
      canonicalPath = canonicalPath.slice(0, -1);
    }
    
    // Add trailing slash if forced and not present
    if (forceTrailingSlash && !canonicalPath.endsWith('/') && canonicalPath !== '/') {
      canonicalPath += '/';
    }
    
    // Use custom URL if provided, otherwise construct from current path
    const canonicalUrl = customUrl || `${baseUrl}${canonicalPath}`;
    
    // Find existing canonical link or create new one
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    
    // Update canonical URL
    canonicalLink.href = canonicalUrl;
    
    // Also update Open Graph URL for consistency
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (ogUrl) {
      ogUrl.content = canonicalUrl;
    }
    
    // Update Twitter URL
    let twitterUrl = document.querySelector('meta[name="twitter:url"]') as HTMLMetaElement;
    if (twitterUrl) {
      twitterUrl.content = canonicalUrl;
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Keep the canonical link but clean up any event listeners if added later
    };
  }, [location.pathname, location.search, options.customUrl, options.forceTrailingSlash]);
};

// Utility function to get canonical URL for a given path
export const getCanonicalUrl = (path: string, forceTrailingSlash = false): string => {
  const baseUrl = 'https://myecclesia.com';
  
  // Clean the path
  let cleanPath = path;
  
  // Remove trailing slash unless it's root or forced
  if (cleanPath !== '/' && cleanPath.endsWith('/') && !forceTrailingSlash) {
    cleanPath = cleanPath.slice(0, -1);
  }
  
  // Add trailing slash if forced and not present
  if (forceTrailingSlash && !cleanPath.endsWith('/') && cleanPath !== '/') {
    cleanPath += '/';
  }
  
  return `${baseUrl}${cleanPath}`;
};

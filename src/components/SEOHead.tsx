import { useEffect } from 'react';
import { useCanonical } from '@/hooks/useCanonical';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
}

export const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  keywords,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  noIndex = false
}: SEOHeadProps) => {
  
  // Set up canonical URL
  useCanonical({ customUrl: canonicalUrl });
  
  useEffect(() => {
    // Update page title
    if (title) {
      document.title = title;
    }
    
    // Update meta description
    const updateMetaTag = (selector: string, content: string | undefined, attribute = 'content') => {
      const metaTag = document.querySelector(selector) as HTMLMetaElement;
      if (metaTag && content) {
        metaTag.setAttribute(attribute, content);
      } else if (content) {
        const newMeta = document.createElement('meta');
        if (selector.includes('property=')) {
          newMeta.setAttribute('property', selector.match(/property="([^"]*)"/)![1]);
        } else if (selector.includes('name=')) {
          newMeta.setAttribute('name', selector.match(/name="([^"]*)"/)![1]);
        }
        newMeta.setAttribute(attribute, content);
        document.head.appendChild(newMeta);
      }
    };
    
    // Update basic meta tags
    if (description) {
      updateMetaTag('meta[name="description"]', description);
      updateMetaTag('meta[property="og:description"]', description);
      updateMetaTag('meta[name="twitter:description"]', description);
    }
    
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', keywords);
    }
    
    if (author) {
      updateMetaTag('meta[name="author"]', author);
    }
    
    // Update Open Graph tags
    if (title) {
      updateMetaTag('meta[property="og:title"]', title);
      updateMetaTag('meta[name="twitter:title"]', title);
    }
    
    if (ogImage) {
      updateMetaTag('meta[property="og:image"]', ogImage);
      updateMetaTag('meta[name="twitter:image"]', ogImage);
    }
    
    updateMetaTag('meta[property="og:type"]', type);
    
    // Update article-specific meta tags
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('meta[property="article:published_time"]', publishedTime);
      }
      if (modifiedTime) {
        updateMetaTag('meta[property="article:modified_time"]', modifiedTime);
      }
      if (author) {
        updateMetaTag('meta[property="article:author"]', author);
      }
    }
    
    // Update robots tag
    const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';
    updateMetaTag('meta[name="robots"]', robotsContent);
    updateMetaTag('meta[name="googlebot"]', robotsContent);
    
  }, [title, description, ogImage, keywords, type, publishedTime, modifiedTime, author, noIndex]);
  
  return null; // This component doesn't render anything
};
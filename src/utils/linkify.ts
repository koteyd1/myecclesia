import React from 'react';

/**
 * Converts URLs in text to clickable links
 * @param text - The text content that may contain URLs
 * @returns JSX elements with clickable links
 */
export const linkifyText = (text: string): (string | React.JSX.Element)[] => {
  // Regex to match URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      // Ensure the URL has a protocol
      const url = part.startsWith('http') ? part : `https://${part}`;
      
      return React.createElement('a', {
        key: index,
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'text-primary hover:text-primary/80 underline font-medium transition-colors'
      }, part);
    }
    return part;
  });
};
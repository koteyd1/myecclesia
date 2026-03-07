// Image optimization utilities for SEO and performance

export const generateImageAlt = (title: string, context?: string): string => {
  // Generate descriptive alt text for images
  const baseAlt = title.replace(/[^\w\s-]/g, '').trim();
  
  if (context) {
    return `${baseAlt} - ${context}`;
  }
  
  return baseAlt;
};

export const optimizeImageUrl = (url: string, width?: number, height?: number): string => {
  // For external images, try to add optimization parameters
  if (url.includes('unsplash.com')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('fit', 'crop');
    params.append('auto', 'format');
    
    return `${url}?${params.toString()}`;
  }
  
  return url;
};

export const generateImageSrcSet = (baseUrl: string): string => {
  // Generate responsive image srcset
  const sizes = [320, 640, 768, 1024, 1280];
  
  return sizes
    .map(size => `${optimizeImageUrl(baseUrl, size)} ${size}w`)
    .join(', ');
};

export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};
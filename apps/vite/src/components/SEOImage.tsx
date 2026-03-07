import { useState, useEffect } from 'react';
import { generateImageAlt, optimizeImageUrl, generateImageSrcSet } from '@/utils/imageOptimization';

interface SEOImageProps {
  src: string;
  alt?: string;
  title?: string;
  context?: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export const SEOImage = ({
  src,
  alt,
  title,
  context,
  width,
  height,
  className,
  loading = 'lazy',
  priority = false,
  ...props
}: SEOImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate optimized alt text
  const optimizedAlt = alt || generateImageAlt(title || 'Image', context);
  
  // Generate optimized URLs
  const optimizedSrc = optimizeImageUrl(src, width, height);
  const srcSet = generateImageSrcSet(src);

  useEffect(() => {
    // Preload critical images
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [optimizedSrc, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ width, height }}
      >
        Image not available
      </div>
    );
  }

  return (
    <>
      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={optimizedAlt}
        title={title}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {!isLoaded && !hasError && (
        <div 
          className={`absolute inset-0 bg-muted animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
    </>
  );
};
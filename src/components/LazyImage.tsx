import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  style?: React.CSSProperties;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/placeholder.svg',
  style = {},
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // For immediate loading if loading is eager or if we're on the homepage
    // Also load immediately if the image is in the visible area initially
    if (loading === 'eager' || window.location.pathname === '/' || window.location.pathname === '') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Reduced margin for faster loading
        threshold: 0.1, // Load when 10% of image is visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [shouldLoad, loading]);

  useEffect(() => {
    if (shouldLoad && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [shouldLoad, src, imageSrc]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setImageSrc(fallbackSrc);
    onError?.();
  };

  // Optimize external Eventbrite images
  const optimizeImageUrl = (url: string) => {
    if (!url) return url;
    
    if (url.includes('evbuc.com') || url.includes('eventbrite')) {
      // For Eventbrite images, use their optimization parameters
      try {
        const optimizedUrl = new URL(url);
        optimizedUrl.searchParams.set('w', width?.toString() || '400');
        optimizedUrl.searchParams.set('auto', 'format,compress');
        optimizedUrl.searchParams.set('q', '75');
        optimizedUrl.searchParams.set('sharp', '10');
        return optimizedUrl.toString();
      } catch (e) {
        // If URL parsing fails, return original
        return url;
      }
    }
    return url;
  };

  const optimizedSrc = imageSrc ? optimizeImageUrl(imageSrc) : '';

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-muted ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        ...style,
      }}
    >
      {/* Placeholder while loading */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Actual image */}
      {optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            imageRendering: 'auto',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
          }}
        />
      )}

      {/* Error state */}
      {imageError && !imageLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-muted-foreground text-sm text-center p-4">
            Image unavailable
          </div>
        </div>
      )}
    </div>
  );
};
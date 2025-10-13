import React, { useState, useRef, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

const LazyImage = ({ 
  src, 
  alt, 
  sx = {}, 
  onError, 
  placeholder = null,
  priority = false, // above-the-fold hints
  reduceMotion = false, // disable shimmer on mobile
  sizes, // responsive sizes hint (optional)
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        // Start loading a bit earlier on small screens to mask latency
        rootMargin: typeof window !== 'undefined' && window.innerWidth < 900 ? '200px' : '100px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const onChange = (e) => setPrefersReduced(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    } catch (_) {
      // no-op on SSR or unsupported
    }
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError();
    }
  };

  return (
    <Box
      ref={imgRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        contain: 'layout paint size',
        ...sx
      }}
      {...props}
    >
      {!isInView && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation={reduceMotion || prefersReduced ? false : 'wave'}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)'
          }}
        />
      )}
      
      {isInView && !hasError && (
        <>
          {isLoading && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation={reduceMotion || prefersReduced ? false : 'wave'}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }}
            />
          )}
          <Box
            component="img"
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'low'}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
              ...sx
            }}
          />
        </>
      )}
      
      {isInView && hasError && placeholder}
    </Box>
  );
};

export default LazyImage;

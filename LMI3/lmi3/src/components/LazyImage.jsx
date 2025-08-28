import React, { useState, useRef, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

const LazyImage = ({ 
  src, 
  alt, 
  sx = {}, 
  onError, 
  placeholder = null,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
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
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
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
        ...sx
      }}
      {...props}
    >
      {!isInView && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
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
              animation="wave"
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

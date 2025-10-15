import React, { useState, memo } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LazyImage from './LazyImage';
import config from '../config';

const PlaceholderImage = ({ sx }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      border: '2px dashed rgba(255, 152, 0, 0.3)',
      width: '100%',
      height: '100%',
      minHeight: '300px',
      flexShrink: 0,
      ...sx,
    }}
  >
    <RestaurantIcon sx={{ fontSize: { xs: 48, md: 64 }, color: 'rgba(255, 152, 0, 0.5)', opacity: 0.7 }} />
  </Box>
)

const SauceCardComponent = ({ sauce, isMobile }) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc = sauce.image ? `${config.API_URL}${sauce.image}` : null;

  return (
    <Card sx={{
      width: { xs: 180, md: 220 },
      height: { xs: 230, md: 280 },
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Box sx={{ position: 'relative' }}>
        {imgSrc && !imgError ? (
          <LazyImage
            src={imgSrc}
            alt={sauce.name}
            reduceMotion={isMobile}
            sizes={isMobile ? '(max-width: 900px) 50vw' : '(min-width: 900px) 20vw'}
            sx={{ width: '100%', height: { xs: 120, md: 160 }, objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <PlaceholderImage sx={{ height: { xs: 120, md: 160 } }} />
        )}
      </Box>
      <CardContent sx={{ flex: 1, p: { xs: 1.5, md: 1.5 }, height: { xs: 110, md: 120 }, overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{
          fontWeight: 600,
          fontSize: { xs: '0.9rem', md: '1.1rem' },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {sauce.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{
          mb: 1,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: { xs: 2, md: 3 },
          WebkitBoxOrient: 'vertical',
          fontSize: { xs: '0.75rem', md: '0.875rem' },
        }}>
          {sauce.description}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, fontSize: { xs: '0.8rem', md: '1rem' } }}>
          {(sauce.price ?? 0).toFixed(2)}€
        </Typography>
      </CardContent>
    </Card>
  );
};

const SauceCard = memo(SauceCardComponent);
export default SauceCard;

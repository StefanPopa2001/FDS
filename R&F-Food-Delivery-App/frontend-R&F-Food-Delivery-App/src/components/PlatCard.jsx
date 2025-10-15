import React, { useState, memo } from 'react';
import { Box, Card, CardContent, Chip, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
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

const PlatCardComponent = ({ plat, isMobile }) => {
  const [imgError, setImgError] = useState(false);

  const imgSrc = (plat.image || plat.versions?.find(v => v.image)?.image) ? `${config.API_URL}${plat.image || plat.versions?.find(v => v.image)?.image}` : null;

  const minPrice = (() => {
    let min = plat.price ?? 0;
    if (Array.isArray(plat.versions) && plat.versions.length > 0) {
      for (const v of plat.versions) {
        const candidate = (plat.price ?? 0) + (v.extraPrice ?? 0);
        if (candidate < min) min = candidate;
      }
    }
    return min;
  })();

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
            alt={plat.name}
            reduceMotion={isMobile}
            sizes={isMobile ? '(max-width: 900px) 50vw' : '(min-width: 900px) 20vw'}
            sx={{ width: '100%', height: { xs: 120, md: 160 }, objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <PlaceholderImage sx={{ height: { xs: 120, md: 160 } }} />
        )}
        {plat.speciality && (
          <Chip
            label="Spécialité"
            icon={<StarIcon />}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
              color: 'white',
            }}
          />
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
          {plat.name}
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
          {plat.description}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, fontSize: { xs: '0.8rem', md: '1rem' } }}>
          {Array.isArray(plat.versions) && plat.versions.length > 0 ? `Dès ${minPrice.toFixed(2)}€` : `${(plat.price ?? 0).toFixed(2)}€`}
        </Typography>

        {plat.ingredients && plat.ingredients.length > 0 && (
          <Accordion sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Ingrédients</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {plat.ingredients.map((pi) => (
                  <Chip key={pi.ingredient.id} label={pi.ingredient.name} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {Array.isArray(plat.versions) && plat.versions.length > 1 && (
          <Accordion sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Tailles disponibles</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {plat.versions.map((version) => (
                  <Box key={version.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{version.size}</Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main' }}>+{(version.extraPrice ?? 0).toFixed(2)}€</Typography>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

const PlatCard = memo(PlatCardComponent);
export default PlatCard;

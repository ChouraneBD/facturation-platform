import { Box, Typography } from '@mui/material';
import { APP_LOGO_SRC, APP_NAME } from '../config/branding';

export function AppLogo({ size = 36, showText = true, textVariant = 'h6', subtitle, light = false }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, textDecoration: 'none', color: light ? '#fff' : 'inherit' }}>
      <Box
        component="img"
        src={APP_LOGO_SRC}
        alt={`${APP_NAME} logo`}
        sx={{ width: size, height: size, objectFit: 'contain', display: 'block', borderRadius: 1 }}
      />
      {showText ? (
        <Box>
          <Typography
            variant={textVariant}
            component="span"
            fontWeight={800}
            sx={{ lineHeight: 1.1, letterSpacing: '-0.02em', color: light ? '#fff' : 'text.primary' }}
          >
            {APP_NAME}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" component="div" sx={{ lineHeight: 1.2, color: light ? 'rgba(255,255,255,0.85)' : 'text.secondary' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

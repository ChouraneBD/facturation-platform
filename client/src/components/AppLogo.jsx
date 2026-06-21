import { Box, Typography } from '@mui/material';
import { APP_LOGO_SRC, APP_NAME } from '../config/branding';

export function AppLogo({ size = 36, showText = true, textVariant = 'h6', subtitle, light = false }) {
  const textColor = light ? '#fff' : 'text.primary';
  const subtitleColor = light ? 'rgba(255,255,255,0.85)' : 'text.secondary';

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.75, textDecoration: 'none', color: light ? '#fff' : 'inherit' }}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: light ? 1.5 : 1.25 }}>
        <Box
          component="img"
          src={APP_LOGO_SRC}
          alt={`${APP_NAME} logo`}
          sx={{
            width: size,
            height: size,
            objectFit: 'contain',
            display: 'block',
            borderRadius: light ? 1.5 : 1,
            flexShrink: 0,
            ...(light && {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.14)'
            })
          }}
        />
        {showText ? (
          <Typography
            variant={textVariant}
            component="span"
            fontWeight={800}
            sx={{
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: textColor,
              fontSize: light && textVariant === 'h5' ? '1.45rem' : undefined
            }}
          >
            {APP_NAME}
          </Typography>
        ) : null}
      </Box>
      {showText && subtitle ? (
        <Typography
          variant="caption"
          component="div"
          sx={{
            lineHeight: 1.2,
            color: subtitleColor,
            pl: `${size + 10}px`
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

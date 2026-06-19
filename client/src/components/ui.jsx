import React from 'react';
import {
  Box,
  Card as MuiCard,
  CardContent,
  Chip,
  FormControl,
  FormHelperText,
  FormLabel,
  Paper,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';

export function titleCase(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const STATUS_COLORS = {
  validee: 'success',
  payee: 'info',
  rejetee: 'error',
  en_attente: 'warning'
};

export function statusClass(status) {
  switch (status) {
    case 'validee':
      return 'chip chip-success';
    case 'payee':
      return 'chip chip-accent';
    case 'rejetee':
      return 'chip chip-danger';
    case 'en_attente':
      return 'chip chip-warn';
    default:
      return 'chip';
  }
}

export function Field({ label, hint, children, wide = false, error }) {
  return (
    <FormControl fullWidth={wide} sx={{ minWidth: wide ? '100%' : 180, gridColumn: wide ? '1 / -1' : undefined }}>
      <FormLabel sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>{label}</FormLabel>
      {children}
      {error ? <FormHelperText error>{error}</FormHelperText> : hint ? <FormHelperText>{hint}</FormHelperText> : null}
    </FormControl>
  );
}

export function CardStat({ title, value, note, icon: Icon, tone = 'default' }) {
  const tones = {
    indigo: '#4f46e5',
    green: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    cyan: '#06b6d4',
    purple: '#8b5cf6',
    default: '#64748b'
  };

  return (
    <MuiCard sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          {Icon ? (
            <Box sx={{ color: tones[tone] || tones.default, display: 'flex' }}>
              <Icon size={18} />
            </Box>
          ) : null}
        </Stack>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
          {value}
        </Typography>
        {note ? (
          <Typography variant="caption" color="text.secondary">
            {note}
          </Typography>
        ) : null}
      </CardContent>
    </MuiCard>
  );
}

export function Card(props) {
  return <CardStat {...props} />;
}

export function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <Paper className={className} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h2" component="h2">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? <Box>{actions}</Box> : null}
      </Stack>
      {children}
    </Paper>
  );
}

export function StatusPill({ value }) {
  return (
    <Chip
      size="small"
      label={titleCase(value)}
      color={STATUS_COLORS[value] || 'default'}
      variant={value ? 'filled' : 'outlined'}
    />
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {action}
    </Box>
  );
}

export function LoadingPanel({ rows = 4 }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={index === 0 ? 32 : 56} />
      ))}
    </Stack>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
      <Box>
        <Typography variant="h2" component="h2">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box>{actions}</Box> : null}
    </Stack>
  );
}

export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

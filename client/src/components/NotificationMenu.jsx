import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Stack,
  Typography
} from '@mui/material';
import {
  Bell,
  BellOff,
  CheckCheck,
  CircleCheck,
  CirclePlus,
  CircleX,
  Receipt,
  Wallet
} from 'lucide-react';

const ALERT_META = {
  facture_created: { label: 'Création', color: 'info', Icon: CirclePlus },
  facture_validated: { label: 'Validée', color: 'success', Icon: CircleCheck },
  facture_rejected: { label: 'Rejetée', color: 'error', Icon: CircleX },
  facture_paid: { label: 'Payée', color: 'primary', Icon: Wallet }
};

function formatAlertTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)} h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function NotificationMenu({ alerts, onMarkRead, onMarkAllRead, onViewFactures }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const unreadCount = alerts.filter((a) => !a.lu).length;

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAll = async () => {
    await onMarkAllRead?.();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        title="Alertes workflow"
        aria-label="Alertes workflow"
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          bgcolor: open ? 'action.selected' : 'transparent',
          transition: 'background-color 0.2s'
        }}
      >
        <Badge badgeContent={unreadCount || null} color="error" max={99}>
          <Bell size={22} />
        </Badge>
      </IconButton>

      <Popover
        id="notification-menu"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxWidth: 'calc(100vw - 24px)',
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.14)',
              overflow: 'hidden'
            }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Notifications
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour'}
              </Typography>
            </Box>
            {unreadCount > 0 ? (
              <Button
                size="small"
                startIcon={<CheckCheck size={16} />}
                onClick={handleMarkAll}
                sx={{
                  color: 'inherit',
                  borderColor: 'rgba(255,255,255,0.4)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.08)' }
                }}
                variant="outlined"
              >
                Tout lire
              </Button>
            ) : null}
          </Stack>
        </Box>

        {alerts.length === 0 ? (
          <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
            <BellOff size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
            <Typography variant="body2" color="text.secondary">
              Aucune alerte pour le moment.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
            {alerts.slice(0, 12).map((alert, index) => {
              const meta = ALERT_META[alert.type] || { label: 'Alerte', color: 'default', Icon: Bell };
              const AlertIcon = meta.Icon;

              return (
                <Box key={alert.id}>
                  {index > 0 ? <Divider component="li" /> : null}
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      py: 1.5,
                      px: 2,
                      bgcolor: alert.lu ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: alert.lu ? 'action.hover' : 'action.selected' }
                    }}
                    secondaryAction={
                      !alert.lu ? (
                        <Button size="small" onClick={() => onMarkRead(alert)} sx={{ minWidth: 0, fontSize: '0.72rem' }}>
                          Lu
                        </Button>
                      ) : null
                    }
                  >
                    <Box sx={{ mr: 1.5, mt: 0.3, color: `${meta.color}.main`, display: 'flex' }}>
                      <AlertIcon size={18} />
                    </Box>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, pr: 4 }}>
                          <Chip size="small" label={meta.label} color={meta.color} variant={alert.lu ? 'outlined' : 'filled'} />
                          {alert.facture_numero ? (
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              {alert.facture_numero}
                            </Typography>
                          ) : null}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatAlertTime(alert.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1.5, bgcolor: 'background.default' }}>
          <Button
            fullWidth
            variant="text"
            startIcon={<Receipt size={18} />}
            onClick={() => {
              handleClose();
              onViewFactures?.();
            }}
          >
            Voir les factures
          </Button>
        </Box>
      </Popover>
    </>
  );
}

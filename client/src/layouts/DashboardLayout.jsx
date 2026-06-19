import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PublicIcon from '@mui/icons-material/Public';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchAlerts, markAlertAsRead } from '../services/firebaseService';

const tabs = [
  { id: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: '/dashboard/clients', label: 'Clients', icon: PeopleIcon },
  { id: '/dashboard/categories', label: 'Catégories', icon: CategoryIcon, adminOnly: true },
  { id: '/dashboard/articles', label: 'Articles', icon: Inventory2Icon, adminOnly: true },
  { id: '/dashboard/factures', label: 'Factures', icon: ReceiptLongIcon },
  { id: '/dashboard/parametres', label: 'Paramètres', icon: SettingsIcon, adminOnly: true }
];

export function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { session, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const isAdmin = session?.user?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);
  const currentPath = window.location.pathname;
  const activeTab = visibleTabs.find((tab) => currentPath === tab.id || currentPath.startsWith(`${tab.id}/`))?.id || '/dashboard';
  const unreadCount = alerts.filter((a) => !a.lu).length;

  useEffect(() => {
    if (!session?.token) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchAlerts(session.token);
        if (!cancelled) setAlerts(data);
      } catch (error) {
        console.warn('Alerts load error:', error.message);
      }
    };

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session?.token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkRead = async (alert) => {
    try {
      await markAlertAsRead(alert.id, session.token);
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, lu: true } : a)));
    } catch (error) {
      notify('error', error.message);
    }
  };

  const navContent = (
    <List sx={{ pt: 1 }}>
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <ListItemButton
            key={tab.id}
            component={NavLink}
            to={tab.id}
            end={tab.id === '/dashboard'}
            onClick={() => setMobileOpen(false)}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 2,
              '&.active': { bgcolor: 'primary.main', color: 'primary.contrastText', '& .MuiListItemIcon-root': { color: 'inherit' } }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={tab.label} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          {isMobile ? (
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : null}

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="overline" color="primary" fontWeight={700}>
              TechPro Services
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              Tableau de bord
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session?.user?.email} · {isAdmin ? 'Administrateur' : 'Comptable'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip icon={<EmailOutlinedIcon />} label="Email" size="small" variant="outlined" />
            <IconButton onClick={() => setShowAlerts((v) => !v)} title="Alertes workflow">
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
            <Button startIcon={<PublicIcon />} variant="outlined" size="small" onClick={() => navigate('/')}>
              Site
            </Button>
            <Button startIcon={<LogoutIcon />} color="error" variant="contained" size="small" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Stack>
        </Toolbar>

        {!isMobile ? (
          <Tabs value={activeTab} variant="scrollable" scrollButtons="auto" sx={{ px: 2 }}>
            {visibleTabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={tab.label}
                onClick={() => navigate(tab.id)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            ))}
          </Tabs>
        ) : null}
      </AppBar>

      {showAlerts ? (
        <Paper sx={{ mx: { xs: 2, md: 3 }, mt: 2, p: 2, maxHeight: 280, overflow: 'auto' }} elevation={1}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Alertes workflow
          </Typography>
          {alerts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Aucune alerte pour le moment.</Typography>
          ) : (
            alerts.slice(0, 8).map((alert) => (
              <Box
                key={alert.id}
                sx={{
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  opacity: alert.lu ? 0.65 : 1
                }}
              >
                <Typography variant="body2">{alert.message}</Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {alert.facture_numero || alert.type}
                  </Typography>
                  {!alert.lu ? (
                    <Button size="small" onClick={() => handleMarkRead(alert)}>Marquer lu</Button>
                  ) : null}
                </Stack>
              </Box>
            ))
          )}
        </Paper>
      ) : null}

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>{navContent}</Box>
      </Drawer>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

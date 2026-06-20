import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
import PaymentsIcon from '@mui/icons-material/Payments';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PublicIcon from '@mui/icons-material/Public';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { subscribeToAlerts, markAlertAsRead } from '../services/firebaseService';
import { AppLogo } from '../components/AppLogo';
import { NotificationMenu } from '../components/NotificationMenu';
import { APP_NAME, APP_TAGLINE } from '../config/branding';

const tabs = [
  { id: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: '/dashboard/clients', label: 'Clients', icon: PeopleIcon },
  { id: '/dashboard/categories', label: 'Catégories', icon: CategoryIcon, adminOnly: true },
  { id: '/dashboard/articles', label: 'Articles', icon: Inventory2Icon, adminOnly: true },
  { id: '/dashboard/factures', label: 'Factures', icon: ReceiptLongIcon },
  { id: '/dashboard/paiements', label: 'Paiements', icon: PaymentsIcon },
  { id: '/dashboard/parametres', label: 'Paramètres', icon: SettingsIcon, adminOnly: true }
];

function resolveActiveTab(path, visibleTabs) {
  const exact = visibleTabs.find((tab) => path === tab.id);
  if (exact) return exact.id;

  const nested = visibleTabs
    .filter((tab) => tab.id !== '/dashboard')
    .find((tab) => path.startsWith(`${tab.id}/`));
  if (nested) return nested.id;

  return path.startsWith('/dashboard') ? '/dashboard' : visibleTabs[0]?.id || '/dashboard';
}

export function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { session, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = session?.user?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);
  const activeTab = resolveActiveTab(location.pathname, visibleTabs);

  useEffect(() => {
    if (!session?.token) return undefined;
    return subscribeToAlerts(session.token, setAlerts);
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

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((a) => !a.lu);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map((alert) => markAlertAsRead(alert.id, session.token)));
      setAlerts((prev) => prev.map((a) => ({ ...a, lu: true })));
      notify('success', 'Toutes les notifications ont été marquées comme lues.');
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

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <AppLogo size={44} showText={false} />
            <Box>
            <Typography variant="overline" color="primary" fontWeight={700}>
              {APP_NAME}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              Tableau de bord
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {APP_TAGLINE} · {session?.user?.email} · {isAdmin ? 'Administrateur' : 'Comptable'}
            </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <NotificationMenu
              alerts={alerts}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onViewFactures={() => navigate('/dashboard/factures')}
            />
            <Button startIcon={<PublicIcon />} variant="outlined" size="small" onClick={() => navigate('/')}>
              Site
            </Button>
            <Button startIcon={<LogoutIcon />} color="error" variant="contained" size="small" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Stack>
        </Toolbar>

        {!isMobile ? (
          <Tabs
            value={activeTab}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
            onChange={(_, value) => navigate(value)}
          >
            {visibleTabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={tab.label}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            ))}
          </Tabs>
        ) : null}
      </AppBar>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>{navContent}</Box>
      </Drawer>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

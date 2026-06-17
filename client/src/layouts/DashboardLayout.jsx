import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Package,
  FileText,
  Settings,
  LogOut,
  Globe,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const tabs = [
  { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: '/dashboard/clients', label: 'Clients', icon: Users },
  { id: '/dashboard/categories', label: 'Catégories', icon: FolderOpen, adminOnly: true },
  { id: '/dashboard/articles', label: 'Articles', icon: Package, adminOnly: true },
  { id: '/dashboard/factures', label: 'Factures', icon: FileText },
  { id: '/dashboard/parametres', label: 'Paramètres', icon: Settings, adminOnly: true }
];

export function DashboardLayout() {
  const { session, logout } = useAuth();
  const { notice } = useToast();
  const navigate = useNavigate();
  const isAdmin = session?.user?.role === 'admin';

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell dashboard-shell">
      {notice ? <div className={`toast toast-${notice.type}`}>{notice.text}</div> : null}

      <header className="topbar card dashboard-topbar">
        <div className="topbar-brand">
          <div className="brand-mark">TP</div>
          <div>
            <div className="eyebrow">TechPro Services</div>
            <h1>Tableau de bord</h1>
            <p className="muted topbar-meta">
              {session?.user?.email} · {isAdmin ? 'Administrateur' : 'Comptable'}
            </p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="email-badge" title="Notifications par email activées">
            <Mail size={14} /> Email
          </span>
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/')}>
            <Globe size={16} /> Site
          </button>
          <button className="btn btn-danger btn-icon" type="button" onClick={handleLogout}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </header>

      <nav className="tabs main-tabs card dashboard-tabs">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={tab.id}
              end={tab.id === '/dashboard'}
              className={({ isActive }) => `tab dashboard-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <main className="workspace">
        <Outlet />
      </main>
    </div>
  );
}

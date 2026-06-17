import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { Home } from './pages/public/Home';
import { Cart } from './pages/public/Cart';
import { Checkout } from './pages/public/Checkout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Categories } from './pages/Categories';
import { Articles } from './pages/Articles';
import { Factures } from './pages/Factures';
import { Parametres } from './pages/Parametres';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { session } = useAuth();
  if (session?.user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cart', element: <Cart /> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      }
    ]
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'clients', element: <Clients /> },
      {
        path: 'categories',
        element: (
          <AdminRoute>
            <Categories />
          </AdminRoute>
        )
      },
      {
        path: 'articles',
        element: (
          <AdminRoute>
            <Articles />
          </AdminRoute>
        )
      },
      { path: 'factures', element: <Factures /> },
      {
        path: 'parametres',
        element: (
          <AdminRoute>
            <Parametres />
          </AdminRoute>
        )
      }
    ]
  }
]);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

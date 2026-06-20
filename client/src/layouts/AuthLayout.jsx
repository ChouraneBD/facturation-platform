import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="app-shell auth-background">
      <Outlet />
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export function AuthLayout() {
  const { notice } = useToast();

  return (
    <div className="app-shell auth-background">
      {notice ? <div className={`toast toast-${notice.type}`}>{notice.text}</div> : null}
      <Outlet />
    </div>
  );
}

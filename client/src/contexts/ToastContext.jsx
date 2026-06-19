import { createContext, useContext, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [notice, setNotice] = useState(null);

  const notify = (type, text) => {
    setNotice({ type, text });
  };

  const handleClose = () => setNotice(null);

  return (
    <ToastContext.Provider value={{ notice, notify }}>
      {children}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {notice ? (
          <Alert onClose={handleClose} severity={notice.type === 'warning' ? 'warning' : notice.type} variant="filled" sx={{ width: '100%' }}>
            {notice.text}
          </Alert>
        ) : null}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

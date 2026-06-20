import { createContext, useContext, useState } from 'react';
import { Alert, Snackbar, Slide } from '@mui/material';

const ToastContext = createContext(null);

function ToastTransition(props) {
  return <Slide {...props} direction="left" />;
}

function resolveSeverity(type) {
  if (type === 'success' || type === 'error' || type === 'warning' || type === 'info') {
    return type;
  }
  return 'info';
}

export function ToastProvider({ children }) {
  const [notice, setNotice] = useState(null);

  const notify = (type, text) => {
    setNotice({ type, text });
  };

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setNotice(null);
  };

  return (
    <ToastContext.Provider value={{ notice, notify }}>
      {children}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={ToastTransition}
        sx={{
          top: { xs: 72, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: (theme) => theme.zIndex.snackbar
        }}
      >
        {notice ? (
          <Alert
            onClose={handleClose}
            severity={resolveSeverity(notice.type)}
            variant="filled"
            elevation={6}
            sx={{
              width: '100%',
              minWidth: { xs: 280, sm: 320 },
              maxWidth: 420,
              borderRadius: 2,
              boxShadow: '0 10px 40px rgba(15, 23, 42, 0.2)',
              alignItems: 'center',
              py: 1.25,
              '& .MuiAlert-message': { fontWeight: 600, fontSize: '0.92rem' },
              '& .MuiAlert-icon': { fontSize: 22 }
            }}
          >
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

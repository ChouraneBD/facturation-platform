import { createContext, useContext, useState, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [notice, setNotice] = useState(null);

  const notify = (type, text) => {
    setNotice({ type, text });
    window.clearTimeout(window.__facturationNoticeTimer);
    window.__facturationNoticeTimer = window.setTimeout(() => setNotice(null), 4500);
  };

  return (
    <ToastContext.Provider value={{ notice, notify }}>
      {children}
      {notice ? (
        <div className={`toast toast-${notice.type}`}>
          {notice.text}
        </div>
      ) : null}
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
